import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { dbGet, dbUpdate } from "@/lib/server/firebase";
import { formatDuration, toPkParts } from "@/lib/server/time";
import { stopProjectInternal } from "@/lib/server/helpers";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = requireUser(req);
  if (error) return error;

  try {
    const { id } = await params;
    const uid = user!.id;
    const project = (await dbGet(`projects/${uid}/${id}`)) as {
      id: string;
      status?: string;
      sessionStartedAt?: string | null;
      totalSeconds?: number;
      name: string;
      sessionStartedPk?: string | null;
    } | null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.status === "running") {
      return NextResponse.json(
        { error: "Timer is already running" },
        { status: 400 }
      );
    }

    const all = (await dbGet(`projects/${uid}`)) || {};
    for (const p of Object.values(all as Record<string, typeof project>)) {
      if (p.id !== id && p.status === "running" && p.sessionStartedAt) {
        await stopProjectInternal(uid, p);
      }
    }

    const pk = toPkParts();
    await dbUpdate(`projects/${uid}/${id}`, {
      status: "running",
      sessionStartedAt: pk.iso,
      sessionStartedPk: `${pk.displayDate} · ${pk.displayTime}`,
      updatedAt: pk.iso,
    });

    const updated = (await dbGet(`projects/${uid}/${id}`)) as {
      totalSeconds?: number;
    };
    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Failed to start timer" },
      { status: 500 }
    );
  }
}
