# Database Documentation

- **Database:** `boardtrack_db` (name is configurable through `DATABASE_URL`) · **Schema:** `public` · **PostgreSQL:** written for 18; uses only features available since 13
- **Extensions:** `btree_gist` (overlap constraint), `pgcrypto` (password hashing)
- **Naming:** lowercase snake_case; PKs `<table>_id`; FKs named after the referenced key.

## Tables
| Table | Purpose | Key columns |
|---|---|---|
| property | Buildings managed by the landlord | PK property_id |
| room | Rentable units | PK room_id; FK property_id; UNIQUE(property_id, room_number) |
| tenant | People renting | PK tenant_id; UNIQUE email (nullable) |
| lease | Tenant ↔ room agreement over a period (resolves M:N) | PK lease_id; FK tenant_id, room_id |
| payment | Rent payments per lease | PK payment_id; FK lease_id |
| utility_bill | Utility charges per lease/period | PK utility_bill_id; FK lease_id |
| app_user | Application logins and roles (**new**) | PK user_id; UNIQUE username; FK tenant_id (tenant role only) |

## Relationships
property 1—N room · tenant 1—N lease · room 1—N lease · lease 1—N payment · lease 1—N utility_bill · tenant 1—0..1 app_user.
All FKs use the default `ON DELETE NO ACTION`, so history is never silently deleted (move-out = status change, not deletion).

## Constraints (see `db/migrations/001_schema.sql`)
- **CHECK:** monthly_rate > 0; monthly_rent > 0; payment.amount > 0; utility amount ≥ 0; end_date > start_date; moved_out_on ≥ start_date; billing_period is the 1st of a month; all status/method/type columns restricted to listed values; app_user: tenant_id is set **iff** role = 'tenant'.
- **EXCLUDE (business rule 2):** `ex_lease_no_overlap` — no two ACTIVE leases on the same room may have overlapping `[start_date, end_date]`.
- **DEFAULT:** room.status AVAILABLE; lease.status ACTIVE; payment.payment_date CURRENT_DATE; payment.status COMPLETED; utility_bill.status UNPAID.
- **Indexes:** lease(room_id), lease(tenant_id), payment(lease_id), utility_bill(lease_id) plus PK/UNIQUE indexes.

## Other objects
- **Trigger** `trg_lease_sync_room` → `sync_room_status()`: after a lease is inserted, updated, or deleted, sets the room OCCUPIED/AVAILABLE from its ACTIVE leases (MAINTENANCE untouched).
- **Trigger** `trg_room_status_guard` → `guard_room_status()`: rejects a manual room status that contradicts its leases (OCCUPIED without an ACTIVE lease, or AVAILABLE with one).
- **View** `v_lease_summary`: lease + tenant + room with computed `total_paid` and `utilities_billed` (balances are never stored).
- **Table** `schema_migrations`: created by `scripts/db.js` to track applied migrations.

## Changes from the approved Activity 2 design (with reasons)
| Change | Reason |
|---|---|
| Added `app_user` table | Activity 3 requires logins and application roles; the proposal had none. |
| Removed `property.total_rooms` | Derived value; contradicted the normalization review. Now `COUNT(*)` of rooms (shown in the Properties list). |
| Added `lease.moved_out_on` | Records real move-out date separately from contractual `end_date` (history preserved). |
| `utility_bill.billing_period` VARCHAR → DATE (1st of month) | Sortable, validated, no format ambiguity. |
| Added `utility_bill.status` | Lets the landlord track paid/unpaid utilities. |
| Added CHECK constraints on status/method/type | Dictionary listed allowed values but did not enforce them. |
| Overlap rule implemented as EXCLUDE constraint | A CHECK cannot compare rows; this is the correct PostgreSQL mechanism. |
| Added room-status triggers (sync + guard) | Keeps occupancy consistent without relying on application code, including when a lease is deleted. |
