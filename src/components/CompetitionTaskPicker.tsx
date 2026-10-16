import React, { useMemo, useState } from 'react';
import { Trophy, CheckSquare, Square, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { GradeLevel, Question } from '../types';

const CATEGORIES: { id: GradeLevel; label: string }[] = [
  { id: '9', label: '9-р анги' },
  { id: '12', label: '12-р анги' },
  { id: 'teacher', label: 'Багш' },
  { id: 'team', label: 'Баг' },
];

const TASK_LABELS: Record<string, string> = {
  contour_shape: 'Хэлбэр дүрс таах',
  name_by_attribute: 'Нэр ба үзүүлэлт',
  area: 'Талбай',
  neighbor: 'Хөрш',
  assemble: 'Эвлүүлэх',
  point_placement: 'Цэг байрлуулах',
};

const taskTypeOf = (q: Question): string => (q as any).gisAutoTaskType || 'other';
const layerOf = (q: Question): string => q.shpContourData?.layerName || q.mapPinData?.subCategory || 'Бусад';

/**
 * Бэлтгэсэн бүх даалгавар Сорил хэсэгт хадгалагдана. Энд аль даалгаврыг аль ангиллын
 * УРАЛДААНД оруулахыг ангилал тус бүрээр сонгоно (даалгавар олон ангилалд орж болно).
 */
export const CompetitionTaskPicker: React.FC = () => {
  const { customQuestions, setCompetitionCategory } = useApp();
  const [category, setCategory] = useState<GradeLevel>('9');
  const [layerFilter, setLayerFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [onlySelected, setOnlySelected] = useState(false);

  const layers = useMemo(() => Array.from(new Set(customQuestions.map(layerOf))).sort(), [customQuestions]);
  const types = useMemo(() => Array.from(new Set(customQuestions.map(taskTypeOf))).sort(), [customQuestions]);

  const inCat = (q: Question) => Array.isArray(q.gradeLevels) && q.gradeLevels.includes(category);

  const filtered = customQuestions.filter(
    (q) =>
      (layerFilter === 'all' || layerOf(q) === layerFilter) &&
      (typeFilter === 'all' || taskTypeOf(q) === typeFilter) &&
      (!onlySelected || inCat(q)),
  );

  const selectedInCat = customQuestions.filter(inCat);
  const points = selectedInCat.reduce((s, q) => s + (q.points || 0), 0);
  const byType = selectedInCat.reduce<Record<string, number>>((m, q) => {
    const t = taskTypeOf(q);
    m[t] = (m[t] || 0) + 1;
    return m;
  }, {});
  const counts = (g: GradeLevel) => customQuestions.filter((q) => q.gradeLevels?.includes(g)).length;

  const allFilteredSelected = filtered.length > 0 && filtered.every(inCat);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-black text-slate-900">Уралдааны даалгавар сонгох</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Бэлтгэсэн <strong>{customQuestions.length}</strong> даалгавар бүгд <strong>Сорил</strong> хэсэгт байна. Уралдаанд
          зөвхөн энд сонгосон даалгавар орно. Ангилалгүй даалгавар уралдаанд орохгүй.
        </p>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                category === c.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {c.label} <span className="opacity-70">({counts(c.id)})</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700">
          <strong>{CATEGORIES.find((c) => c.id === category)?.label}</strong>: {selectedInCat.length} даалгавар, нийт {points} оноо
          {selectedInCat.length > 0 && (
            <span className="text-slate-500">
              {' '}
              ·{' '}
              {Object.entries(byType)
                .map(([t, n]) => `${TASK_LABELS[t] || 'Бусад'} ${n}`)
                .join(', ')}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Layers className="h-4 w-4 text-slate-500" />
          <select
            value={layerFilter}
            onChange={(e) => setLayerFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
          >
            <option value="all">Бүх давхарга</option>
            {layers.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
          >
            <option value="all">Бүх төрөл</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {TASK_LABELS[t] || 'Бусад'}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 cursor-pointer text-slate-700">
            <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} />
            Зөвхөн энэ ангилалд орсон
          </label>

          <div className="ml-auto flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={filtered.length === 0}
              onClick={() => setCompetitionCategory(filtered.map((q) => q.id), category, !allFilteredSelected)}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-3 py-1.5 font-bold text-white cursor-pointer"
            >
              {allFilteredSelected ? `Шүүсэн ${filtered.length}-г хасах` : `Шүүсэн ${filtered.length}-г нэмэх`}
            </button>
            <button
              type="button"
              disabled={selectedInCat.length === 0}
              onClick={() => {
                if (confirm('Энэ ангиллын уралдааны бүх даалгаврыг хасах уу? (Сорилоос устахгүй)'))
                  setCompetitionCategory(selectedInCat.map((q) => q.id), category, false);
              }}
              className="rounded-lg border border-rose-200 bg-white hover:bg-rose-50 disabled:opacity-40 px-3 py-1.5 font-bold text-rose-700 cursor-pointer"
            >
              Ангиллыг цэвэрлэх
            </button>
          </div>
        </div>

        <div className="max-h-[480px] overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 w-10"></th>
                <th className="px-3 py-2 font-semibold">Даалгавар</th>
                <th className="px-3 py-2 font-semibold">Давхарга</th>
                <th className="px-3 py-2 font-semibold">Төрөл</th>
                <th className="px-3 py-2 font-semibold">Оноо</th>
                <th className="px-3 py-2 font-semibold">Бусад ангилал</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    Даалгавар олдсонгүй. Эхлээд «Асуулт / Сорил» табаас давхаргаас даалгавар үүсгэнэ үү.
                  </td>
                </tr>
              )}
              {filtered.map((q) => {
                const on = inCat(q);
                const others = (q.gradeLevels || []).filter((g) => g !== category);
                return (
                  <tr
                    key={q.id}
                    onClick={() => setCompetitionCategory([q.id], category, !on)}
                    className={`cursor-pointer hover:bg-amber-50/50 ${on ? 'bg-emerald-50/50' : ''}`}
                  >
                    <td className="px-3 py-2">
                      {on ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-slate-300" />}
                    </td>
                    <td className="px-3 py-2 text-slate-800">{q.title}</td>
                    <td className="px-3 py-2 text-slate-600">{layerOf(q)}</td>
                    <td className="px-3 py-2 text-slate-600">{TASK_LABELS[taskTypeOf(q)] || 'Бусад'}</td>
                    <td className="px-3 py-2 font-mono">{q.points}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {others.map((g) => (g === '9' ? '9-р' : g === '12' ? '12-р' : g === 'teacher' ? 'Багш' : 'Баг')).join(', ') || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
