# Functional Requirements Questions

Use these questions to finalize exact business behavior.

## Customer Booking

1. If a customer creates a new appointment while another appointment is pending, should the system allow it?
2. If the customer rebooks a cancelled appointment, should the old quotation be copied or only shown as reference?
3. If the customer changes address after selecting quote items, should quote prices be recalculated?
4. If the customer logs in with phone today and email tomorrow, should all matching appointments always merge under one customer account?

## Appointment Status

1. When an appointment is marked no-show, should the customer be allowed to rebook from the same appointment?
2. When an appointment is reopened, should it return to pending or confirmed?
3. When an appointment is cancelled after confirmation, should assigned workers be removed automatically?
4. Should workers be able to mark no-show, or only admin/sub-admin?

## Quotation

1. Should customers sign only after all items are approved, or can they sign a quote with some approved items and some rejected items?
2. If an admin adds a new item after signing, should the whole quotation require re-signing or only the new item?
3. If a customer rejects one item, should admin be notified to revise the quote?
4. Should a signed quotation lock admin editing until admin provides a reason?
5. Should signed PDFs be archived as immutable files?

## Work Jobs

1. Can a work job be created before quotation signature?
2. Can a work job be created without downpayment?
3. If a work job is cancelled, should the related appointment reopen?
4. Should back jobs be separate work jobs linked to the original job?

## Photos and Proof

1. Are before photos required before moving an appointment to inspected/in progress?
2. Are after photos required before completing a work job?
3. Should customers be allowed to see all uploaded before/after photos?

## Notifications

1. Which status changes should send SMS, email, database notification, or all three?
2. Should customers receive a notification for every internal status change?
3. Should admins receive notifications for every customer action or only important ones?

## Audit

1. Which users can view audit logs?
2. Should audit logs be exportable?
3. Should audit logs include read/view actions or only create/update/delete/status changes?

