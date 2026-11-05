# Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `DATABASE_URL is not set` | `.env` missing | `cp .env.example .env` and fill it in |
| `password authentication failed` | Wrong user/password in `DATABASE_URL` | Test with `psql "<your URL>"`; reset the password in psql |
| `Could not create database ... ` | DB user lacks CREATEDB, or `AUTO_CREATE_DB=false` | Create it manually: `psql -U postgres -c "CREATE DATABASE boardtrack_db;"`, then `npm start` |
| Tables missing / app errors `relation does not exist` | `AUTO_SETUP=false` | Remove it or run `npm run db:setup` |
| Want to run setup in pgAdmin | No Node needed | Query Tool on an empty DB → open `db/boardtrack_full_setup.sql` → Execute |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running / other port | Start the service (Windows: `services.msc` → postgresql-x64-NN); check the port in the URL |
| `psql` not recognized | Not on PATH | Add PostgreSQL `bin` folder to PATH or use full path |
| `permission denied to create extension` | DB user is not owner/superuser | Make the user the database owner, or run `CREATE EXTENSION btree_gist; CREATE EXTENSION pgcrypto;` as superuser, then re-run migrate |
| `could not open extension control file ... btree_gist` | Minimal Linux install | Install `postgresql-contrib` (Debian/Ubuntu: `postgresql-NN` includes it; some distros need `postgresql-contrib`) |
| Seed fails with duplicate key | `db:seed` forced on non-empty DB | Use `npm run db:reset`; plain `npm start` never re-seeds |
| `process.loadEnvFile is not a function` | Node too old | Install Node ≥ 20.12 |
| Port 3000 in use | Another app | Set `PORT=3001` in `.env` |
| Login always fails | Seed not loaded | Run `npm run db:seed` (or `db:reset`) and use accounts from README |
| "overlapping ACTIVE lease" error | Business rule 2 working | Terminate/expire the earlier lease or change dates |
