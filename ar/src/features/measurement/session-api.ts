import type { JsonValue, MeasurementSessionPayload } from "./session-records";
import { apiBaseUrl } from "../../lib/api-base";

interface MeasurementSessionResponse {
  reference: string;
  status: string | null;
}

interface UserAgentDataLike {
  platform?: string;
}

export class MeasurementSessionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "MeasurementSessionApiError";
  }
}

export async function saveMeasurementSession(
  payload: MeasurementSessionPayload,
  signal?: AbortSignal,
): Promise<MeasurementSessionResponse> {
  const response = await fetch(`${apiBaseUrl()}/api/v1/ar-measurement-sessions`, {
    method: "POST",
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify(payload),
  });
  const body = await readJson(response);

  if (!response.ok) {
    throw new MeasurementSessionApiError(responseMessage(body), response.status);
  }

  const resource = isRecord(body) && isRecord(body.data) ? body.data : body;
  const reference =
    isRecord(resource) && typeof resource.reference === "string"
      ? resource.reference
      : "";

  if (!reference) {
    throw new MeasurementSessionApiError(
      "The server saved the record without returning its reference.",
      response.status,
    );
  }

  return {
    reference,
    status:
      isRecord(resource) && typeof resource.status === "string"
        ? resource.status
        : null,
  };
}

export function measurementSaveErrorMessage(error: unknown) {
  if (error instanceof MeasurementSessionApiError) {
    if (error.status === 401) {
      return "Sign in on the main site, then reopen AR from your appointment.";
    }

    if (error.status === 403) {
      return "This appointment is not available to your account.";
    }

    if (error.status === 404) {
      return "The linked appointment could not be found.";
    }

    if (error.status === 422) {
      return "Some measurements could not be saved. Review the objects and try again.";
    }

    if (error.status >= 500) {
      return "The measurement service is temporarily unavailable. Try again shortly.";
    }
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "Measurement save cancelled.";
  }

  return "Could not reach the measurement service. Check your connection and try again.";
}

/**
 * Keep this metadata intentionally coarse: it is useful for diagnosing AR
 * accuracy without collecting location, camera content, or a device identifier.
 */
export function collectDeviceMetadata(): Record<string, JsonValue> {
  const userAgentData = (
    navigator as Navigator & { userAgentData?: UserAgentDataLike }
  ).userAgentData;

  return {
    user_agent: navigator.userAgent.slice(0, 512),
    platform: (userAgentData?.platform || navigator.platform || "unknown").slice(
      0,
      80,
    ),
    language: navigator.language.slice(0, 35),
    viewport_width_px: window.innerWidth,
    viewport_height_px: window.innerHeight,
    screen_width_px: window.screen.width,
    screen_height_px: window.screen.height,
    pixel_ratio: Math.round(window.devicePixelRatio * 100) / 100,
    secure_context: window.isSecureContext,
    webxr_available: "xr" in navigator,
  };
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function responseMessage(body: unknown) {
  return isRecord(body) && typeof body.message === "string"
    ? body.message
    : "Unable to save the measurement record.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
