import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import Bottleneck from 'bottleneck';
import type { TargetConfig } from './types.js';
import { warn } from './logger.js';

export interface HttpSession {
  jar: CookieJar;
  csrfToken?: string;
  loggedIn?: boolean;
}

export class HttpClient {
  private axios: AxiosInstance;
  private limiter: Bottleneck;
  session: HttpSession;

  constructor(private target: TargetConfig) {
    this.session = { jar: new CookieJar() };
    const instance = axios.create({
      baseURL: target.base_url,
      timeout: target.timeout_ms,
      validateStatus: () => true
    });
    this.axios = wrapper(instance);

    const hasApiKey = 'auth' in target && (target.auth as any).apiKey;
    if (!hasApiKey) {
      // Session/cookie-based auth for username/password targets
      // @ts-ignore: axios-cookiejar-support types
      this.axios.defaults.jar = this.session.jar;
      this.axios.defaults.withCredentials = true;
    } else {
      // For API-key based Integration API calls, behave like curl:
      // no cookies, no withCredentials. Auth is via header only.
      this.axios.defaults.withCredentials = false;
    }

    if (target.verify_ssl === false) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      warn('TLS verification disabled for target', { id: target.id });
    }

    this.limiter = new Bottleneck({ minTime: 1000 / (target.rate_limit_per_sec || 5) });
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<{ status: number; data: T; headers: any }>{
    const headers = { ...config.headers } as any;
    if (this.session.csrfToken) headers['X-CSRF-Token'] = this.session.csrfToken;
    if ('auth' in this.target && (this.target.auth as any).apiKey) {
      const a: any = this.target.auth as any;
      const headerName = a.headerName || 'Authorization';
      const scheme = a.scheme || (headerName.toLowerCase() === 'authorization' ? 'Bearer' : '');
      headers[headerName] = scheme ? `${scheme} ${a.apiKey}` : a.apiKey;
    }
    return this.limiter.schedule(async () => {
      const res = await this.axios.request<T>({ ...config, headers });
      const csrf = res.headers['x-csrf-token'];
      if (csrf && !this.session.csrfToken) this.session.csrfToken = csrf as string;
      return { status: res.status, data: res.data as T, headers: res.headers };
    });
  }
}
