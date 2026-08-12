import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { dbGet } from "@/lib/server/firebase";
import { toPkParts } from "@/lib/server/time";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = requireUser(req);
  if (error) return error;

  try {
    const uid = user!.id;
    const sessionsMap = (await dbGet(`sessions/${uid}`)) || {};
    const sessions = Object.values(
      sessionsMap as Record<string, { endAt: string }>
    ).sort(
      (a, b) => new Date(b.endAt).getTime() - new Date(a.endAt).getTime()
    );
    return NextResponse.json({ sessions, nowPk: toPkParts() });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load history" },
      { status: 500 }
    );
  }
}
