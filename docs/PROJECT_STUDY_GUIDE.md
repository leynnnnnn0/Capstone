# SOG Project Study Guide

This document explains the whole project at a practical level: what each app does, where the important files are, how data moves, and why the folders exist. Use it as the first place to look before reading individual files.

## 1. Project Overview

The repository has three main parts:

- `backend/` is the Laravel API. It owns database records, authentication, file storage, business rules, quotations, appointments, work jobs, payments, reports, and notifications.
- `frontend/` is the Next.js web app. It owns the public website, product catalog, quote builder, customer account pages, staff/admin dashboard, and model-viewer fallback UI.
- `ar/` is the Vite/React WebXR app. It owns camera-based AR measurement and placement, product model browsing inside AR, quote item capture, and handoff back to the quote page.
- `docs/` stores system documentation, diagrams, setup notes, and this study guide.

The most important idea: the backend is the source of truth. Frontend and AR both fetch products, models, quotations, and customer data from the backend API.

## 2. Backend Structure

Backend path: `backend/`

### Routes

- `backend/routes/api.php`
  Main API route loader. It includes auth routes and groups business routes under `/api/v1`.

- `backend/routes/api/auth.php`
  Staff login/logout/session routes.

- `backend/routes/api/customer_auth.php`
  Customer OTP authentication routes.

- `backend/routes/api/user.php`
  Current authenticated user endpoint.

- `backend/routes/api/v1/products.php`
  Product CRUD, product image upload/delete, and 3D model file endpoint.

- `backend/routes/api/v1/appointments.php`
  Appointment booking and appointment status actions.

- `backend/routes/api/v1/quotations.php`
  Quotation CRUD, quotation item status, signatures, PDFs, and item images.

- `backend/routes/api/v1/work_jobs.php`
  Work job scheduling, status changes, back jobs, payments, and charges.

- `backend/routes/api/v1/tracking.php`
  Public tracking lookup.

- `backend/routes/api/v1/sales.php`
  Sales report endpoints.

### Controllers

Controllers live in `backend/app/Http/Controllers`.

Controllers should mostly do HTTP work:

- receive requests
- use Form Request validation
- call services
- return JSON resources
- catch/report errors where useful

Examples:

- `Products/ProductController.php`
  Lists, creates, shows, updates, and deletes products. It delegates file/relation syncing to `ProductService`.

- `Products/Product3DModelFileController.php`
  Streams 3D model files so AR/model-viewer can load GLB assets.

- `Appointments/AppointmentController.php`
  Handles appointment CRUD and passes business rules to `AppointmentService`.

- `Quotations/QuotationController.php`
  Handles quotation create/update/show and passes line item rules to `QuotationService`.

- `WorkJobs/WorkJobController.php`
  Handles work job CRUD and passes operational rules to `WorkJobService`.

### Requests

Requests live in `backend/app/Http/Requests`.

They validate incoming payloads before the controller runs. This keeps validation rules out of controllers.

Important examples:

- `Products/StoreProductRequest.php`
- `Products/UpdateProductRequest.php`
- `Customer/StoreCustomerAppointmentRequest.php`
- `Quotations/StoreQuotationRequest.php`
- `WorkJobs/StoreWorkJobRequest.php`

### Resources

Resources live in `backend/app/Http/Resources`.

Resources shape API responses. They are important because the frontend and AR depend on their field names.

Important examples:

- `ProductResource.php`
  Returns product details, categories, images, 3D model, warranty, variants, and option groups.

- `ProductImageResource.php`
  Converts stored image paths into usable URLs.

- `Product3DModelResource.php`
  Converts stored GLB paths into file URLs for model-viewer and AR.

- `QuotationResource.php`
  Returns appointment quotation summary and quotation items.

- `WorkJobResource.php`
  Returns work job details, workers, charges, ratings, warranties, and related records.

### Models

Models live in `backend/app/Models`.

Models represent database tables and relationships.

Important product models:

- `Product.php`
- `ProductImage.php`
- `Product3DModel.php`
- `ProductVariant.php`
- `ProductVariantImage.php`
- `ProductOptionGroup.php`
- `ProductOption.php`
- `ProductWarranty.php`

Important workflow models:

