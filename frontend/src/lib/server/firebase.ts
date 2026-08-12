import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getDatabase, type Database } from "firebase-admin/database";
import fs from "fs";
import path from "path";

const localDbPath = path.join(process.cwd(), "data/local-db.json");

let db: Database | null = null;
let useLocal = false;
let localData: Record<string, unknown> = {
  users: {},
  projects: {},
  sessions: {},
  emails: {},
};
let initialized = false;

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
  const filePath = resolveServiceAccountPath();
  if (filePath) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return {
      projectId: raw.project_id || process.env.FIREBASE_PROJECT_ID,
      clientEmail: raw.client_email,
      privateKey: raw.private_key,
      source: filePath,
    };
  }

  const email = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const key = (process.env.FIREBASE_PRIVATE_KEY || "").trim();
  if (
    email &&
    key &&
    !email.includes("xxxxx") &&
    !key.includes("YOUR_PRIVATE_KEY")
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: email,
      privateKey: key.replace(/\\n/g, "\n"),
      source: ".env",
    };
  }

  return null;
}

export function initFirebase() {
  if (initialized) return;
  initialized = true;

  const databaseURL = (
    process.env.FIREBASE_DATABASE_URL ||
    "https://tracking-4e060-default-rtdb.firebaseio.com"
  ).replace(/\/$/, "");

  const creds = loadCredentials();

  if (!creds) {
    useLocal = true;
    ensureLocalFile();
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
  console.log("✓ Firebase Realtime Database connected:", databaseURL);
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
