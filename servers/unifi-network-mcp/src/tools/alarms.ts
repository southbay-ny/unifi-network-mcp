import type { TargetConfig, ResultEnvelope, Alarm } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath } from '../router.js';

export interface GetAlarmsOpts { site?: string; raw?: boolean; archived?: boolean }

export async function getAlarms(target: TargetConfig, http: HttpClient, opts: GetAlarmsOpts = {}): Promise<ResultEnvelope<Alarm[]>> {
  await ensureSession(target, http);
  const s = opts.site || target.default_site;

  // Try stat/alarm first (most recent). If archived filter is explicitly set, also try rest/alarm with query.
  const primary = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/alarm') });
  let combined: any[] = [];
  let truncated = false;

  if (primary.status >= 200 && primary.status < 300) {
    combined = Array.isArray((primary.data as any)?.data) ? (primary.data as any).data : [];
    truncated = truncated || !!((primary.data as any)?.meta?.count);
  }

  if (typeof opts.archived === 'boolean') {
    const qs = `archived=${opts.archived ? 'true' : 'false'}`;
    const rest = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, `rest/alarm?${qs}`) });
    if (rest.status >= 200 && rest.status < 300) {
      const restList = Array.isArray((rest.data as any)?.data) ? (rest.data as any).data : [];
      combined = mergeById(combined, restList);
      truncated = truncated || !!((rest.data as any)?.meta?.count);
    }
  }

  const alarms: Alarm[] = combined.map((a: any) => ({
    time: a.time ?? 0,
    key: a.key,
    msg: a.msg,
    archived: !!a.archived,
    site_id: a.site_id
  }));

  return { data: alarms, ...(truncated ? { truncated: true } : {}), ...(opts.raw ? { raw: { primary: primary.data } } : {}) };
}

function mergeById(a: any[], b: any[]): any[] {
  const by = new Map<string, any>();
  for (const x of a) by.set(x._id || `${x.time}-${x.key}`, x);
  for (const y of b) by.set(y._id || `${y.time}-${y.key}`, y);
  return Array.from(by.values());
}
