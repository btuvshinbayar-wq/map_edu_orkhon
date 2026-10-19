import React, { useEffect, useMemo, useState } from 'react';
import { Wand2 } from 'lucide-react';
import type { Question } from '../types';
import {
  PLACEHOLDERS, commonTemplate, applyTemplate, deriveVars, missingPlaceholders, findReplace, render, deriveTemplate,
} from '../lib/questionTemplates';
import { editPoints, editPinTolerance } from '../lib/draftEdit';

interface Props {
  /** Засах даалгавруудын жагсаалт (сонгосон эсвэл бүлгийн бүх даалгавар) */
  targets: Question[];
  scopeLabel: string;
  onApply: (fn: (q: Question) => Question) => void;
}

/**
 * Нэг төрлийн даалгаврын асуултыг НЭГ ДОР засах самбар.
 * Загварт {нэр}, {давхарга} гэх мэт placeholder ашиглавал даалгавар бүр өөрийнх нь утгаар дүүрнэ.
 */
export const BulkEditPanel: React.FC<Props> = ({ targets, scopeLabel, onApply }) => {
  const common = useMemo(() => commonTemplate(targets), [targets]);
  const [title, setTitle] = useState(common.template.title);
  const [subtitle, setSubtitle] = useState(common.template.subtitle);
  const [explanation, setExplanation] = useState(common.template.explanation);
  const [points, setPoints] = useState('');
  const [tolerance, setTolerance] = useState('');
  const [find, setFind] = useState('');
  const [replaceWith, setReplaceWith] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  // Сонголт солигдох бүрт загварыг шинэ бүлгийнхээр дахин бөглөнө
  const sig = targets.map((q) => q.id).join('|');
  useEffect(() => {
    setTitle(common.template.title);
    setSubtitle(common.template.subtitle);
    setExplanation(common.template.explanation);
    setDone(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const hasPins = targets.some((q) => q.mapPinData);
  const first = targets[0];
  const firstVars = first ? deriveVars(first) : {};
  const miss = Array.from(new Set([...missingPlaceholders(title, targets), ...missingPlaceholders(subtitle, targets), ...missingPlaceholders(explanation, targets)]));
  const changedTitle = title !== common.template.title;
  const changedSub = subtitle !== common.template.subtitle;
  const changedExp = explanation !== common.template.explanation;

  const insert = (key: string) => setTitle((t) => `${t}{${key}}`);

  const apply = () => {
    const patch: any = {};
    if (changedTitle) patch.title = title;
    if (changedSub) patch.subtitle = subtitle;
    if (changedExp) patch.explanation = explanation;
    const pts = Number(points);
    const tol = Number(tolerance);
    onApply((q) => {
      let n = Object.keys(patch).length ? applyTemplate(q, patch) : q;
      if (find.trim()) n = findReplace(n, find, replaceWith);
      if (points.trim() !== '' && pts > 0) n = editPoints(n, pts);
      if (tolerance.trim() !== '' && tol > 0) n = editPinTolerance(n, tol);
      return n;
    });
    setDone(`${targets.length} даалгаварт хэрэглэлээ`);
    setFind('');
  };

  const nothing = !changedTitle && !changedSub && !changedExp && !find.trim() && points.trim() === '' && tolerance.trim() === '';
  const area = 'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-violet-500 focus:outline-none';

  if (targets.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500">Засах даалгавраа сонгоно уу.</div>;
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-violet-200 bg-violet-50/50 p-3 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <Wand2 className="h-4 w-4 text-violet-700" />
        <strong className="text-violet-900">Бөөнөөр засах: {scopeLabel}</strong>
        <span className="rounded-md bg-white px-1.5 py-0.5 font-bold text-violet-800 border border-violet-200">{targets.length} даалгавар</span>
        {!common.uniform && (
          <span className="text-amber-700">
            Эдгээр {common.distinct} өөр загвартай (хамгийн түгээмэл нь харагдаж байна). Хэрэглэвэл бүгд нэг загвартай болно.
          </span>
        )}
      </div>

      <div>
        <label className="mb-1 block font-semibold text-slate-700">Асуулт (загвар):</label>
        <textarea value={title} onChange={(e) => setTitle(e.target.value)} rows={3} className={area} />
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="text-slate-500">Оруулах:</span>
          {PLACEHOLDERS.filter((p) => p.key in firstVars || targets.some((q) => p.key in deriveVars(q))).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => insert(p.key)}
              title={`${p.label}${firstVars[p.key] ? `, жишээ нь: ${firstVars[p.key]}` : ''}`}
              className="rounded-md border border-violet-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-violet-800 hover:bg-violet-100 cursor-pointer"
            >
              {`{${p.key}}`}
            </button>
          ))}
        </div>
        {first && (
          <p className="mt-1 text-slate-600">
            Урьдчилсан харагдац: <em>{render(title, firstVars)}</em>
          </p>
        )}
      </div>

      <button type="button" onClick={() => setShowMore((x) => !x)} className="font-semibold text-violet-700 hover:underline cursor-pointer">
        {showMore ? '▾ Нэмэлт талбаруудыг нуух' : '▸ Дэд гарчиг, тайлбар, оноо, хайх/солих'}
      </button>
      {showMore && (
        <div className="space-y-2">
          <div>
            <label className="mb-1 block font-semibold text-slate-700">Дэд гарчиг (загвар):</label>
            <textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} className={area} />
          </div>
          <div>
            <label className="mb-1 block font-semibold text-slate-700">Хариултын тайлбар (загвар):</label>
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className={area} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              Оноо (бүгдэд):
              <input type="number" min={1} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="өөрчлөхгүй" className="w-28 rounded-lg border border-slate-300 px-2 py-1.5" />
            </label>
            {hasPins && (
              <label className="flex flex-col gap-1">
                Цэгийн зөвшөөрөх алдаа (км):
                <input type="number" min={1} value={tolerance} onChange={(e) => setTolerance(e.target.value)} placeholder="өөрчлөхгүй" className="w-32 rounded-lg border border-slate-300 px-2 py-1.5" />
              </label>
            )}
            <label className="flex flex-col gap-1">
              Хайх:
              <input value={find} onChange={(e) => setFind(e.target.value)} className="w-40 rounded-lg border border-slate-300 px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              Солих:
              <input value={replaceWith} onChange={(e) => setReplaceWith(e.target.value)} className="w-40 rounded-lg border border-slate-300 px-2 py-1.5" />
            </label>
          </div>
        </div>
      )}

      {miss.length > 0 && (
        <p className="font-semibold text-amber-700">
          Анхаар: {miss.map((m) => `{${m}}`).join(', ')} нь зарим даалгаварт утгагүй тул тэр хэвээр үлдэнэ.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={nothing}
          onClick={apply}
          className="rounded-lg bg-violet-600 px-4 py-2 font-bold text-white hover:bg-violet-700 disabled:opacity-40 cursor-pointer"
        >
          {targets.length} даалгаварт хэрэглэх
        </button>
        {done && <span className="font-semibold text-emerald-700">✓ {done}</span>}
      </div>
    </div>
  );
};

export { deriveTemplate };
