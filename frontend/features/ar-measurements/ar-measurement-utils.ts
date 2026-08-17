import type {
  ArMeasurement,
  ArMeasurementConfidence,
  ArMeasurementSession,
  ArMeasurementSessionStatus,
} from "./types";

export function appointmentArUrl(appointmentId: string | number) {
  const configuredVersion = process.env.NEXT_PUBLIC_AR_VERSION;
  const version = configuredVersion === "v1" || configuredVersion === "v3"
    ? configuredVersion
    : "v2";
  const params = new URLSearchParams({ appointment_id: String(appointmentId) });

  // Keep the browser request on the app origin so the authentication cookie is
  // available to the AR session-save API. Next.js proxies this route in local
  // development and production can serve the built AR app at the same path.
  return `/ar/${version}?${params.toString()}`;
}

export function measurementStatusLabel(
  status: ArMeasurementSessionStatus,
  fallback?: string,
) {
  if (fallback) return fallback;

  return {
    submitted: "Submitted",
    reviewed: "Reviewed",
    approved: "Approved",
    needs_retake: "Needs retake",
  }[status];
}

export function confidenceLabel(confidence: ArMeasurementConfidence | null) {
  if (!confidence || confidence === "none") return "No confidence reading";
  return `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence`;
}

export function formatMeasurementDate(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatMeasurementDimensions(measurement: ArMeasurement) {
  const dimensions = [
    `${formatMeasurementNumber(measurement.width_cm)} W`,
    `${formatMeasurementNumber(measurement.height_cm)} H`,
  ];

  if (measurement.depth_cm !== null && measurement.depth_cm > 0) {
    dimensions.push(`${formatMeasurementNumber(measurement.depth_cm)} D`);
  }

  return `${dimensions.join(" × ")} cm`;
}

export function formatMeasurementNumber(value: number, digits = 1) {
  return new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export function measurementDeviceRows(
  metadata: ArMeasurementSession["device_metadata"],
) {
  if (!metadata) return [];

  const preferredKeys = [
    "device_model",
    "device",
    "platform",
    "operating_system",
    "os",
    "browser",
    "browser_version",
    "viewport",
    "screen",
    "orientation",
    "language",
    "user_agent",
  ];
  const entries = Object.entries(metadata).filter(([, value]) =>
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean",
  );
  const ordered = entries.sort(([left], [right]) => {
    const leftIndex = preferredKeys.indexOf(left);
    const rightIndex = preferredKeys.indexOf(right);
    const leftRank = leftIndex === -1 ? preferredKeys.length : leftIndex;
    const rightRank = rightIndex === -1 ? preferredKeys.length : rightIndex;
    return leftRank - rightRank;
  });

  return ordered.slice(0, 8).map(([key, value]) => ({
    label: key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase()),
    value:
      typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : String(value),
  }));
}

export function isMeasurementEstimate(session: ArMeasurementSession) {
  return session.status !== "approved";
}