- `Appointment.php`
- `Quotation.php`
- `QuotationItem.php`
- `WorkJob.php`
- `Payment.php`
- `WorkJobCharge.php`
- `WorkJobWarranty.php`

### Services

Services live in `backend/app/Services`.

Services contain business rules and database transactions. This is where you should study how the system actually behaves.

Important services:

- `ProductService.php`
  Creates/updates products, images, variants, option groups, warranty, and 3D models.

- `AppointmentService.php`
  Creates appointments, checks slot capacity, confirms/cancels/reschedules, creates initial quotations, and dispatches appointment events.

- `QuotationService.php`
  Creates/updates quotation line items, stores selected options, and invalidates signatures after quote edits.

- `WorkJobService.php`
  Creates installation/service jobs, converts appointments into work jobs, creates back jobs, and changes work job status.

- `CustomerOtpService.php`
  Creates and verifies OTP login codes for customer access.

- `RealtimeNotificationService.php`
  Creates notifications and broadcasts them to subscribed frontend users.

- `SalesReportService.php`
  Builds report data for sales dashboards and exports.

### Events, Listeners, and Notifications

- `backend/app/Events`
  Events describe something that happened: appointment booked, quotation changed, work job changed, payment recorded.

- `backend/app/Listeners`
  Listeners react to events: send email/SMS, create notifications, broadcast realtime updates.

- `backend/app/Notifications`
  Notification classes define notification payloads.

### Database

- `backend/database/migrations`
  Defines tables and columns.

- `backend/database/seeders`
  Creates sample/system data.

- `backend/database/factories`
  Creates fake test data.

## 3. Frontend Structure

Frontend path: `frontend/`

### App Routes

Routes live in `frontend/app`.

Important routes:

- `frontend/app/page.tsx`
  Public landing page.

- `frontend/app/products/page.tsx`
  Public product catalog.

- `frontend/app/products/[product]/page.tsx`
  Public product details page.

- `frontend/app/get-quote/page.tsx`
  Quote builder and checkout page.

- `frontend/app/track/page.tsx`
  Public appointment/work tracking.

- `frontend/app/account/*`
  Customer account pages.

- `frontend/app/(dashboard)/dashboard/*`
  Staff/admin dashboard pages.

### Components

Components live in `frontend/components`.

Important groups:

- `landing/`
  Public home page UI: hero, navbar, booking section, footer.

- `public-products/`
  Public catalog and product detail UI, including AR button behavior.

- `quote/`
  Quote builder, cart, checkout form, dimension fields, variant picker, option picker.

- `customer/`
  Customer dashboard, customer appointments, customer work jobs.

- `admin-appointments/`
  Admin appointment list, details, forms, quotation editor.

- `admin-work-jobs/`
  Admin work job list, details, status actions, payments, charges, back jobs.

- `products/`
  Admin product forms, product list, product details, 3D model viewer.

- `ui/`
  Shared shadcn-style UI primitives.

### Features

Features live in `frontend/features`.

This folder holds API clients, types, schemas, and utility functions per domain.

Important files:

- `frontend/lib/api.ts`
  Shared fetch wrapper. It applies `NEXT_PUBLIC_API_URL`, sends cookies, adds headers, handles JSON errors, and redirects on unauthenticated responses.

- `features/products/product-api.ts`
  Product API functions used by product pages, quote builder, and AR-related frontend UI.

- `features/products/product-utils.ts`
  Product image/category/3D model helpers. Use this instead of manually guessing product field shapes.

- `features/quotes/ar-quote-handoff.ts`
  Decodes AR measurements from the URL and converts them into quote cart items.

- `features/quotes/quote-api.ts`
  Sends final quote/booking data to the backend.

- `features/customer/customer-api.ts`
  Customer account API functions.

- `features/admin-work-jobs/admin-work-job-api.ts`
  Admin work job API functions.

## 4. AR Structure

AR path: `ar/`

### Entry Files

- `ar/src/main.tsx`
  Mounts the React app.

- `ar/src/App.tsx`
  Main AR application. This is the largest file because it coordinates WebXR, Three.js scene objects, product drawers, measurement state, quote summary, and navigation.

