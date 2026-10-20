// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';

let ctx: any;
const updateCompetitionSchedule = vi.fn();
vi.mock('../../src/context/AppContext', () => ({ useApp: () => ctx }));
vi.mock('../../src/utils/documentExport', () => ({ exportToDocx: vi.fn(), exportToPdf: vi.fn() }));
import { CompetitionRulesEditor } from '../../src/components/CompetitionRulesEditor';
import { buildCompetitionGuidelinesHtml } from '../../src/components/CompetitionGuidelinesModal';

afterEach(cleanup);
const q = (grades: string[], n: number) => Array.from({ length: n }, (_, i) => ({ id: `${grades.join('')}${i}`, gradeLevels: grades }));
beforeEach(() => {
  updateCompetitionSchedule.mockClear();
  ctx = {
    competitionSchedule: { mode: 'open', questionsPerAttempt: 10, secondsPerQuestion: 30, speedBonusPercent: 50, categorySettings: { teacher: { questionCount: 20, secondsPerQuestion: 60 } } },
    updateCompetitionSchedule,
    customQuestions: [...q(['9', '12'], 6), ...q(['teacher'], 25)],
  };
});

describe('Админ: уралдааны асуултын тоо, хугацааны тохиргоо', () => {
  it('Ангилал бүрийн бэлэн даалгавар, асуултын тоо, хугацаа, нийт хугацааг харуулж, хүрэлцэхгүйг анхааруулна', () => {
    render(<CompetitionRulesEditor />);
    const r9 = screen.getByTestId('rules-row-9');
    expect(within(r9).getByText(/зөвхөн 6-ийг өгнө/)).toBeTruthy(); // 10 асуулт тохируулсан ч 6 л бэлэн
    expect(r9.textContent).toMatch(/10\s*×\s*30 сек ≈\s*3 мин/); // 6 даалгавар × 30 сек = 3 мин
    const rt = screen.getByTestId('rules-row-teacher');
    expect(within(rt).queryByText(/өгнө/)).toBeNull(); // 25 бэлэн ≥ 20
    expect(rt.textContent).toMatch(/20\s*×\s*60 сек ≈\s*20 мин/);
    expect(within(screen.getByTestId('rules-row-team')).getByText('даалгавар сонгоогүй')).toBeTruthy();
    expect((within(rt).getByLabelText('Багш: асуултын тоо') as HTMLInputElement).value).toBe('20');
    expect((within(r9).getByLabelText('9-р анги: асуултын тоо') as HTMLInputElement).placeholder).toBe('10'); // нийтийн утга
  });

  it('Нийтийн утгыг өөрчилнө', () => {
    render(<CompetitionRulesEditor />);
    const [count, secs] = screen.getAllByRole('spinbutton');
    fireEvent.change(count, { target: { value: '15' } });
    expect(updateCompetitionSchedule).toHaveBeenLastCalledWith({ questionsPerAttempt: 15 });
    fireEvent.change(secs, { target: { value: '45' } });
    expect(updateCompetitionSchedule).toHaveBeenLastCalledWith({ secondsPerQuestion: 45 });
    fireEvent.change(count, { target: { value: '0' } });
    expect(updateCompetitionSchedule.mock.calls.at(-1)![0].questionsPerAttempt).toBe(10); // буруу утга анхдагчид
  });

  it('Ангилалын тусгай утгыг тогтоож, хоослоход нийтийн утга руу буцна; бусад ангиллын тохиргоо хадгалагдана', () => {
    const { rerender } = render(<CompetitionRulesEditor />);
    // Бодит байдалд төлөв шинэчлэгдэж дахин зурагдана; энд түүнийг дуурайна
    const commit = () => { ctx.competitionSchedule = { ...ctx.competitionSchedule, ...updateCompetitionSchedule.mock.calls.at(-1)![0] }; rerender(<CompetitionRulesEditor />); };
    fireEvent.change(screen.getByLabelText('9-р анги: асуултын тоо'), { target: { value: '5' } });
    expect(updateCompetitionSchedule).toHaveBeenLastCalledWith({ categorySettings: { teacher: { questionCount: 20, secondsPerQuestion: 60 }, '9': { questionCount: 5 } } });
    commit();
    expect((screen.getByLabelText('9-р анги: асуултын тоо') as HTMLInputElement).value).toBe('5');
    fireEvent.change(screen.getByLabelText('Багш: хугацаа'), { target: { value: '' } });
    expect(updateCompetitionSchedule).toHaveBeenLastCalledWith({ categorySettings: { teacher: { questionCount: 20 }, '9': { questionCount: 5 } } });
    commit();
    fireEvent.change(screen.getByLabelText('Багш: асуултын тоо'), { target: { value: '' } });
    expect(updateCompetitionSchedule.mock.calls.at(-1)![0].categorySettings).toEqual({ '9': { questionCount: 5 } }); // багшийн тусгай тохиргоо бүрмөсөн арилсан
    commit();
    fireEvent.change(screen.getByLabelText('12-р анги: хугацаа'), { target: { value: '2' } });
    expect(updateCompetitionSchedule.mock.calls.at(-1)![0].categorySettings['12']).toEqual({ secondsPerQuestion: 5 }); // 5-аас бага бол 5
  });

  it('Удирдамжид (хэвлэх, Word, PDF) тохируулсан тоо, хугацаа орно', () => {
    const html = buildCompetitionGuidelinesHtml(ctx.competitionSchedule);
    expect(html).toContain('Багш: 20 даалгавар × 60 секунд');
    expect(html).toContain('9-р анги: 10 даалгавар × 30 секунд');
    expect(buildCompetitionGuidelinesHtml({ questionsPerAttempt: 12, secondsPerQuestion: 40 })).toContain('12 даалгавар, даалгавар тус бүрт 40 секунд');
    expect(buildCompetitionGuidelinesHtml()).toContain('10 даалгавар, даалгавар тус бүрт 30 секунд');
  });
});

