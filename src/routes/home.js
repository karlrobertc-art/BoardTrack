// routes/home.js - the dashboard (summary cards).
const express = require('express');
const db = require('../db');
const { requireLogin } = require('../auth');
const { safe } = require('../helpers');
const router = express.Router();

router.get('/', requireLogin, safe(async (req, res) => {
  let stats = null;
  if (req.session.user.role !== 'tenant') {            // tenants only see their own records
    stats = (await db.query(`SELECT
      (SELECT COUNT(*) FROM property)                                  AS properties,
      (SELECT COUNT(*) FROM room WHERE status = 'OCCUPIED')            AS occupied,
      (SELECT COUNT(*) FROM room WHERE status = 'AVAILABLE')           AS available,
      (SELECT COUNT(*) FROM lease WHERE status = 'ACTIVE')             AS active_leases,
      (SELECT COALESCE(SUM(amount),0) FROM payment WHERE status = 'COMPLETED')   AS collected,
      (SELECT COALESCE(SUM(amount),0) FROM utility_bill WHERE status = 'UNPAID') AS unpaid_utilities`)).rows[0];
  }
  res.render('home', { stats });
}));
module.exports = router;
