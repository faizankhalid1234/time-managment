import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { dbGet, dbSet } from "@/lib/server/firebase";
import { formatDuration, toPkParts } from "@/lib/server/time";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = requireUser(req);
  if (error) return error;

  try {
    const uid = user!.id;
    const projectsMap = (await dbGet(`projects/${uid}`)) || {};
    const projects = Object.values(
      projectsMap as Record<string, Record<string, unknown>>
    ).sort(
      (a, b) =>
        new Date(String(b.createdAt)).getTime() -
        new Date(String(a.createdAt)).getTime()
    );

    const now = Date.now();
    const enriched = projects.map((p) => {
      let liveSeconds = Number(p.totalSeconds || 0);
      if (p.status === "running" && p.sessionStartedAt) {
        liveSeconds += Math.floor(
          (now - new Date(String(p.sessionStartedAt)).getTime()) / 1000
        );
      }
      return {
        ...p,
        liveSeconds,
        duration: formatDuration(liveSeconds),
        currentElapsed:
          p.status === "running" && p.sessionStartedAt
            ? Math.floor(
                (now - new Date(String(p.sessionStartedAt)).getTime()) / 1000
              )
            : 0,
      };
    });

    return NextResponse.json({ projects: enriched, nowPk: toPkParts() });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = requireUser(req);
  if (error) return error;

  try {
    const { name, description } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const uid = user!.id;
    const id = crypto.randomUUID();
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

    await dbSet(`projects/${uid}/${id}`, project);
    return NextResponse.json(
      {
        project: {
          ...project,
          liveSeconds: 0,
          duration: formatDuration(0),
          currentElapsed: 0,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
