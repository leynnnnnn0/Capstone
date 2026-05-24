# Input Validation Rules

This document describes the current input restrictions, normalization rules, and user-facing error messages used in the SOG Glass and Aluminum system. It is intended for QA testing, capstone documentation, and future backend/frontend validation parity checks.

Most frontend validation is implemented with Zod and shared helpers in `frontend/features/forms/validation.ts`. Some protected actions, file uploads, passwords, two-factor authentication, and payment requests are also validated by the backend or third-party providers.

## Shared Field Rules

| Field or field type | Used in | Restriction | Normalization / UX behavior | Error message |
| --- | --- | --- | --- | --- |
| First name | Booking, quote request, customer appointments, admin appointments, work jobs, users, settings | Required, 2 to 50 characters, letters only with spaces, apostrophes, and hyphens allowed | Removes numbers and unsupported special characters while typing through the shared name input | `First name must be at least 2 characters.` `First name must be 50 characters or fewer.` `First name can only contain letters, spaces, apostrophes, and hyphens.` |
| Last name | Booking, quote request, customer appointments, admin appointments, work jobs, users, settings | Required, 2 to 50 characters, letters only with spaces, apostrophes, and hyphens allowed | Removes numbers and unsupported special characters while typing through the shared name input | `Last name must be at least 2 characters.` `Last name must be 50 characters or fewer.` `Last name can only contain letters, spaces, apostrophes, and hyphens.` |
| Required email | Booking, quote request, customer appointments, users, settings | Required valid email format | Trimmed and lowercased | `Email is required.` `Enter a valid email address.` |
| Optional email | Admin appointments and work jobs | Empty is allowed; when filled it must be a valid email address | Trimmed and lowercased | `Enter a valid email address.` |
| Philippine mobile number | Booking, quote request, customer appointments, admin appointments, work jobs | Required local mobile number beginning with `9` and exactly 10 local digits | Phone input shows `+63` as a fixed addon. Accepted typing is local format like `9266887272`; stored value becomes `+639266887272`. Pasted `09...` and `639...` formats are normalized. | `Phone number must start with 9 and contain 10 digits.` |
| Optional Philippine mobile number | Users and settings | Empty is allowed; when filled it must start with `9` and contain 10 local digits | Same `+63` display and normalization when the shared phone input is used | `Phone number must start with 9 and contain 10 digits.` |
| Required date | Appointment schedules, work job schedules, payment date, back job schedule | Required `YYYY-MM-DD` date | Browser date input is used where applicable | `<Label> is required.` `Enter a valid <label>.` |
| Required time | Appointment schedules, work job schedules, back job schedule | Required `HH:mm` time | Browser time input is used where applicable | `<Label> is required.` `Enter a valid <label>.` |
| Numeric amount or dimension | Prices, dimensions, quantities, percentages, charges, payments | Must be numeric. Fields that require positive values must be greater than 0. Fields that allow zero must not be negative. | Number input blocks or removes `e`, `E`, `+`, and `-`. Integer-only fields also block decimals. | `<Label> is required.` `<Label> must be a valid number.` `<Label> cannot be negative.` `<Label> must be greater than 0.` `<Label> must be <max> or less.` |
| Notes / remarks text | Booking notes, quote notes, work job notes, charges, back jobs, payments, status dialogs | Free text with per-form max length | Trimmed in several admin forms before submit | See module-specific rows below |

## Scheduling Logic

| Scenario | Applies to | Rule | Error message |
| --- | --- | --- | --- |
| Customer booking date | Public booking, quote checkout, customer appointment create/edit | Date cannot be before the minimum booking date/today | `Date cannot be in the past.` or `Date cannot be before today.` |
| Admin appointment/work job date | Admin appointment create/edit, admin schedule modal, admin work job create, back jobs | Admin can enter a past start date when backfilling records | No past-date error for admin start date |
| End date before start date | Any schedule that includes an end date | End date cannot be earlier than start date | `End date cannot be before the start date.` |
| Start time format | All schedule forms | Must be a valid `HH:mm` time | `Enter a valid start time.` |
| End time format | All schedule forms | Must be a valid `HH:mm` time | `Enter a valid end time.` |
| End time on same day | All schedule forms | End time must be after start time | `End time must be after the start time.` |
| Customer same-day time | Customer-facing schedule flows when future start is required | Start time cannot be earlier than current time | `Start time cannot be earlier than the current time.` |
| Morning availability | Public booking, quote checkout, customer appointment create/edit | Morning is unavailable once the daily cutoff has passed | `Morning is no longer available for this date.` |