- `ar/src/styles.css`
  AR-specific styling for overlays, drawers, navigation, panels, and product cards.

### AR Components

- `ar/src/components/shop/ArShop.tsx`
  Product browsing screen inside the AR app.

- `ar/src/components/ui/*`
  AR-local shadcn-style UI components.

### Measurement Feature Files

- `ar/src/features/measurement/model-catalog.ts`
  Fetches backend products and converts them into AR model definitions. It also contains local fallback/sample model data.

- `ar/src/features/measurement/scene.ts`
  Creates and resizes the Three.js scene, renderer, lights, camera, and reticle.

- `ar/src/features/measurement/xr-session.ts`
  Requests WebXR immersive-ar sessions and hit-test features.

- `ar/src/features/measurement/snapping.ts`
  Converts hit-test points into stable planes and snapped measurement points.

- `ar/src/features/measurement/dimensions.ts`
  Computes dimensions from captured points.

- `ar/src/features/measurement/labels.ts`
  Creates text labels in the AR scene.

- `ar/src/features/measurement/types.ts`
  Shared AR types.

## 5. Main Data Flows

### Public Product Catalog

1. User opens `/products`.
2. `PublicProductCatalog` calls `fetchProducts`.
3. `fetchProducts` uses `frontend/lib/api.ts`.
4. Backend route `/api/v1/products` goes to `ProductController@index`.
5. `ProductController@index` loads product relations.
6. `ProductResource` returns normalized product JSON.
7. Frontend renders product cards and AR buttons.

### Product Details and Model Viewer

1. User opens `/products/{id}`.
2. Frontend fetches one product.
3. Product details show gallery, variants, quote button, and AR/model-viewer button.
4. If WebXR is supported, AR button opens the configured AR route.
5. If WebXR is not supported, frontend opens model-viewer fallback.

### AR Product Loading

1. User opens `/ar/v2` or `/ar/v3`.
2. `App.tsx` calls `fetchProductModelCatalog`.
3. `model-catalog.ts` fetches backend products.
4. Products with `model_3d.file_url` become AR model definitions.
5. The AR product drawer shows available models.

### AR Placement and Measurement

V1:

1. User taps shape points.
2. User taps height point.
3. Dimensions are computed from captured points.
4. Item is added to quote summary.

V2:

1. User scans/locks reference wall.
2. User taps location on wall/floor.
3. Product model is placed.
4. User adjusts height, width, rotation, and position.
5. Item is added to quote summary.
6. "Do another" asks for a new wall again.

V3:

1. User starts directly in AR.
2. Model appears in front of the camera.
3. User can move/place with simplified controls.
4. This is experimental compared with V2.

### AR Quote Handoff

1. AR app builds an `ArQuoteTransferPayload`.
2. Payload is base64url encoded into `ar_items`.
3. Browser navigates to `/get-quote?checkout=1&source=ar&ar_items=...`.
4. `GetQuotePage` loads active products.
5. `parseArQuoteHandoff` decodes the payload.
6. `arHandoffToCartItems` converts AR measurements into quote cart items.
7. Customer sees checkout with AR-measured items.

### Save for Later

1. User tries to exit AR with quote items.
2. AR opens an exit drawer.
3. `Save for later` stores the AR quote payload in browser storage and exits.
4. `Discard and Exit` clears saved AR quote data and exits.
5. Closing the drawer keeps the user inside AR.

### Quote Builder

1. User opens `/get-quote`.
2. Frontend loads active products.
3. User selects product/variant/options/dimensions.
4. Items are added to cart.
5. Checkout submits an appointment/quotation request to backend.
6. Backend creates appointment and quotation records.

### Appointment to Work Job

1. Customer submits appointment/quote request.
2. Admin confirms appointment and assigns workers.
3. Admin can proceed appointment to work job.
4. `WorkJobService` creates operational work job.
5. Workers/admin update job status.
6. Completion can issue warranty.

## 6. Payments and Refunds

Payments are attached to work jobs, not directly to products or appointments. A quotation establishes the approved price. A work job establishes the operational record that can be paid.

### Important Payment Files

Backend:

- `backend/routes/api/v1/payments.php`
  Staff payment listing and refund endpoints.

