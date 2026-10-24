import { describe, it, expect } from 'vitest';
import { createInFlightGuard } from '../src/services/inflight.js';
import { CheckResult, parseWith } from '../src/services/gemmaSchema.js';
import { checkPrompt } from '../src/services/prompts.js';
import { demoCheck } from '../src/services/demoGemma.js';

describe('in-flight guard', () => {
  it('allows one check per session and frees on release', () => {
    const g = createInFlightGuard();
    expect(g.tryAcquire('s1')).toBe(true);
    expect(g.tryAcquire('s1')).toBe(false);
    expect(g.tryAcquire('s2')).toBe(true);
    g.release('s1');
    expect(g.isBusy('s1')).toBe(false);
    expect(g.tryAcquire('s1')).toBe(true);
  });
});

describe('compact check shape', () => {
  it('expands {i,s,en,sw,f} into the full CheckResult', () => {
    const r = parseWith(CheckResult, '```json\n{"i":[{"n":"outer gloves","ok":false,"x":"tear"}],"s":false,"en":"Pause.","sw":"Simama.","f":["glove_tear"]}\n```');
    expect(r).toMatchObject({ step_ok: false, feedback_en: 'Pause.', risk_flags: ['glove_tear'], items: [{ name: 'outer gloves', present: true, correct: false, issue: 'tear' }] });
  });
  it('still accepts the full shape', () => {
    expect(parseWith(CheckResult, '{"items":[],"step_ok":true,"feedback_en":"a","feedback_sw":"b","risk_flags":[]}').step_ok).toBe(true);
  });
  it('prompt only lists the current step items', () => {
    const p = checkPrompt({ protocol: { kind: 'doffing' }, step: { order: 2, title: { en: 'Inspect PPE' }, instruction: { en: 'Look.' }, expectedItems: ['outer gloves'] } });
    expect(p).toContain('Check only: outer gloves');
    expect(p.length).toBeLessThan(600);
  });
  it('demo responses are valid CheckResults', () => {
    const step = { order: 2, critical: true, title: { en: 'Inspect PPE', sw: 'Kagua' }, expectedItems: ['gown or coverall', 'outer gloves'] };
    expect(() => CheckResult.parse(demoCheck(step))).not.toThrow();
    expect(() => CheckResult.parse(demoCheck(step))).not.toThrow();
  });
});