## Public Booking And Quote Request

| Field | Restriction | Error message |
| --- | --- | --- |
| First name | Shared person name rule | See shared field rules |
| Last name | Shared person name rule | See shared field rules |
| Phone / Viber | Shared Philippine mobile rule | `Phone number must start with 9 and contain 10 digits.` |
| Email | Shared required email rule | `Email is required.` `Enter a valid email address.` |
| Address | Required, minimum 5 trimmed characters | `Address is required.` or `Service address is required.` depending on form |
| Address pin / latitude / longitude | Optional map metadata | Backend may validate coordinates when submitted |
| Preferred date | Required valid date, cannot be in the past | `Preferred date is required.` `Enter a valid preferred date.` `Date cannot be in the past.` |
| Preferred time | Must be `morning` or `afternoon` | `Preferred time is required.` `Morning is no longer available for this date.` |
| Service type | Public landing booking is fixed to quotation | No editable frontend error |
| Additional notes | Optional, maximum 2000 characters | `Notes must be 2000 characters or fewer.` |
| Consent | Required checkbox | `You must agree to be contacted.` |
| Quote items | Quote request should include selected items when using product quote flow | Backend or form-level error is shown in `items`/`form` area when missing |

## Customer Appointments

| Field | Restriction | Error message |
| --- | --- | --- |
| First name | Shared person name rule | See shared field rules |
| Last name | Shared person name rule | See shared field rules |
| Phone number | Shared Philippine mobile rule | `Phone number must start with 9 and contain 10 digits.` |
| Email | Shared required email rule | `Email is required.` `Enter a valid email address.` |
| Service address | Required, minimum 5 trimmed characters | `Service address is required.` |
| Service type | Required | `Service type is required.` |
| Other service type | Required only when service type is `other` | `Please describe the service needed.` |
| Preferred date | Required valid date, cannot be in the past | `Preferred date is required.` `Enter a valid preferred date.` `Date cannot be in the past.` |
| Preferred time | Must be `morning` or `afternoon` | `Preferred time is required.` `Morning is no longer available for this date.` |
| Additional notes | Optional, maximum 2000 characters | `Notes must be 2000 characters or fewer.` |
| Consent | Required checkbox | `You must agree to be contacted.` |
| Quote items while editing | Existing quote cannot be emptied in the customer edit flow | `Keep at least one quote item, or contact SOG to remove the quote.` |

## Customer Authentication

| Field | Restriction | Error message |
| --- | --- | --- |
| OTP login contact | Must be either a valid email or a phone-like value of 10 to 20 characters | `Enter a valid email address or mobile number.` |
| OTP code | Must be exactly 6 digits | `Enter the 6-digit code we sent you.` |
| Staff login email | Required valid email input; backend validates account and role | Backend error, or `Login failed` fallback |
| Staff login password | Required; backend validates password | Backend error, or `Login failed` fallback |
| Two-factor authentication code | Required numeric code; backend validates OTP | Backend error, or `Invalid authentication code.` fallback |
| Forgot password email | Required valid email input; backend validates account | Backend error, or `Something went wrong.` fallback |
| Reset password fields | Required; backend validates strength and confirmation | Backend error, or `Something went wrong.` fallback |
| Registration fields | Required name, email, password, password confirmation; backend validates uniqueness and password policy | Backend error, or `Registration failed` fallback |

## Tracking Page

| Field | Restriction | Error message |
| --- | --- | --- |
| Appointment or work job number | Required before submit; input is trimmed and uppercased | API error is displayed when not found; fallback is `Unable to track this request. Please try again.` |

## Admin Appointments

