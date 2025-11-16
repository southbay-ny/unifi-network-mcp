export type ControllerType = 'unifi_os' | 'classic';

export interface TargetAuthUserPass { username: string; password: string; }
export interface TargetAuthApiKey { apiKey: string; headerName?: string; scheme?: string }
export type TargetAuth = TargetAuthUserPass | TargetAuthApiKey;

export interface TargetConfig {
  id: string;
  base_url: string;
  controller_type: ControllerType;
  default_site: string;
  auth: TargetAuth;
  verify_ssl?: boolean;
  ca_bundle_path?: string;
  timeout_ms?: number;
  rate_limit_per_sec?: number;
}

export interface Site { id: string; name: string; desc?: string }

export interface ResultEnvelope<T> { data: T; truncated?: boolean; raw?: any }

export interface Device {
  mac: string;
  type?: string;
  model?: string;
  name?: string;
  ip?: string;
  version?: string;
  adopted?: boolean;
  state?: number;
  uptime?: number;
  site_id?: string;
}

export interface Client {
  mac: string;
  hostname?: string;
  ip?: string;
  user_id?: string;
  is_active?: boolean;
  ap_mac?: string;
  rx_bytes?: number;
  tx_bytes?: number;
  site_id?: string;
}

export interface Event {
  time: number;
  key?: string;
  msg?: string;
  user?: string;
  ap_mac?: string;
  site_id?: string;
}

export interface Alarm {
  time: number;
  key?: string;
  msg?: string;
  archived?: boolean;
  site_id?: string;
}

export interface Health {
  subcontrollers?: any[];
  num_user?: number;
  num_ap?: number;
  num_sw?: number;
  num_gw?: number;
}

export interface Sysinfo {
  version?: string;
  hostname?: string;
  uptime?: number;
  build?: string;
}
