import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { get, set, update, remove } from "../config/firebase.js";
import { toPkParts, formatDuration, getWeekDateKeys } from "../utils/time.js";

const router = Router();

/** List only the authenticated user's projects */
router.get("/", async (req, res) => {
  try {
    const uid = req.user.id;
    const projectsMap = (await get(`projects/${uid}`)) || {};
    const projects = Object.values(projectsMap).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Attach live elapsed if running
    const now = Date.now();
    const enriched = projects.map((p) => {
      let liveSeconds = p.totalSeconds || 0;
      if (p.status === "running" && p.sessionStartedAt) {
        liveSeconds += Math.floor((now - new Date(p.sessionStartedAt).getTime()) / 1000);
      }
      return {
        ...p,
        liveSeconds,
        duration: formatDuration(liveSeconds),
        currentElapsed: p.status === "running" && p.sessionStartedAt
          ? Math.floor((now - new Date(p.sessionStartedAt).getTime()) / 1000)
          : 0,
      };
    });

    res.json({ projects: enriched, nowPk: toPkParts() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load projects" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const uid = req.user.id;
    const id = uuidv4();
    const pk = toPkParts();

    const project = {
      id,
      userId: uid,
      name: name.trim(),
      description: (description || "").trim(),
      status: "idle",
      totalSeconds: 0,
      sessionStartedAt: null,
      sessionStartedPk: null,
      createdAt: pk.iso,
      createdAtPk: pk.displayDate,
      updatedAt: pk.iso,
    };

    await set(`projects/${uid}/${id}`, project);
    res.status(201).json({
      project: { ...project, liveSeconds: 0, duration: formatDuration(0), currentElapsed: 0 },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.post("/:id/start", async (req, res) => {
  try {
    const uid = req.user.id;
    const { id } = req.params;
    const project = await get(`projects/${uid}/${id}`);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (project.status === "running") {
      return res.status(400).json({ error: "Timer is already running" });
    }

    // Stop any other running project for this user
    const all = (await get(`projects/${uid}`)) || {};
    for (const p of Object.values(all)) {
      if (p.id !== id && p.status === "running" && p.sessionStartedAt) {
        await stopProjectInternal(uid, p);
      }
    }

    const pk = toPkParts();
    await update(`projects/${uid}/${id}`, {
      status: "running",
      sessionStartedAt: pk.iso,
      sessionStartedPk: `${pk.displayDate} · ${pk.displayTime}`,
      updatedAt: pk.iso,
    });

    const updated = await get(`projects/${uid}/${id}`);
    res.json({
      project: {
        ...updated,
        liveSeconds: updated.totalSeconds || 0,
        duration: formatDuration(updated.totalSeconds || 0),
        currentElapsed: 0,
      },
      nowPk: pk,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start timer" });
  }
});

async function stopProjectInternal(uid, project) {
  const pk = toPkParts();
  const started = new Date(project.sessionStartedAt).getTime();
  const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000));
  const totalSeconds = (project.totalSeconds || 0) + elapsed;
  const startPk = toPkParts(new Date(project.sessionStartedAt));

  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    userId: uid,
    projectId: project.id,
    projectName: project.name,
    startAt: project.sessionStartedAt,
    endAt: pk.iso,
    startPk: project.sessionStartedPk || startPk.displayTime,
    endPk: `${pk.displayDate} · ${pk.displayTime}`,
    dateKey: pk.dateKey,
    weekday: pk.weekday,
    durationSeconds: elapsed,
    duration: formatDuration(elapsed),
  };

  await set(`sessions/${uid}/${sessionId}`, session);
  await update(`projects/${uid}/${project.id}`, {
    status: "idle",
    totalSeconds,
    sessionStartedAt: null,
    sessionStartedPk: null,
    updatedAt: pk.iso,
    lastSessionAt: pk.iso,
    lastSessionPk: `${pk.displayDate} · ${pk.displayTime}`,
  });

  return { session, totalSeconds };
}

router.post("/:id/stop", async (req, res) => {
  try {
    const uid = req.user.id;
    const { id } = req.params;
    const project = await get(`projects/${uid}/${id}`);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (project.status !== "running" || !project.sessionStartedAt) {
      return res.status(400).json({ error: "Timer is not running" });
    }

    const { session, totalSeconds } = await stopProjectInternal(uid, project);
    const updated = await get(`projects/${uid}/${id}`);

    res.json({
      project: {
        ...updated,
        liveSeconds: totalSeconds,
        duration: formatDuration(totalSeconds),
        currentElapsed: 0,
      },
      session,
      nowPk: toPkParts(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to stop timer" });
  }
});

/** Session history for this user only */
router.get("/history/sessions", async (req, res) => {
  try {
    const uid = req.user.id;
    const sessionsMap = (await get(`sessions/${uid}`)) || {};
    const sessions = Object.values(sessionsMap).sort(
      (a, b) => new Date(b.endAt) - new Date(a.endAt)
    );
    res.json({ sessions, nowPk: toPkParts() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load history" });
  }
});

/** Weekly graph data — time per project this week (Pakistan) */
router.get("/stats/weekly", async (req, res) => {
  try {
    const uid = req.user.id;
    const weekKeys = getWeekDateKeys();
    const sessionsMap = (await get(`sessions/${uid}`)) || {};
    const sessions = Object.values(sessionsMap);
    const projectsMap = (await get(`projects/${uid}`)) || {};

    // Include currently running session partial for today
    const todayKey = toPkParts().dateKey;
    const now = Date.now();

    const byProject = {};

    for (const s of sessions) {
      if (!weekKeys.includes(s.dateKey)) continue;
      if (!byProject[s.projectId]) {
        byProject[s.projectId] = {
          projectId: s.projectId,
          projectName: s.projectName,
          totalSeconds: 0,
          byDay: Object.fromEntries(weekKeys.map((k) => [k, 0])),
        };
      }
      byProject[s.projectId].totalSeconds += s.durationSeconds || 0;
      byProject[s.projectId].byDay[s.dateKey] =
        (byProject[s.projectId].byDay[s.dateKey] || 0) + (s.durationSeconds || 0);
    }

    for (const p of Object.values(projectsMap)) {
      if (p.status === "running" && p.sessionStartedAt) {
        const elapsed = Math.floor((now - new Date(p.sessionStartedAt).getTime()) / 1000);
        if (!byProject[p.id]) {
          byProject[p.id] = {
            projectId: p.id,
            projectName: p.name,
            totalSeconds: 0,
            byDay: Object.fromEntries(weekKeys.map((k) => [k, 0])),
          };
        }
        byProject[p.id].totalSeconds += elapsed;
        byProject[p.id].byDay[todayKey] =
          (byProject[p.id].byDay[todayKey] || 0) + elapsed;
      }
    }

    const series = Object.values(byProject).map((p) => ({
      ...p,
      duration: formatDuration(p.totalSeconds),
      hours: Math.round((p.totalSeconds / 3600) * 100) / 100,
    }));

    const dayLabels = weekKeys.map((key) => {
      const [y, m, d] = key.split("-").map(Number);
      const weekday = new Date(Date.UTC(y, m - 1, d, 5)).toLocaleDateString("en-PK", {
        weekday: "short",
        timeZone: "Asia/Karachi",
      });
      return { key, label: weekday, date: `${d}/${m}` };
    });

    res.json({
      weekKeys,
      dayLabels,
      series,
      totalSeconds: series.reduce((a, b) => a + b.totalSeconds, 0),
      nowPk: toPkParts(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load weekly stats" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const uid = req.user.id;
    const { id } = req.params;
    const project = await get(`projects/${uid}/${id}`);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    if (project.status === "running") {
      return res.status(400).json({ error: "Stop the timer before deleting" });
    }
    await remove(`projects/${uid}/${id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
