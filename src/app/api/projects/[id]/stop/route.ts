import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { dbGet } from "@/lib/server/firebase";
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
      name: string;
      status?: string;
      sessionStartedAt?: string | null;
      sessionStartedPk?: string | null;
      totalSeconds?: number;
    } | null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.status !== "running" || !project.sessionStartedAt) {
      return NextResponse.json(
        { error: "Timer is not running" },
        { status: 400 }
      );
    }

    const { session, totalSeconds } = await stopProjectInternal(uid, project);
    const updated = await dbGet(`projects/${uid}/${id}`);

    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Failed to stop timer" },
      { status: 500 }
    );
  }
}
