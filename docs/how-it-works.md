# How the Code Works (for students)

Read the files in this order. Each is short and commented.

| File | What it does |
|---|---|
| `src/server.js` | Starts the app: loads `.env`, sets up sessions and pages, mounts the route files, runs the automatic database setup. |
| `src/db.js` | The one connection to PostgreSQL. Everything else calls `db.query(sql, [values])`. |
| `src/auth.js` | Login/logout and the **permission table** (which role may create/read/update/delete each page), plus the guards `requireLogin` and `can(page, action)`. |
| `src/routes/*.js` | **One file per page**: `properties`, `rooms`, `tenants`, `leases`, `payments`, `bills`, and `home` (dashboard). Each has the same six parts: list, empty form, create, edit form, update, delete, each with its own visible SQL. |
| `src/helpers.js` | Three small tools: `safe` (error handling), `dbError` and `formError` (friendly constraint messages; the form keeps what you typed), `numericId` (rejects bad record ids), `rowsFor` (tenants see only their own rows), `dropdowns`. |
| `src/bootstrap.js` | Automatic setup on start: create database, run migrations, load sample data. |
| `src/views/*.ejs` | HTML pages (templates). `public/style.css` is the design. |
| `db/migrations/`, `db/seeds/` | The SQL that builds the tables and loads sample data. |

## One request, step by step (editing a room)
1. The browser asks for `/rooms/3/edit`.
2. `requireLogin` checks the session; `can('rooms', 'u')` checks the permission table in `auth.js`.
3. `routes/rooms.js` runs `SELECT * FROM room WHERE room_id = $1` and shows `form.ejs`.
4. Save → `POST /rooms/3` → `UPDATE room SET ... WHERE room_id = $5` runs.
5. If PostgreSQL rejects it (CHECK, FK, UNIQUE, overlap rule), `dbError` shows a friendly message; otherwise you return to the list.

**Important idea:** the database enforces the rules (constraints, trigger). The app only shows the results, so bad data cannot get in even if the app has a bug.

## Common changes
- **Change who can do what:** edit the permission table at the top of `src/auth.js` (`c r u d`).
- **Add a column:** new migration file `db/migrations/002_*.sql`, then update `fields`, the list SQL, and the INSERT/UPDATE in that page's route file.
- **Change colors:** edit the variables at the top of `public/style.css`.
- **Change sample data:** edit `db/seeds/001_sample_data.sql`, then `npm run db:bundle` and `npm run db:reset`.
- SQL uses `$1, $2...` placeholders for values (never string-joining user input) to prevent SQL injection.