- `backend/routes/api/v1/customer.php`
  Customer PayPal configuration, order creation, and capture endpoints.

- `backend/routes/api/v1/work_jobs.php`
  Staff manual-payment and additional-charge endpoints.

- `backend/app/Services/Payments/WorkJobPaymentService.php`
  Central billing calculator. It decides the payable amount, accepted payment types, PayPal lifecycle, and staff-recorded payment rules.

- `backend/app/Services/Payments/PaymentRefundService.php`
  Refund validation, PayPal refund requests, manual refunds, status updates, remarks, and events.

- `backend/app/Services/Payments/PayPalClient.php`
  Small HTTP client for PayPal access tokens, order creation, order capture, and capture refunds.

- `backend/app/Services/Payments/PaymentReconciliationService.php`
  Cancels stale pending PayPal checkout records.

- `backend/app/Models/Payment.php`
  Payment record plus helpers for captured revenue, refunded total, net amount, refundable balance, and whether refunding is allowed.

- `backend/app/Models/PaymentRefund.php`
  Individual refund record. One payment can have multiple partial refunds.

- `backend/app/Services/WorkJobChargeService.php`
  Additional service fees, materials, delivery fees, discounts, and their approval state.

Frontend:

- `frontend/components/customer/work-jobs/CustomerWorkJobPaymentCard.tsx`
  Customer payment summary, PayPal checkout buttons, adjustment details, and payment history.

- `frontend/components/admin-work-jobs/AdminWorkJobPaymentsCard.tsx`
  Staff manual-payment form and work-job payment history.

- `frontend/components/admin-work-jobs/AdminWorkJobChargesCard.tsx`
  Staff UI for additional charges and discounts.

- `frontend/components/admin-payments/AdminPaymentsPage.tsx`
  Admin payment ledger, filters, totals, and refund action.

- `frontend/features/customer/customer-api.ts`
  Customer PayPal API calls.

- `frontend/features/admin-work-jobs/admin-work-job-api.ts`
  Manual-payment and charge API calls.

- `frontend/features/admin-payments/admin-payment-api.ts`
  Admin payment ledger and refund API calls.

### Payment Types

`backend/app/Enums/PaymentType.php` defines:

- `down_payment`
  Partial amount required before the remaining balance.

- `final_payment`
  Remaining amount after the required down payment is complete.

- `full_payment`
  Entire remaining quotation balance when no down payment is required. It may also be used instead of a down payment when the work job allows it.

- `additional_charge`
  Approved extra amount after normal quotation payment.

### Payment Methods

`backend/app/Enums/PaymentMethod.php` defines:

- `paypal`
  Customer online checkout. Must use PayPal order and capture.

- `cash`
  Staff records an offline cash collection.

- `bank_transfer`
  Staff records an offline bank transfer.

- `other`
  Staff records another offline method.

### Payment Statuses

`backend/app/Enums/PaymentStatus.php` defines:

- `pending`
  Online PayPal order exists but has not been captured.

- `paid`
  Captured online payment or confirmed manual payment.

- `failed`
  Provider order/capture failed.

- `cancelled`
  Checkout expired or another payment superseded it.

- `partially_refunded`
  Some captured amount was returned.

- `refunded`
  The entire captured amount was returned.

### Billing Formula

`WorkJobPaymentService::summary()` is the source of truth:

```text
approved quotation total
+ approved non-discount charges
- approved discount charges
= payable total

payable total
- sum(net amount of captured payments)
= remaining amount

payment net amount
= original payment amount - completed refunds
```

Only approved quotation items count toward the quotation total. Pending charges do not become payable until approved. A cancelled work job cannot accept payments.

For a back job, the inherited quotation total is informational only. Billing starts at zero because the original work job already owns the quoted cost. Only approved extra charges become payable.

### Down-Payment Rules

1. Admin creates a work job and optionally enables `is_down_payment_required`.
2. `down_payment_percentage` defaults to `20`.
3. `WorkJobPaymentService::summary()` computes the down-payment target from the payable total.
4. Until that target is satisfied, the accepted types are `down_payment` and optionally `full_payment`.
5. After the target is satisfied, the accepted type becomes `final_payment`.
6. If approved post-payment charges remain, the accepted type becomes `additional_charge`.

