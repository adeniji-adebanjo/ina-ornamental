import { test, describe } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  generateOrderReference,
  generateUniqueOrderReference,
} from "@/lib/queries/orders";

// Minimal stub of the `.from().select().eq().maybeSingle()` chain the uniqueness
// check uses. `exists` decides whether a candidate reference is already taken.
function mockAdmin(exists: boolean): SupabaseClient {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: exists ? { id: "x" } : null }),
        }),
      }),
    }),
  } as unknown as SupabaseClient;
}

describe("generateOrderReference", () => {
  test("matches INA-YYYYMMDD-NNN", () => {
    assert.match(generateOrderReference(), /^INA-\d{8}-\d{3}$/);
  });
});

describe("generateUniqueOrderReference", () => {
  test("returns a standard reference when the first candidate is free", async () => {
    const ref = await generateUniqueOrderReference(mockAdmin(false));
    assert.match(ref, /^INA-\d{8}-\d{3}$/);
  });

  test("falls back to a widened suffix when every candidate collides", async () => {
    const ref = await generateUniqueOrderReference(mockAdmin(true));
    assert.match(ref, /^INA-\d{8}-\d{3}-\d{4}$/);
  });
});
