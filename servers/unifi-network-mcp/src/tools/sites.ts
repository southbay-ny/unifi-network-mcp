import type { TargetConfig, ResultEnvelope, Site } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { controllerPath, integrationPath } from '../router.js';

export async function listSites(
  target: TargetConfig,
  http: HttpClient,
  raw = false,
  params?: { offset?: number; limit?: number; filter?: string }
): Promise<ResultEnvelope<Site[]>> {
  await ensureSession(target, http);
  const isApiKey = (target as any).auth && (target as any).auth.apiKey;
  const tryPaths: string[] = [];
  if (isApiKey) {
    // Prefer Integration API when API key is provided, with optional pagination/filter params
    let url = integrationPath(target, 'sites');
    if (params) {
      const qs: string[] = [];
      if (typeof params.offset === 'number') qs.push(`offset=${encodeURIComponent(String(params.offset))}`);
      if (typeof params.limit === 'number') qs.push(`limit=${encodeURIComponent(String(params.limit))}`);
      if (typeof params.filter === 'string' && params.filter.length > 0) qs.push(`filter=${encodeURIComponent(params.filter)}`);
      if (qs.length > 0) url = `${url}?${qs.join('&')}`;
    }
    tryPaths.push(url);
  } else {
    if (target.controller_type === 'unifi_os') {
      tryPaths.push(controllerPath(target, 'self/sites', true));
      tryPaths.push(controllerPath(target, 'self/sites', false));
    } else {
      tryPaths.push(controllerPath(target, 'self/sites', false));
    }
  }

  let lastErr: any;
  for (const p of tryPaths) {
    const res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: p });
    if (res.status >= 200 && res.status < 300 && res.data) {
      // Integration API returns { data: [...] } with UUID id field
      // Controller API returns { data: [...] } with _id field
      const arr = (res.data as any)?.data || (Array.isArray(res.data) ? res.data : []);
      if (Array.isArray(arr)) {
        const sites: Site[] = arr.map((s: any) => ({
          id: s.id || s._id || s.name,
          name: s.name || s.desc || s.display_name || s.internalReference || s.id,
          desc: s.desc || s.description
        }));
        return { data: sites, ...(raw ? { raw: res.data } : {}) };
      }
    }
    lastErr = new Error(`HTTP ${res.status}`);
  }
  throw lastErr;
}
