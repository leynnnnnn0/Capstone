# Non-Functional Requirements Questions

Use these questions to decide system rules before production.

## Security

1. How long should customer OTP codes be valid?
2. How many failed OTP attempts should lock a customer login request?
3. Should customer sessions always last 14 days, or should sensitive actions require OTP again?
4. Which roles can export PDFs, view audit logs, and manage users?
5. Should admins be blocked from editing signed quotations unless they provide a reason?
6. Should audit records be immutable forever, or archived after a retention period?

## Privacy and Compliance

1. How long should customer phone numbers, emails, addresses, signatures, and uploaded photos be retained?
2. Should customers be able to request deletion of their account data?
3. Should signature image files be private instead of public storage?
4. Should PDF links require authentication or signed temporary URLs?

## Availability

1. What should happen if Reverb/broadcasting is down?
2. Should notifications still be saved even if realtime broadcast fails?
3. Should workers be able to use the app offline at job sites?

## Performance

1. How many products, appointments, work jobs, and audit rows should the system support in the first year?
2. Should audit logs be paginated, searchable, and exportable?
3. Should calendar endpoints load by visible date range instead of loading the latest 250 records?

## Operations

1. Who receives alerts when appointment booking fails?
2. Who receives alerts when email/SMS sending fails?
3. Should failed notifications be retried through a queue?
4. Should queued jobs run through database queue, Redis, or another queue backend?

## Business Rules

1. Should customers be allowed to cancel confirmed appointments?
2. How late can customers cancel before admin approval is required?
3. Should no-show customers be allowed to rebook immediately?
4. Should a signed quotation expire after a number of days?
5. Should approved quotation items require downpayment before work job creation?
6. Should final payment be tracked before marking work job completed?
7. Should warranty period start on work job completion, invoice creation, or final payment?

## Reporting

1. What dashboard metrics matter most: revenue, approved quotes, conversion rate, worker workload, cancelled appointments, no-shows, or overdue jobs?
2. Should admins export business reports to CSV/PDF?
3. Should workers see performance metrics or only operational schedules?