### Customer PayPal Checkout Flow

1. Customer opens a work-job page.
2. `CustomerWorkJobPaymentCard.tsx` requests `/api/v1/customer/payments/paypal/config`.
3. The component renders only the payment actions allowed by `payment_summary.accepted_payment_types`.
4. Customer chooses a payment action.
5. Frontend calls `POST /api/v1/customer/work-jobs/{workJob}/payments/paypal/order`.
6. `CustomerWorkJobPaymentController::createOrder()` calls `WorkJobPaymentService::createPayPalOrder()`.
7. The service calculates the exact amount due and creates a local `pending` payment.
8. `PayPalClient::createOrder()` sends the provider request.
9. Frontend opens PayPal checkout.
10. After approval, frontend calls `POST /api/v1/customer/work-jobs/{workJob}/payments/paypal/capture`.
11. `WorkJobPaymentService::capturePayPalPayment()` captures the provider order.
12. Successful capture changes the local status to `paid`, stores PayPal payer/capture data, writes a work-job remark, cancels competing pending checkouts, and dispatches `PaymentRecorded`.

Recent equivalent pending checkouts can be reused for 30 minutes. A new checkout or an offline payment cancels obsolete pending records so the UI does not show misleading pending balances.

### Staff Manual-Payment Flow

1. Staff opens the admin work-job details page.
2. `AdminWorkJobPaymentsCard.tsx` opens the manual-payment dialog.
3. Staff selects type, offline method, amount, date, and remarks.
4. Frontend calls `POST /api/v1/work-jobs/{workJob}/payments/manual`.
5. `RecordWorkJobPaymentController` blocks workers and validates the payload.
6. `WorkJobPaymentService::recordManualPayment()` validates current balance and allowed type.
7. The service stores a `paid` payment, writes a work-job remark, cancels stale PayPal checkout records for that job, and dispatches `PaymentRecorded`.

Manual payments cannot use the `paypal` method. Online PayPal payments must go through provider capture.

### Additional Charges and Discounts

1. Staff opens the work-job charge card.
2. Staff creates a charge through `POST /api/v1/work-jobs/{workJob}/charges`.
3. `WorkJobChargeService` stores the charge, creates a remark, and dispatches `WorkJobChanged`.
4. Approved non-discount charges increase the payable total.
5. Approved discounts decrease the payable total.
6. Pending-approval charges are shown but are not collectible yet.
7. Cancelled charges no longer affect billing.

### Refund Flow

1. Staff opens `/dashboard/payments`.
2. `AdminPaymentsPage.tsx` loads `GET /api/v1/payments`.
3. Staff chooses a refundable captured payment and enters amount, method, and reason.
4. Frontend calls `POST /api/v1/payments/{payment}/refund`.
5. `PaymentController::refund()` requires the `payments.refund` permission.
6. `PaymentRefundService::refund()` locks the payment row to protect against overlapping refunds.
7. The service rejects non-paid payments, zero amounts, over-refunds, missing PayPal capture IDs, and unconfigured PayPal refunds.
8. The service creates a `pending` refund record.
9. For PayPal, `PayPalClient::refundCapture()` calls the provider API. For manual methods, the refund completes locally.
10. Successful completion updates the refund record and changes the payment status to `partially_refunded` or `refunded`.
11. The service creates a work-job remark and dispatches `PaymentRefunded`.
12. Payment summary and sales reports immediately use the reduced net amount.

### Stale Checkout Reconciliation

`backend/routes/console.php` registers:

```bash
php artisan payments:reconcile --minutes=60
```

This calls `PaymentReconciliationService::cancelStalePendingPayPalPayments()`. It cancels PayPal payments that remained pending beyond the chosen time window. This is useful for a scheduler or operational cleanup command.

### PayPal Environment Variables

Backend `.env`:

```dotenv
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_CURRENCY=PHP
```

Use `PAYPAL_MODE=live` only with live credentials. `backend/config/paypal.php` selects the PayPal API base URL.

## 7. Complete Business Workflows

### Customer Authentication

Customer authentication uses OTP instead of a password:

