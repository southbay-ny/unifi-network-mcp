export interface NormalizedError {
  code: string;
  http_status?: number;
  meta_rc?: string;
  meta_msg?: string;
  message: string;
}

export function normalizeError(httpStatus: number, body: any, fallback: string): NormalizedError {
  const meta = body && typeof body === 'object' ? (body.meta || {}) : {};
  const meta_rc = typeof meta.rc === 'string' ? meta.rc : undefined;
  const meta_msg = typeof meta.msg === 'string' ? meta.msg : undefined;
  return {
    code: codeFrom(httpStatus, meta_rc),
    http_status: httpStatus,
    meta_rc,
    meta_msg,
    message: meta_msg || fallback
  };
}

function codeFrom(status: number, rc?: string): string {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 408) return 'timeout';
  if (status >= 500) return 'controller_error';
  if (rc === 'error') return 'controller_error';
  return 'network_error';
}
