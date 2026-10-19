import React from 'react';
import { Timer, ListOrdered, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CATEGORY_IDS, CATEGORY_LABEL, DEFAULT_QUESTION_COUNT, resolveCompetitionRules, totalSeconds, formatMinutes, type CategoryId,
} from '../lib/scoring';

/**
 * Уралдааны дүрмийн тохиргоо: асуултын тоо ба нэг асуултад ногдох хугацаа.
 * Нийтийн утгыг тогтоож, ангилал тус бүрт (9, 12, Багш, Баг) тусгай утга өгч болно.
 */
export const CompetitionRulesEditor: React.FC = () => {
  const { competitionSchedule: cfg, updateCompetitionSchedule, customQuestions } = useApp();
  const input = 'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs';

  const setOverride = (g: CategoryId, key: 'questionCount' | 'secondsPerQuestion', raw: string) => {
    const next = { ...(cfg.categorySettings ?? {}) } as NonNullable<typeof cfg.categorySettings>;
    const cur = { ...(next[g] ?? {}) };
    const n = Math.round(Number(raw));
    if (raw.trim() === '' || !(n > 0)) delete cur[key]; // хоосон = нийтийн утга
    else cur[key] = key === 'questionCount' ? Math.min(100, n) : Math.min(600, Math.max(5, n));
    if (Object.keys(cur).length === 0) delete next[g];
    else next[g] = cur;
    updateCompetitionSchedule({ categorySettings: next });
  };

  const pool = (g: CategoryId) => customQuestions.filter((q) => Array.isArray(q.gradeLevels) && q.gradeLevels.includes(g)).length;

  return (
    <div className="space-y-3" data-testid="rules-editor">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 flex items-center gap-1 font-semibold text-slate-700">
            <ListOrdered className="h-3.5 w-3.5" /> Асуултын тоо (нийтийн)
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={cfg.questionsPerAttempt ?? DEFAULT_QUESTION_COUNT}
            onChange={(e) => updateCompetitionSchedule({ questionsPerAttempt: Math.min(100, Math.max(1, Math.round(Number(e.target.value)) || DEFAULT_QUESTION_COUNT)) })}
            className={`${input} w-full`}
          />
        </label>
        <label className="block">
          <span className="mb-1 flex items-center gap-1 font-semibold text-slate-700">
            <Timer className="h-3.5 w-3.5" /> Нэг асуултад өгөх хугацаа, секунд (нийтийн)
          </span>
          <input
            type="number"
            min={5}
            max={600}
            value={cfg.secondsPerQuestion ?? 30}
            onChange={(e) => updateCompetitionSchedule({ secondsPerQuestion: Math.min(600, Math.max(5, Number(e.target.value) || 30)) })}
            className={`${input} w-full`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold text-slate-700">Хурдны урамшуулал (суурь оноонд нэмэх %)</span>
          <input
            type="number"
            min={0}
            max={300}
            value={cfg.speedBonusPercent ?? 50}
            onChange={(e) => updateCompetitionSchedule({ speedBonusPercent: Math.min(300, Math.max(0, Number(e.target.value) || 0)) })}
            className={`${input} w-full`}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-amber-200 bg-amber-50 text-slate-700">
            <tr>
              <th className="px-3 py-2 font-semibold">Ангилал</th>
              <th className="px-3 py-2 font-semibold">Бэлэн даалгавар</th>
              <th className="px-3 py-2 font-semibold">Асуултын тоо</th>
              <th className="px-3 py-2 font-semibold">Хугацаа / асуулт (сек)</th>
              <th className="px-3 py-2 font-semibold">Нийт хугацаа</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CATEGORY_IDS.map((g) => {
              const r = resolveCompetitionRules(cfg, g);
              const ov = cfg.categorySettings?.[g];
              const available = pool(g);
              const short = available < r.questionCount;
              return (
                <tr key={g} data-testid={`rules-row-${g}`}>
                  <td className="px-3 py-2 font-bold text-slate-800">{CATEGORY_LABEL[g]}</td>
                  <td className="px-3 py-2 font-mono">
                    {available}
                    {short && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-800" title="Бэлэн даалгавар хүрэлцэхгүй тул байгаа бүгдийг л өгнө">
                        <AlertTriangle className="h-3 w-3" /> {available === 0 ? 'даалгавар сонгоогүй' : `зөвхөн ${available}-ийг өгнө`}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={ov?.questionCount ?? ''}
                      placeholder={String(cfg.questionsPerAttempt ?? DEFAULT_QUESTION_COUNT)}
                      onChange={(e) => setOverride(g, 'questionCount', e.target.value)}
                      className={`${input} w-24`}
                      aria-label={`${CATEGORY_LABEL[g]}: асуултын тоо`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={5}
                      max={600}
                      value={ov?.secondsPerQuestion ?? ''}
                      placeholder={String(cfg.secondsPerQuestion ?? 30)}
                      onChange={(e) => setOverride(g, 'secondsPerQuestion', e.target.value)}
                      className={`${input} w-24`}
                      aria-label={`${CATEGORY_LABEL[g]}: хугацаа`}
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    <strong>{r.questionCount}</strong> × {r.secondsPerQuestion} сек ≈ <strong>{formatMinutes(totalSeconds(r, available || undefined))}</strong>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-600">
        Ангилалын талбарыг хоосон орхивол нийтийн утгыг хэрэглэнэ. Даалгаврыг ангилалд «🏆 Уралдааны даалгавар» табаас оноож, энд хэдийг нь санамсаргүйгээр
        өгөхөө тогтооно. Оролцогч уралдаан эхэлмэгц дүрэм түгжигдэх тул явцад тохиргоог өөрчилсөн ч түүнд нөлөөлөхгүй.
      </p>
    </div>
  );
};
