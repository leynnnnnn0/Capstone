export async function requestHitTestSession(overlayRoot?: Element | null, useDepth = false) {
  if (!window.isSecureContext) {
    throw new Error("WebXR requires HTTPS.");
  }

  if (!navigator.xr) {
    throw new Error("This browser does not expose navigator.xr.");
  }

  const withOverlay: XRSessionInit = {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["local-floor", "dom-overlay", "anchors"],
    ...(overlayRoot ? { domOverlay: { root: overlayRoot } } : {}),
  };

  if (useDepth) {
    try {
      return await navigator.xr.requestSession("immersive-ar", {
        ...withOverlay,
        optionalFeatures: [...withOverlay.optionalFeatures!, "depth-sensing"],
        depthSensing: {
          usagePreference: ["cpu-optimized"],
          dataFormatPreference: ["float32", "luminance-alpha"],
        },
      });
    } catch (error) {
      if (!(error instanceof TypeError) && !(error instanceof DOMException && error.name === "NotSupportedError")) {
        throw error;
      }
    }
  }

  try {
    return await navigator.xr.requestSession("immersive-ar", withOverlay);
  } catch {
    return navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["local-floor", "anchors"],
    });
  }
}

export function getCenterDepthMeters(frame: XRFrame, view: XRView) {
  if (!frame.getDepthInformation) return null;
  try {
    if (frame.session.depthUsage !== "cpu-optimized") return null;
    const distance = frame.getDepthInformation(view)?.getDepthInMeters(0.5, 0.5);
    return distance != null && Number.isFinite(distance) && distance >= 0.3 && distance <= 8
      ? distance
      : null;
  } catch {
    // An optional depth stream can be unavailable even while the camera is tracking.
    return null;
  }
}