1. Customer submits email or phone.
2. `CustomerOtpService::requestCode()` verifies that the contact belongs to an appointment or work job.
3. The service enforces a 60-second cooldown, invalidates old unused codes, stores a hashed six-digit OTP, and sends it by email or SMS.
4. OTP expires after 10 minutes.
5. `verifyCode()` allows up to five attempts.
6. Successful verification consumes the OTP, resolves or creates the customer account, and claims matching appointment/work-job records.

Staff authentication is separate and uses the standard authenticated session routes.

### Quotation Lifecycle

1. Booking or AR checkout includes product line items.
2. `AppointmentService::create()` stores the appointment.
3. If items exist, it calls `QuotationService::create()`.
4. `QuotationService::syncItems()` snapshots product name, description, dimensions, pieces, price, total, and selected options.
5. Staff reviews items and updates item statuses.
6. Customer signs only when at least one quotation item is approved.
7. `QuotationSignatureService` stores a PNG signature, signer name, IP address, user agent, timestamp, and a hash of approved quote data.
8. Editing the quotation or item status invalidates the signature so the customer must review and sign again.

### Appointment Lifecycle

1. Customer submits preferred date/time and contact details.
2. `AppointmentService` limits each preferred slot to 10 pending or confirmed appointments.
3. Appointment starts as pending unless staff creates it differently.
4. Staff confirms the appointment, assigns workers, and provides the actual schedule.
5. Staff can update, reschedule, cancel, reopen, mark on-the-way, in-progress, completed, or no-show through dedicated action controllers.
6. Status changes create remarks and events for realtime updates and notifications.

### Work Job Lifecycle

1. Staff creates a work job manually or from an appointment.
2. `WorkJobService` copies customer details, quotation link, assigned workers, schedule, and payment terms.
3. Work job starts as pending.
4. Staff moves it to in-progress, completed, or cancelled according to `WorkJobStatus` transition rules.
5. Completion issues warranty coverage for original jobs.
6. Staff can create a linked back job from in-progress or completed work.
7. Back jobs preserve history and do not charge the original quotation again.

### Warranty

1. `WorkJobService::complete()` calls `WorkJobWarrantyService::issueForCompletedWorkJob()`.
2. Warranty is issued only for completed original jobs, not back jobs.
3. Product-specific active warranty records are inspected through quotation items.
4. If products do not define warranty details, the service uses a 12-month default.
5. The resulting work-job warranty stores coverage, terms, start date, expiry date, status, customer, and issuing staff member.

### Customer Rating

1. Customer opens a completed work job.
2. Customer submits one to five stars and an optional comment.
3. `CustomerWorkJobRatingController` rejects ratings for incomplete jobs.
4. The controller creates or updates the work-job rating, adds a remark, and dispatches `WorkJobChanged`.

### Public Tracking

1. User enters a tracking reference on `/track`.
2. Frontend calls `GET /api/v1/track?reference=...`.
3. `TrackingService` treats references starting with `WJ-` as work jobs; other references are appointments.
4. The response includes schedule, status, quotation items, total, workers, and sanitized activity remarks.

### Realtime Notifications

Domain events dispatch after successful writes. Listeners call `RealtimeNotificationService`, which:

- creates notification records for relevant staff and customers
- chooses dashboard or customer-account links
- broadcasts record-change events to subscribed channels
- sends payment and refund updates to both sides

This keeps email, UI notifications, and broadcasts outside the main database transaction.

### Sales Reports

`SalesReportService` derives reports from payment records:

- gross sales from captured payment amounts
- net sales after completed refunds
- pending totals
- refunded totals
- outstanding work-job balances
- additional-charge collections
- average payment and collection rate
- charts by date, method, type, and status
- top products, customers, and work jobs
- export rows for CSV, XLSX, and PDF

Routes:

```text
GET /api/v1/sales
GET /api/v1/sales/export/csv
GET /api/v1/sales/export/xlsx
GET /api/v1/sales/export/pdf
```

## 8. API Route Map

### Public

```text
GET  /api/v1/products
GET  /api/v1/products/{product}
GET  /api/v1/product-3d-models/{product3DModel}/file
GET  /api/v1/track
```

### Customer Account

