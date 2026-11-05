# BoardTrack — Boarding House & Rental Management System

COMP 018 Database Administration · Activity 3 · Group project
**Stack:** Node.js 20.12+, Express, EJS, `pg` · **Database:** PostgreSQL (written for 18; uses features available since 13)

BoardTrack lets a landlord record properties, rooms, tenants, leases, rent payments, and utility bills.
PostgreSQL enforces integrity (PK/FK/UNIQUE/CHECK, plus an exclusion constraint that blocks overlapping active leases on one room).

## Prerequisites
- Node.js ≥ 20.12 and npm (`node -v`)
- PostgreSQL ≥ 13 running locally, and `psql` available
- A PostgreSQL account allowed to create a database (e.g. `postgres`)

## Installation (automatic setup)
```bash
git clone <REPOSITORY_URL> boardtrack && cd boardtrack
npm install
cp .env.example .env          # Windows: copy .env.example .env
```
Edit `.env`: set the user/password in `DATABASE_URL` and a random `SESSION_SECRET`. Then:
```bash
npm start
```
On startup the app **automatically**: (1) creates the database named in `DATABASE_URL` if it does not exist,
(2) creates all tables, constraints, the room-status trigger function, and the summary view, and
(3) loads the sample data and demo accounts if the database is empty. Then open http://localhost:3000.
Running `npm start` again is safe: nothing is recreated or duplicated.

The database user needs the `CREATEDB` privilege for step 1 (the `postgres` superuser has it). If your user does not,
create an empty database yourself and the app will do the rest:
`psql -U postgres -c "CREATE DATABASE boardtrack_db;"`

### Optional quick start (double-click)
Everything above still works exactly as written. If you prefer not to type commands, the project also includes a launcher that runs the same steps:
- **Windows:** double-click `start.bat`. On the first run it installs packages, creates `.env`, and opens it in Notepad: enter your PostgreSQL password in `DATABASE_URL`, save, then double-click `start.bat` again. After that, one double-click starts the app and opens the browser. (If Windows shows "Windows protected your PC", choose *More info → Run anyway*.)
- **Mac/Linux:** run `bash start.sh` (same behavior).

Node.js and PostgreSQL must still be installed first. If the launcher does not work on your machine, use the normal steps above.

### Other ways to set up the database
| Method | Command |
|---|---|
| Run setup without starting the app | `npm run db:setup` |
| Schema only, no sample data | `npm run db:migrate` (and set `AUTO_SEED=false`) |
| Wipe and rebuild everything | `npm run db:reset` (**deletes all data** in that database) |
| Plain SQL (psql or pgAdmin Query Tool) on an empty database | `psql -U <user> -d <db> -f db/boardtrack_full_setup.sql` |
| Regenerate the plain SQL file after editing migrations/seeds | `npm run db:bundle` |

Set `AUTO_SETUP=false` in `.env` to turn off the automatic setup. Extensions `btree_gist` and `pgcrypto` ship with standard PostgreSQL.

## See the design without a database
Open `preview/login.html` (double-click it) in any browser. These are static pages with sample data, so no Node or PostgreSQL is needed. They are for looking only; the real app needs the database.

## Demo accounts (sample data only — change before any real use)
| Username | Password | App role | Sees |
|---|---|---|---|
| `landlord` | `ChangeMe123!` | admin | everything, full CRUD |
| `caretaker` | `ChangeMe123!` | staff | create/read/update, no delete, rooms update-only, properties read-only |
| `juan` | `ChangeMe123!` | tenant | read-only, own leases/payments/bills only |

## Quick test script (essential functions)
1. Log in as `landlord`. **Leases → Add new**: tenant *Maria Santos*, room *Sunshine Boarding House - 101*, 2026-06-01 to 2026-12-31, ACTIVE → must be **rejected** ("overlapping ACTIVE lease"), because Juan's lease on room 101 already covers those dates.
2. Add a lease for room *Sunshine Boarding House - 103* with any valid dates → accepted. **Rooms** now shows 103 as `OCCUPIED` (trigger-maintained).
3. Edit that lease and set it to `TERMINATED` (or delete it) → room 103 returns to `AVAILABLE`. In **Rooms**, try setting an occupied room to `AVAILABLE` → rejected by the database.
4. **Payments → Add new** a payment → the Leases page `total paid` changes.
5. Try deleting a lease that has payments → blocked by the foreign key.
6. Log in as `caretaker` (no Delete buttons, properties read-only) and as `juan` (only his own leases/payments/bills; cannot open Properties, Rooms, or Tenants).

## Project layout
```
src/server.js        start here: app setup          src/auth.js        login + permission table
src/db.js            PostgreSQL connection          src/helpers.js     small shared tools
src/routes/*.js      one file per page (properties, rooms, tenants, leases, payments, bills, home)
src/bootstrap.js     automatic database setup        start.bat / start.sh   optional launchers       src/views/*.ejs    pages        public/style.css  design
db/migrations/       schema (tables, constraints, trigger function, view)
db/seeds/            sample data + demo accounts
db/boardtrack_full_setup.sql   same schema + seeds as one plain SQL file
scripts/db.js        setup / migrate / seed / reset / bundle commands
docs/                database, roles, how the code works, troubleshooting, AI usage
```
## Documentation
- [Database documentation](docs/database.md) · [User roles & DB role setup](docs/user-roles.md)
- [How the code works](docs/how-it-works.md) · [Troubleshooting](docs/troubleshooting.md) · [AI usage](docs/ai-usage.md)

Never commit `.env` or real credentials. Scope notes: no online payments, notifications, or maintenance ticketing.
