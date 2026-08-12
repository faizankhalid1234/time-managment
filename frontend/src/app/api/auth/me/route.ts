import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { dbGet } from "@/lib/server/firebase";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { user, error } = requireUser(req);
  if (error) return error;

  try {
    const row = (await dbGet(`users/${user!.id}`)) as {
      id: string;
      name: string;
      email: string;
    } | null;
    if (!row) {
      return NextResponse.json(
        { code: "INVALID_TOKEN", error: "User not found" },
        { status: 401 }
      );
    }
    return NextResponse.json({
      user: { id: row.id, name: row.name, email: row.email },
    });
  } catch (err) {
    console.error("Me error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
