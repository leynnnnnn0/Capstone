# ERD and Flow Diagrams

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ APPOINTMENTS : owns
    USERS ||--o{ APPOINTMENT_REMARKS : writes
    USERS ||--o{ WORK_JOB_REMARKS : writes
    USERS }o--o{ APPOINTMENTS : assigned_workers
    USERS }o--o{ WORK_JOBS : assigned_workers
    USERS ||--o{ NOTIFICATIONS : receives

    APPOINTMENTS ||--o| QUOTATIONS : has
    APPOINTMENTS ||--o{ APPOINTMENT_REMARKS : logs
    APPOINTMENTS ||--o{ WORK_JOBS : creates

    WORK_JOBS ||--o{ WORK_JOB_REMARKS : logs
    WORK_JOBS }o--|| QUOTATIONS : references

    PRODUCTS }o--o{ CATEGORIES : categorized
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCT_VARIANTS ||--o{ PRODUCT_VARIANT_IMAGES : has
    PRODUCTS ||--o{ PRODUCT_OPTION_GROUPS : has
    PRODUCT_OPTION_GROUPS ||--o{ PRODUCT_OPTIONS : has

    QUOTATIONS ||--o{ QUOTATION_ITEMS : has
    QUOTATION_ITEMS ||--o{ QUOTATION_ITEM_OPTIONS : snapshots
    QUOTATION_ITEMS ||--o{ QUOTATION_ITEM_IMAGES : has
    PRODUCTS ||--o{ QUOTATION_ITEMS : quoted_as

    USERS ||--o{ AUDITS : actor
```

## Customer Booking Flow

```mermaid
flowchart TD
    A["Customer visits site"] --> B{"Choose path"}
    B --> C["Browse products"]
    C --> D["Build quotation items"]
    D --> E["Prefill booking form with quote items"]
    B --> F["Open booking form directly"]
    F --> G["Blank booking form"]
    E --> H["Submit appointment"]
    G --> H
    H --> I["System creates appointment and optional quotation"]
    I --> J["Send confirmation email/SMS"]
    J --> K["Customer can track by reference or login with OTP"]
```

## Appointment Operations Flow

```mermaid
flowchart TD
    A["New appointment: pending"] --> B{"Admin decision"}
    B -->|confirm| C["Confirmed: schedule and workers assigned"]
    B -->|cancel| D["Cancelled: customer notified"]
    C --> E["Worker on the way"]
    E --> F["In progress"]
    F --> G["Completed"]
    C --> H["No show"]
    D --> I["Reopen if admin correction"]
    H --> I
    I --> C
```

## Quotation Signing Flow

```mermaid
flowchart TD
    A["Quotation created or updated"] --> B["Admin marks items approved"]
    B --> C["Customer reviews digital quotation"]
    C --> D{"Customer accepts?"}
    D -->|no| E["Item status remains for acceptance/revision/rejected"]
    D -->|yes| F["Customer signs e-signature"]
    F --> G["System stores signature, signed date, signer name, and quote hash"]
    G --> H["Admin notified that quote was signed"]
    H --> I["PDF prints approved items and signature block"]
    I --> J{"Quote changes after signing?"}
    J -->|yes| K["Signature invalidated"]
    K --> L["Customer notified to sign again"]
    L --> C
    J -->|no| M["Signed quotation remains valid"]
```

## Work Job Flow

```mermaid
flowchart TD
    A["Appointment confirmed or quote approved"] --> B["Admin creates work job"]
    B --> C["Work job inherits customer, location, schedule, workers, and quotation"]
    C --> D["Worker sees assigned job"]
    D --> E["Worker starts job: in progress"]
    E --> F["Worker uploads after photos"]
    F --> G["Admin/worker marks completed"]
    G --> H["Customer sees completed status and activity log"]
```

## Notification Flow

```mermaid
flowchart TD
    A["Domain action occurs"] --> B["Event dispatched"]
    B --> C["DispatchRealtimeNotification listener"]
    C --> D["Database notification saved"]
    C --> E["Realtime broadcast sent"]
    D --> F["Notification bell updates"]
    E --> G["Affected pages refresh"]
```

## Audit Flow

```mermaid
flowchart TD
    A["Auditable model changes"] --> B["Laravel auditing records event"]
    B --> C["Audit row stores actor, URL, IP, before, after"]
    C --> D["Admin opens Audit Log"]
    D --> E["Admin views detail page"]
```

