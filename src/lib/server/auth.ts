import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export type AuthUser = { id: string; email: string; name: string };

function secret() {
  return process.env.JWT_SECRET || "time_management_dev_secret_change_me";
}

export function signToken(user: AuthUser) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    secret(),
    { expiresIn: "7d" }
  );
}

export function getAuthUser(req: NextRequest): AuthUser | null {
  const header = req.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  try {
    const payload = jwt.verify(header.slice(7), secret()) as AuthUser;
    if (!payload?.id) return null;
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function requireUser(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return { user: null, error: unauthorized() };
  return { user, error: null };
}
