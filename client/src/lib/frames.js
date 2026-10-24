/** Pure helpers for cheap, fast live checks (kept DOM-free so they are unit-testable). */

/** Fit (w,h) inside a max edge, never upscaling. */
export function fitWithin(w, h, maxEdge = 640) {
  if (!w || !h) return { width: 0, height: 0, scale: 0 };
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale), scale };
}

/** Grayscale an RGBA buffer (ImageData.data) into a Uint8Array. */
export function toGray(rgba) {
  const out = new Uint8Array(rgba.length / 4);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j++) out[j] = (rgba[i] * 77 + rgba[i + 1] * 150 + rgba[i + 2] * 29) >> 8;
  return out;
}

/** Mean absolute difference (0..1) between two equal-length grayscale thumbnails. */
export function frameDiff(a, b) {
  if (!a || !b || a.length !== b.length || !a.length) return 1;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / (a.length * 255);
}

/** Below this the frame "barely changed" and an auto-check is skipped. */
export const DIFF_THRESHOLD = 0.04;

/** Single in-flight guard: run() returns null (skipped) while another call is pending. */
export function createInFlight() {
  let pending = null;
  return {
    get busy() { return pending !== null; },
    run(fn) {
      if (pending) return null;
      pending = Promise.resolve().then(fn).finally(() => { pending = null; });
      return pending;
    },
  };
}

/** Auto-check interval adapts to measured latency: at least the user pref, at least latency + 2s gap, max 30s. */
export function adaptiveIntervalMs(prefSec, lastLatencyMs) {
  const base = Math.max(5, prefSec || 6) * 1000;
  if (!lastLatencyMs) return base;
  return Math.min(30_000, Math.max(base, Math.round(lastLatencyMs * 1.25 + 2000)));
}

/** Resolve with the promise, or with `fallback` after ms (the promise keeps running). */
export function softTimeout(promise, ms, fallback) {
  let t;
  return Promise.race([promise, new Promise((r) => { t = setTimeout(() => r(fallback), ms); })]).finally(() => clearTimeout(t));
}
