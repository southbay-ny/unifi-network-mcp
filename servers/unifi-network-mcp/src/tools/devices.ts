import type { TargetConfig, ResultEnvelope, Device } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath, integrationPath } from '../router.js';
import { listSites } from './sites.js';

export interface GetDevicesOpts { site?: string; raw?: boolean; macs?: string[] }

export async function getDevices(target: TargetConfig, http: HttpClient, opts: GetDevicesOpts = {}): Promise<ResultEnvelope<Device[]>> {
  await ensureSession(target, http);
  const s = opts.site || target.default_site;
  const isApiKey = (target as any).auth && (target as any).auth.apiKey;

  // For API-key targets, use Integration API
  if (isApiKey) {
    // Resolve siteId from site name
    const sitesRes = await listSites(target, http, false);
    const site = sitesRes.data.find(site => site.name === s || site.id === s);
    if (!site || !site.id) throw new Error(`Site '${s}' not found`);
    
    const url = integrationPath(target, `sites/${encodeURIComponent(site.id)}/devices`);
    const res = await http.request<{ data?: any[]; offset?: number; limit?: number; count?: number; totalCount?: number }>({ 
      method: 'GET', 
      url 
    });
    
    if (res.status >= 200 && res.status < 300) {
      const list = ((res.data as any)?.data || []) as any[];
      const devices: Device[] = list.map((d: any) => ({
        mac: d.macAddress || d.mac,
        type: d.model?.toLowerCase().includes('usw') ? 'usw' : d.model?.toLowerCase().includes('u6') || d.features?.includes('accessPoint') ? 'uap' : d.model === 'UDR' ? 'udm' : d.type,
        model: d.model,
        name: d.name,
        ip: d.ipAddress || d.ip,
        version: d.firmwareVersion || d.version,
        adopted: d.state === 'ONLINE' || d.adopted,
        state: d.state === 'ONLINE' ? 1 : 0,
        uptime: d.uptime,
        site_id: site.id
      }));
      const truncated = !!((res.data as any)?.totalCount && (res.data as any).totalCount > list.length);
      return { data: devices, ...(truncated ? { truncated: true } : {}), ...(opts.raw ? { raw: res.data } : {}) };
    }
    throw new Error(`HTTP ${res.status}`);
  }

  let res;
  if (opts.macs && opts.macs.length > 0) {
    if (target.controller_type === 'classic') {
      res = await http.request<{ data?: any[]; meta?: any }>({
        method: 'POST',
        url: sitePath(target, s, 'stat/device'),
        data: { macs: opts.macs }
      });
    } else if (opts.macs.length === 1) {
      res = await http.request<{ data?: any[]; meta?: any }>({
        method: 'GET',
        url: sitePath(target, s, `stat/device/${encodeURIComponent(opts.macs[0])}`)
      });
    } else {
      res = await http.request<{ data?: any[]; meta?: any }>({
        method: 'GET',
        url: sitePath(target, s, 'stat/device')
      });
    }
  } else {
    res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/device') });
  }

  if (res.status >= 200 && res.status < 300) {
    const list = ((res.data as any)?.data || []) as any[];
    const devices: Device[] = list.map((d: any) => ({
      mac: d.mac,
      type: d.type,
      model: d.model,
      name: d.name || d.adopted_name || d.hostname,
      ip: d.ip,
      version: d.version,
      adopted: d.adopted,
      state: d.state,
      uptime: d.uptime,
      site_id: d.site_id
    }));
    const truncated = !!((res.data as any)?.meta?.count);
    return { data: devices, ...(truncated ? { truncated: true } : {}), ...(opts.raw ? { raw: res.data } : {}) };
  }
  throw new Error(`HTTP ${res.status}`);
}
