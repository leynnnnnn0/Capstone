import assert from "node:assert/strict";
import test from "node:test";
import { v2Guidance } from "../src/features/measurement/v2-guidance.ts";

test("a stable floor never tells the user the wall is ready", () => {
  const guidance = v2Guidance("high", false, 0, false);
  assert.equal(guidance.ready, false);
  assert.match(guidance.title, /vertical wall/);
  assert.match(guidance.detail, /Place preview/);
});

test("slow detection escalates advice and readiness immediately supersedes it", () => {
  assert.match(v2Guidance("none", false, 4, false).detail, /Still scanning/);
  assert.match(v2Guidance("medium", false, 8, false).detail, /textured/);
  const ready = v2Guidance("high", true, 10, false);
  assert.equal(ready.ready, true);
  assert.match(ready.detail, /Place product/);
});

test("placement follows automatic wall detection and pending anchoring never promises readiness", () => {
  assert.match(v2Guidance("high", true, 0, false).detail, /Place product/);
  const pending = v2Guidance("high", true, 0, true);
  assert.equal(pending.ready, false);
  assert.match(pending.detail, /anchors/);
});
