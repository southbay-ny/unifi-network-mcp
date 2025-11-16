import type { TargetConfig } from './types.js';
import { HttpClient } from './http.js';

export async function ensureSession(target: TargetConfig, http: HttpClient) {
  if (http.session.loggedIn) return;
  const isOs = target.controller_type === 'unifi_os';
  const url = isOs ? '/api/auth/login' : '/api/login';
  if ('username' in target.auth) {
    const body = { username: (target.auth as any).username, password: (target.auth as any).password };
    const res = await http.request({ method: 'POST', url, data: body, headers: { 'Content-Type': 'application/json' } });
    if (res.status < 200 || res.status >= 300) throw new Error(`Login failed (${res.status})`);
    http.session.loggedIn = true;
    const csrfHeader = res.headers['x-csrf-token'];
    if (csrfHeader) http.session.csrfToken = csrfHeader as string;
  } else {
    http.session.loggedIn = true;
  }
}
