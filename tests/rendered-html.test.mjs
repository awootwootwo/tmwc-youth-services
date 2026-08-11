import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

test("minimal app build creates a client manifest", () => {
  const manifestPath = "dist/client/.vite/manifest.json";
  assert.equal(existsSync(manifestPath), true);

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  assert.equal(
    Boolean(manifest["virtual:vinext-app-browser-entry"]?.isEntry),
    true,
  );
});

test("Supabase migration includes secure MVP policies", () => {
  const migration = readFileSync(
    "supabase/migrations/001_initial_mvp.sql",
    "utf8",
  );

  assert.match(migration, /enable row level security/i);
  assert.match(migration, /Guests create service requests/);
  assert.match(migration, /Admins manage services/);
  assert.match(migration, /Staff read assigned requests/);
});
