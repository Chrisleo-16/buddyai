export class TimeoutError extends Error { constructor(ms) { super(`timeout_after_${ms}ms`); this.code = 'TIMEOUT'; } }

export function withTimeout(promiseFactory, ms) {
  const ctrl = new AbortController();
  let t;
  const timeout = new Promise((_, rej) => { t = setTimeout(() => { ctrl.abort(); rej(new TimeoutError(ms)); }, ms); });
  return Promise.race([promiseFactory(ctrl.signal), timeout]).finally(() => clearTimeout(t));
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function isRetryable(err) {
  const s = Number(err?.status || err?.code || err?.response?.status);
  if ([408, 429, 500, 502, 503, 504].includes(s)) return true;
  const m = String(err?.message || '');
  return /UNAVAILABLE|INTERNAL|overloaded|503|500|429|ECONNRESET|fetch failed|timeout/i.test(m);
}

/** Retry with exponential backoff + jitter. */
export async function retry(fn, { retries = 2, baseMs = 1500, onAttempt } = {}) {
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(attempt); } catch (e) {
      last = e;
      onAttempt?.(attempt, e);
      if (attempt === retries || !isRetryable(e)) break;
      await sleep(baseMs * 2 ** attempt + Math.random() * 400);
    }
  }
  throw last;
}
