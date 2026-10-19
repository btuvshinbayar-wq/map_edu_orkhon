// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';

const saveAttempt = vi.fn((a: any) => ({ ...a, id: 'att1', certificateNumber: 'C-1' }));
const reportLive = vi.fn();
let ctx: any;
vi.mock('../../src/context/AppContext', () => ({ useApp: () => ctx }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('../../src/utils/audio', () => ({ sound: new Proxy({}, { get: () => () => undefined }) }));

import { CompetitionModal } from '../../src/components/CompetitionModal';
import { generateComprehensiveGisQuestions } from '../../src/utils/gisAutoQuestionGenerator';

HTMLCanvasElement.prototype.getContext = (() =>
  new Proxy({}, { get: (_t, p) => (p === 'measureText' ? () => ({ width: 0 }) : () => undefined), set: () => true })) as any;

const ring = (cx: number, cy: number, r: number) => { const pts = Array.from({ length: 16 }, (_, k) => [cx + r * Math.cos((k / 16) * 6.283), cy + r * Math.sin((k / 16) * 6.283)]); pts.push(pts[0]); return pts; };
const lakes = Array.from({ length: 8 }, (_, i) => ({ type: 'Feature', properties: { name_mn: `Нуур ${i}` }, geometry: { type: 'Polygon', coordinates: [ring(95 + i * 1.2, 45 + (i % 3) * 0.6, 0.25 + i * 0.02)] } }));
const layer: any = { id: 'lk', name: 'Нуур', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Polygon', featureCount: 8, nameField: 'name_mn', createdAt: '', geojson: { type: 'FeatureCollection', features: lakes } };
const two = (generateComprehensiveGisQuestions({ layers: [layer], enabledTypes: ['contour_shape'], gradeLevels: ['9'], pointsPerQuestion: 10 } as any) as any[]).slice(0, 2);

const correctText = (q: any) => q.options.find((o: any) => o.isCorrect).text;
// Дэлгэц дээр яг ямар даалгавар харагдаж байгааг сонголтуудын олонлогоор тодорхойлно
const displayed = (): any => {
  const texts = [...document.querySelectorAll('button')].map((b) => (b.textContent || '').trim());
  return two.find((q) => q.options.every((o: any) => texts.includes(o.text)) && q.options.length === q.options.filter((o: any) => texts.includes(o.text)).length);
};
const clickCorrect = (q: any) => fireEvent.click([...document.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === correctText(q))!);
const t0 = new Date('2026-10-20T10:00:00Z').getTime();
const startBtn = () => screen.getByRole('button', { name: /Уралдааныг эхлүүлэх/ });
const setHidden = (h: boolean) => { Object.defineProperty(document, 'hidden', { value: h, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); };
const openAndStart = async (extra: any = {}) => {
  Object.assign(ctx.competitionSchedule, extra);
  render(<CompetitionModal isOpen onClose={() => {}} overrideGrade={'9' as any} onOpenAuth={() => {}} />);
  await act(async () => { fireEvent.click(startBtn()); });
};
const finishBtn = () => [...document.querySelectorAll('button')].find((b) => /Дараагийн|дуусгах|Үр дүн/i.test(b.textContent || ''));

describe('Уралдаан: хурдан зөв хариулсан нь өндөр оноо, шууд хяналтад явц мэдээлнэ', () => {
  beforeEach(() => {
    saveAttempt.mockClear(); reportLive.mockClear();
    ctx = {
      currentUser: { id: 'u1', fullName: 'Бат', role: 'student', status: 'approved', isCompetitionConfirmed: true, grade: '9', school: 'S1', aimag: 'A1', studentCode: 'X' },
      saveAttempt, customQuestions: two, recordTaskAttempt: vi.fn(), isCompetitionCurrentlyOpen: true,
      competitionSchedule: { mode: 'open', secondsPerQuestion: 30, speedBonusPercent: 50 }, reportLive,
    };
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(t0);
  });
  afterEach(() => { vi.useRealTimers(); cleanup(); });

  it('Тэр даруй хариулсан нь 15, 25 секундэд хариулсан нь 10-12 оноо авч, нийт хугацаа болон бодит эхлэх цаг хадгалагдана', async () => {
    await openAndStart();
    const order = () => [...document.querySelectorAll('button')];
    const nextBtn = () => order().find((b) => /Дараагийн|дуусгах|Үр дүн/i.test(b.textContent || ''));
    // Эхний асуулт: 1 секундэд зөв хариулна
    const q1 = displayed();
    vi.setSystemTime(t0 + 1000);
    await act(async () => { clickCorrect(q1); });
    expect(nextBtn()).toBeTruthy();
    vi.setSystemTime(t0 + 2000);
    await act(async () => { fireEvent.click(nextBtn()!); });
    // Хоёр дахь асуулт: 25 секундэд зөв хариулна
    const q2 = displayed();
    expect(q2.id).not.toBe(q1.id);
    vi.setSystemTime(t0 + 2000 + 25000);
    await act(async () => { clickCorrect(q2); });
    await act(async () => { fireEvent.click(nextBtn()!); });

    expect(saveAttempt).toHaveBeenCalledTimes(1);
    const a = saveAttempt.mock.calls[0][0];
    const [r1, r2] = a.answers;
    expect(r1.isCorrect && r2.isCorrect).toBe(true);
    expect(r1.pointsEarned).toBe(15); // ≈1 сек: 10 × (1 + 0.5 × 29/30) = 14.8 → 15
    expect(r2.pointsEarned).toBe(11); // 25 сек: 10 × (1 + 0.5 × 5/30) = 10.8 → 11
    expect(r1.pointsEarned).toBeGreaterThan(r2.pointsEarned);
    expect(a.totalScore).toBe(26);
    expect(a.maxScore).toBe(30); // 2 × 15 (тэр даруй хариулсан тохиолдлын дээд оноо)
    expect(a.totalTimeMs).toBe(r1.timeTakenMs + r2.timeTakenMs);
    expect(a.totalTimeMs).toBeGreaterThanOrEqual(25000);
    expect(new Date(a.startedAt).getTime()).toBe(t0); // бодит эхэлсэн цаг (өмнө нь "5 минутын өмнө" гэж зохиомол байсан)
  });

  it('Админы шууд хяналтад эхлэх → асуулт бүр → дууссан гэж мэдээлнэ', async () => {
    render(<CompetitionModal isOpen onClose={() => {}} overrideGrade={'9' as any} onOpenAuth={() => {}} />);
    expect(reportLive).not.toHaveBeenCalled(); // эхлэхээс өмнө (дүрмийн дэлгэц) шууд хяналтад ороогүй
    await act(async () => { fireEvent.click(startBtn()); });
    const first = reportLive.mock.calls[0][0];
    expect(first).toMatchObject({ grade: '9', status: 'in_progress', answered: 0, total: 2, score: 0 });
    await act(async () => { clickCorrect(displayed()); });
    const afterOne = reportLive.mock.calls.at(-1)![0];
    expect(afterOne).toMatchObject({ status: 'in_progress', answered: 1, correct: 1 });
    expect(afterOne.score).toBeGreaterThanOrEqual(10);
    await act(async () => { fireEvent.click(finishBtn()!); });
    await act(async () => { clickCorrect(displayed()); });
    await act(async () => { fireEvent.click(finishBtn()!); });
    expect(reportLive.mock.calls.at(-1)![0]).toMatchObject({ status: 'finished', answered: 2, correct: 2 });
  });

  it('Эхлэх дэлгэц: дүрэм харагдаж, "Эхлэх" дармагц л хугацаа ба шууд хяналт эхэлнэ', async () => {
    ctx.competitionSchedule.maxWindowLeaves = 3;
    render(<CompetitionModal isOpen onClose={() => {}} overrideGrade={'9' as any} onOpenAuth={() => {}} />);
    const intro = screen.getByTestId('intro');
    expect(intro.textContent).toMatch(/2 даалгавар/);
    expect(intro.textContent).toMatch(/бүтэн дэлгэцээр/);
    expect(intro.textContent).toMatch(/3 удаагаас илүү сольвол уралдаан автоматаар дуусна/);
    vi.setSystemTime(t0 + 60_000); // нэг минут завсарлав: хугацаа явахгүй
    expect(document.querySelectorAll('[data-testid="integrity-chip"]').length).toBe(0);
    await act(async () => { fireEvent.click(startBtn()); });
    expect(screen.queryByTestId('intro')).toBeNull();
    expect(screen.getByTestId('integrity-chip').textContent).toMatch(/Цонх сольсон: 0 \/ 3/);
    expect(reportLive.mock.calls[0][0]).toMatchObject({ status: 'in_progress', answered: 0, leaves: 0, away: false });
  });

  it('Цонх сольбол бүртгэгдэж, оролцогч анхааруулга авч, админы хяналтад шууд харагдаж, нэг үр дүнд хадгалагдана', async () => {
    await openAndStart();
    reportLive.mockClear();
    await act(async () => { setHidden(true); window.dispatchEvent(new Event('blur')); });
    expect(reportLive.mock.calls.at(-1)![0]).toMatchObject({ away: true }); // ОДОО гарсан: админд шууд харагдана
    vi.setSystemTime(t0 + 6000);
    await act(async () => { setHidden(false); window.dispatchEvent(new Event('focus')); });
    expect(screen.getByRole('alert').textContent).toMatch(/Та цонхоос гарсан тул бүртгэгдлээ/);
    expect(screen.getByTestId('integrity-chip').textContent).toMatch(/Цонх сольсон: 1/);
    expect(reportLive.mock.calls.at(-1)![0]).toMatchObject({ away: false, leaves: 1, awayMs: 6000 });

    // Уралдааныг дуустал хийнэ
    for (let i = 0; i < 2; i++) {
      await act(async () => { clickCorrect(displayed()); });
      await act(async () => { fireEvent.click(finishBtn()!); });
    }
    const a = saveAttempt.mock.calls[0][0];
    expect(a.integrity).toMatchObject({ windowLeaves: 1, awayMs: 6000, terminated: false });
    expect(a.integrity.events[0]).toMatchObject({ ms: 6000, question: 0 });
    expect(a.integrity.events[0].kinds).toContain('hidden');
  });

  it('Цонх сольж болох дээд тоо хэтэрвэл уралдаан автоматаар дуусч, "дуусгасан" гэж бүртгэгдэнэ', async () => {
    await openAndStart({ maxWindowLeaves: 1 });
    const leave = async () => { await act(async () => { setHidden(true); }); vi.setSystemTime(Date.now() + 3000); await act(async () => { setHidden(false); }); };
    await leave();
    expect(saveAttempt).not.toHaveBeenCalled(); // 1 удаа зөвшөөрөгдсөн
    await leave();
    expect(saveAttempt).toHaveBeenCalledTimes(1); // 2 дахь нь хэтэрсэн
    const a = saveAttempt.mock.calls[0][0];
    expect(a.integrity).toMatchObject({ windowLeaves: 2, terminated: true, terminatedReason: 'limit' });
    expect(a.answers.length).toBe(0);
  });

  it('Уралдааны явцад "гарах" дарвал баталгаажуулж, батлавал оролдлого дуусна; цуцалбал үргэлжилнэ', async () => {
    await openAndStart();
    await act(async () => { clickCorrect(displayed()); });
    const exit = screen.getByLabelText('Уралдаанаас гарах');
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await act(async () => { fireEvent.click(exit); });
    expect(saveAttempt).not.toHaveBeenCalled(); // цуцалсан
    confirmSpy.mockReturnValue(true);
    await act(async () => { fireEvent.click(exit); });
    expect(saveAttempt).toHaveBeenCalledTimes(1);
    const a = saveAttempt.mock.calls[0][0];
    expect(a.answers.length).toBe(1); // хариулсан хэсгийн оноо л
    expect(a.integrity).toMatchObject({ terminated: true, terminatedReason: 'abandoned' });
  });

  it('Өөр цонхонд байх үед тоолуур ЗОГСОХГҮЙ: бодит цагаар тооцогдож, хугацаа дуусвал асуулт 0 оноотой өнгөрнө', async () => {
    await openAndStart();
    // 40 секундийн турш өөр цонхонд байлаа (хөтөч setInterval-ийг удаашруулсан ч бодит цаг явна). Хязгаар нь 30 сек
    await act(async () => { setHidden(true); });
    vi.setSystemTime(t0 + 40_000);
    await act(async () => { setHidden(false); window.dispatchEvent(new Event('focus')); await new Promise((r) => setTimeout(r, 900)); });
    await act(async () => { fireEvent.click(finishBtn()!); });
    await act(async () => { clickCorrect(displayed()); });
    await act(async () => { fireEvent.click(finishBtn()!); });
    const a = saveAttempt.mock.calls[0][0];
    expect(a.answers[0]).toMatchObject({ isCorrect: false, pointsEarned: 0, timeTakenMs: 30000 }); // хугацаа дууссан
    expect(a.answers[1].isCorrect).toBe(true);
    expect(a.integrity.windowLeaves).toBe(1);
  });
});

describe('Асуултын тоо, хугацааг админ тохируулна', () => {
  beforeEach(() => {
    saveAttempt.mockClear(); reportLive.mockClear();
    ctx = {
      currentUser: { id: 'u1', fullName: 'Бат', role: 'student', status: 'approved', isCompetitionConfirmed: true, grade: '9', school: 'S1', aimag: 'A1', studentCode: 'X' },
      saveAttempt, customQuestions: two, recordTaskAttempt: vi.fn(), isCompetitionCurrentlyOpen: true, reportLive,
      competitionSchedule: { mode: 'open', questionsPerAttempt: 5, secondsPerQuestion: 45, speedBonusPercent: 50, categorySettings: { '9': { questionCount: 1, secondsPerQuestion: 20 } } },
    };
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(t0);
  });
  afterEach(() => { vi.useRealTimers(); cleanup(); });

  it('Ангилалын тусгай тохиргоо: 2 даалгавартай ч 1-ийг л өгч, дүрмийн дэлгэц тэр тоо, хугацааг харуулна', async () => {
    render(<CompetitionModal isOpen onClose={() => {}} overrideGrade={'9' as any} onOpenAuth={() => {}} />);
    const intro = screen.getByTestId('intro').textContent!;
    expect(intro).toMatch(/1 даалгавар/);
    expect(intro).toMatch(/20 секунд/);
    expect(intro).toMatch(/нийт ойролцоогоор 20 сек/);
    await act(async () => { fireEvent.click(startBtn()); });
    vi.setSystemTime(t0 + 5000); // 5 секундэд зөв хариулав
    await act(async () => { clickCorrect(displayed()); });
    await act(async () => { fireEvent.click(finishBtn()!); }); // 1 асуулттай тул шууд дуусна
    expect(saveAttempt).toHaveBeenCalledTimes(1);
    const a = saveAttempt.mock.calls[0][0];
    expect(a.answers.length).toBe(1);
    // 20 секундийн хязгаартай: 10 × (1 + 0.5 × 15/20) = 13.75 → 14 (30 секундийн нийтийн дүрмээр бол 14.2 → 14 биш 12.5 шиг байхгүй)
    expect(a.answers[0].pointsEarned).toBe(14);
    expect(a.maxScore).toBe(15);
  });

  it('Тусгай тохиргоогүй ангилал нийтийн утгыг дагана (энд нийтийн 5 асуулт, 2 даалгавар л бэлэн тул 2-ыг өгнө)', async () => {
    ctx.currentUser.grade = '12';
    ctx.customQuestions = two.map((q) => ({ ...q, gradeLevels: ['12'] }));
    render(<CompetitionModal isOpen onClose={() => {}} overrideGrade={'12' as any} onOpenAuth={() => {}} />);
    const intro = screen.getByTestId('intro').textContent!;
    expect(intro).toMatch(/2 даалгавар/);
    expect(intro).toMatch(/45 секунд/);
  });

  it('Уралдаан эхэлсний дараа админ тохиргоог өөрчилсөн ч энэ оролцогчийн дүрэм түгжигдсэн хэвээр', async () => {
    render(<CompetitionModal isOpen onClose={() => {}} overrideGrade={'9' as any} onOpenAuth={() => {}} />);
    await act(async () => { fireEvent.click(startBtn()); });
    // Админ явцад хугацааг 5 секунд болгов
    ctx.competitionSchedule = { ...ctx.competitionSchedule, categorySettings: { '9': { questionCount: 2, secondsPerQuestion: 5 } } };
    vi.setSystemTime(t0 + 10_000); // 10 сек: 5 секундийн шинэ дүрмээр бол цаг дууссан байх, харин түгжигдсэн 20 сек-ээр үргэлжилнэ
    await act(async () => { clickCorrect(displayed()); });
    await act(async () => { fireEvent.click(finishBtn()!); });
    const a = saveAttempt.mock.calls[0][0];
    expect(a.answers.length).toBe(1); // 2 биш 1 асуулт (түгжигдсэн)
    expect(a.answers[0].isCorrect).toBe(true);
    expect(a.answers[0].pointsEarned).toBe(13); // 10 × (1 + 0.5 × 10/20) = 12.5 → 13 (20 секундийн түгжигдсэн дүрмээр)
  });
});
