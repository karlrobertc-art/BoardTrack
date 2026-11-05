// helpers.js - three small tools shared by the route files.
const db = require('./db');

// Lets a route use async/await and still send errors to the error page.
const safe = fn => (req, res, next) => fn(req, res, next).catch(next);

// PostgreSQL error code -> friendly message (shown when a constraint blocks a save).
const messages = {
  '23P01': 'That room already has an ACTIVE lease overlapping these dates.',
  '23505': 'Duplicate value: that record (or room number / email) already exists.',
  '23503': 'Blocked by a related record (it is referenced elsewhere, or the referenced record does not exist).',
  '23514': 'A value is outside the allowed range (check amounts, dates, status).',
  '23502': 'A required field is missing.', '22007': 'Invalid date.', '22P02': 'Invalid number.',
};
// P0001 = a message we wrote ourselves with RAISE EXCEPTION in the database (room-status guard)
const friendly = err => err.code === 'P0001' ? err.message : messages[err.code] || 'Database error: ' + err.message;

// Used by delete: go back to the list with the message.
function dbError(req, res, err, backUrl) {
  console.error(err.code, err.message);
  req.session.flash = { err: friendly(err) };
  res.redirect(backUrl);
}

// Used by add/edit: show the SAME form again with what the user typed, plus the message.
async function formError(req, res, err, page, row, action) {
  console.error(err.code, err.message);
  res.locals.flash = { err: friendly(err) };
  res.status(400).render('form', { row, dropdowns: await dropdowns(page), action });
}

// Only whole numbers are valid record ids (stops /rooms/abc/edit from reaching the database).
function numericId(req, res, next, id) {
  if (/^\d{1,9}$/.test(id)) return next();
  res.status(404).render('error', { msg: 'Record not found.' });
}

// Run a list query. Tenants only get THEIR OWN rows (scopeColumn = column holding the tenant id).
async function rowsFor(req, sql, scopeColumn) {
  const user = req.session.user;
  const onlyOwn = user.role === 'tenant' && scopeColumn;
  const result = await db.query(sql + (onlyOwn ? ` WHERE ${scopeColumn} = $1` : '') + ' ORDER BY 1', onlyOwn ? [user.tenant_id] : []);
  return result.rows;
}

// Fill the dropdowns of a form (fields that have an `fk` query).
async function dropdowns(page) {
  const out = {};
  for (const f of page.fields) if (f.fk) out[f.n] = (await db.query(f.fk)).rows;
  return out;
}
module.exports = { safe, dbError, formError, numericId, rowsFor, dropdowns };
