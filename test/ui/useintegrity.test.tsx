// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cleanup, render, screen, act } from '@testing-library/react';
import { useIntegrity } from '../../src/lib/useIntegrity';

const onLimit = vi.fn();
const onLeave = vi.fn();
let api: ReturnType<typeof useIntegrity>;
const Probe: React.FC<{ active: boolean; max?: number; q?: number }> = ({ active, max = 0, q = 0 }) => {
  api = useIntegrity({ active, question: q, maxLeaves: max, onLimit, onLeave });
  return <div data-testid="s">{`${api.leaves}|${api.isAway ? 'away' : 'here'}|${api.fullscreen ? 'fs' : 'win'}`}</div>;
};
const state = () => screen.getByTestId('s').textContent;
const setHidden = (h: boolean) => { Object.defineProperty(document, 'hidden', { value: h, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); };
let clock = 1_000_000;

beforeEach(() => { onLimit.mockClear(); onLeave.mockClear(); vi.spyOn(Date, 'now').mockImplementation(() => clock); setHidden(false); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Цонх солилтыг илрүүлэх (браузерын бодит үйл явдлаар)', () => {
  it('Таб солиход "гарсан" төлөв, буцаж ирэхэд 1 удаа бүртгэгдэнэ', () => {
    render(<Probe active q={3} />);
    expect(state()).toBe('0|here|win');
    act(() => { clock += 1000; setHidden(true); window.dispatchEvent(new Event('blur')); });
    expect(state()).toBe('0|away|win'); // тоо буцаж ирэхэд л нэмэгдэнэ
    act(() => { clock += 4000; setHidden(false); window.dispatchEvent(new Event('focus')); });
    expect(state()).toBe('1|here|win');
    expect(onLeave).toHaveBeenCalledTimes(1);
    const [ev, count] = onLeave.mock.calls[0];
    expect(count).toBe(1);
    expect(ev.ms).toBe(4000);
    expect(ev.question).toBe(3);
    expect(api.awayMs).toBe(4000);
  });

  it('Богино фокус алдалт тоологдохгүй, удаан нь тоологдоно', () => {
    render(<Probe active />);
    act(() => { window.dispatchEvent(new Event('blur')); clock += 200; window.dispatchEvent(new Event('focus')); });
    expect(state()).toBe('0|here|win');
    act(() => { window.dispatchEvent(new Event('blur')); clock += 2500; window.dispatchEvent(new Event('focus')); });
    expect(state()).toBe('1|here|win');
  });

  it('Уралдаан идэвхгүй (эхлээгүй/дууссан) үед юу ч бүртгэхгүй', () => {
    const { rerender } = render(<Probe active={false} />);
    act(() => { setHidden(true); clock += 5000; setHidden(false); });
    expect(state()).toBe('0|here|win');
    rerender(<Probe active />);
    act(() => { setHidden(true); clock += 5000; setHidden(false); });
    expect(state()).toBe('1|here|win');
    rerender(<Probe active={false} />); // дуусав
    act(() => { setHidden(true); clock += 5000; setHidden(false); });
    expect(api.tracker.report().windowLeaves).toBe(1); // дараах шилжилт нэмэгдээгүй
  });

  it('Дээд тоо хэтэрвэл нэг удаа onLimit дуудагдана (3 удаа зөвшөөрөгдсөн бол 4 дэх нь)', () => {
    render(<Probe active max={3} />);
    const leave = () => act(() => { setHidden(true); clock += 1500; setHidden(false); });
    leave(); leave(); leave();
    expect(onLimit).not.toHaveBeenCalled();
    leave();
    expect(onLimit).toHaveBeenCalledTimes(1);
    leave();
    expect(onLimit).toHaveBeenCalledTimes(1); // давхар дуудагдахгүй
  });

  it('0 бол хязгааргүй: зөвхөн бүртгэнэ', () => {
    render(<Probe active max={0} />);
    for (let i = 0; i < 6; i++) act(() => { setHidden(true); clock += 1500; setHidden(false); });
    expect(state()).toBe('6|here|win');
    expect(onLimit).not.toHaveBeenCalled();
  });

  it('Хуулах, буулгах, баруун товшилт, Ctrl+P-ийг хаана, оролдлогыг бүртгэнэ', () => {
    render(<Probe active />);
    const results = [
      new Event('copy', { cancelable: true }), new Event('paste', { cancelable: true }), new Event('contextmenu', { cancelable: true }),
      new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, cancelable: true }), new KeyboardEvent('keydown', { key: 'F12', cancelable: true }),
    ];
    results.forEach((e) => act(() => { document.dispatchEvent(e); }));
    expect(results.every((e) => e.defaultPrevented)).toBe(true);
    const plain = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    act(() => { document.dispatchEvent(plain); });
    expect(plain.defaultPrevented).toBe(false); // энгийн товч хаагдахгүй
    expect(api.tracker.report().blockedActions).toBe(5);
  });

  it('Бүтэн дэлгэцэд орж, Esc-ээр гарвал бүртгэгдэнэ', async () => {
    let fsEl: any = null;
    Object.defineProperty(document, 'fullscreenElement', { get: () => fsEl, configurable: true });
    (document.documentElement as any).requestFullscreen = vi.fn(async () => { fsEl = document.documentElement; document.dispatchEvent(new Event('fullscreenchange')); });
    (document as any).exitFullscreen = vi.fn(async () => { fsEl = null; });
    render(<Probe active />);
    await act(async () => { expect(await api.enterFullscreen()).toBe(true); });
    expect(state()).toBe('0|here|fs');
    act(() => { fsEl = null; document.dispatchEvent(new Event('fullscreenchange')); }); // хэрэглэгч Esc дарав
    expect(state()).toBe('1|here|win');
    expect(onLeave.mock.calls[0][0].kinds).toEqual(['fullscreen_exit']);
  });

  it('Бүтэн дэлгэц дэмжигдэхгүй төхөөрөмж (утас) дээр алдаагүй', async () => {
    (document.documentElement as any).requestFullscreen = undefined;
    render(<Probe active />);
    await act(async () => { expect(await api.enterFullscreen()).toBe(false); });
    expect(state()).toBe('0|here|win');
  });
});
