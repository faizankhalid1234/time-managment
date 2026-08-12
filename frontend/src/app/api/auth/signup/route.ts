import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbSet } from "@/lib/server/firebase";
import { signToken } from "@/lib/server/auth";
import { toPkParts } from "@/lib/server/time";
import { emailKey, findUserByEmail } from "@/lib/server/helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        {
          code: "EMAIL_TAKEN",
          error: "This email is already registered. Please log in.",
        },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    const pk = toPkParts();
    const user = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: pk.iso,
      createdAtPk: pk.displayDate,
    };

    await dbSet(`users/${id}`, user);
    await dbSet(`emails/${emailKey(normalizedEmail)}`, id);

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return NextResponse.json(
      { token, user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "Could not create account" },
      { status: 500 }
    );
  }
}
