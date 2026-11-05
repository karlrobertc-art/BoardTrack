// routes/rooms.js - Rooms: list, add, edit, delete (one explicit SQL statement per action).
const express = require('express');
const db = require('../db');
const { requireLogin, can } = require('../auth');
const { safe, dbError, formError, numericId, rowsFor, dropdowns } = require('../helpers');
const router = express.Router();
router.param('id', numericId);       // :id must be a whole number

// What the list shows and which inputs the form has.
// n = column name, t = input type, opts = fixed dropdown choices, fk = SQL for a dropdown, opt = optional
const page = { key: 'rooms', label: 'Rooms', pk: 'room_id', fields: [
  { n: 'property_id', fk: "SELECT property_id v, property_name l FROM property ORDER BY 2" },
  { n: 'room_number' },
  { n: 'monthly_rate', t: 'number' },
  { n: 'status', opts: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'] },
] };
router.use('/rooms', requireLogin, (req, res, next) => { res.locals.page = page; next(); });

// LIST (read)
router.get('/rooms', can('rooms', 'r'), safe(async (req, res) => {
  const rows = await rowsFor(req, `SELECT r.room_id, p.property_name, r.room_number, r.monthly_rate, r.status
    FROM room r JOIN property p ON p.property_id = r.property_id`, null);
  res.render('list', { rows });
}));

// EMPTY FORM
router.get('/rooms/new', can('rooms', 'c'), safe(async (req, res) => {
  res.render('form', { row: {}, dropdowns: await dropdowns(page), action: '/rooms' });
}));

// CREATE
router.post('/rooms', can('rooms', 'c'), safe(async (req, res) => {
  const b = req.body;
  try {
    await db.query('INSERT INTO room (property_id, room_number, monthly_rate, status) VALUES ($1, $2, $3, $4)', [b.property_id, b.room_number, b.monthly_rate, b.status]);
    req.session.flash = { ok: 'Rooms: record added.' };
    res.redirect('/rooms');
  } catch (err) { await formError(req, res, err, page, b, '/rooms'); }
}));

// FORM FILLED WITH THE EXISTING RECORD
router.get('/rooms/:id/edit', can('rooms', 'u'), safe(async (req, res) => {
  const found = await db.query('SELECT * FROM room WHERE room_id = $1', [req.params.id]);
  if (found.rowCount === 0) return res.status(404).render('error', { msg: 'Record not found.' });
  res.render('form', { row: found.rows[0], dropdowns: await dropdowns(page), action: '/rooms/' + req.params.id });
}));

// UPDATE
router.post('/rooms/:id', can('rooms', 'u'), safe(async (req, res) => {
  const b = req.body;
  try {
    const result = await db.query('UPDATE room SET property_id = $1, room_number = $2, monthly_rate = $3, status = $4 WHERE room_id = $5', [b.property_id, b.room_number, b.monthly_rate, b.status, req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/rooms'); }
    req.session.flash = { ok: 'Rooms: record updated.' };
    res.redirect('/rooms');
  } catch (err) { await formError(req, res, err, page, { ...b, [page.pk]: req.params.id }, '/rooms/' + req.params.id); }
}));

// DELETE
router.post('/rooms/:id/delete', can('rooms', 'd'), safe(async (req, res) => {
  try {
    const result = await db.query('DELETE FROM room WHERE room_id = $1', [req.params.id]);
    if (result.rowCount === 0) { req.session.flash = { err: 'That record no longer exists.' }; return res.redirect('/rooms'); }
    req.session.flash = { ok: 'Rooms: record deleted.' };
    res.redirect('/rooms');
  } catch (err) { dbError(req, res, err, '/rooms'); }
}));

module.exports = router;
