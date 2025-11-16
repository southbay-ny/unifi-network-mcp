import type { TargetConfig } from './types.js';

export function sitePath(target: TargetConfig, site: string, subpath: string) {
  const base = target.controller_type === 'unifi_os' ? '/proxy/network' : '';
  return `${base}/api/s/${encodeURIComponent(site)}/${subpath}`;
}

export function controllerPath(target: TargetConfig, subpath: string, preferProxy = false) {
  if (target.controller_type === 'unifi_os' && preferProxy) return `/proxy/network/api/${subpath}`;
  return `/api/${subpath}`;
}

export function integrationPath(target: TargetConfig, subpath: string) {
  if (target.controller_type === 'unifi_os') return `/proxy/network/integration/v1/${subpath}`;
  return `/integration/v1/${subpath}`;
}
