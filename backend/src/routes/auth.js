import { Router } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { get, set } from "../config/firebase.js";
import { authMiddleware, signToken } from "../middleware/auth.js";
import { toPkParts } from "../utils/time.js";

const router = Router();

function emailKey(email) {
  return email.trim().toLowerCase().replace(/\./g, ",");
}

async function findUserByEmail(normalizedEmail) {
  const mappedId = await get(`emails/${emailKey(normalizedEmail)}`);
  if (mappedId) {
    const user = await get(`users/${mappedId}`);
    if (user) return user;
  }

  const users = (await get("users")) || {};
  return Object.values(users).find((u) => u.email === normalizedEmail) || null;
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({
        code: "EMAIL_TAKEN",
        error: "This email is already registered. Please log in.",
      });
    }

    const id = uuidv4();
    const pk = toPkParts();
    const user = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10),
      createdAt: pk.iso,
      createdAtPk: pk.displayDate,
    };

    await set(`users/${id}`, user);
    await set(`emails/${emailKey(normalizedEmail)}`, id);

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Could not create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(404).json({
        code: "NO_ACCOUNT",
        error: "No account found. Please sign up first.",
      });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({
        code: "WRONG_PASSWORD",
        error: "Incorrect password",
      });
    }

    await set(`emails/${emailKey(normalizedEmail)}`, user.id);

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Could not log in" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await get(`users/${req.user.id}`);
    if (!user) {
      return res.status(401).json({ code: "INVALID_TOKEN", error: "User not found" });
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