| Field | Restriction | Error message |
| --- | --- | --- |
| First name | Shared person name rule | See shared field rules |
| Last name | Shared person name rule | See shared field rules |
| Phone number | Shared Philippine mobile rule | `Phone number must start with 9 and contain 10 digits.` |
| Email | Optional email rule | `Enter a valid email address.` |
| Service address | Required, minimum 5 trimmed characters | `Service address is required.` |
| Preferred date | Optional on admin form | Backend may validate when submitted |
| Preferred time | Must be `morning` or `afternoon` when present | Backend may validate when submitted |
| Service type | Required | `Service type is required.` |
| Other service type | Required only when service type is `other` | `Describe the service type.` |
| Additional notes | Optional, maximum 2000 characters | `Notes must be 2000 characters or fewer.` |
| Consent | Boolean | No frontend error |
| Status | Required appointment status: pending, confirmed, rescheduled, on_the_way, in_progress, completed, cancelled, reopened, no_show | `Status is required.` |
| Appointment date | Required valid date; admin can backdate | `Appointment date is required.` `Enter a valid appointment date.` |
| Start time | Required valid time | `Start time is required.` `Enter a valid start time.` |
| End time | Required valid time and after start time | `End time is required.` `Enter a valid end time.` `End time must be after the start time.` |
| Assigned workers | Required when status is confirmed | `Assign at least one worker when confirming an appointment.` |
| Quotation notes | Optional, maximum 2000 characters | `Quotation notes must be 2000 characters or fewer.` |
| Cancel reason | Required by dialog before cancelling | Action remains disabled until a reason is entered; backend may return a validation message |
| No-show reason | Required by dialog before marking no show | Action remains disabled until a reason is entered; backend may return a validation message |
| Reopen remarks | Optional | Backend may validate length |

## Admin Appointment Schedule Modal

| Field | Restriction | Error message |
| --- | --- | --- |
| Appointment date | Required valid date; admin can backdate | `Appointment date is required.` `Enter a valid appointment date.` |
| Start time | Required valid time | `Start time is required.` `Enter a valid start time.` |
| End time | Required valid time and after start time | `End time is required.` `Enter a valid end time.` `End time must be after the start time.` |
| Assigned workers | At least one worker required | `Please assign at least one worker.` |
| Remarks | Optional, maximum 1000 characters | `Remarks must be 1000 characters or fewer.` |

## Quotation Line Items

| Field | Restriction | Error message |
| --- | --- | --- |
| Quotation items list | At least one line item required when quotation is attached | `At least one item is required.` |
| Product | Required on each line item | `Product is required.` |
| Item name | Required trimmed text | `Item name is required.` |
| Width | Numeric decimal, blocks `e`, `E`, `+`, and `-` | Shared numeric errors if schema validation is added; recalculation uses sanitized value |
| Height | Numeric decimal, blocks `e`, `E`, `+`, and `-` | Shared numeric errors if schema validation is added; recalculation uses sanitized value |
| Thickness | Numeric decimal, blocks `e`, `E`, `+`, and `-` | Shared numeric errors if schema validation is added; recalculation uses sanitized value |
| Pieces | Integer, at least 1 | `At least 1 piece required.` |
| Amount per piece | Numeric decimal, blocks `e`, `E`, `+`, and `-` | Shared numeric errors if schema validation is added; recalculation uses sanitized value |
| Material options | Selectable product options | Backend validates option IDs and pricing |
| Quotation item photos | JPG, PNG, or WebP; up to 5 MB each; up to 10 pending files per panel | `Upload JPG, PNG, or WebP images up to 5 MB each.` |
| Photo caption | Optional text | Backend may validate length |

## Admin Work Jobs

| Field | Restriction | Error message |
| --- | --- | --- |
| First name | Shared person name rule | See shared field rules |
| Last name | Shared person name rule | See shared field rules |
| Phone number | Shared Philippine mobile rule | `Phone number must start with 9 and contain 10 digits.` |
| Email | Optional email rule | `Enter a valid email address.` |
| Address | Required, minimum 5 trimmed characters | `Address is required.` |
| Service type | Required | `Service type is required.` |
| Other service type | Required only when service type is `other` | `Describe the service type.` |
| Work job date | Required valid date; admin can backdate | `Work job date is required.` `Enter a valid work job date.` |
| Start time | Required valid time | `Start time is required.` `Enter a valid start time.` |
| End time | Required valid time and after start time | `End time is required.` `Enter a valid end time.` `End time must be after the start time.` |
| Assigned workers | At least one worker required | `Assign at least one worker.` |
| Down payment required | Boolean toggle | No frontend error |
| Down payment percentage | Numeric percentage from 1 to 100 | `Down payment must be at least 1%.` `Down payment cannot exceed 100%.` |
| Notes | Optional, maximum 2000 characters | `Notes must be 2000 characters or fewer.` |
| Status remarks | Optional for status actions unless backend requires a reason | Backend errors are shown when returned |

