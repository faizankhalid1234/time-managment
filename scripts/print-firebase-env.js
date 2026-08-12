/**
 * Reads serviceAccountKey.json and prints Vercel env values.
 * Usage: node scripts/print-firebase-env.js
 */
const fs = require("fs");
const path = require("path");

const candidates = [
  path.join(process.cwd(), "serviceAccountKey.json"),
  path.join(process.cwd(), "firebase-service-account.json"),
];

const file = candidates.find((p) => fs.existsSync(p));
if (!file) {
  console.error(`
Missing service account file.

1) Open: https://console.firebase.google.com/project/tracking-4e060/settings/serviceaccounts/adminsdk
2) Click "Generate new private key"
3) Save the JSON as: serviceAccountKey.json  (project root)
4) Run again: node scripts/print-firebase-env.js
`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(file, "utf8"));
if (!raw.client_email || !raw.private_key) {
  console.error("Invalid service account JSON — missing client_email or private_key");
  process.exit(1);
}

const privateKey = String(raw.private_key).replace(/\r\n/g, "\n").replace(/\n/g, "\\n");

console.log(`
======= Copy these into Vercel → Settings → Environment Variables =======
(Add for Production + Preview + Development, then Redeploy)

JWT_SECRET=<any-long-random-secret>

FIREBASE_DATABASE_URL=https://tracking-4e060-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=${raw.project_id || "tracking-4e060"}

FIREBASE_CLIENT_EMAIL=${raw.client_email}

FIREBASE_PRIVATE_KEY="${privateKey}"

NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_SITE_URL=https://time-managment.vercel.app

======= Also saved into .env.local (gitignored) =======
`);

const envBlock = `# Auto-filled from ${path.basename(file)} — do not commit
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api
JWT_SECRET=project_tracker_pk_secret_change_in_production_2026
FIREBASE_DATABASE_URL=https://tracking-4e060-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=${raw.project_id || "tracking-4e060"}
FIREBASE_CLIENT_EMAIL=${raw.client_email}
FIREBASE_PRIVATE_KEY="${privateKey}"
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
`;

fs.writeFileSync(path.join(process.cwd(), ".env.local"), envBlock, "utf8");
console.log("Wrote .env.local");
