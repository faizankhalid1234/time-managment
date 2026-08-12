import { dbGet, dbSet, dbUpdate } from "./firebase";
import { formatDuration, toPkParts } from "./time";

type Project = {
  id: string;
  name: string;
  totalSeconds?: number;
  sessionStartedAt?: string | null;
  sessionStartedPk?: string | null;
};

export async function stopProjectInternal(uid: string, project: Project) {
  const pk = toPkParts();
  const started = new Date(project.sessionStartedAt as string).getTime();
  const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000));
  const totalSeconds = (project.totalSeconds || 0) + elapsed;
  const startPk = toPkParts(new Date(project.sessionStartedAt as string));
  const sessionId = crypto.randomUUID();

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

  await dbSet(`sessions/${uid}/${sessionId}`, session);
  await dbUpdate(`projects/${uid}/${project.id}`, {
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

export async function findUserByEmail(normalizedEmail: string) {
  const mappedId = await dbGet(`emails/${emailKey(normalizedEmail)}`);
  if (mappedId) {
    const user = await dbGet(`users/${mappedId}`);
    if (user) return user;
  }
  const users = (await dbGet("users")) || {};
  return (
    Object.values(users as Record<string, { email: string }>).find(
      (u) => u.email === normalizedEmail
    ) || null
  );
}

export function emailKey(email: string) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}
