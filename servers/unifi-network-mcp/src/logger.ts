export function info(msg: string, meta?: any) { console.log(format('INFO', msg, meta)); }
export function warn(msg: string, meta?: any) { console.warn(format('WARN', msg, meta)); }
export function error(msg: string, meta?: any) { console.error(format('ERROR', msg, meta)); }

function format(level: string, msg: string, meta?: any) {
  const ts = new Date().toISOString();
  const redacted = redact(meta);
  return JSON.stringify({ ts, level, msg, ...(redacted ? { meta: redacted } : {}) });
}

function redact(meta?: any) {
  if (!meta) return undefined;
  const s = JSON.stringify(meta, (_k, v) => {
    if (typeof v === 'string') {
      if (/authorization|cookie|csrf|password|token/i.test(_k)) return 'REDACTED';
    }
    return v;
  });
  return JSON.parse(s);
}
