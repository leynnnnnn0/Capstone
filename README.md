# SOG Glass and Aluminum System

SOG Glass and Aluminum is a Laravel, Next.js, and React/Vite system for appointment booking, quotations, work jobs, payments, product management, AR measurement, realtime notifications, reporting, auditing, and customer self-service.

The project is split into three main apps:

```txt
sog-project/
├── backend   # Laravel API, auth, payments, reports, queues, Reverb
├── frontend  # Next.js web app for customers, admin, workers
└── ar        # Standalone React/Vite WebXR AR measurement app
```

## Requirements

Install these before running the project:

- Herd
- Git
- Composer
- Node.js 22 LTS or newer
- npm
- MySQL or MariaDB
- Google Chrome

Recommended tools:

- Visual Studio Code
- TablePlus, Sequel Ace, or DBeaver for database inspection
- ngrok for mobile AR testing
- Blender for editing or creating `.glb` 3D models

Optional for testing:

- Playwright browsers

```bash
cd frontend
npx playwright install
```

## Clone The Project

```bash
git clone <repository-url> sog-project
cd sog-project
```

If the project is copied through a zip file or external drive, make sure the folder is placed somewhere Herd can access, for example:

```txt
/Users/<name>/Herd/sog-project
```

## Backend Setup

Go to the Laravel backend:

```bash
cd backend
```

Install PHP dependencies:

```bash
composer install
```

Install backend JavaScript dependencies. These are needed by Vite and by PDF generation through Browsershot/Puppeteer:

```bash
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Generate the Laravel app key:

```bash
php artisan key:generate
```

Create a MySQL database, for example:

```txt
sog_project
```

Update `backend/.env`:

```env
APP_NAME="SOG Glass and Aluminum"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

FRONTEND_URL=http://localhost:3000
AR_FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sog_project
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=sog-local
REVERB_APP_KEY=your-local-reverb-key
REVERB_APP_SECRET=your-local-reverb-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_CURRENCY=PHP
```

Use the same Reverb values in the frontend environment later.

If you will test maps, email, SMS, PayPal, or realtime notifications, also configure:

```env
MAIL_MAILER=
MAIL_HOST=
MAIL_PORT=
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

Run migrations and seeders:

```bash
php artisan migrate --seed
```

Create the storage symlink:

```bash
php artisan storage:link
```

Clear cached config:

```bash
php artisan optimize:clear
```

## Frontend Setup

Go to the Next.js frontend:

```bash
cd ../frontend
```

Install dependencies:

```bash
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

NEXT_PUBLIC_REVERB_APP_KEY=your-local-reverb-key
NEXT_PUBLIC_REVERB_HOST=localhost
NEXT_PUBLIC_REVERB_PORT=8080
NEXT_PUBLIC_REVERB_SCHEME=http
```

The `NEXT_PUBLIC_REVERB_APP_KEY` value must match `REVERB_APP_KEY` in `backend/.env`.

## AR App Setup

Go to the standalone AR app:

```bash
cd ../ar
```

Install dependencies:

```bash
npm install
```

Create `ar/.env.local`:

```env
VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:3000
```

The AR catalogue reads products from the backend and uses uploaded product 3D model files.

## Running The System Locally

Open separate terminals.

Terminal 1 - Laravel API:

```bash
cd backend
php artisan serve
```

Default URL:

```txt
http://localhost:8000
```

Terminal 2 - Queue worker:

```bash
cd backend
php artisan queue:work
```

Terminal 3 - Reverb realtime server:

```bash
cd backend
php artisan reverb:start
```

Default WebSocket port:

```txt
8080
```

Terminal 4 - Next.js frontend:

```bash
cd frontend
npm run dev
```

Default URL:

```txt
http://localhost:3000
```

Terminal 5 - AR app:

```bash
cd ar
npm run dev
```

Default URL:

```txt
http://localhost:5173
```

## Useful URLs

```txt
Public website:        http://localhost:3000
Customer login:        http://localhost:3000/login
Staff/admin login:     http://localhost:3000/staff/login
Admin dashboard:       http://localhost:3000/dashboard
Customer account:      http://localhost:3000/account
AR app:                http://localhost:5173
Backend API:           http://localhost:8000/api/v1
```

## Main Features

Customer side:

- Browse products and product details
- Build quote requests
- Book appointments
- Track appointments by reference number
- Passwordless OTP login
- Customer dashboard
- View appointments and work jobs
- View quote items, images, before and after photos
- Sign quotations
- Pay work job balances or down payments through PayPal
- Receive realtime and database notifications

Admin side:

