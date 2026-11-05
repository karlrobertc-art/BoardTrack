// routes/tenants.js - Tenants: list, add, edit, delete (one explicit SQL statement per action).
const express = require('express');
const db = require('../db');
const { requireLogin, can } = require('../auth');
const { safe, dbError, formError, numericId, rowsFor, dropdowns } = require('../helpers');
const router = express.Router();
router.param('id', numericId);       // :id must be a whole number

// What the list shows and which inputs the form has.
// n = column name, t = input type, opts = fixed dropdown choices, fk = SQL for a dropdown, opt = optional
const page = { key: 'tenants', label: 'Tenants', pk: 'tenant_id', fields: [
  { n: 'full_name' },
  { n: 'contact_number' },
  { n: 'email', t: 'email', opt: true },
  { n: 'valid_id_number', opt: true },
] };
router.use('/tenants', requireLogin, (req, res, next) => { res.locals.page = page; next(); });

// LIST (read)
router.get('/tenants', can('tenants', 'r'), safe(async (req, res) => {
  const rows = await rowsFor(req, `SELECT tenant_id, full_name, contact_number, email, valid_id_number FROM tenant`, null);
  res.render('list', { rows });
}));

// EMPTY FORM
router.get('/tenants/new', can('tenants', 'c'), safe(async (req, res) => {
  res.render('form', { row: {}, dropdowns: await dropdowns(page), action: '/tenants' });
}));

// CREATE
router.post('/tenants', can('tenants', 'c'), safe(async (req, res) => {
  const b = req.body;
  try {
    await db.query('INSERT INTO tenant (full_name, contact_number, email, valid_id_number) VALUES ($1, $2, $3, $4)', [b.full_name, b.contact_number, b.email || null, b.valid_id_number || null]);
    req.session.flash = { ok: 'Tenants: record added.' };
    res.redirect('/tenants');
  } catch (err) { await formError(req, res, err, page, b, '/tenants'); }
}));

// FORM FILLED WITH THE EXISTING RECORD
router.get('/tenants/:id/edit', can('tenants', 'u'), safe(async (req, res) => {
  const found = await db.query('SELECT * FROM tenant WHERE tenant_id = $1', [req.params.id]);
  if (found.rowCount === 0) return res.status(404).render('error', { msg: 'Record not found.' });
  res.render('form', { row: found.rows[0], dropdowns: await dropdowns(page), action: '/tenants/' + req.params.id });
}));

// UPDATE
router.post('/tenants/:id', can('tenants', 'u'), safe(async (req, res) => {
  const b = req.body;
  try {
    const result = await db.query('UPDATE tenant SET full_name = $1, contact_number = $2, email = $3, valid_id_number = $4 WHERE tenant_id = $5', [b.full_name, b.contact_number, b.email || null, b.valid_id_number || null, req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/tenants'); }
    req.session.flash = { ok: 'Tenants: record updated.' };
    res.redirect('/tenants');
  } catch (err) { await formError(req, res, err, page, { ...b, [page.pk]: req.params.id }, '/tenants/' + req.params.id); }
}));

// DELETE
router.post('/tenants/:id/delete', can('tenants', 'd'), safe(async (req, res) => {
  try {
    const result = await db.query('DELETE FROM tenant WHERE tenant_id = $1', [req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/tenants'); }
    req.session.flash = { ok: 'Tenants: record deleted.' };
    res.redirect('/tenants');
  } catch (err) { dbError(req, res, err, '/tenants'); }
}));

module.exports = router;
