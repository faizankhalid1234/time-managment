import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "../..");
const localDbPath = path.join(backendRoot, "data/local-db.json");

let db = null;
let useLocal = false;
let localData = { users: {}, projects: {}, sessions: {} };

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
    fromEnv ? path.resolve(backendRoot, fromEnv) : null,
    path.join(backendRoot, "serviceAccountKey.json"),
    path.join(backendRoot, "firebase-service-account.json"),
  ].filter(Boolean);

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
  const databaseURL = (
    process.env.FIREBASE_DATABASE_URL ||
    "https://tracking-4e060-default-rtdb.firebaseio.com"
  ).replace(/\/$/, "");

  const creds = loadCredentials();

  if (!creds) {
    useLocal = true;
    ensureLocalFile();
    console.log("⚠ Firebase service account missing.");
    console.log("  Put serviceAccountKey.json in backend/ OR set FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY");
    console.log("  Using local JSON fallback for now:", localDbPath);
    return;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: creds.projectId || "tracking-4e060",
        clientEmail: creds.clientEmail,
        privateKey: creds.privateKey,
      }),
      databaseURL,
    });
  }

  db = admin.database();
  console.log("✓ Firebase Realtime Database connected:", databaseURL);
  console.log("  Credentials from:", creds.source);
}

function ref(pathStr) {
  return db.ref(pathStr);
}

export async function get(pathStr) {
  if (useLocal) {
    const parts = pathStr.split("/").filter(Boolean);
    let cur = localData;
    for (const p of parts) {
      if (cur == null) return null;
      cur = cur[p];
    }
    return cur ?? null;
  }
  const snap = await ref(pathStr).once("value");
  return snap.val();
}

export async function set(pathStr, value) {
  if (useLocal) {
    const parts = pathStr.split("/").filter(Boolean);
    let cur = localData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
    saveLocal();
    return;
  }
  await ref(pathStr).set(value);
}

export async function update(pathStr, value) {
  if (useLocal) {
    const parts = pathStr.split("/").filter(Boolean);
    let cur = localData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    const key = parts[parts.length - 1];
    cur[key] = { ...(cur[key] || {}), ...value };
    saveLocal();
    return;
  }
  await ref(pathStr).update(value);
}

export async function remove(pathStr) {
  if (useLocal) {
    const parts = pathStr.split("/").filter(Boolean);
    let cur = localData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) return;
      cur = cur[parts[i]];
    }
    delete cur[parts[parts.length - 1]];
    saveLocal();
    return;
  }
  await ref(pathStr).remove();
}

export async function push(pathStr, value) {
  if (useLocal) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    await set(`${pathStr}/${id}`, value);
    return id;
  }
  const newRef = ref(pathStr).push();
  await newRef.set(value);
  return newRef.key;
}
