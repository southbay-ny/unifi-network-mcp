import 'dotenv/config';
import { loadTargets } from './config.js';
import { HttpClient } from './http.js';
import { listSites } from './tools/sites.js';

async function main() {
  const targets = loadTargets();
  for (const t of targets) {
    const http = new HttpClient(t);
    try {
      const sites = await listSites(t, http, false);
      console.log(JSON.stringify({ target: t.id, sites: sites.data }, null, 2));
    } catch (e: any) {
      console.error(JSON.stringify({ target: t.id, error: e?.message || String(e) }));
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
