# SOG AR Measurement

Standalone React/Vite WebXR app for AR measurement. This app is separate from
the Next.js frontend so WebXR is not affected by Next middleware, SSR, or
hydration behavior.

## Development

```bash
cd ar
npm install
npm run dev
```

The dev server runs on:

```txt
http://localhost:5173
```

For mobile testing with ngrok:

```bash
ngrok http 5173
```

Open the HTTPS ngrok URL on an Android Chrome device with ARCore support.

## Current Scope

This is Tier 1 only:

- WebXR `immersive-ar`
- Required `hit-test`
- Start button directly calls `navigator.xr.requestSession(...)`
- No startup `isSessionSupported(...)` gate
- Reticle confidence based on stable hit-test frames
- Tap places numbered points
- Consecutive points draw measured line segments
- `Finish Object` computes shape segments, height, and thickness
- Multi-object session list and summary page

The second-to-last point is treated as height, and the last point is treated as
material thickness.
