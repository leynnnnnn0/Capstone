export async function requestHitTestSession(overlayRoot?: Element | null) {
  if (!window.isSecureContext) {
    throw new Error("WebXR requires HTTPS.");
  }

  if (!navigator.xr) {
    throw new Error("This browser does not expose navigator.xr.");
  }

  const withOverlay: XRSessionInit = {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["local-floor", "dom-overlay"],
    ...(overlayRoot ? { domOverlay: { root: overlayRoot } } : {}),
  };

  try {
    return await navigator.xr.requestSession("immersive-ar", withOverlay);
  } catch {
    return navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["local-floor"],
    });
  }
}
