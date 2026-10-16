import React, { useMemo, useState } from 'react';
import { Palette } from 'lucide-react';
import type { ActiveGisLayer } from '../types';
import { listCategoricalFields, uniqueValues, autoColorMap, buildPalette } from '../utils/layerColors';

interface Props {
  layer: ActiveGisLayer;
  onChange: (updates: Partial<ActiveGisLayer>) => void;
}

/** Полигоныг атрибутын утгаар нь өөр өөр өнгөөр дүүргэх тохиргоо (Вектор / SHP сан). */
export const CategoryColorEditor: React.FC<Props> = ({ layer, onChange }) => {
  const fields = useMemo(() => listCategoricalFields(layer.geojson), [layer.geojson]);
  const [showAll, setShowAll] = useState(false);
  const active = layer.colorByField;
  const values = useMemo(() => (active ? uniqueValues(layer.geojson, active) : []), [layer.geojson, active]);

  if (fields.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
        <Palette className="mr-1 inline h-3.5 w-3.5" />
        Өнгөөр ангилах боломжтой багана олдсонгүй (2-оос олон, гэхдээ обьект бүрт өөр биш утгатай багана хэрэгтэй).
      </div>
    );
  }

  const choose = (field: string) => {
    if (!field) {
      onChange({ colorByField: undefined, colorMap: undefined });
      return;
    }
    onChange({ colorByField: field, colorMap: autoColorMap(layer.geojson, field) });
  };

  const shown = showAll ? values : values.slice(0, 12);

  return (
    <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-3 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-violet-900">
        <Palette className="h-4 w-4" /> Агуулгаар нь өөр өөр өнгөөр дүүргэх
      </div>
      <select
        value={active || ''}
        onChange={(e) => choose(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
      >
        <option value="">Нэг өнгөөр (ангилахгүй)</option>
        {fields.map((f) => (
          <option key={f.field} value={f.field}>
            {f.field} ({f.unique} ялгаатай утга)
          </option>
        ))}
      </select>

      {active && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ colorMap: autoColorMap(layer.geojson, active) })}
              className="rounded-md border border-violet-300 bg-white px-2 py-1 font-semibold text-violet-800 hover:bg-violet-100 cursor-pointer"
            >
              Өнгийг дахин оноох
            </button>
            <button
              type="button"
              onClick={() => {
                const pal = buildPalette(values.length).sort(() => Math.random() - 0.5);
                onChange({ colorMap: Object.fromEntries(values.map((v, i) => [v.value, pal[i]])) });
              }}
              className="rounded-md border border-violet-300 bg-white px-2 py-1 font-semibold text-violet-800 hover:bg-violet-100 cursor-pointer"
            >
              Холих
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {shown.map((v) => (
              <label key={v.value} className="flex items-center gap-2 rounded-md bg-white px-2 py-1 border border-slate-200">
                <input
                  type="color"
                  value={layer.colorMap?.[v.value] || layer.fillColor}
                  onChange={(e) => onChange({ colorMap: { ...(layer.colorMap || {}), [v.value]: e.target.value } })}
                  className="h-6 w-8 shrink-0 cursor-pointer rounded border border-slate-300 p-0"
                />
                <span className="min-w-0 flex-1 truncate text-slate-800">{v.value}</span>
                <span className="shrink-0 text-slate-400">{v.count}</span>
              </label>
            ))}
          </div>
          {values.length > 12 && (
            <button type="button" onClick={() => setShowAll((x) => !x)} className="font-semibold text-violet-700 hover:underline cursor-pointer">
              {showAll ? 'Цөөн харуулах' : `Бүх ${values.length} утгыг харуулах`}
            </button>
          )}
          <p className="text-[10px] text-violet-900/70">
            Дүүргэлтийн нэг өнгө (доорх) нь энэ үед хэрэглэгдэхгүй, харин тунгалагшилтыг доорх гулсагчаар тохируулна.
          </p>
        </>
      )}
    </div>
  );
};
