// db.js - the single connection to PostgreSQL. Every other file calls db.query(sql, [values]).
const pg = require('pg');
pg.types.setTypeParser(1082, v => v);   // return DATE columns as plain 'YYYY-MM-DD' text
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
module.exports = { query: (sql, values = []) => pool.query(sql, values) };
