// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, act, within } from '@testing-library/react';

const unsub = vi.fn();
let push: (l: any[]) => void = () => {};
const clearAllLive = vi.fn(async () => 3);
const updateCompetitionSchedule = vi.fn();
vi.mock('../../src/lib/liveStore', () => ({
  watchLive: (cb: (l: any[]) => void) => { push = cb; return unsub; },
  clearAllLive: () => clearAllLive(),
}));
vi.mock('../../src/context/AppContext', () => ({
  useApp: () => ({ competitionSchedule: { mode: 'open' }, updateCompetitionSchedule, isCompetitionCurrentlyOpen: true }),
}));
import { LiveCompetitionMonitor } from '../../src/components/LiveCompetitionMonitor';

afterEach(cleanup);
const now = Date.now();
const mk = (o: any) => ({ userId: 'u', name: 'N', school: 'S', aimag: 'A', grade: '9', status: 'in_progress', total: 10, answered: 4, correct: 3, score: 50, maxScore: 150, elapsedMs: 30000, startedAt: now - 60000, updatedAt: now - 3000, ...o });
const data = [
  mk({ userId: '1', name: 'Бат', score: 90, grade: '9' }),
  mk({ userId: '2', name: 'Дорж', score: 140, grade: '12', status: 'finished', answered: 10, elapsedMs: 120000 }),
  mk({ userId: '3', name: 'Сараа', score: 140, grade: '12', status: 'finished', answered: 10, elapsedMs: 100000 }),
  mk({ userId: '4', name: 'Болд', score: 20, grade: 'teacher', updatedAt: now - 5 * 60_000 }),
];

describe('Уралдааны шууд хяналт (админ)', () => {
  it('Өгөгдөл шууд ирэхэд тоо, эрэмбэ, төлөв зөв харагдана', () => {
    render(<LiveCompetitionMonitor />);
    expect(screen.getByText(/уралдаанд оролцож буй хүн алга/)).toBeTruthy();
    act(() => push(data));
    expect(screen.getByText(/Шууд холбогдсон/)).toBeTruthy();
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.length).toBe(4);
    // Эрэмбэ: 140 (100сек, Сараа) → 140 (120сек, Дорж) → 90 → 20
    expect(rows.map((r) => within(r).getAllByRole('cell')[1].textContent)).toEqual(['Сараа', 'Дорж', 'Бат', 'Болд']);
    expect(within(rows[3]).getByText('Хөдөлгөөнгүй')).toBeTruthy(); // 5 минут шинэчлэгдээгүй
    expect(within(rows[0]).getByText('Дууссан')).toBeTruthy();
    expect(within(rows[2]).getByText('Явж байна')).toBeTruthy();
  });

  it('Шинэ явц ирэхэд жагсаалт шууд шинэчлэгдэнэ (оноо өсөхөд байр солигдоно)', () => {
    render(<LiveCompetitionMonitor />);
    act(() => push(data));
    act(() => push(data.map((d) => (d.userId === '1' ? { ...d, score: 200, answered: 5 } : d))));
    const first = screen.getAllByRole('row')[1];
    expect(within(first).getAllByRole('cell')[1].textContent).toBe('Бат');
  });

  it('Ангилалаар шүүнэ', () => {
    render(<LiveCompetitionMonitor />);
    act(() => push(data));
    fireEvent.click(screen.getByRole('button', { name: /12-р анги \(2\)/ }));
    expect(screen.getAllByRole('row').slice(1).length).toBe(2);
  });

  it('"Дэлгэцэд гаргах" нь том шилдэг самбарыг нээж, хаах боломжтой', () => {
    render(<LiveCompetitionMonitor />);
    act(() => push(data));
    fireEvent.click(screen.getByRole('button', { name: /Дэлгэцэд гаргах/ }));
    const p = screen.getByTestId('projector');
    expect(within(p).getByText('Сараа')).toBeTruthy();
    expect(within(p).getByText('12-р анги')).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/Дэлгэцийн горимоос гарах/));
    expect(screen.queryByTestId('projector')).toBeNull();
  });

  it('Уралдааныг шууд хаах, явцыг цэвэрлэх', async () => {
    render(<LiveCompetitionMonitor />);
    act(() => push(data));
    fireEvent.click(screen.getByRole('button', { name: /Уралдааныг хаах/ }));
    expect(updateCompetitionSchedule).toHaveBeenCalledWith({ mode: 'closed' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Цэвэрлэх/ })); });
    expect(clearAllLive).toHaveBeenCalledTimes(1);
  });

  it('Таб хаагдахад шууд сонсогч зогсоно (Firestore-ийн унших квот хэмнэнэ)', () => {
    unsub.mockClear();
    const { unmount } = render(<LiveCompetitionMonitor />);
    unmount();
    expect(unsub).toHaveBeenCalledTimes(1);
  });
});

import { IntegrityBadge } from '../../src/components/IntegrityBadge';
describe('Цонх солилт: админд харагдах байдал', () => {
  it('Шууд хяналт: одоо цонхоос гарсан оролцогч улаанаар тодорч, шилжсэн тоо/хугацаа харагдана', () => {
    render(<LiveCompetitionMonitor />);
    act(() => push([
      mk({ userId: '1', name: 'Бат', leaves: 0 }),
      mk({ userId: '2', name: 'Дорж', leaves: 3, awayMs: 95_000, away: true }),
      mk({ userId: '3', name: 'Сараа', leaves: 1, awayMs: 8_000, away: false }),
    ]));
    const row = (n: string) => screen.getAllByRole('row').find((r) => r.textContent?.includes(n))!;
    expect(within(row('Дорж')).getByText('⚠ Цонхоос гарсан')).toBeTruthy();
    expect(within(row('Дорж')).getByText('3× · 1:35')).toBeTruthy();
    expect(within(row('Сараа')).getByText('1× · 0:08')).toBeTruthy();
    expect(within(row('Сараа')).queryByText('⚠ Цонхоос гарсан')).toBeNull();
    expect(screen.getByText('Одоо цонхоос гарсан').nextSibling!.textContent).toBe('1');
    expect(screen.getByText('Цонх сольсон хүн').nextSibling!.textContent).toBe('2');
  });

  it('Оролдлогын бүртгэл: цонх сольсон, дуусгасан, хориглосон оролдлогыг харуулна', () => {
    const { container } = render(<IntegrityBadge report={{ windowLeaves: 2, awayMs: 70_000, fullscreenUsed: true, blockedActions: 4, terminated: true, terminatedReason: 'limit', events: [{ at: 1_000_000, ms: 60_000, kinds: ['hidden', 'blur'], question: 2 }, { at: 2_000_000, ms: 0, kinds: ['fullscreen_exit'], question: 5 }] }} />);
    expect(screen.getByText(/Цонх сольсон: 2× \(1:10\)/)).toBeTruthy();
    expect(screen.getByText(/Дээд тоо хэтэрч дууссан/)).toBeTruthy();
    expect(screen.getByText(/4 хориглосон оролдлого/)).toBeTruthy();
    expect(container.querySelector('[title*="3-р асуулт"]')).toBeTruthy(); // хулганы заагчаар үйл явдал бүрийг харна
    cleanup();
    render(<IntegrityBadge report={{ windowLeaves: 0, awayMs: 0, fullscreenUsed: true, blockedActions: 0, terminated: false, events: [] }} />);
    expect(screen.getByText('🖥 Цонх сольсонгүй')).toBeTruthy();
    cleanup();
    render(<IntegrityBadge report={undefined} />);
    expect(screen.getByText('Цонхны бүртгэл алга')).toBeTruthy();
  });
});
