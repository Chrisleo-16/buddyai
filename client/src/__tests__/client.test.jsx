import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { mergeItems } from '../components/Checklist.jsx';
import { Meter, EmptyState } from '../components/ui.jsx';
import { translate } from '../i18n/index.js';
import { strings } from '../i18n/strings.js';

const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));

describe('mergeItems', () => {
  it('marks expected items unknown until detected and maps detection status', () => {
    const r = mergeItems(['Gown', 'Outer gloves', 'PAPR'], [
      { name: 'gown', present: true, correct: true },
      { name: 'Outer gloves', present: false, correct: false, issue: 'not visible' },
      { name: 'Boot covers', present: true, correct: false },
    ]);
    expect(r.map((i) => [i.name, i.status])).toEqual([['Gown', 'ok'], ['Outer gloves', 'missing'], ['PAPR', 'unknown'], ['Boot covers', 'incorrect']]);
  });
});

describe('Meter', () => {
  it('fills ticks proportionally and exposes a11y value', () => {
    render(<Meter value={50} ticks={10} label="Risk" />);
    const m = screen.getByRole('meter', { name: 'Risk' });
    expect(m.getAttribute('aria-valuenow')).toBe('50');
    expect(m.querySelectorAll('.bg-warn')).toHaveLength(5);
  });
});

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No sessions" description="Start one" />);
    expect(screen.getByText('No sessions')).toBeTruthy();
    expect(screen.getByText('Start one')).toBeTruthy();
  });
});

describe('i18n', () => {
  it('Kiswahili covers every English key', () => {
    const sw = new Set(keys(strings.sw));
    expect(keys(strings.en).filter((k) => !sw.has(k))).toEqual([]);
  });
  it('falls back to English then key', () => {
    expect(translate('sw', 'nope.key')).toBe('nope.key');
  });
});
