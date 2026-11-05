// Usage: node scripts/db.js setup | migrate | seed | reset | bundle
try { process.loadEnvFile(); } catch {}
const b = require('../src/bootstrap');
const cmd = process.argv[2];
const actions = {
  setup:   () => b.setup({ seed: true }),                         // create DB if missing + schema + sample data (if empty)
  migrate: () => b.setup({ seed: false }),                        // create DB if missing + schema only
  seed:    () => b.withDb(c => b.seed(c, true)),                  // force-load sample data
  reset:   () => b.reset(),                                       // WIPE public schema, rebuild, reseed
  bundle:  async () => console.log('wrote', b.bundle()),          // regenerate db/boardtrack_full_setup.sql
};
if (!actions[cmd]) { console.error('Usage: db.js ' + Object.keys(actions).join('|')); process.exit(1); }
actions[cmd]().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
