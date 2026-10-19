import React, { useMemo, useState } from 'react';
import { Pencil, Trash2, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Question } from '../types';
import { BulkEditPanel } from './BulkEditPanel';
import { DraftReviewModal } from './DraftReviewModal';
import { groupQuestions, layerNameOf, typeLabelOf } from '../lib/questionGroups';

/**
 * Сорил хэсэгт хадгалагдсан бүх даалгаврыг төрлөөр нь олноор нь сонгож, асуултыг нэг дор засах.
 * Ганц даалгаврыг ч засч болно.
 */
export const QuestionBankEditor: React.FC = () => {
  const { customQuestions, bulkEditQuestions, batchDeleteCustomQuestions } = useApp();
  const [layerFilter, setLayerFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Question | null>(null);

  const groups = useMemo(() => groupQuestions(customQuestions), [customQuestions]);
  const layers = useMemo(() => Array.from(new Set(customQuestions.map(layerNameOf))).sort(), [customQuestions]);
  const types = useMemo(() => Array.from(new Set(customQuestions.map(typeLabelOf))).sort(), [customQuestions]);

  const filtered = customQuestions.filter(
    (q) =>
      (layerFilter === 'all' || layerNameOf(q) === layerFilter) &&
      (typeFilter === 'all' || typeLabelOf(q) === typeFilter) &&
      (!search.trim() || q.title.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const targets = customQuestions.filter((q) => selected.has(q.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((q) => selected.has(q.id));

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const selectIds = (ids: string[]) => setSelected(new Set(ids));

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-violet-700" />
          <h3 className="text-sm font-black text-slate-900">Даалгавар засах (олноор)</h3>
          <span className="text-xs text-slate-500">Нийт {customQuestions.length} даалгавар</span>
        </div>
        <p className="text-xs leading-relaxed text-slate-600">
          Нэг төрлийн, нэг давхаргын даалгаврын асуулт ижил загвартай. Бүлгийг сонгоод асуултыг <strong>нэг удаа</strong> засахад бүх даалгавар өөр
          өөрийнхөө обьектийн нэртэйгээр шинэчлэгдэнэ.
        </p>

        <div className="flex flex-wrap gap-1.5">
          <span className="self-center text-xs font-semibold text-slate-600">Бүлэг сонгох:</span>
          {groups.map((g) => {
            const on = g.ids.length > 0 && g.ids.every((id) => selected.has(id)) && targets.length === g.ids.length;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => selectIds(g.ids)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold cursor-pointer ${on ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {g.label} ({g.ids.length})
              </button>
            );
          })}
          {groups.length === 0 && <span className="text-xs text-slate-500">Даалгавар алга. Эхлээд давхаргаас даалгавар бэлтгэнэ үү.</span>}
        </div>
      </div>

      {targets.length > 0 && (
        <BulkEditPanel
          targets={targets}
          scopeLabel={`сонгосон ${targets.length} даалгавар`}
          onApply={(fn) => bulkEditQuestions(targets.map((q) => q.id), fn)}
        />
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select value={layerFilter} onChange={(e) => setLayerFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <option value="all">Бүх давхарга</option>
            {layers.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
            <option value="all">Бүх төрөл</option>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Асуултаас хайх"
            className="rounded-lg border border-slate-200 px-2.5 py-1.5"
          />
          <div className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={() => selectIds(allFilteredSelected ? [] : filtered.map((q) => q.id))}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {allFilteredSelected ? 'Сонголтыг цуцлах' : `Шүүсэн ${filtered.length}-г сонгох`}
            </button>
            <button
              type="button"
              disabled={targets.length === 0}
              onClick={() => {
                if (confirm(`Сонгосон ${targets.length} даалгаврыг сангаас БҮР МӨСӨН устгах уу?`)) {
                  batchDeleteCustomQuestions(targets.map((q) => q.id));
                  setSelected(new Set());
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Устгах ({targets.length})
            </button>
          </div>
        </div>

        <div className="max-h-[520px] overflow-y-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="w-10 px-3 py-2"></th>
                <th className="px-3 py-2 font-semibold">Асуулт</th>
                <th className="px-3 py-2 font-semibold">Давхарга</th>
                <th className="px-3 py-2 font-semibold">Төрөл</th>
                <th className="px-3 py-2 font-semibold">Оноо</th>
                <th className="w-16 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                    Даалгавар олдсонгүй.
                  </td>
                </tr>
              )}
              {filtered.map((q) => {
                const on = selected.has(q.id);
                return (
                  <tr key={q.id} className={on ? 'bg-violet-50/60' : ''}>
                    <td className="px-3 py-2 cursor-pointer" onClick={() => toggle(q.id)}>
                      {on ? <CheckSquare className="h-4 w-4 text-violet-600" /> : <Square className="h-4 w-4 text-slate-300" />}
                    </td>
                    <td className="px-3 py-2 text-slate-800 cursor-pointer" onClick={() => toggle(q.id)}>
                      {q.title}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{layerNameOf(q)}</td>
                    <td className="px-3 py-2 text-slate-600">{typeLabelOf(q)}</td>
                    <td className="px-3 py-2 font-mono">{q.points}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setEditing(q)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Засах
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <DraftReviewModal
          title="Ганц даалгаврыг засах"
          initial={[editing]}
          confirmLabel="Хадгалах"
          onCancel={() => setEditing(null)}
          onConfirm={(qs) => {
            if (qs[0]) bulkEditQuestions([editing.id], () => qs[0]);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};
