import React, { useState } from 'react';
import { Timer, ListOrdered, AlertTriangle, Layers, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  CATEGORY_IDS, CATEGORY_LABEL, DEFAULT_QUESTION_COUNT, resolveCompetitionRules, totalSeconds, formatMinutes, type CategoryId,
} from '../lib/scoring';
import type { BlueprintRule, Question } from '../types';
import { blueprintTotal, layerKeyOf, layerLabelOf, newRuleId, previewBlueprint, taskTypeOf, matchesRule } from '../lib/blueprint';
import { GIS_AUTO_TASK_TYPE_LABELS } from '../utils/gisAutoQuestionGenerator';

const typeLabel = (t: string) => (GIS_AUTO_TASK_TYPE_LABELS.find((x) => x.id === t)?.label || 'Бусад').replace(/^\d+\.\s*/, '');

/**
 * Уралдааны дүрмийн тохиргоо: асуултын тоо, нэг асуултад ногдох хугацаа, мөн ангилал бүрт
 * ямар давхарга, ямар төрлийн даалгавраас хэдийг оруулах бүрэлдэхүүн.
 */
export const CompetitionRulesEditor: React.FC = () => {
  const { competitionSchedule: cfg, updateCompetitionSchedule, customQuestions } = useApp();
  const input = 'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs';
  const [openBp, setOpenBp] = useState<CategoryId | null>(null);

  type CatCfg = NonNullable<NonNullable<typeof cfg.categorySettings>[CategoryId]>;
  /** Ангилалын тохиргоог шинэчилнэ. Хоосон болсон талбар, ангилал бүрмөсөн арилна */
  const patchCategory = (g: CategoryId, patch: Partial<CatCfg>) => {
    const next = { ...(cfg.categorySettings ?? {}) } as NonNullable<typeof cfg.categorySettings>;
    const cur: any = { ...(next[g] ?? {}), ...patch };
    for (const k of Object.keys(cur)) if (cur[k] === undefined) delete cur[k];
    if (Array.isArray(cur.blueprint) && cur.blueprint.length === 0) { delete cur.blueprint; delete cur.shuffleBlueprint; }
    if (Object.keys(cur).length === 0) delete next[g];
    else next[g] = cur;
    updateCompetitionSchedule({ categorySettings: next });
  };

  const setOverride = (g: CategoryId, key: 'questionCount' | 'secondsPerQuestion', raw: string) => {
    const n = Math.round(Number(raw));
    if (raw.trim() === '' || !(n > 0)) patchCategory(g, { [key]: undefined } as any);
    else patchCategory(g, { [key]: key === 'questionCount' ? Math.min(100, n) : Math.min(600, Math.max(5, n)) } as any);
  };

  const poolOf = (g: CategoryId): Question[] => customQuestions.filter((q) => Array.isArray(q.gradeLevels) && q.gradeLevels.includes(g));

  // ---------------- Бүрэлдэхүүний засвар ----------------
  const BlueprintPanel: React.FC<{ g: CategoryId }> = ({ g }) => {
    const pool = poolOf(g);
    const rules: BlueprintRule[] = cfg.categorySettings?.[g]?.blueprint ?? [];
    const enabled = rules.length > 0;
    const shuffle = cfg.categorySettings?.[g]?.shuffleBlueprint !== false;

    const layers = new Map<string, { label: string; n: number }>();
    const types = new Map<string, number>();
    for (const q of pool) {
      const k = layerKeyOf(q);
      layers.set(k, { label: layerLabelOf(q), n: (layers.get(k)?.n ?? 0) + 1 });
      types.set(taskTypeOf(q), (types.get(taskTypeOf(q)) ?? 0) + 1);
    }
    const setRules = (next: BlueprintRule[]) => patchCategory(g, { blueprint: next });
    const update = (id: string, patch: Partial<BlueprintRule>) => setRules(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const preview = previewBlueprint(pool, rules);
    const shortById = new Map(preview.shortages.map((s) => [s.rule.id, s]));
    const requested = blueprintTotal(rules);

    return (
      <div className="space-y-3 bg-amber-50/40 p-3" data-testid={`bp-panel-${g}`}>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Layers className="h-4 w-4 text-amber-700" />
          <strong className="text-slate-800">{CATEGORY_LABEL[g]}: уралдааны бүрэлдэхүүн</strong>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`bp-mode-${g}`}
              checked={!enabled}
              onChange={() => patchCategory(g, { blueprint: undefined, shuffleBlueprint: undefined })}
            />
            Санамсаргүй (сонгосон даалгавраас)
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`bp-mode-${g}`}
              checked={enabled}
              onChange={() => !enabled && setRules([{ id: newRuleId(), count: Math.min(5, Math.max(1, pool.length)) }])}
            />
            Давхарга, төрлөөр тогтоох
          </label>
        </div>

        {enabled && (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-2.5 py-1.5 font-semibold">Давхарга</th>
                    <th className="px-2.5 py-1.5 font-semibold">Даалгаврын төрөл</th>
                    <th className="px-2.5 py-1.5 font-semibold">Хэд</th>
                    <th className="px-2.5 py-1.5 font-semibold">Бэлэн</th>
                    <th className="w-10 px-2.5 py-1.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rules.map((r, i) => {
                    const avail = pool.filter((q) => matchesRule(q, r)).length;
                    const sh = shortById.get(r.id);
                    return (
                      <tr key={r.id} data-testid={`bp-rule-${g}-${i}`}>
                        <td className="px-2.5 py-1.5">
                          <select
                            value={r.layer ?? ''}
                            onChange={(e) => update(r.id, { layer: e.target.value || undefined })}
                            className={`${input} w-44`}
                            aria-label={`Мөр ${i + 1}: давхарга`}
                          >
                            <option value="">Бүх давхарга</option>
                            {Array.from(layers.entries()).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v.label} ({v.n})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <select
                            value={r.type ?? ''}
                            onChange={(e) => update(r.id, { type: e.target.value || undefined })}
                            className={`${input} w-52`}
                            aria-label={`Мөр ${i + 1}: төрөл`}
                          >
                            <option value="">Бүх төрөл</option>
                            {Array.from(types.entries()).map(([k, n]) => (
                              <option key={k} value={k}>
                                {typeLabel(k)} ({n})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2.5 py-1.5">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={r.count}
                            onChange={(e) => update(r.id, { count: Math.min(100, Math.max(0, Math.round(Number(e.target.value)) || 0)) })}
                            className={`${input} w-20`}
                            aria-label={`Мөр ${i + 1}: тоо`}
                          />
                        </td>
                        <td className="px-2.5 py-1.5 font-mono">
                          {avail}
                          {sh && (
                            <span className="ml-1.5 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-800">
                              <AlertTriangle className="h-3 w-3" /> {sh.got}-ийг л өгнө
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-1.5">
                          <button
                            type="button"
                            onClick={() => setRules(rules.filter((x) => x.id !== r.id))}
                            className="rounded-md border border-rose-200 bg-white p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                            aria-label={`Мөр ${i + 1}-г устгах`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRules([...rules, { id: newRuleId(), count: 1 }])}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-bold text-amber-900 hover:bg-amber-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Мөр нэмэх
              </button>
              <button
                type="button"
                title="Бэлэн даалгаврын давхарга × төрөл бүрт 1 даалгавар"
                onClick={() => {
                  const seen = new Set<string>();
                  const auto: BlueprintRule[] = [];
                  for (const q of pool) {
                    const key = `${layerKeyOf(q)}|${taskTypeOf(q)}`;
                    if (seen.has(key)) continue;
                    seen.add(key);
                    auto.push({ id: newRuleId(), layer: layerKeyOf(q), type: taskTypeOf(q), count: 1 });
                  }
                  setRules(auto);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Давхарга × төрөл бүрийг автоматаар нэмэх
              </button>
              <label className="ml-auto flex items-center gap-1.5">
                <input type="checkbox" checked={shuffle} onChange={(e) => patchCategory(g, { shuffleBlueprint: e.target.checked ? undefined : false })} />
                Сонгосон даалгаврыг холих
              </label>
            </div>

            <p className={`text-xs font-semibold ${preview.picked.length < requested ? 'text-amber-800' : 'text-slate-700'}`} data-testid={`bp-total-${g}`}>
              Нийт: {requested} даалгавар
              {preview.picked.length < requested ? ` (бэлэн даалгавар хүрэлцэхгүй тул ${preview.picked.length}-ийг л өгнө)` : ''}. Асуултын тоо нь мөрүүдийн нийлбэр болно.
            </p>
          </>
        )}
      </div>
    );
  };

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
              <th className="px-3 py-2 font-semibold">Бүрэлдэхүүн</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_IDS.map((g) => {
              const r = resolveCompetitionRules(cfg, g);
              const ov = cfg.categorySettings?.[g];
              const pool = poolOf(g);
              const available = pool.length;
              const hasBp = !!r.blueprint;
              const given = hasBp ? previewBlueprint(pool, r.blueprint!).picked.length : Math.min(r.questionCount, available);
              const short = given < r.questionCount;
              return (
                <React.Fragment key={g}>
                  <tr data-testid={`rules-row-${g}`} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-bold text-slate-800">{CATEGORY_LABEL[g]}</td>
                    <td className="px-3 py-2 font-mono">
                      {available}
                      {short && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-800" title="Бэлэн даалгавар хүрэлцэхгүй тул байгаа бүгдийг л өгнө">
                          <AlertTriangle className="h-3 w-3" /> {available === 0 ? 'даалгавар сонгоогүй' : `зөвхөн ${given}-ийг өгнө`}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={hasBp ? r.questionCount : ov?.questionCount ?? ''}
                        disabled={hasBp}
                        placeholder={String(cfg.questionsPerAttempt ?? DEFAULT_QUESTION_COUNT)}
                        onChange={(e) => setOverride(g, 'questionCount', e.target.value)}
                        className={`${input} w-24 disabled:bg-slate-100 disabled:text-slate-500`}
                        aria-label={`${CATEGORY_LABEL[g]}: асуултын тоо`}
                        title={hasBp ? 'Бүрэлдэхүүний мөрүүдийн нийлбэр' : undefined}
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
                      <strong>{r.questionCount}</strong> × {r.secondsPerQuestion} сек ≈ <strong>{formatMinutes(totalSeconds(r, hasBp ? given || undefined : available || undefined))}</strong>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setOpenBp(openBp === g ? null : g)}
                        className={`rounded-lg border px-2.5 py-1 font-semibold cursor-pointer ${hasBp ? 'border-amber-400 bg-amber-100 text-amber-900' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                        aria-label={`${CATEGORY_LABEL[g]}: бүрэлдэхүүн`}
                      >
                        {hasBp ? `${r.blueprint!.length} мөр ▾` : 'Санамсаргүй ▾'}
                      </button>
                    </td>
                  </tr>
                  {openBp === g && (
                    <tr>
                      <td colSpan={6} className="p-0">
                        <BlueprintPanel g={g} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-600">
        Ангилалын талбарыг хоосон орхивол нийтийн утгыг хэрэглэнэ. Даалгаврыг ангилалд «🏆 Уралдааны даалгавар» табаас оноож, энд хэдийг нь санамсаргүйгээр
        өгөхөө тогтооно. «Бүрэлдэхүүн»-ээр ямар давхарга, ямар төрлийн даалгавраас хэдийг оруулахыг нарийвчлан тогтооно. Оролцогч уралдаан эхэлмэгц дүрэм
        түгжигдэх тул явцад тохиргоог өөрчилсөн ч түүнд нөлөөлөхгүй.
      </p>
    </div>
  );
};
