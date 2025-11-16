import type { TargetConfig, ResultEnvelope, Client } from '../types.js';
import { HttpClient } from '../http.js';
import { ensureSession } from '../session.js';
import { sitePath, integrationPath } from '../router.js';
import { listSites } from './sites.js';

export interface GetClientsOpts { site?: string; raw?: boolean; active_only?: boolean }

export async function getClients(target: TargetConfig, http: HttpClient, opts: GetClientsOpts = {}): Promise<ResultEnvelope<Client[]>> {
  await ensureSession(target, http);
  const s = opts.site || target.default_site;
  const isApiKey = (target as any).auth && (target as any).auth.apiKey;

  // For API-key targets, use Integration API
  if (isApiKey) {
    // Resolve siteId from site name
    const sitesRes = await listSites(target, http, false);
    const site = sitesRes.data.find(site => site.name === s || site.id === s);
    if (!site || !site.id) throw new Error(`Site '${s}' not found`);
    
    const url = integrationPath(target, `sites/${encodeURIComponent(site.id)}/clients`);
    const res = await http.request<{ data?: any[]; offset?: number; limit?: number; count?: number; totalCount?: number }>({ 
      method: 'GET', 
      url 
    });
    
    if (res.status >= 200 && res.status < 300) {
      const list = ((res.data as any)?.data || []) as any[];
      const clients: Client[] = list.map((c: any) => ({
        mac: c.macAddress || c.mac,
        hostname: c.name || c.hostname,
        ip: c.ipAddress || c.ip,
        user_id: c.id || c.user_id,
        is_active: c.connectedAt ? true : false,
        ap_mac: c.uplinkDeviceId,
        rx_bytes: c.rxBytes || c.rx_bytes,
        tx_bytes: c.txBytes || c.tx_bytes,
        site_id: site.id
      }));
      const truncated = !!((res.data as any)?.totalCount && (res.data as any).totalCount > list.length);
      return { data: clients, ...(truncated ? { truncated: true } : {}), ...(opts.raw ? { raw: res.data } : {}) };
    }
    throw new Error(`HTTP ${res.status}`);
  }

  if (opts.active_only) {
    const res = await http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/sta') });
    if (res.status >= 200 && res.status < 300) {
      const list = ((res.data as any)?.data || []) as any[];
      const clients: Client[] = list.map((c: any) => ({
        mac: c.mac,
        hostname: c.hostname || c.name,
        ip: c.ip,
        user_id: c.user_id,
        is_active: true,
        ap_mac: c.ap_mac,
        rx_bytes: c.rx_bytes,
        tx_bytes: c.tx_bytes,
        site_id: c.site_id
      }));
      const truncated = !!((res.data as any)?.meta?.count);
      return { data: clients, ...(truncated ? { truncated: true } : {}), ...(!!opts.raw ? { raw: res.data } : {}) };
    }
    throw new Error(`HTTP ${res.status}`);
  }

  // Combine known clients (rest/user) with active (stat/sta)
  const [knownRes, activeRes] = await Promise.all([
    http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'rest/user') }),
    http.request<{ data?: any[]; meta?: any }>({ method: 'GET', url: sitePath(target, s, 'stat/sta') })
  ]);
  if ((knownRes.status >= 200 && knownRes.status < 300) && (activeRes.status >= 200 && activeRes.status < 300)) {
    const activeMap = new Map<string, any>(((activeRes.data as any)?.data || []).map((c: any) => [c.mac, c]));
    const list = ((knownRes.data as any)?.data || []) as any[];
    const clients: Client[] = list.map((c: any) => {
      const a = activeMap.get(c.mac);
      return {
        mac: c.mac,
        hostname: c.hostname || c.name,
        ip: a?.ip || c.last_ip,
        user_id: c._id,
        is_active: !!a,
        ap_mac: a?.ap_mac,
        rx_bytes: a?.rx_bytes,
        tx_bytes: a?.tx_bytes,
        site_id: c.site_id
      } as Client;
    });
    const truncated = !!((knownRes.data as any)?.meta?.count || (activeRes.data as any)?.meta?.count);
    return { data: clients, ...(truncated ? { truncated: true } : {}), ...(!!opts.raw ? { raw: { known: knownRes.data, active: activeRes.data } } : {}) };
  }
  throw new Error(`HTTP ${knownRes.status}/${activeRes.status}`);
}
