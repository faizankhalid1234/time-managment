import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { dbGet } from "@/lib/server/firebase";
import { formatDuration, getWeekDateKeys, toPkParts } from "@/lib/server/time";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = requireUser(req);
  if (error) return error;

  try {
    const uid = user!.id;
    const weekKeys = getWeekDateKeys();
    const sessionsMap = (await dbGet(`sessions/${uid}`)) || {};
    const sessions = Object.values(
      sessionsMap as Record<
        string,
        { dateKey: string; projectId: string; projectName: string; durationSeconds?: number }
      >
    );
    const projectsMap = (await dbGet(`projects/${uid}`)) || {};
    const todayKey = toPkParts().dateKey;
    const now = Date.now();
    const byProject: Record<
      string,
      {
        projectId: string;
        projectName: string;
        totalSeconds: number;
        byDay: Record<string, number>;
      }
    > = {};

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
        (byProject[s.projectId].byDay[s.dateKey] || 0) +
        (s.durationSeconds || 0);
    }

    for (const p of Object.values(
      projectsMap as Record<
        string,
        { id: string; name: string; status?: string; sessionStartedAt?: string }
      >
    )) {
      if (p.status === "running" && p.sessionStartedAt) {
        const elapsed = Math.floor(
          (now - new Date(p.sessionStartedAt).getTime()) / 1000
        );
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
      const weekday = new Date(Date.UTC(y, m - 1, d, 5)).toLocaleDateString(
        "en-PK",
        { weekday: "short", timeZone: "Asia/Karachi" }
      );
      return { key, label: weekday, date: `${d}/${m}` };
    });

    return NextResponse.json({
      weekKeys,
      dayLabels,
      series,
      totalSeconds: series.reduce((a, b) => a + b.totalSeconds, 0),
      nowPk: toPkParts(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load weekly stats" },
      { status: 500 }
    );
  }
}
