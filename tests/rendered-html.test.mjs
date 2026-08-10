import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

test("MVP build includes public and protected app chunks", () => {
  const manifestPath = "dist/client/.vite/manifest.json";
  assert.equal(existsSync(manifestPath), true);

  const manifest = readFileSync(manifestPath, "utf8");
  assert.match(manifest, /request-form/);
  assert.match(manifest, /dashboard-client/);
  assert.match(manifest, /services-client/);
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
