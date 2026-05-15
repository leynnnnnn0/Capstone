# Functional Requirements

## Authentication

1. Customers can request an OTP using the email or phone used in an appointment or work job.
2. Customers cannot use staff login credentials in the OTP login flow.
3. Staff users login with email and password.
4. Staff users can update profile information and password.
5. Staff users can enable and disable two-factor authentication.

## Customer Appointments

1. Customer can create an appointment without quotation items.
2. Customer can create an appointment with quotation items.
3. Customer can edit an appointment only when it is pending.
4. Customer can cancel eligible appointments.
5. Customer cannot delete appointments.
6. Customer can rebook cancelled appointments and reuse previous details.
7. Customer can see appointment details, location map, quotation, and activity log.

## Admin Appointments

1. Admin can list, search, filter, and view appointments.
2. Admin can create appointments with status, schedule, workers, and quotation.
3. Admin can edit appointment details.
4. Admin can confirm, reschedule, cancel, reopen, mark no-show, mark on-the-way, mark in-progress, and mark completed.
5. Admin cannot edit/create quotation or edit appointment when the status is cancelled or no-show.
6. Admin can open calendar drawers to inspect appointment details.

## Worker Appointments

1. Worker can see only assigned appointments.
2. Worker can see only worker schedule on the calendar module.
3. Worker cannot edit customer/appointment details.
4. Worker can update allowed statuses.
5. Worker can create or update quotation where permission allows.

## Quotations

1. Staff can create quotation items with product, size, quantity, options, and pricing.
2. Staff can update quotation item status.
3. Staff can upload before and after photos for quotation items.
4. Customer can see a digital quotation.
5. Customer can download quotation PDF.
6. Customer can sign approved quotations using e-signature.
7. Printed quotation PDF includes printed name, signature image, and signed date when signed.
8. If quotation content changes after signing, the signature is invalidated and the customer is notified to sign again.
9. Admin is notified when customer signs a quotation.
10. Admin can see whether quotation is signed or needs re-signing.

## Work Jobs

1. Admin can create work jobs directly.
2. Admin can create work jobs from appointments with prefilled customer, schedule, worker, and quotation details.
3. Worker can see assigned work jobs.
4. Worker can update allowed work job statuses.
5. Customer can track work job progress but cannot create work jobs.

## Notifications

1. System creates database notifications for appointment, quotation, and work job updates.
2. Customer receives relevant staff/admin changes.
3. Staff receives customer-originated changes.
4. Users can mark notifications as read or delete notifications.
5. Realtime events refresh affected pages without manual reload.

## Audit

1. System audits changes to users, products, appointments, quotations, work jobs, remarks, images, options, and related records.
2. Admin/sub-admin can view audit list.
3. Admin/sub-admin can open audit detail page to inspect before and after values.

