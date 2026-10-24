/** One in-flight Gemma check per key (session). Overlapping requests are rejected, not queued. */
export function createInFlightGuard() {
  const active = new Set();
  return {
    tryAcquire(key) { if (active.has(key)) return false; active.add(key); return true; },
    release(key) { active.delete(key); },
    isBusy(key) { return active.has(key); },
    size() { return active.size; },
  };
}
