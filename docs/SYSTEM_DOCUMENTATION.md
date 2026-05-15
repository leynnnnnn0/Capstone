# SOG Glass and Aluminum System Documentation

## Overview

The system is a Laravel API and Next.js frontend for managing customer appointments, product quotations, work jobs, staff operations, worker schedules, real-time notifications, and audit history.

## User Roles

- Customer: books appointments, tracks appointments and work jobs, reviews quotation items, downloads quotation PDFs, and signs approved quotations.
- Worker: views assigned appointments and work jobs, updates operational statuses, creates quotations when allowed, and sees only assigned schedules.
- Sub Admin: manages operational records based on assigned permissions.
- Admin: full access to users, products, appointments, work jobs, quotations, dashboard analytics, audit logs, roles, and permissions.

## Major Modules

### Authentication and Security

- Staff login uses email/password.
- Customer login uses OTP by email or phone.
- Customer sessions can remain valid for the configured long-lived customer session period.
- Staff accounts support Fortify profile, password, and two-factor authentication settings.
- API requests include Sanctum cookie authentication and CSRF retry handling.
- Roles and permissions are handled through Laravel permission roles.

### Products

- Admin can manage products, categories, variants, option groups, options, and images.
- Product images and variant images are exposed to public/product pages and quotation builders.
- Product options are snapshotted into quotation items so old quotations do not change when product prices/options later change.

### Appointments

- Customers can create appointments with or without quotation items.
- Logged-in customer appointment creation can prefill from the customer’s most recent appointment except quotation items.
- Customers can edit pending appointments, cancel eligible appointments, and rebook cancelled appointments.
- Admin/sub-admin can create, view, edit, confirm, reschedule, cancel, reopen, mark no-show, and progress appointments.
- Workers can see appointments assigned to them and update allowed statuses.
- Appointment activity logs record status changes and remarks.

### Quotations

- Quotations can be created from customer-selected items or by staff.
- Quotation items support status changes such as for acceptance, approved, rejected, revision needed, and on hold.
- Only approved quotation items are included in the printed PDF.
- Customers can download the quotation PDF.
- Customers can sign approved quotations with an e-signature.
- A signed quotation stores the printed name, signature image, signed date, IP address, user agent, and approved quote content hash.
- If approved quotation content changes after signing, the signature becomes stale and the customer must sign again.
- Admin sees whether a quotation is signed or needs re-signing.

### Work Jobs

- Work jobs are created directly or from appointments.
- Work jobs can inherit appointment/customer/schedule/quotation details.
- Workers can only see assigned work jobs.
- Work job remarks record status changes and operational notes.

### Calendar

- Admin calendar shows appointments and worker schedules.
- Worker calendar is scoped to worker schedule only.
- Calendar entries open details drawers.
- Overlapping appointment/work schedules are handled by grouped/stacked event rendering.

### Notifications and Realtime

- Laravel broadcasting/Reverb and Echo are used for real-time updates.
- Appointment, quotation, and work job changes create database notifications.
- Customers receive notifications for staff/admin changes affecting their records.
- Staff receive notifications for customer actions, including customer signing a quotation.
- Notifications can be marked as read or deleted.

### Audit Log

- Laravel auditing records changes to business-critical models.
- Admin/sub-admin can view the audit list and open detail pages.
- Audit details show event, actor, record, timestamp, IP, URL, user agent, and before/after values.

## Architecture

- Backend: Laravel API with request validation, services, events, listeners, notifications, resources, and policies/role middleware.
- Frontend: Next.js app with feature folders, reusable components, typed API clients, shadcn UI, and role-aware dashboard pages.
- Realtime: backend events create notifications and broadcast record refresh payloads; frontend hooks refresh affected pages.
- Auditing: auditable models write immutable audit rows for security review.

