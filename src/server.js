// server.js - starts the web app. Read this file first.
try { process.loadEnvFile(); } catch {}          // load settings from .env (must run before db.js)
const express = require('express');
const session = require('express-session');
const { menuFor } = require('./auth');

const app = express();
app.set('view engine', 'ejs');                   // pages are in src/views/*.ejs
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/../public'));       // style.css
app.use(express.urlencoded({ extended: false }));        // read form submissions
app.use(session({ secret: process.env.SESSION_SECRET || 'dev-only-change-me', resave: false, saveUninitialized: false }));

// Values every page can use: who is logged in, the menu, and one-time messages.
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.menu = menuFor(req.session.user);
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

app.use(require('./auth').router);               // /login and /logout
// One file per page. Open the one you want to read, e.g. src/routes/rooms.js
for (const name of ['home', 'properties', 'rooms', 'tenants', 'leases', 'payments', 'bills']) app.use(require('./routes/' + name));

app.use((err, req, res, next) => {               // anything unexpected ends up here
  console.error(err);
  res.status(500).render('error', { msg: 'Something went wrong: ' + err.message });
});

(async () => {
  // Create the database/tables/sample data if needed (see src/bootstrap.js and .env).
  if (process.env.AUTO_SETUP !== 'false') await require('./bootstrap').setup({ seed: process.env.AUTO_SEED !== 'false' });
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`BoardTrack running at http://localhost:${port}`));
})().catch(e => { console.error('STARTUP ERROR:', e.message); process.exit(1); });