```text
GET   /api/v1/customer/appointments
POST  /api/v1/customer/appointments
GET   /api/v1/customer/appointments/{appointment}
PUT   /api/v1/customer/appointments/{appointment}
PATCH /api/v1/customer/appointments/{appointment}/cancel
GET   /api/v1/customer/work-jobs
GET   /api/v1/customer/work-jobs/{workJob}
POST  /api/v1/customer/work-jobs/{workJob}/rating
GET   /api/v1/customer/payments/paypal/config
POST  /api/v1/customer/work-jobs/{workJob}/payments/paypal/order
POST  /api/v1/customer/work-jobs/{workJob}/payments/paypal/capture
POST  /api/v1/customer/quotations/{quotation}/sign
```

### Staff Operations

```text
GET   /api/v1/work-jobs
GET   /api/v1/work-jobs/{workJob}
POST  /api/v1/work-jobs
POST  /api/v1/appointments/{appointment}/work-job
PATCH /api/v1/work-jobs/{workJob}/in-progress
PATCH /api/v1/work-jobs/{workJob}/complete
PATCH /api/v1/work-jobs/{workJob}/cancel
POST  /api/v1/work-jobs/{workJob}/back-jobs
POST  /api/v1/work-jobs/{workJob}/payments/manual
POST  /api/v1/work-jobs/{workJob}/charges
PATCH /api/v1/work-jobs/{workJob}/charges/{charge}
PATCH /api/v1/work-jobs/{workJob}/charges/{charge}/cancel
```

### Payment Administration

```text
GET  /api/v1/payments
POST /api/v1/payments/{payment}/refund
```

## 9. Environment Variables

Backend `.env` important values:

- `APP_URL`
  Base URL used by Laravel when generating storage URLs.

- `FRONTEND_URL`
  Frontend origin allowed for auth/CORS flows.

- `AR_FRONTEND_URL`
  AR app origin when separated from frontend.

- `SANCTUM_STATEFUL_DOMAINS`
  Domains where Sanctum cookie authentication is allowed.

- `PAYPAL_MODE`
  `sandbox` or `live`.

- `PAYPAL_CLIENT_ID`
  Public PayPal application client ID.

- `PAYPAL_CLIENT_SECRET`
  Server-only PayPal application secret.

- `PAYPAL_CURRENCY`
  Payment currency, currently expected to be `PHP`.

Frontend `.env` important values:

- `NEXT_PUBLIC_API_URL`
  Backend API base URL. The shared API client normalizes this value.

- `NEXT_PUBLIC_AR_URL`
  Base AR route or domain.

- `NEXT_PUBLIC_AR_VERSION`
  Controls which AR version buttons open: `v1`, `v2`, or `v3`.

AR `.env` important values:

- `VITE_API_URL`
  Backend API URL used by the AR catalog.

- `VITE_FRONTEND_URL`
  Frontend URL used when AR sends quote items back to `/get-quote`.

## 10. How to Study the Code

Recommended order:

1. Read `backend/routes/api.php`.
2. Read the route file for the feature you care about.
3. Read the controller.
4. Read the service.
5. Read the resource.
6. Read the frontend feature API file.
7. Read the frontend page/component.
8. For AR, read `model-catalog.ts`, `scene.ts`, `xr-session.ts`, then `App.tsx`.

For products and AR, study in this order:

1. `backend/routes/api/v1/products.php`
2. `backend/app/Http/Controllers/Products/ProductController.php`
3. `backend/app/Services/ProductService.php`
4. `backend/app/Http/Resources/ProductResource.php`
5. `frontend/features/products/product-api.ts`
6. `frontend/features/products/product-utils.ts`
7. `frontend/components/public-products/PublicProductCatalog.tsx`
8. `frontend/components/public-products/ProductArButton.tsx`
9. `ar/src/features/measurement/model-catalog.ts`
10. `ar/src/App.tsx`

For AR to quote:

1. `ar/src/App.tsx`
2. `frontend/features/quotes/ar-quote-handoff.ts`
3. `frontend/components/quote/GetQuotePage.tsx`
4. `frontend/components/quote/QuoteCheckoutForm.tsx`
5. `backend/app/Services/AppointmentService.php`
6. `backend/app/Services/QuotationService.php`

For payments and refunds:

