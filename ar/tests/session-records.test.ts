import assert from "node:assert/strict";
import test from "node:test";
import {
  appointmentIdFromSearch,
  buildMeasurementSessionPayload,
  measurementSnapshotFingerprint,
  type CapturedMeasurementRecord,
} from "../src/features/measurement/session-records.ts";

const measuredDoor: CapturedMeasurementRecord = {
  productId: 12,
  modelId: "product-12",
  label: "Sliding Door",
  objectType: "door",
  segmentsCm: [100.127, 50.235],
  widthCm: 150.362,
  heightCm: 210.499,
  depthCm: 8,
  confidence: "high",
  pointsCount: 4,
};

test("appointmentIdFromSearch accepts only canonical positive IDs", () => {
  assert.equal(appointmentIdFromSearch("?appointment_id=42"), 42);
  assert.equal(appointmentIdFromSearch("?direct=ar&appointment_id=7"), 7);
  assert.equal(appointmentIdFromSearch("?appointment_id=1foo"), null);
  assert.equal(appointmentIdFromSearch("?appointment_id=-1"), null);
  assert.equal(appointmentIdFromSearch("?appointment_id=0"), null);
  assert.equal(
    appointmentIdFromSearch("?appointment_id=9007199254740992"),
    null,
  );
});

test("buildMeasurementSessionPayload normalizes measurements and confidence", () => {
  const payload = buildMeasurementSessionPayload({
    appointmentId: 42,
    captureMode: "wall_scan_placement",
    captureVersion: "v2",
    capturedAt: "2026-07-25T08:00:00.000Z",
    deviceMetadata: { platform: "Android" },
    objects: [
      measuredDoor,
      {
        ...measuredDoor,
        productId: null,
        modelId: "fallback-window-1",
        objectType: "window",
        confidence: "medium",
        depthCm: null,
        pointsCount: 1,
      },
    ],
  });

  assert.equal(payload.appointment_id, 42);
  assert.equal(payload.overall_confidence, "medium");
  assert.equal(payload.objects[0].width_cm, 150.36);
  assert.equal(payload.objects[0].height_cm, 210.5);
  assert.deepEqual(payload.objects[0].segments_cm, [100.13, 50.24]);
  assert.equal(payload.objects[0].model_id, "product-12");
  assert.equal(payload.objects[1].product_id, null);
  assert.equal(payload.objects[1].depth_cm, null);
  assert.equal(payload.objects[1].points_count, null);
});

test("buildMeasurementSessionPayload rejects empty or unlinked captures", () => {
  assert.throws(
    () =>
      buildMeasurementSessionPayload({
        appointmentId: 0,
        captureMode: "point_measurement",
        captureVersion: "v1",
        capturedAt: new Date().toISOString(),
        deviceMetadata: {},
        objects: [measuredDoor],
      }),
    /valid appointment/i,
  );

  assert.throws(
    () =>
      buildMeasurementSessionPayload({
        appointmentId: 1,
        captureMode: "point_measurement",
        captureVersion: "v1",
        capturedAt: new Date().toISOString(),
        deviceMetadata: {},
        objects: [],
      }),
    /captured object/i,
  );
});

test("measurementSnapshotFingerprint changes after a dimension edit", () => {
  const original = measurementSnapshotFingerprint(42, "v2", [measuredDoor]);
  const edited = measurementSnapshotFingerprint(42, "v2", [
    { ...measuredDoor, widthCm: measuredDoor.widthCm + 5 },
  ]);

  assert.notEqual(original, edited);
  assert.equal(
    original,
    measurementSnapshotFingerprint(42, "v2", [{ ...measuredDoor }]),
  );
});
