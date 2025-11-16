import 'dotenv/config';
import { loadTargets } from '../config.js';
import { HttpClient } from '../http.js';
import { listSites } from '../tools/sites.js';
import type { TargetConfig } from '../types.js';

function describeTarget(target: {
  id: string;
  base_url: string;
  controller_type: string;
  verify_ssl?: boolean;
}) {
  console.log(`- ${target.id} (${target.controller_type}) @ ${target.base_url}`);
  console.log(`  TLS verify: ${target.verify_ssl !== false}`);
}

async function testTarget(target: TargetConfig) {
  console.log(`\nTrying ${target.id}...`);
  describeTarget(target);
  const client = new HttpClient(target);
  try {
    const response = await listSites(target, client, true);
    const count = Array.isArray(response.data) ? response.data.length : 'unknown';
    console.log(`  ✅ List sites succeeded (sites: ${count})`);
  } catch (error) {
    console.error(`  ❌ List sites failed: ${error instanceof Error ? error.message : error}`);
    throw error;
  }
}

async function main() {
  const targets = loadTargets();
  console.log(`Loaded ${targets.length} UniFi target${targets.length === 1 ? '' : 's'}.`);
  if (targets.length === 0) {
    console.warn('Set UNIFI_TARGETS with at least one controller definition.');
    return;
  }

  for (const target of targets) {
    await testTarget(target);
  }

  console.log('\nEnvironment variables appear valid.');
}

main().catch((error) => {
  console.error('\nEnvironment test failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
