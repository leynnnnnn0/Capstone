export type SessionConfidence = "none" | "weak" | "medium" | "high";

export type JsonValue =
  | boolean
  | number
  | string
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface CapturedMeasurementRecord {
  productId: number | null;
  modelId: string;
  label: string;
  objectType: string;
  segmentsCm: number[];
  widthCm: number;
  heightCm: number;
  depthCm: number | null;
  confidence: SessionConfidence;
  pointsCount: number | null;
  metadata?: Record<string, JsonValue>;
}

export interface MeasurementSessionPayload {
  appointment_id: number;
  capture_mode: string;
  capture_version: string;
  overall_confidence: SessionConfidence;
  captured_at: string;
  device_metadata: Record<string, JsonValue>;
  objects: Array<{
    product_id: number | null;
    model_id: string;
    object_type: string;
    label: string;
    width_cm: number;
    height_cm: number;
    depth_cm: number | null;
    segments_cm: number[];
    confidence: SessionConfidence;
    points_count: number | null;
    metadata: Record<string, JsonValue>;
  }>;
}

interface BuildMeasurementSessionPayloadInput {
  appointmentId: number;
  captureMode: string;
  captureVersion: string;
  capturedAt: string;
  deviceMetadata: Record<string, JsonValue>;
  objects: CapturedMeasurementRecord[];
}

const CONFIDENCE_RANK: Record<SessionConfidence, number> = {
  none: 0,
  weak: 1,
  medium: 2,
  high: 3,
};

/**
 * Appointment IDs enter the AR app through a URL, so accept only a canonical,
 * positive integer. Values such as `1foo`, negative IDs, and unsafe integers
 * must never reach the API.
 */
export function appointmentIdFromSearch(search: string) {
  const value = new URLSearchParams(search).get("appointment_id");

  if (!value || !/^[1-9]\d*$/.test(value)) return null;

  const appointmentId = Number(value);
  return Number.isSafeInteger(appointmentId) ? appointmentId : null;
}

export function hasAppointmentIdParameter(search: string) {
  return new URLSearchParams(search).has("appointment_id");
}

export function buildMeasurementSessionPayload(
  input: BuildMeasurementSessionPayloadInput,
): MeasurementSessionPayload {
  if (!Number.isSafeInteger(input.appointmentId) || input.appointmentId < 1) {
    throw new Error("A valid appointment is required.");
  }

  if (input.objects.length === 0) {
    throw new Error("At least one captured object is required.");
  }

  const captureMode = input.captureMode.trim();
  const captureVersion = input.captureVersion.trim();

  if (!captureMode || !captureVersion) {
    throw new Error("Capture mode and version are required.");
  }

  return {
    appointment_id: input.appointmentId,
    capture_mode: captureMode,
    capture_version: captureVersion,
    overall_confidence: lowestConfidence(
      input.objects.map((object) => object.confidence),
    ),
    captured_at: input.capturedAt,
    device_metadata: input.deviceMetadata,
    objects: input.objects.map((object) => ({
      product_id:
        object.productId != null &&
        Number.isSafeInteger(object.productId) &&
        object.productId > 0
          ? object.productId
          : null,
      model_id: object.modelId,
      object_type: object.objectType.trim() || "other",
      label: object.label.trim() || "Measured object",
      width_cm: measurementNumber(object.widthCm),
      height_cm: measurementNumber(object.heightCm),
      depth_cm:
        object.depthCm == null ? null : measurementNumber(object.depthCm),
      segments_cm: object.segmentsCm.map(measurementNumber),
      confidence: object.confidence,
      points_count:
        object.pointsCount != null &&
        Number.isSafeInteger(object.pointsCount) &&
        object.pointsCount >= 2
          ? object.pointsCount
          : null,
      metadata: {
        ...object.metadata,
      },
    })),
  };
}

/**
 * A deterministic signature lets the UI distinguish the exact snapshot that
 * was saved from measurements subsequently edited in AR.
 */
export function measurementSnapshotFingerprint(
  appointmentId: number | null,
  captureVersion: string,
  objects: CapturedMeasurementRecord[],
) {
  return JSON.stringify({
    appointmentId,
    captureVersion,
    objects: objects.map((object) => ({
      productId: object.productId,
      modelId: object.modelId,
      objectType: object.objectType,
      segmentsCm: object.segmentsCm.map(measurementNumber),
      widthCm: measurementNumber(object.widthCm),
      heightCm: measurementNumber(object.heightCm),
      depthCm:
        object.depthCm == null ? null : measurementNumber(object.depthCm),
      confidence: object.confidence,
      pointsCount: object.pointsCount,
    })),
  });
}

function lowestConfidence(values: SessionConfidence[]): SessionConfidence {
  return values.reduce<SessionConfidence>(
    (lowest, value) =>
      CONFIDENCE_RANK[value] < CONFIDENCE_RANK[lowest] ? value : lowest,
    "high",
  );
}

function measurementNumber(value: number) {
  if (!Number.isFinite(value) || value < 0) return 0;

  return Math.round(value * 100) / 100;
}
