/**
 * Create (or reset the password of) the dedicated end-to-end test account.
 *
 *   node scripts/ensure-e2e-user.mjs <email> <password>
 *
 * The e2e suite signs in as a real user because that is the whole point of it:
 * every functional bug this project has shipped lived behind auth and survived
 * curl, unit tests and isolated renders. Give it its own account rather than a
 * human's, so the codes it creates and deletes never touch a real dashboard.
 *
 * Uses the service-role key from .env.local, so the account is created already
 * confirmed and no mail is sent.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(path) {
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => {
        const eq = line.indexOf("=");
        return [line.slice(0, eq).trim(), line.slice(eq + 1).trim()];
      }),
  );
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("usage: node scripts/ensure-e2e-user.mjs <email> <password>");
  process.exit(1);
}

const env = { ...readEnvFile(".env.local"), ...process.env };

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const { data: list, error: listError } = await admin.auth.admin.listUsers({
  perPage: 1000,
});
if (listError) throw listError;

const existing = list.users.find((u) => u.email === email);

if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`updated existing e2e user ${existing.id}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  console.log(`created e2e user ${data.user.id}`);
}
