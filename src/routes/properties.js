// routes/properties.js - Properties: list, add, edit, delete (one explicit SQL statement per action).
const express = require('express');
const db = require('../db');
const { requireLogin, can } = require('../auth');
const { safe, dbError, formError, numericId, rowsFor, dropdowns } = require('../helpers');
const router = express.Router();
router.param('id', numericId);       // :id must be a whole number

// What the list shows and which inputs the form has.
// n = column name, t = input type, opts = fixed dropdown choices, fk = SQL for a dropdown, opt = optional
const page = { key: 'properties', label: 'Properties', pk: 'property_id', fields: [
  { n: 'property_name' },
  { n: 'address' },
] };
router.use('/properties', requireLogin, (req, res, next) => { res.locals.page = page; next(); });

// LIST (read)
router.get('/properties', can('properties', 'r'), safe(async (req, res) => {
  const rows = await rowsFor(req, `SELECT p.property_id, p.property_name, p.address,
    (SELECT COUNT(*) FROM room r WHERE r.property_id = p.property_id) AS rooms
    FROM property p`, null);
  res.render('list', { rows });
}));

// EMPTY FORM
router.get('/properties/new', can('properties', 'c'), safe(async (req, res) => {
  res.render('form', { row: {}, dropdowns: await dropdowns(page), action: '/properties' });
}));

// CREATE
router.post('/properties', can('properties', 'c'), safe(async (req, res) => {
  const b = req.body;
  try {
    await db.query('INSERT INTO property (property_name, address) VALUES ($1, $2)', [b.property_name, b.address]);
    req.session.flash = { ok: 'Properties: record added.' };
    res.redirect('/properties');
  } catch (err) { await formError(req, res, err, page, b, '/properties'); }
}));

// FORM FILLED WITH THE EXISTING RECORD
router.get('/properties/:id/edit', can('properties', 'u'), safe(async (req, res) => {
  const found = await db.query('SELECT * FROM property WHERE property_id = $1', [req.params.id]);
  if (found.rowCount === 0) return res.status(404).render('error', { msg: 'Record not found.' });
  res.render('form', { row: found.rows[0], dropdowns: await dropdowns(page), action: '/properties/' + req.params.id });
}));

// UPDATE
router.post('/properties/:id', can('properties', 'u'), safe(async (req, res) => {
  const b = req.body;
  try {
    const result = await db.query('UPDATE property SET property_name = $1, address = $2 WHERE property_id = $3', [b.property_name, b.address, req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/properties'); }
    req.session.flash = { ok: 'Properties: record updated.' };
    res.redirect('/properties');
  } catch (err) { await formError(req, res, err, page, { ...b, [page.pk]: req.params.id }, '/properties/' + req.params.id); }
}));

// DELETE
router.post('/properties/:id/delete', can('properties', 'd'), safe(async (req, res) => {
  try {
    const result = await db.query('DELETE FROM property WHERE property_id = $1', [req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/properties'); }
    req.session.flash = { ok: 'Properties: record deleted.' };
    res.redirect('/properties');
  } catch (err) { dbError(req, res, err, '/properties'); }
}));

module.exports = router;
