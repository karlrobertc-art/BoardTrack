// routes/leases.js - Leases: list, add, edit, delete (one explicit SQL statement per action).
const express = require('express');
const db = require('../db');
const { requireLogin, can } = require('../auth');
const { safe, dbError, formError, numericId, rowsFor, dropdowns } = require('../helpers');
const router = express.Router();
router.param('id', numericId);       // :id must be a whole number

// What the list shows and which inputs the form has.
// n = column name, t = input type, opts = fixed dropdown choices, fk = SQL for a dropdown, opt = optional
const page = { key: 'leases', label: 'Leases', pk: 'lease_id', fields: [
  { n: 'tenant_id', fk: "SELECT tenant_id v, full_name l FROM tenant ORDER BY 2" },
  { n: 'room_id', fk: "SELECT r.room_id v, p.property_name || ' - ' || r.room_number l FROM room r JOIN property p ON p.property_id = r.property_id ORDER BY 2" },
  { n: 'start_date', t: 'date' },
  { n: 'end_date', t: 'date' },
  { n: 'moved_out_on', t: 'date', opt: true },
  { n: 'monthly_rent', t: 'number' },
  { n: 'status', opts: ['ACTIVE', 'TERMINATED', 'EXPIRED'] },
] };
router.use('/leases', requireLogin, (req, res, next) => { res.locals.page = page; next(); });

// LIST (read)
router.get('/leases', can('leases', 'r'), safe(async (req, res) => {
  const rows = await rowsFor(req, `SELECT lease_id, tenant_id, tenant, property_name, room_number, start_date, end_date,
    monthly_rent, status, total_paid, utilities_billed FROM v_lease_summary`, 'tenant_id');
  res.render('list', { rows });
}));

// EMPTY FORM
router.get('/leases/new', can('leases', 'c'), safe(async (req, res) => {
  res.render('form', { row: {}, dropdowns: await dropdowns(page), action: '/leases' });
}));

// CREATE
router.post('/leases', can('leases', 'c'), safe(async (req, res) => {
  const b = req.body;
  try {
    await db.query('INSERT INTO lease (tenant_id, room_id, start_date, end_date, moved_out_on, monthly_rent, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', [b.tenant_id, b.room_id, b.start_date, b.end_date, b.moved_out_on || null, b.monthly_rent, b.status]);
    req.session.flash = { ok: 'Leases: record added.' };
    res.redirect('/leases');
  } catch (err) { await formError(req, res, err, page, b, '/leases'); }
}));

// FORM FILLED WITH THE EXISTING RECORD
router.get('/leases/:id/edit', can('leases', 'u'), safe(async (req, res) => {
  const found = await db.query('SELECT * FROM lease WHERE lease_id = $1', [req.params.id]);
  if (found.rowCount === 0) return res.status(404).render('error', { msg: 'Record not found.' });
  res.render('form', { row: found.rows[0], dropdowns: await dropdowns(page), action: '/leases/' + req.params.id });
}));

// UPDATE
router.post('/leases/:id', can('leases', 'u'), safe(async (req, res) => {
  const b = req.body;
  try {
    const result = await db.query('UPDATE lease SET tenant_id = $1, room_id = $2, start_date = $3, end_date = $4, moved_out_on = $5, monthly_rent = $6, status = $7 WHERE lease_id = $8', [b.tenant_id, b.room_id, b.start_date, b.end_date, b.moved_out_on || null, b.monthly_rent, b.status, req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/leases'); }
    req.session.flash = { ok: 'Leases: record updated.' };
    res.redirect('/leases');
  } catch (err) { await formError(req, res, err, page, { ...b, [page.pk]: req.params.id }, '/leases/' + req.params.id); }
}));

// DELETE
router.post('/leases/:id/delete', can('leases', 'd'), safe(async (req, res) => {
  try {
    const result = await db.query('DELETE FROM lease WHERE lease_id = $1', [req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/leases'); }
    req.session.flash = { ok: 'Leases: record deleted.' };
    res.redirect('/leases');
  } catch (err) { dbError(req, res, err, '/leases'); }
}));

module.exports = router;
