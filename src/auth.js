// auth.js - who may do what, plus login/logout.
const express = require('express');
const db = require('./db');
const router = express.Router();

// PERMISSION TABLE: c=create r=read u=update d=delete. Change roles here.
// A role that is not listed for a page cannot open it. Tenants only ever see their OWN rows.
const permissions = {
  properties: { label: 'Properties',    admin: 'crud', staff: 'r' },
  rooms:      { label: 'Rooms',         admin: 'crud', staff: 'ru' },
  tenants:    { label: 'Tenants',       admin: 'crud', staff: 'cru' },
  leases:     { label: 'Leases',        admin: 'crud', staff: 'cru', tenant: 'r' },
  payments:   { label: 'Payments',      admin: 'crud', staff: 'cru', tenant: 'r' },
  bills:      { label: 'Utility bills', admin: 'crud', staff: 'cru', tenant: 'r' },
};

// Guard 1: must be logged in.
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login');
}
// Guard 2: the user's role must allow this action on this page. Example: can('rooms', 'u')
function can(pageKey, action) {
  return (req, res, next) => {
    const perms = permissions[pageKey][req.session.user.role] || '';
    if (!perms.includes(action)) return res.status(403).render('error', { msg: 'Your role is not allowed to do that.' });
    res.locals.perms = perms;                 // the page uses this to show/hide Edit and Delete
    next();
  };
}
// The menu: only pages the role may read.
function menuFor(user) {
  if (!user) return [];
  return Object.entries(permissions).filter(([k, p]) => (p[user.role] || '').includes('r')).map(([k, p]) => ({ key: k, label: p.label }));
}

router.get('/login', (req, res) => res.render('login'));
router.post('/login', async (req, res, next) => {
  try {
    // crypt() re-hashes the typed password with the stored salt and compares (pgcrypto).
    const result = await db.query(
      `SELECT user_id, username, role, tenant_id FROM app_user
       WHERE username = $1 AND is_active AND password_hash = crypt($2, password_hash)`,
      [req.body.username, req.body.password]);
    if (result.rowCount === 0) {
      req.session.flash = { err: 'Invalid username or password.' };
      return res.redirect('/login');
    }
    req.session.user = result.rows[0];        // remember who is logged in
    res.redirect('/');
  } catch (err) { next(err); }
});
router.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

module.exports = { router, requireLogin, can, menuFor };
