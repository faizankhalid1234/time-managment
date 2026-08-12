import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbSet } from "@/lib/server/firebase";
import { signToken } from "@/lib/server/auth";
import { emailKey, findUserByEmail } from "@/lib/server/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = (await findUserByEmail(normalizedEmail)) as {
      id: string;
      name: string;
      email: string;
      passwordHash: string;
    } | null;

    if (!user) {
      return NextResponse.json(
        {
          code: "NO_ACCOUNT",
          error: "No account found. Please sign up first.",
        },
        { status: 404 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { code: "WRONG_PASSWORD", error: "Incorrect password" },
        { status: 401 }
      );
    }

    await dbSet(`emails/${emailKey(normalizedEmail)}`, user.id);

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    const message = err instanceof Error ? err.message : "Could not log in";
    const isConfig = /firebase/i.test(message);
    return NextResponse.json(
      {
        error: isConfig ? message : "Could not log in",
        code: isConfig ? "FIREBASE_CONFIG" : "ERROR",
      },
      { status: isConfig ? 503 : 500 }
    );
  }
}
