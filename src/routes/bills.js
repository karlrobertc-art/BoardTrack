// routes/bills.js - Utility bills: list, add, edit, delete (one explicit SQL statement per action).
const express = require('express');
const db = require('../db');
const { requireLogin, can } = require('../auth');
const { safe, dbError, formError, numericId, rowsFor, dropdowns } = require('../helpers');
const router = express.Router();
router.param('id', numericId);       // :id must be a whole number

// What the list shows and which inputs the form has.
// n = column name, t = input type, opts = fixed dropdown choices, fk = SQL for a dropdown, opt = optional
const page = { key: 'bills', label: 'Utility bills', pk: 'utility_bill_id', fields: [
  { n: 'lease_id', fk: "SELECT l.lease_id v, '#' || l.lease_id || ' ' || t.full_name l FROM lease l JOIN tenant t ON t.tenant_id = l.tenant_id ORDER BY l.lease_id" },
  { n: 'billing_period', t: 'date' },
  { n: 'utility_type', opts: ['ELECTRICITY', 'WATER', 'INTERNET'] },
  { n: 'amount', t: 'number' },
  { n: 'status', opts: ['UNPAID', 'PAID'] },
] };
router.use('/bills', requireLogin, (req, res, next) => { res.locals.page = page; next(); });

// LIST (read)
router.get('/bills', can('bills', 'r'), safe(async (req, res) => {
  const rows = await rowsFor(req, `SELECT u.utility_bill_id, t.full_name AS tenant, u.lease_id, u.billing_period, u.utility_type, u.amount, u.status
    FROM utility_bill u JOIN lease l ON l.lease_id = u.lease_id JOIN tenant t ON t.tenant_id = l.tenant_id`, 'l.tenant_id');
  res.render('list', { rows });
}));

// EMPTY FORM
router.get('/bills/new', can('bills', 'c'), safe(async (req, res) => {
  res.render('form', { row: {}, dropdowns: await dropdowns(page), action: '/bills' });
}));

// CREATE
router.post('/bills', can('bills', 'c'), safe(async (req, res) => {
  const b = req.body;
  try {
    await db.query('INSERT INTO utility_bill (lease_id, billing_period, utility_type, amount, status) VALUES ($1, $2, $3, $4, $5)', [b.lease_id, b.billing_period, b.utility_type, b.amount, b.status]);
    req.session.flash = { ok: 'Utility bills: record added.' };
    res.redirect('/bills');
  } catch (err) { await formError(req, res, err, page, b, '/bills'); }
}));

// FORM FILLED WITH THE EXISTING RECORD
router.get('/bills/:id/edit', can('bills', 'u'), safe(async (req, res) => {
  const found = await db.query('SELECT * FROM utility_bill WHERE utility_bill_id = $1', [req.params.id]);
  if (found.rowCount === 0) return res.status(404).render('error', { msg: 'Record not found.' });
  res.render('form', { row: found.rows[0], dropdowns: await dropdowns(page), action: '/bills/' + req.params.id });
}));

// UPDATE
router.post('/bills/:id', can('bills', 'u'), safe(async (req, res) => {
  const b = req.body;
  try {
    const result = await db.query('UPDATE utility_bill SET lease_id = $1, billing_period = $2, utility_type = $3, amount = $4, status = $5 WHERE utility_bill_id = $6', [b.lease_id, b.billing_period, b.utility_type, b.amount, b.status, req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/bills'); }
    req.session.flash = { ok: 'Utility bills: record updated.' };
    res.redirect('/bills');
  } catch (err) { await formError(req, res, err, page, { ...b, [page.pk]: req.params.id }, '/bills/' + req.params.id); }
}));

// DELETE
router.post('/bills/:id/delete', can('bills', 'd'), safe(async (req, res) => {
  try {
    const result = await db.query('DELETE FROM utility_bill WHERE utility_bill_id = $1', [req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/bills'); }
    req.session.flash = { ok: 'Utility bills: record deleted.' };
    res.redirect('/bills');
  } catch (err) { dbError(req, res, err, '/bills'); }
}));

module.exports = router;
