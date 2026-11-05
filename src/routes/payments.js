// routes/payments.js - Payments: list, add, edit, delete (one explicit SQL statement per action).
const express = require('express');
const db = require('../db');
const { requireLogin, can } = require('../auth');
const { safe, dbError, formError, numericId, rowsFor, dropdowns } = require('../helpers');
const router = express.Router();
router.param('id', numericId);       // :id must be a whole number

// What the list shows and which inputs the form has.
// n = column name, t = input type, opts = fixed dropdown choices, fk = SQL for a dropdown, opt = optional
const page = { key: 'payments', label: 'Payments', pk: 'payment_id', fields: [
  { n: 'lease_id', fk: "SELECT l.lease_id v, '#' || l.lease_id || ' ' || t.full_name || ' (' || l.status || ')' l FROM lease l JOIN tenant t ON t.tenant_id = l.tenant_id ORDER BY l.lease_id" },
  { n: 'payment_date', t: 'date' },
  { n: 'amount', t: 'number' },
  { n: 'payment_method', opts: ['CASH', 'GCASH', 'BANK_TRANSFER'] },
  { n: 'status', opts: ['COMPLETED', 'PENDING', 'FAILED'] },
] };
router.use('/payments', requireLogin, (req, res, next) => { res.locals.page = page; next(); });

// LIST (read)
router.get('/payments', can('payments', 'r'), safe(async (req, res) => {
  const rows = await rowsFor(req, `SELECT x.payment_id, t.full_name AS tenant, x.lease_id, x.payment_date, x.amount, x.payment_method, x.status
    FROM payment x JOIN lease l ON l.lease_id = x.lease_id JOIN tenant t ON t.tenant_id = l.tenant_id`, 'l.tenant_id');
  res.render('list', { rows });
}));

// EMPTY FORM
router.get('/payments/new', can('payments', 'c'), safe(async (req, res) => {
  res.render('form', { row: {}, dropdowns: await dropdowns(page), action: '/payments' });
}));

// CREATE
router.post('/payments', can('payments', 'c'), safe(async (req, res) => {
  const b = req.body;
  try {
    await db.query('INSERT INTO payment (lease_id, payment_date, amount, payment_method, status) VALUES ($1, $2, $3, $4, $5)', [b.lease_id, b.payment_date, b.amount, b.payment_method, b.status]);
    req.session.flash = { ok: 'Payments: record added.' };
    res.redirect('/payments');
  } catch (err) { await formError(req, res, err, page, b, '/payments'); }
}));

// FORM FILLED WITH THE EXISTING RECORD
router.get('/payments/:id/edit', can('payments', 'u'), safe(async (req, res) => {
  const found = await db.query('SELECT * FROM payment WHERE payment_id = $1', [req.params.id]);
  if (found.rowCount === 0) return res.status(404).render('error', { msg: 'Record not found.' });
  res.render('form', { row: found.rows[0], dropdowns: await dropdowns(page), action: '/payments/' + req.params.id });
}));

// UPDATE
router.post('/payments/:id', can('payments', 'u'), safe(async (req, res) => {
  const b = req.body;
  try {
    const result = await db.query('UPDATE payment SET lease_id = $1, payment_date = $2, amount = $3, payment_method = $4, status = $5 WHERE payment_id = $6', [b.lease_id, b.payment_date, b.amount, b.payment_method, b.status, req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/payments'); }
    req.session.flash = { ok: 'Payments: record updated.' };
    res.redirect('/payments');
  } catch (err) { await formError(req, res, err, page, { ...b, [page.pk]: req.params.id }, '/payments/' + req.params.id); }
}));

// DELETE
router.post('/payments/:id/delete', can('payments', 'd'), safe(async (req, res) => {
  try {
    const result = await db.query('DELETE FROM payment WHERE payment_id = $1', [req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/payments'); }
    req.session.flash = { ok: 'Payments: record deleted.' };
    res.redirect('/payments');
  } catch (err) { dbError(req, res, err, '/payments'); }
}));

module.exports = router;
