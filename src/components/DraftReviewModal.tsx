import React, { useMemo, useState } from 'react';
import { X, Eye, EyeOff, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Question } from '../types';
import { GIS_AUTO_TASK_TYPE_LABELS, detectQuestionGisTaskType } from '../utils/gisAutoQuestionGenerator';
import { ShpContourViewer } from './ShpContourViewer';
import { InteractiveMapPinQuestion } from './InteractiveMapPinQuestion';
import { BulkEditPanel } from './BulkEditPanel';
import { groupQuestions } from '../lib/questionGroups';
import {
  editTitle, editExplanation, editPoints, editOptionText, setCorrectOption, editPinTolerance, validateDraft,
} from '../lib/draftEdit';

interface Props {
  title: string;
  initial: Question[];
  onConfirm: (questions: Question[]) => void;
  onCancel: () => void;
  confirmLabel?: string;
}

/**
 * Үүсгэсэн даалгаврыг САНД НЭМЭХЭЭС ӨМНӨ урьдчилан харж, засаж, хэрэггүйг нь хасах цонх.
 * Нэмэхээр сонгосон бүх даалгавар шалгалтыг давсан байж л "Санд нэмэх" идэвхжинэ.
 */
export const DraftReviewModal: React.FC<Props> = ({ title, initial, onConfirm, onCancel, confirmLabel = 'Санд нэмэх' }) => {
  const [items, setItems] = useState<Question[]>(initial);
  const [keep, setKeep] = useState<Set<string>>(() => new Set(initial.map((q) => q.id)));
  const [open, setOpen] = useState<string | null>(null);
  const [bulkGroup, setBulkGroup] = useState<string>('');
  const [showBulk, setShowBulk] = useState(initial.length > 3);

  const update = (id: string, fn: (q: Question) => Question) =>
    setItems((prev) => prev.map((q) => (q.id === id ? fn(q) : q)));
  const toggleKeep = (id: string) =>
    setKeep((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const typeLabel = (q: Question) => {
    const id = detectQuestionGisTaskType(q);
    return GIS_AUTO_TASK_TYPE_LABELS.find((t) => t.id === id);
  };

  const selected = items.filter((q) => keep.has(q.id));
  const problems = useMemo(() => {
    const m = new Map<string, string>();
    for (const q of selected) {
      const p = validateDraft(q);
      if (p) m.set(q.id, p);
    }
    return m;
  }, [selected]);

  const summary = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of selected) {
      const t = typeLabel(q)?.label.replace(/^\d+\.\s*/, '') || 'Бусад';
      m.set(t, (m.get(t) || 0) + 1);
    }
    return Array.from(m.entries());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const groups = useMemo(() => groupQuestions(items.filter((q) => keep.has(q.id))), [items, keep]);
  const bulkIds = useMemo(() => {
    if (!bulkGroup) return new Set<string>();
    if (bulkGroup === '__all') return new Set(items.filter((q) => keep.has(q.id)).map((q) => q.id));
    return new Set(groups.find((g) => g.key === bulkGroup)?.ids ?? []);
  }, [bulkGroup, groups, items, keep]);
  const bulkTargets = useMemo(() => items.filter((q) => bulkIds.has(q.id)), [items, bulkIds]);

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Даалгаврыг урьдчилан харах ба засах</h3>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {title}. Хадгалахаас өмнө шалгаж, засаж, хэрэггүйг нь хасна уу. <strong>Санд нэмэх</strong> товч дармагц Сорил хэсэгт орно.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 cursor-pointer" aria-label="Хаах">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 bg-slate-50 px-4 py-2 text-[11px] text-slate-700">
          <strong>
            {selected.length} / {items.length} даалгавар сонгосон
          </strong>
          {summary.map(([label, n]) => (
            <span key={label} className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5">
              {label}: {n}
            </span>
          ))}
          <span className="ml-auto flex gap-2">
            <button type="button" className="font-semibold text-sky-700 hover:underline cursor-pointer" onClick={() => setKeep(new Set(items.map((q) => q.id)))}>
              Бүгдийг сонгох
            </button>
            <button type="button" className="font-semibold text-slate-600 hover:underline cursor-pointer" onClick={() => setKeep(new Set())}>
              Бүгдийг болих
            </button>
          </span>
        </div>

        {items.length > 1 && (
          <div className="border-b border-slate-100 bg-white px-4 py-2 text-xs">
            <button type="button" onClick={() => setShowBulk((x) => !x)} className="font-bold text-violet-800 hover:underline cursor-pointer">
              {showBulk ? '▾' : '▸'} Бөөнөөр засах: нэг төрлийн даалгаврын асуултыг нэг дор солих
            </button>
            {showBulk && (
              <div className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setBulkGroup(g.key)}
                      className={`rounded-lg border px-2.5 py-1 font-semibold cursor-pointer ${bulkGroup === g.key ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      {g.label} ({g.ids.length})
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBulkGroup('__all')}
                    className={`rounded-lg border px-2.5 py-1 font-semibold cursor-pointer ${bulkGroup === '__all' ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    Бүгд ({selected.length})
                  </button>
                </div>
                <BulkEditPanel
                  targets={bulkTargets}
                  scopeLabel={bulkGroup === '__all' ? 'бүх сонгосон даалгавар' : groups.find((g) => g.key === bulkGroup)?.label || ''}
                  onApply={(fn) => setItems((prev) => prev.map((q) => (bulkIds.has(q.id) ? fn(q) : q)))}
                />
              </div>
            )}
          </div>
        )}

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {items.map((q, i) => {
            const on = keep.has(q.id);
            const tl = typeLabel(q);
            const problem = on ? problems.get(q.id) : undefined;
            const isOpen = open === q.id;
            return (
              <div
                key={q.id}
                className={`rounded-xl border p-3 text-xs space-y-2 ${on ? (problem ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-white') : 'border-slate-200 bg-slate-50 opacity-60'}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1.5 font-bold text-slate-800 cursor-pointer">
                    <input type="checkbox" checked={on} onChange={() => toggleKeep(q.id)} className="h-3.5 w-3.5" />
                    <span>№{i + 1}</span>
                  </label>
                  {tl && <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${tl.badgeColor}`}>{tl.label.replace(/^\d+\.\s*/, '')}</span>}
                  <span className="text-slate-500">{q.shpContourData?.layerName || q.mapPinData?.subCategory}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : q.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      {isOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {isOpen ? 'Зургийг хаах' : 'Зургийг харах'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItems((prev) => prev.filter((x) => x.id !== q.id));
                        setKeep((prev) => {
                          const n = new Set(prev);
                          n.delete(q.id);
                          return n;
                        });
                      }}
                      className="rounded-lg border border-rose-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Энэ даалгаврыг жагсаалтаас бүр мөсөн хасах"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {on && (
                  <>
                    <textarea
                      value={q.title}
                      onChange={(e) => update(q.id, (x) => editTitle(x, e.target.value))}
                      rows={2}
                      className={input}
                      aria-label="Асуултын текст"
                    />

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {q.options.map((o, oi) => (
                          <label key={o.id} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${o.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200'}`}>
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={o.isCorrect}
                              onChange={() => update(q.id, (x) => setCorrectOption(x, oi))}
                              title="Зөв хариулт"
                            />
                            <input
                              value={o.text}
                              onChange={(e) => update(q.id, (x) => editOptionText(x, oi, e.target.value))}
                              className="min-w-0 flex-1 bg-transparent text-xs text-slate-800 focus:outline-none"
                              aria-label={`Сонголт ${oi + 1}`}
                            />
                          </label>
                        ))}
                      </div>
                    )}

                    {q.mapPinData && (
                      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-cyan-200 bg-cyan-50/60 px-2.5 py-1.5">
                        <span>
                          📍 Байрлуулах обьект: <strong>{q.mapPinData.targetName}</strong>
                        </span>
                        <label className="flex items-center gap-1.5">
                          Зөвшөөрөх алдаа (км):
                          <input
                            type="number"
                            min={1}
                            value={q.mapPinData.allowedDistanceKm}
                            onChange={(e) => update(q.id, (x) => editPinTolerance(x, Number(e.target.value)))}
                            className="w-20 rounded-md border border-slate-300 px-1.5 py-0.5"
                          />
                        </label>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_90px]">
                      <input
                        value={q.explanation}
                        onChange={(e) => update(q.id, (x) => editExplanation(x, e.target.value))}
                        className={input}
                        placeholder="Хариултын тайлбар"
                        aria-label="Тайлбар"
                      />
                      <label className="flex items-center gap-1.5">
                        Оноо
                        <input
                          type="number"
                          min={1}
                          value={q.points}
                          onChange={(e) => update(q.id, (x) => editPoints(x, Number(e.target.value)))}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                        />
                      </label>
                    </div>

                    {problem && (
                      <p className="flex items-center gap-1.5 font-semibold text-rose-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> {problem}
                      </p>
                    )}
                  </>
                )}

                {isOpen && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                    {q.mapPinData ? (
                      <InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={() => {}} />
                    ) : q.shpContourData ? (
                      <ShpContourViewer
                        geojson={q.shpContourData.geojson}
                        geometryType={q.shpContourData.geometryType}
                        maskedProperties={q.shpContourData.maskedProperties}
                        realProperties={q.shpContourData.realProperties}
                        targetName={q.shpContourData.targetName}
                        hasAnswered={false}
                        categoryLabel={q.shpContourData.categoryLabel}
                        hints={q.shpContourData.hints}
                      />
                    ) : (
                      <p className="text-slate-500">Урьдчилан харах зураг алга.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {items.length === 0 && <p className="py-10 text-center text-slate-500">Бүх даалгаврыг хаслаа. Цуцалж буцна уу.</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-3">
          <span className={`text-[11px] ${problems.size > 0 ? 'font-bold text-rose-700' : 'text-slate-500'}`}>
            {problems.size > 0 ? `${problems.size} даалгаварт засах зүйл байна (улаанаар тэмдэглэсэн)` : 'Бүх сонгосон даалгавар шалгалтыг давлаа'}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
              Цуцлах
            </button>
            <button
              type="button"
              disabled={selected.length === 0 || problems.size > 0}
              onClick={() => onConfirm(selected)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {confirmLabel} ({selected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
