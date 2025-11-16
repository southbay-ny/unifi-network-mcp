import { z } from 'zod';
import type { TargetConfig } from './types.js';

const TargetSchema = z.object({
  id: z.string().min(1),
  base_url: z.string().url(),
  controller_type: z.enum(['unifi_os', 'classic']),
  default_site: z.string().min(1),
  auth: z.union([
    z.object({ username: z.string().min(1), password: z.string().min(1) }),
    z.object({ apiKey: z.string().min(1), headerName: z.string().optional(), scheme: z.string().optional() })
  ]),
  verify_ssl: z.boolean().optional(),
  ca_bundle_path: z.string().optional(),
  timeout_ms: z.number().int().positive().optional(),
  rate_limit_per_sec: z.number().positive().optional()
});

const TargetsSchema = z.array(TargetSchema).min(1);

export function loadTargets(): TargetConfig[] {
  const raw = process.env.UNIFI_TARGETS;
  if (!raw) throw new Error('UNIFI_TARGETS is required (JSON array)');
  const parsed = JSON.parse(raw);
  const targets = TargetsSchema.parse(parsed);
  return targets.map((t: TargetConfig) => ({
    verify_ssl: true,
    timeout_ms: 15000,
    rate_limit_per_sec: 5,
    ...t
  }));
}
