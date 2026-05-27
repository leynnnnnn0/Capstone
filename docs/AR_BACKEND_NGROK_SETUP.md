# AR and Backend ngrok Setup for Product 3D Models

This guide explains how to run the Laravel backend and the standalone AR app so a phone can fetch uploaded product 3D models through ngrok.

## How the AR App Fetches Models

The AR app loads its product catalog from the backend:

```txt
GET {VITE_API_URL}/api/v1/products?per_page=100
```

The AR app only shows active products that have:

```json
{
  "model_3d": {
    "file_url": "https://backend-url/api/v1/product-3d-models/1/file"
  }
}
```

The model file is served by:

```txt
GET /api/v1/product-3d-models/{product3DModel}/file
```

That file endpoint returns correct GLB/GLTF content types and cross-origin headers for AR model loading.

## Backend Setup

From the backend folder:

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

In another terminal, expose the backend:

```bash
ngrok http 8000
```

Copy the HTTPS ngrok URL, for example:

```txt
https://abc123.ngrok-free.dev
```

Set the backend `.env` values so generated asset/model URLs point to the reachable backend URL:

```env
APP_URL=https://abc123.ngrok-free.dev
AR_FRONTEND_URL=https://your-ar-ngrok-url.ngrok-free.dev
```

Then clear cached config:

```bash
php artisan config:clear
```

If product model files are stored on the public disk, make sure the storage symlink exists:

```bash
php artisan storage:link
```

## AR App Setup

From the AR folder:

```bash
cd ar
VITE_API_URL=https://abc123.ngrok-free.dev npm run dev
```

If the AR app should send measurements to the Next.js frontend quote page, also set:

```bash
VITE_API_URL=https://abc123.ngrok-free.dev \
VITE_FRONTEND_URL=https://your-frontend-url.ngrok-free.dev \
npm run dev
```

Expose the AR dev server:

```bash
ngrok http 5173
```

Open the AR ngrok HTTPS URL on an Android Chrome device with ARCore support.

## Required Product Data

Products must be active and have an uploaded 3D model.

The backend accepts product 3D model uploads through the `model_3d` field. Current validation allows:

- `.glb`
- `.gltf`
- max size: 50 MB

The product API response must include `model_3d.file_url`. Products without `model_3d.file_url` are ignored by the AR catalog and local fallback models are shown instead.

## Quick Test

Use the backend ngrok URL:

```bash
curl https://abc123.ngrok-free.dev/api/v1/products?per_page=100 \
  -H "Accept: application/json"
```

Confirm at least one product has:

```json
"is_active": true,
"model_3d": {
  "file_url": "https://abc123.ngrok-free.dev/api/v1/product-3d-models/1/file"
}
```

Then test the model file URL:

```bash
curl -I https://abc123.ngrok-free.dev/api/v1/product-3d-models/1/file
```

Expected headers include a model content type such as:

```txt
Content-Type: model/gltf-binary
Access-Control-Allow-Origin: *
Accept-Ranges: bytes
```

## Common Problems

### AR app shows local fallback models

Check:

- `VITE_API_URL` points to the backend ngrok HTTPS URL.
- The AR dev server was restarted after changing `VITE_API_URL`.
- `/api/v1/products?per_page=100` is reachable from the phone.
- Products are active.
- Products have `model_3d.file_url`.

### Model file fails to load

Check:

- The `file_url` opens from the phone.
- `php artisan storage:link` has been run.
- The file still exists in `storage/app/public`.
- The file response is not HTML or a 404 page.
- The response content type is `model/gltf-binary` for `.glb` or `model/gltf+json` for `.gltf`.

### CORS errors

The backend CORS config already allows localhost AR ports and ngrok-free domains:

```php
'allowed_origins_patterns' => [
    '#^https://[a-z0-9-]+\.ngrok-free\.dev$#',
],
```

If using a custom ngrok domain or a deployed AR URL, add that origin to `AR_FRONTEND_URL` or the CORS config, then run:

```bash
php artisan config:clear
```

### ngrok browser warning blocks API responses

If ngrok returns an HTML warning page instead of JSON or GLB data, use a reserved ngrok domain, a deployed backend URL, or configure the request/tunnel so the warning is skipped. The AR app must receive JSON from `/api/v1/products` and binary model data from `/api/v1/product-3d-models/{id}/file`.

## Local Defaults

Without ngrok, the AR app defaults to:

```txt
VITE_API_URL=http://localhost:8000
```

This works on the development machine, but not on a phone, because the phone's `localhost` is the phone itself. Use the backend ngrok HTTPS URL for mobile AR testing.
