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
