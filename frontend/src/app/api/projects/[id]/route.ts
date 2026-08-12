import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { dbGet, dbRemove } from "@/lib/server/firebase";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = requireUser(req);
  if (error) return error;

  try {
    const { id } = await params;
    const uid = user!.id;
    const project = (await dbGet(`projects/${uid}/${id}`)) as {
      status?: string;
    } | null;
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.status === "running") {
      return NextResponse.json(
        { error: "Stop the timer before deleting" },
        { status: 400 }
      );
    }
    await dbRemove(`projects/${uid}/${id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
