import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";
import fs from "fs";
import path from "path";

const localDbPath = path.join(process.cwd(), "data/local-db.json");
const requireFirebase = process.env.VERCEL === "1";

let db: Database | null = null;
let useLocal = false;
let localData: Record<string, unknown> = {
  users: {},
  projects: {},
  sessions: {},
  emails: {},
};
let initialized = false;
let initError: string | null = null;

function ensureLocalFile() {
  const dir = path.dirname(localDbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(localDbPath)) {
    fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2));
  } else {
    localData = JSON.parse(fs.readFileSync(localDbPath, "utf8"));
  }
}

function saveLocal() {
  fs.writeFileSync(localDbPath, JSON.stringify(localData, null, 2));
}

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function normalizePrivateKey(raw: string) {
  return stripQuotes(raw)
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();
}

function resolveServiceAccountPath() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const candidates = [
    fromEnv ? path.resolve(process.cwd(), fromEnv) : null,
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "firebase-service-account.json"),
  ].filter(Boolean) as string[];

  return candidates.find((p) => fs.existsSync(p)) || null;
}

function loadCredentials() {
  const jsonRaw = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "").trim();
  if (jsonRaw && jsonRaw.startsWith("{")) {
    try {
      const parsed = JSON.parse(jsonRaw) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
      };
      if (parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id || process.env.FIREBASE_PROJECT_ID,
          clientEmail: parsed.client_email,
          privateKey: normalizePrivateKey(parsed.private_key),
          source: "FIREBASE_SERVICE_ACCOUNT_JSON",
        };
      }
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
  }

  const filePath = resolveServiceAccountPath();
  if (filePath) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    return {
      projectId: raw.project_id || process.env.FIREBASE_PROJECT_ID,
      clientEmail: raw.client_email,
      privateKey: normalizePrivateKey(raw.private_key || ""),
      source: filePath,
    };
  }

  const email = stripQuotes(process.env.FIREBASE_CLIENT_EMAIL || "");
  let key = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY || "");

  // Vercel-friendly: paste base64 of the private_key field
  const keyB64 = stripQuotes(process.env.FIREBASE_PRIVATE_KEY_BASE64 || "");
  if ((!key || key.includes("PASTE_FROM_FIREBASE")) && keyB64) {
    try {
      key = normalizePrivateKey(
        Buffer.from(keyB64, "base64").toString("utf8")
      );
    } catch {
      throw new Error("FIREBASE_PRIVATE_KEY_BASE64 is invalid");
    }
  }

  if (
    email &&
    key &&
    !email.includes("xxxxx") &&
    !key.includes("YOUR_PRIVATE_KEY") &&
    !key.includes("PASTE_FROM_FIREBASE")
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: email,
      privateKey: key,
      source: "env",
    };
  }

  return null;
}

export function getFirebaseStatus() {
  try {
    initFirebase();
  } catch (err) {
    return {
      ok: false,
      mode: "error" as const,
      error: err instanceof Error ? err.message : "Firebase failed",
    };
  }
  if (initError) return { ok: false, mode: "error" as const, error: initError };
  if (useLocal) return { ok: true, mode: "local" as const };
  return { ok: true, mode: "firebase" as const };
}

export function initFirebase() {
  if (initialized) {
    if (initError) throw new Error(initError);
    return;
  }

  const databaseURL = (
    process.env.FIREBASE_DATABASE_URL ||
    "https://tracking-4e060-default-rtdb.firebaseio.com"
  ).replace(/\/$/, "");

  try {
    const creds = loadCredentials();

    if (!creds) {
      if (requireFirebase) {
        initError =
          "Firebase is not configured. Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in Vercel environment variables.";
        initialized = true;
        throw new Error(initError);
      }
      useLocal = true;
      ensureLocalFile();
      initialized = true;
      console.log(
        "⚠ Firebase service account missing — using local JSON database"
      );
      return;
    }

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: creds.projectId || "tracking-4e060",
          clientEmail: creds.clientEmail,
          privateKey: creds.privateKey,
        }),
        databaseURL,
      });
    }

    db = getDatabase();
    initialized = true;
    console.log("✓ Firebase Realtime Database connected:", databaseURL);
  } catch (err) {
    initError =
      err instanceof Error
        ? err.message
        : "Firebase failed to initialize";
    initialized = true;
    throw new Error(initError);
  }
}

function walk(obj: Record<string, unknown>, parts: string[]) {
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur ?? null;
}

export async function dbGet(pathStr: string) {
  initFirebase();
  const parts = pathStr.split("/").filter(Boolean);
  if (useLocal) return walk(localData, parts);

  const snap = await db!.ref(pathStr).once("value");
  return snap.val();
}

export async function dbSet(pathStr: string, value: unknown) {
  initFirebase();
  const parts = pathStr.split("/").filter(Boolean);
  if (useLocal) {
    let cur = localData;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
      cur = cur[key] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = value as never;
    saveLocal();
    return;
  }
  await db!.ref(pathStr).set(value);
}

export async function dbUpdate(pathStr: string, value: Record<string, unknown>) {
  initFirebase();
  const parts = pathStr.split("/").filter(Boolean);
  if (useLocal) {
    let cur = localData;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
      cur = cur[key] as Record<string, unknown>;
    }
    const key = parts[parts.length - 1];
    cur[key] = { ...((cur[key] as object) || {}), ...value };
    saveLocal();
    return;
  }
  await db!.ref(pathStr).update(value);
}

export async function dbRemove(pathStr: string) {
  initFirebase();
  const parts = pathStr.split("/").filter(Boolean);
  if (useLocal) {
    let cur = localData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) return;
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    delete cur[parts[parts.length - 1]];
    saveLocal();
    return;
  }
  await db!.ref(pathStr).remove();
}