## Work Job Charges

| Field | Restriction | Error message |
| --- | --- | --- |
| Charge title | Required, 2 to 120 trimmed characters | `Charge title is required.` `Charge title is too long.` |
| Charge description | Optional, maximum 1000 characters | `Description is too long.` |
| Charge type | Must be service_fee, extra_material, extra_labor, delivery, adjustment, discount, or other | Backend/API error if invalid |
| Charge status | Must be approved, pending_approval, waived, or cancelled | Backend/API error if invalid |
| Amount | Required positive number, maximum 9999999 | `Amount is required.` `Amount must be a valid number.` `Amount cannot be negative.` `Amount must be 9999999 or less.` `Amount must be greater than 0.` |
| Requires customer approval | Boolean | No frontend error |

## Work Job Payments

| Field | Restriction | Error message |
| --- | --- | --- |
| Payment type | Must be down_payment, final_payment, full_payment, or additional_charge | Backend/API error if invalid |
| Payment method | Manual payment method must be cash, bank_transfer, or other | Backend/API error if invalid |
| Amount | Required positive number | `Amount is required.` `Amount must be a valid number.` `Amount cannot be negative.` `Amount must be greater than 0.` |
| Paid date | Required valid date | `Paid date is required.` `Enter a valid paid date.` |
| Remarks | Optional, maximum 1000 characters | `Remarks must be 1000 characters or fewer.` |
| PayPal payment | Amount and order are validated by backend and PayPal | PayPal or API error is displayed when returned |

## Back Jobs

| Field | Restriction | Error message |
| --- | --- | --- |
| Scheduled date | Required valid date; admin can backdate | `Scheduled date is required.` `Enter a valid scheduled date.` |
| Start time | Required valid time | `Start time is required.` `Enter a valid start time.` |
| End time | Required valid time and after start time | `End time is required.` `Enter a valid end time.` `End time must be after the start time.` |
| Assigned workers | At least one worker required | `Please assign at least one worker.` |
| Back job reason | Must be unfinished_work, warranty_claim, quality_issue, missing_parts, customer_request, or other | Backend/API error if invalid |
| Other reason | Required when reason is `other`, maximum 100 characters | `Please enter the other reason.` `Other reason must be 100 characters or fewer.` |
| Back job details | Required, 5 to 2000 trimmed characters | `Details must be at least 5 characters.` `Details must be 2000 characters or fewer.` |
| Internal notes | Optional, maximum 2000 trimmed characters | `Internal notes must be 2000 characters or fewer.` |

## Product Management

| Field | Restriction | Error message |
| --- | --- | --- |
| Product name | Required trimmed text, maximum 255 characters | `Product name is required.` Zod default max-length message for over 255 characters |
| Description | Required trimmed text | `Description is required.` |
| Categories | At least one category required | `Select at least one category.` |
| Unit | Must be sqm, meter, piece, or set | `Select a unit.` |
| Price per unit | Required non-negative number | `Price per unit is required.` `Price per unit must be a valid number.` `Price per unit cannot be negative.` |
| Product active flag | Boolean | No frontend error |
| Product images | Uploaded files; first image becomes cover | Backend/API errors are shown in the image field when returned |
| 3D model | Optional uploaded model file for AR and model viewer | Backend/API errors are shown in the 3D model field when returned |
| Variant width | Required positive number | `Width is required.` `Width must be a valid number.` `Width cannot be negative.` `Width must be greater than 0.` |
| Variant height | Required positive number | `Height is required.` `Height must be a valid number.` `Height cannot be negative.` `Height must be greater than 0.` |
| Variant price | Required non-negative number | `Variant price is required.` `Variant price must be a valid number.` `Variant price cannot be negative.` |
| Variant images | Uploaded files per variant | Backend/API errors are shown when returned |
| Option group name | Required trimmed text | `Group name is required.` |
| Option group required flag | Boolean | No frontend error |
| Option group sort order | Numeric order maintained by UI | Backend/API error if invalid |
| Options list | At least one option per group | `Add at least one option.` |
| Option name | Required trimmed text | `Option name is required.` |
| Option price modifier | Required non-negative number | `Price modifier is required.` `Price modifier must be a valid number.` `Price modifier cannot be negative.` |
| Option active flag | Boolean | No frontend error |

