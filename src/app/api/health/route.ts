import { NextResponse } from "next/server";
import { getFirebaseStatus } from "@/lib/server/firebase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const firebase = getFirebaseStatus();
    return NextResponse.json({
      ok: firebase.ok,
      timezone: "Asia/Karachi",
      firebase: firebase.mode,
      error: firebase.ok ? undefined : firebase.error,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        timezone: "Asia/Karachi",
        firebase: "error",
        error: err instanceof Error ? err.message : "Health check failed",
      },
      { status: 503 }
    );
  }
}