- Dashboard and charts
- Users, roles, and permissions
- Product CRUD
- Product images and 3D model uploads
- Appointment CRUD
- Appointment calendar
- Work job CRUD
- Back jobs
- Quotation editor
- Quote PDF export
- Payments module
- Sales report with CSV, Excel, and PDF export
- Audit logs
- Realtime notifications

Worker side:

- Worker dashboard
- Assigned appointments
- Assigned work jobs
- Worker calendar
- Status updates with remarks
- Quotation creation where allowed
- Before and after photo workflows

AR app:

- WebXR hit testing
- Reticle-based point placement
- Shape and height measurement
- Product 3D model catalogue from backend products
- Multi-object AR session
- Redirect measured items to the quote request flow

## Mobile AR Testing

WebXR AR requires HTTPS on a real mobile device. Localhost on a laptop is not enough for Android Chrome.

Start the AR app:

```bash
cd ar
npm run dev
```

Expose it with ngrok:

```bash
ngrok http 5173
```

Open the HTTPS ngrok URL on an Android phone with:

- Google Chrome
- ARCore support
- Google Play Services for AR installed

If the AR app needs to call your backend from the phone, the backend must also be reachable from the phone. You can either expose the backend with another ngrok tunnel or deploy it to a reachable URL.

Example:

```bash
VITE_API_URL=https://your-backend-ngrok-url.ngrok-free.dev npm run dev
```

If the AR app needs to redirect to the frontend quote page:

```bash
VITE_FRONTEND_URL=https://your-frontend-url.ngrok-free.dev npm run dev
```

## Payments Setup

The system uses PayPal sandbox for development.

1. Go to the PayPal Developer dashboard.
2. Create or use a sandbox REST API app.
3. Copy the sandbox client ID and secret.
4. Put them in `backend/.env`:

```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-sandbox-client-id
PAYPAL_CLIENT_SECRET=your-sandbox-client-secret
PAYPAL_CURRENCY=PHP
```

5. Use a sandbox personal buyer account to test checkout.

Do not use real PayPal credentials or real money while `PAYPAL_MODE=sandbox`.

## Reports And PDF Export

The backend uses Laravel Excel for spreadsheet exports and Browsershot/Puppeteer for PDF generation.

If PDF export fails, check that backend npm dependencies are installed:

```bash
cd backend
npm install
```

If needed, clear Laravel config:

```bash
php artisan optimize:clear
```

## Running Tests

Backend tests:

```bash
cd backend
php artisan test
```

Frontend build check:

```bash
cd frontend
npm run build
```

Frontend E2E tests:

```bash
cd frontend
npm run test:e2e
```

AR build check:

```bash
cd ar
npm run build
```

## Common Development Commands

Clear backend cache:

```bash
cd backend
php artisan optimize:clear
```

Run new migrations:

```bash
cd backend
php artisan migrate
```

Seed database:

```bash
cd backend
php artisan db:seed
```

Reset database during development:

```bash
cd backend
php artisan migrate:fresh --seed
```

Restart queue after code changes:

```bash
cd backend
php artisan queue:restart
```

## Troubleshooting

### CORS Error

Make sure the frontend URL is listed in `backend/config/cors.php` through `FRONTEND_URL`:

```env
FRONTEND_URL=http://localhost:3000
```

Then clear config:

```bash
cd backend
php artisan optimize:clear
```

### Login Works But Authenticated Requests Fail

Check:

- `NEXT_PUBLIC_API_URL` points to the Laravel backend
- frontend requests use credentials
- Sanctum stateful domains include the frontend host
- backend cookies are not blocked by the browser

### Realtime Notifications Do Not Show

Check:

- `php artisan reverb:start` is running
- frontend Reverb env values match backend Reverb env values
- queue worker is running
- browser console has no WebSocket connection errors

### PayPal Checkout Fails

Check:

- `PAYPAL_MODE=sandbox`
- client ID and secret are from the same sandbox app
- the buyer uses a sandbox personal account
- backend config was cleared after env changes

```bash
cd backend
php artisan optimize:clear
```

### Uploaded Images Or GLB Files Do Not Load

Run:

```bash
cd backend
php artisan storage:link
```

Also make sure the backend URL is reachable from the frontend or AR app.

### AR Does Not Open On Phone

Check:

- You are using HTTPS
- Android Chrome is used
- phone supports ARCore
- Google Play Services for AR is installed
- ngrok points to the AR app port, usually `5173`
- backend URL is reachable if loading product models from the backend

## Project Notes

- The backend is the source of truth for business rules.
- The frontend uses Zod for user-friendly validation.
- The AR app is separate from Next.js to avoid SSR, middleware, and hydration issues with WebXR.
- Product 3D models are uploaded through the admin product module and consumed by the AR app.
- Reverb provides realtime updates, while database notifications keep a persistent fallback record.
