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

If the AR app needs to read products from a backend that is not reachable as
`http://localhost:8000` from the device, set:

```bash
VITE_API_URL=https://your-backend-url.test npm run dev
```

The AR catalogue reads products from `/api/v1/products` and uses each product's
uploaded `model_3d.file_url`.

## Current Scope

This is Tier 1 only:

- WebXR `immersive-ar`
- Required `hit-test`
- Start button directly calls `navigator.xr.requestSession(...)`
- No startup `isSessionSupported(...)` gate
- Reticle confidence based on stable hit-test frames
- Tap places numbered points
- Consecutive points draw measured line segments
- `Finish Object` computes shape segments and height
- Multi-object session list and summary page

Shape points are captured first. After pressing `Finish Shape`, the next point
is treated as the object height.
