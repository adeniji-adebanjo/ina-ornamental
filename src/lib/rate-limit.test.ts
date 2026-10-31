import { test, describe, mock } from "node:test";
import assert from "node:assert/strict";
import {
  rateLimit,
  recallRecent,
  rememberRecent,
  claimOnce,
  forgetRecent,
  clientIp,
} from "@/lib/rate-limit";

describe("rateLimit", () => {
  test("allows up to the limit, then blocks", () => {
    const key = "test:limit:" + Math.random();
    const opts = { limit: 2, windowMs: 60_000 };
    assert.equal(rateLimit(key, opts).ok, true);
    assert.equal(rateLimit(key, opts).ok, true);
    const blocked = rateLimit(key, opts);
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfterMs > 0);
  });

  test("different keys are independent", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    assert.equal(rateLimit("test:a:" + Math.random(), opts).ok, true);
    assert.equal(rateLimit("test:b:" + Math.random(), opts).ok, true);
  });

  test("window resets after it elapses", () => {
    mock.timers.enable({ apis: ["Date"] });
    try {
      const key = "test:window:" + Math.random();
      const opts = { limit: 1, windowMs: 1000 };
      assert.equal(rateLimit(key, opts).ok, true);
      assert.equal(rateLimit(key, opts).ok, false);
      mock.timers.tick(1001);
      assert.equal(rateLimit(key, opts).ok, true);
    } finally {
      mock.timers.reset();
    }
  });
});

describe("recallRecent / rememberRecent", () => {
  test("recalls a stored value within the TTL, null otherwise", () => {
    const key = "test:recent:" + Math.random();
    assert.equal(recallRecent(key), null);
    rememberRecent(key, "INA-123", 60_000);
    assert.equal(recallRecent(key), "INA-123");
    assert.equal(recallRecent("test:missing:" + Math.random()), null);
  });

  test("value expires after the TTL", () => {
    mock.timers.enable({ apis: ["Date"] });
    try {
      const key = "test:expire:" + Math.random();
      rememberRecent(key, "v", 1000);
      assert.equal(recallRecent(key), "v");
      mock.timers.tick(1001);
      assert.equal(recallRecent(key), null);
    } finally {
      mock.timers.reset();
    }
  });
});

describe("claimOnce / forgetRecent", () => {
  test("first claim is new, a concurrent one is pending, then done", () => {
    const key = "test:claim:" + Math.random();
    assert.deepEqual(claimOnce(key, 60_000), { state: "new" });
    assert.deepEqual(claimOnce(key, 60_000), { state: "pending" });
    rememberRecent(key, "INA-9", 60_000);
    assert.deepEqual(claimOnce(key, 60_000), { state: "done", value: "INA-9" });
  });

  test("forgetRecent releases a failed claim so a retry can proceed", () => {
    const key = "test:forget:" + Math.random();
    claimOnce(key, 60_000);
    forgetRecent(key);
    assert.deepEqual(claimOnce(key, 60_000), { state: "new" });
  });
});

describe("clientIp", () => {
  test("prefers x-real-ip, which the proxy sets and clients can't forge", () => {
    const h = new Headers({
      "x-real-ip": "9.9.9.9",
      "x-forwarded-for": "1.2.3.4, 9.9.9.9",
    });
    assert.equal(clientIp(h), "9.9.9.9");
  });
  test("ignores the client-controlled first x-forwarded-for entry", () => {
    const h = new Headers({ "x-forwarded-for": "6.6.6.6, 5.6.7.8" });
    assert.equal(clientIp(h), "5.6.7.8");
  });
  test("falls back to 'unknown'", () => {
    assert.equal(clientIp(new Headers()), "unknown");
  });
});