## User Management

| Field | Restriction | Error message |
| --- | --- | --- |
| Username | Required, 2 to 50 characters, only letters, numbers, dots, underscores, and hyphens | `Username is required.` `Username must be 50 characters or fewer.` `Username can only contain letters, numbers, dots, underscores, and hyphens.` |
| First name | Shared person name rule | See shared field rules |
| Last name | Shared person name rule | See shared field rules |
| Email | Shared required email rule | `Email is required.` `Enter a valid email address.` |
| Phone number | Optional Philippine mobile rule | `Phone number must start with 9 and contain 10 digits.` |
| Password | Required when creating a user; optional when editing | `Password is required.` for new users when blank; backend returns password policy errors |
| Role | Must be admin, sub_admin, worker, or customer | Backend/API error if invalid |
| Permission overrides | Array of permission strings | Backend/API error if invalid |

## Settings

| Field | Restriction | Error message |
| --- | --- | --- |
| Username | Required, 3 to 50 characters, only letters, numbers, dots, underscores, and hyphens | `Username must be at least 3 characters.` `Username must be 50 characters or fewer.` `Username can only contain letters, numbers, dots, underscores, and hyphens.` |
| First name | Shared person name rule | See shared field rules |
| Last name | Shared person name rule | See shared field rules |
| Email | Shared required email rule | `Email is required.` `Enter a valid email address.` |
| Phone number | Optional Philippine mobile rule | `Phone number must start with 9 and contain 10 digits.` |
| Current password | Backend validates current password | Example backend error: `The provided password does not match your current password.` |
| New password | Backend validates password policy | Example backend error: `The password field must contain at least one symbol.` |
| Confirm new password | Backend validates confirmation match | Backend password confirmation error is shown |
| Confirm password dialog | Backend validates password before protected actions | Backend error is shown |
| Two-factor code | Backend validates authenticator code | Backend error, or `Invalid authentication code.` fallback |
| Recovery code actions | Backend validates authenticated user and 2FA state | Backend error, or action-specific fallback such as `Unable to regenerate recovery codes.` |

## Sales, Payments, Audit, And Dashboard Filters

| Field | Restriction | Error message |
| --- | --- | --- |
| Search fields | Free text search; trimmed by API or browser behavior | Module fallback errors such as `Unable to load payments.` or `Unable to load the sales report.` |
| Date range filters | Valid date inputs; backend validates range | Backend/API error if invalid |
| Export format | Must match available export buttons such as PDF, Excel, or CSV | Backend/API error if export fails |
| Audit filters | Free text or selected filters depending on page controls | Backend/API error if invalid |

## File And External-Service Validation

| Area | Restriction | Error handling |
| --- | --- | --- |
| Product images | Valid image files accepted by backend storage rules | Field-level backend/API errors are displayed |
| Product 3D models | Valid model file accepted by backend storage rules | Field-level backend/API errors are displayed |
| Quotation item before/after photos | JPG, PNG, or WebP, up to 5 MB each | `Upload JPG, PNG, or WebP images up to 5 MB each.` |
| PayPal checkout | Amount, currency, work job, payment type, and capture state validated by backend and PayPal | API or PayPal error is displayed |
| PDF and Excel export | Backend validates export request and generates file | API/export error is displayed |

## Implementation Notes

- `PhoneNumberInput` displays the `+63` addon and only lets the user type the local `9XXXXXXXXX` portion.
- `NumericInput` uses text input with numeric sanitization instead of browser number input so characters like `e`, `+`, and `-` cannot be entered.
- Customer-facing date rules are stricter than admin rules. Customers cannot pick a past booking date; admins can backfill dates for operational records.
- Backend validation remains the final authority for security-sensitive operations, files, authentication, authorization, payments, and protected status transitions.
- When the backend returns validation errors, the UI displays the first returned message for the field when available.
