# Application User Roles & Database Role Setup

Application roles (what a person can do after logging in) are separate from PostgreSQL roles (what a database account can do).
The web app logs in to PostgreSQL through **one runtime account**; end users do **not** get PostgreSQL logins.
Activity 4 will implement the database roles below. No real passwords are stored in this repository.

## Application roles
| App role | Responsibilities | Functions and data access | Intended DB role |
|---|---|---|---|
| **Administrator (landlord)** | Owns the business; manages all records | Full CRUD on properties, rooms, tenants, leases, payments, utility bills; reads reports/summary view | `boardtrack_admin_grp` (elevated, **not** superuser) |
| **Staff (caretaker)** | Day-to-day encoding | Create/read/update tenants, leases, payments, bills; update rooms; read properties; **no delete** | `app_runtime_grp` (app enforces the narrower limits) |
| **Tenant (view-limited)** | Checks own lease and balance | Read-only on **own** leases, payments, bills (filtered by `app_user.tenant_id`) | `app_readonly_grp` (row filtering done by the app/views) |
| **Application runtime (system account)** | Account the Node app connects with | Only operations the code runs: SELECT/INSERT/UPDATE/DELETE on business tables, SELECT on `v_lease_summary`, SELECT on `app_user` for login | `app_runtime_grp` via login role `boardtrack_app` |

Permission enforcement today is in the permission table at the top of `src/auth.js`. The DB roles add a second layer in Activity 4.

## Intended PostgreSQL roles (setup plan — not executed in Activity 3)
| Role | Type | Privileges (intended) |
|---|---|---|
| `boardtrack_owner` | LOGIN, DB owner | Owns objects; used for migrations only; not used by the app |
| `boardtrack_admin_grp` | NOLOGIN group | ALL on business tables; no CREATEROLE/SUPERUSER |
| `app_runtime_grp` | NOLOGIN group | SELECT, INSERT, UPDATE on business tables; DELETE only where the app allows; USAGE on sequences; SELECT on view and `app_user` |
| `app_readonly_grp` | NOLOGIN group | SELECT on business tables and `v_lease_summary` only |
| `boardtrack_app` | LOGIN | Member of `app_runtime_grp`; password set outside the repo (`<SET_PASSWORD>`) |

Sketch (for Activity 4; placeholders only):
```sql
CREATE ROLE app_runtime_grp NOLOGIN;  CREATE ROLE app_readonly_grp NOLOGIN;
CREATE ROLE boardtrack_admin_grp NOLOGIN;
CREATE ROLE boardtrack_app LOGIN PASSWORD '<SET_PASSWORD>' IN ROLE app_runtime_grp;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly_grp;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_runtime_grp;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_runtime_grp;
```
## Demo application accounts
`landlord` (admin), `caretaker` (staff), `juan` (tenant, tenant_id 1). Sample password for all: `ChangeMe123!` (seed data, bcrypt-hashed in the DB via `pgcrypto`). Change for any real deployment.
Account management is currently done in SQL (`app_user`); a user-management screen is future work.