import { generateComprehensiveGisQuestions } from '../../src/utils/gisAutoQuestionGenerator';
describe('Админ: уралдааны бүрэлдэхүүн (давхарга, төрлөөр)', () => {
  const ring = (cx: number, cy: number, r: number) => { const pts = Array.from({ length: 16 }, (_, k) => [cx + r * Math.cos((k / 16) * 6.283), cy + r * Math.sin((k / 16) * 6.283)]); pts.push(pts[0]); return pts; };
  const pl = (id: string, name: string, off: number) => ({ id, name, visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Polygon', featureCount: 8, nameField: 'nm', createdAt: '',
    geojson: { type: 'FeatureCollection', features: Array.from({ length: 8 }, (_, i) => ({ type: 'Feature', properties: { nm: `${name} ${i}` }, geometry: { type: 'Polygon', coordinates: [ring(90 + off + i * 1.3, 44 + (i % 3) * 0.8, 0.3 + i * 0.02)] } })) } });
  let pool: any[] = [];
  const lay = (id: string) => `lk-${id}`;
  beforeEach(() => {
    pool = (generateComprehensiveGisQuestions({ layers: [pl('lk', 'Нуур', 0), pl('ai', 'Аймаг', 4)], enabledTypes: ['contour_shape', 'area'], gradeLevels: ['9'] } as any) as any[]);
    ctx = { competitionSchedule: { mode: 'open', questionsPerAttempt: 10, secondsPerQuestion: 30, speedBonusPercent: 50 }, updateCompetitionSchedule, customQuestions: pool };
  });
  const commit = (rerender: any) => { ctx.competitionSchedule = { ...ctx.competitionSchedule, ...updateCompetitionSchedule.mock.calls.at(-1)![0] }; rerender(<CompetitionRulesEditor />); };

  it('Бүрэлдэхүүн нээж, санамсаргүй → давхарга/төрлөөр шилжиж, мөр нэмж, засч, устгана; тоо нь нийлбэр болно', () => {
    const { rerender } = render(<CompetitionRulesEditor />);
    fireEvent.click(screen.getByLabelText('9-р анги: бүрэлдэхүүн'));
    const panel = () => screen.getByTestId('bp-panel-9');
    fireEvent.click(within(panel()).getByLabelText('Давхарга, төрлөөр тогтоох'));
    expect(updateCompetitionSchedule.mock.calls.at(-1)![0].categorySettings['9'].blueprint).toHaveLength(1);
    commit(rerender);
    // мөр 1: Нуур · контур таах · 3
    fireEvent.change(screen.getByLabelText('Мөр 1: давхарга'), { target: { value: 'lk' } });
    commit(rerender);
    fireEvent.change(screen.getByLabelText('Мөр 1: төрөл'), { target: { value: 'contour_shape' } });
    commit(rerender);
    fireEvent.change(screen.getByLabelText('Мөр 1: тоо'), { target: { value: '3' } });
    commit(rerender);
    // мөр 2
    fireEvent.click(within(panel()).getByRole('button', { name: /Мөр нэмэх/ }));
    commit(rerender);
    fireEvent.change(screen.getByLabelText('Мөр 2: давхарга'), { target: { value: 'ai' } });
    commit(rerender);
    fireEvent.change(screen.getByLabelText('Мөр 2: төрөл'), { target: { value: 'area' } });
    commit(rerender);
    fireEvent.change(screen.getByLabelText('Мөр 2: тоо'), { target: { value: '2' } });
    commit(rerender);
    const saved = ctx.competitionSchedule.categorySettings['9'].blueprint;
    expect(saved.map((r: any) => [r.layer, r.type, r.count])).toEqual([['lk', 'contour_shape', 3], ['ai', 'area', 2]]);
    expect(screen.getByTestId('bp-total-9').textContent).toMatch(/Нийт: 5 даалгавар/);
    // Асуултын тоо нь мөрүүдийн нийлбэр, гараар засах боломжгүй
    const countInput = screen.getByLabelText('9-р анги: асуултын тоо') as HTMLInputElement;
    expect(countInput.value).toBe('5');
    expect(countInput.disabled).toBe(true);
    expect(screen.getByTestId('rules-row-9').textContent).toMatch(/5\s*×\s*30 сек/);
    // Мөр устгах
    fireEvent.click(screen.getByLabelText('Мөр 2-г устгах'));
    commit(rerender);
    expect(ctx.competitionSchedule.categorySettings['9'].blueprint).toHaveLength(1);
    // Санамсаргүй руу буцах: бүрэлдэхүүн бүрмөсөн арилна, асуултын тоо дахин засагдана
    fireEvent.click(within(panel()).getByLabelText('Санамсаргүй (сонгосон даалгавраас)'));
    commit(rerender);
    expect(ctx.competitionSchedule.categorySettings?.['9']?.blueprint).toBeUndefined();
    expect((screen.getByLabelText('9-р анги: асуултын тоо') as HTMLInputElement).disabled).toBe(false);
  });

  it('Бэлэн даалгавараас илүү хүссэн мөрийг анхааруулна, "автоматаар нэмэх" давхарга × төрөл бүрт мөр үүсгэнэ', () => {
    ctx.competitionSchedule.categorySettings = { '9': { blueprint: [{ id: 'r1', layer: 'lk', type: 'contour_shape', count: 50 }] } };
    const { rerender } = render(<CompetitionRulesEditor />);
    fireEvent.click(screen.getByLabelText('9-р анги: бүрэлдэхүүн'));
    expect(within(screen.getByTestId('bp-rule-9-0')).getByText(/8-ийг л өгнө/)).toBeTruthy(); // Нуур-ийн контур 8 л бэлэн
    expect(screen.getByTestId('bp-total-9').textContent).toMatch(/бэлэн даалгавар хүрэлцэхгүй тул 8-ийг л өгнө/);
    expect(within(screen.getByTestId('rules-row-9')).getByText(/зөвхөн 8-ийг өгнө/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /автоматаар нэмэх/ }));
    const auto = updateCompetitionSchedule.mock.calls.at(-1)![0].categorySettings['9'].blueprint;
    expect(auto.map((r: any) => `${r.layer}|${r.type}|${r.count}`).sort()).toEqual(['ai|area|1', 'ai|contour_shape|1', 'lk|area|1', 'lk|contour_shape|1']);
  });
});