1. `backend/app/Enums/PaymentType.php`
2. `backend/app/Enums/PaymentMethod.php`
3. `backend/app/Enums/PaymentStatus.php`
4. `backend/app/Models/Payment.php`
5. `backend/app/Services/Payments/WorkJobPaymentService.php`
6. `backend/app/Services/Payments/PayPalClient.php`
7. `backend/app/Services/Payments/PaymentRefundService.php`
8. `frontend/components/customer/work-jobs/CustomerWorkJobPaymentCard.tsx`
9. `frontend/components/admin-work-jobs/AdminWorkJobPaymentsCard.tsx`
10. `frontend/components/admin-payments/AdminPaymentsPage.tsx`

## 11. Debugging Checklist

Products not showing:

- Check `NEXT_PUBLIC_API_URL`.
- Open `/api/v1/products?is_active=1&per_page=5` directly.
- Check browser CORS errors.
- Check backend `APP_URL` if image URLs are wrong.
- Check `ProductResource` and `ProductImageResource`.

Images not showing:

- Inspect image `src`.
- Make sure it does not include the wrong port like `:8000` on an ngrok frontend domain.
- Check Laravel storage link.
- Check backend `APP_URL`.

3D model not showing:

- Open `model_3d.file_url` directly.
- Check CORS headers for GLB file endpoint.
- Check `Product3DModelResource`.
- Check AR console for GLTFLoader errors.
- Check `fitCatalogModel` and `removeCatalogModelArtifacts` in `ar/src/App.tsx`.

Login redirects or loops:

- Check `SANCTUM_STATEFUL_DOMAINS`.
- Check `FRONTEND_URL`.
- Check cookies in browser devtools.
- Clear site data for the current origin only.
- Check `frontend/lib/api.ts` redirect behavior.

AR not launching:

- WebXR requires HTTPS or a secure context.
- Check `NEXT_PUBLIC_AR_URL`.
- Check `NEXT_PUBLIC_AR_VERSION`.
- On unsupported devices, the product button should open model-viewer fallback.

Payment amount looks wrong:

- Inspect `payment_summary` in the work-job API response.
- Check approved quotation item statuses.
- Check approved charges and discounts.
- Check completed refunds, because only completed refunds reduce net payment.
- Read `WorkJobPaymentService::summary()`.

PayPal checkout not opening:

- Check `PAYPAL_MODE`, `PAYPAL_CLIENT_ID`, and `PAYPAL_CLIENT_SECRET`.
- Open `/api/v1/customer/payments/paypal/config`.
- Check whether `payment_summary.can_accept_payment` is true.
- Check `payment_summary.accepted_payment_types`.
- Run `php artisan payments:reconcile --minutes=60` if abandoned pending checkouts need cleanup.

Refund rejected:

- Confirm the payment has captured revenue.
- Confirm amount does not exceed `refundable_amount`.
- For PayPal, confirm `provider_capture_id` exists.
- Check the PayPal debug ID returned by the backend validation message.

## 12. Where to Add Future Changes

- Product fields or uploads:
  Backend `ProductService`, `ProductResource`, frontend product types, product forms.

- Product display:
  `PublicProductCatalog`, `PublicProductShow`, product utilities.

- Quote pricing:
  Frontend quote utilities and backend quotation service/request validation.

- AR product loading:
  `ar/src/features/measurement/model-catalog.ts`.

- AR placement or controls:
  `ar/src/App.tsx` and `ar/src/styles.css`.

- AR scene/camera/reticle:
  `ar/src/features/measurement/scene.ts` and `xr-session.ts`.

- Customer dashboard:
  `frontend/components/customer/*` and `frontend/features/customer/*`.

- Admin workflows:
  `frontend/components/admin-*`, `backend/app/Services/*`, route files under `backend/routes/api/v1`.

- Billing formulas, PayPal checkout, or manual payment rules:
  `backend/app/Services/Payments/WorkJobPaymentService.php`.

- Refund behavior:
  `backend/app/Services/Payments/PaymentRefundService.php`.

- Payment ledger UI:
  `frontend/components/admin-payments/AdminPaymentsPage.tsx`.

- Customer online payment UI:
  `frontend/components/customer/work-jobs/CustomerWorkJobPaymentCard.tsx`.
