import type { TargetConfig, ResultEnvelope } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath, controllerPath, integrationPath } from '../router.js';

export async function getSysinfo(target: TargetConfig, http: HttpClient, site?: string, raw = false): Promise<ResultEnvelope<any>> {
  await ensureSession(target, http);
  const isApiKey = (target as any).auth && (target as any).auth.apiKey;
  if (isApiKey) {
    const info = await http.request<{ data?: any; meta?: any }>({
      method: 'GET',
      url: integrationPath(target, 'info')
    });
    const data = { sysinfo: (info.data as any)?.data ?? (info.data as any) };
    return { data, ...(raw ? { raw: info.data } : {}) };
  }

  const s = site || target.default_site;
  const sys = await http.request<{ data?: any; meta?: any }>({
    method: 'GET',
    url: sitePath(target, s, 'stat/sysinfo')
  });
  let status: any = undefined;
  // Try controller /status (may be unauthenticated on classic)
  const statusPath = controllerPath(target, 'status', false);
  const statusRes = await http.request<any>({ method: 'GET', url: statusPath });
  if (statusRes.status >= 200 && statusRes.status < 300) status = statusRes.data;

  const data = { sysinfo: (sys.data as any)?.data ?? (sys.data as any), status };
  return { data, ...(raw ? { raw: { sys: sys.data, status } } : {}) };
}
