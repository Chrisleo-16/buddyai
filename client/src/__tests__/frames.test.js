import { describe, it, expect } from 'vitest';
import { fitWithin, frameDiff, toGray, createInFlight, adaptiveIntervalMs, softTimeout } from '../lib/frames.js';

describe('fitWithin (downscale)', () => {
  it('scales a 1280x720 frame to 640 on the long edge', () => { expect(fitWithin(1280, 720, 640)).toMatchObject({ width: 640, height: 360 }); });
  it('handles portrait', () => { expect(fitWithin(720, 1280, 640)).toMatchObject({ width: 360, height: 640 }); });
  it('never upscales', () => { expect(fitWithin(320, 240, 640)).toMatchObject({ width: 320, height: 240, scale: 1 }); });
  it('handles a missing video size', () => { expect(fitWithin(0, 0)).toMatchObject({ width: 0, height: 0 }); });
});

describe('frameDiff', () => {
  it('is 0 for identical and 1 for black vs white', () => {
    const a = new Uint8Array(16).fill(10);
    expect(frameDiff(a, a.slice())).toBe(0);
    expect(frameDiff(new Uint8Array(4), new Uint8Array(4).fill(255))).toBe(1);
  });
  it('treats missing or mismatched thumbs as changed', () => { expect(frameDiff(null, new Uint8Array(4))).toBe(1); expect(frameDiff(new Uint8Array(2), new Uint8Array(4))).toBe(1); });
  it('grayscales RGBA', () => { expect([...toGray(new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]))]).toEqual([255, 0]); });
});

describe('createInFlight', () => {
  it('allows only one call at a time and frees after settle', async () => {
    const g = createInFlight();
    let release; let calls = 0;
    const p1 = g.run(() => { calls++; return new Promise((r) => { release = r; }); });
    expect(p1).not.toBeNull();
    await Promise.resolve();
    expect(g.busy).toBe(true);
    expect(g.run(() => { calls++; })).toBeNull();
    release('done');
    await expect(p1).resolves.toBe('done');
    expect(g.busy).toBe(false);
    await g.run(() => { calls++; });
    expect(calls).toBe(2);
  });
  it('frees after a rejection', async () => {
    const g = createInFlight();
    await expect(g.run(() => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(g.busy).toBe(false);
  });
});

describe('adaptive interval + soft timeout', () => {
  it('uses the pref until latency dominates, capped at 30s', () => {
    expect(adaptiveIntervalMs(6, 0)).toBe(6000);
    expect(adaptiveIntervalMs(6, 2000)).toBe(6000);
    expect(adaptiveIntervalMs(6, 8000)).toBe(12000);
    expect(adaptiveIntervalMs(6, 60000)).toBe(30000);
  });
  it('returns the fallback when slow but lets the work finish', async () => {
    let done = false;
    const work = new Promise((r) => setTimeout(() => { done = true; r('late'); }, 30));
    expect(await softTimeout(work, 5, 'slow')).toBe('slow');
    expect(await work).toBe('late'); expect(done).toBe(true);
  });
});
