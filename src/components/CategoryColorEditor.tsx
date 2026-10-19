import React, { useMemo, useState } from 'react';
import { Palette, Shuffle, RotateCcw } from 'lucide-react';
import type { ActiveGisLayer } from '../types';
import {
  listCategoricalFields, uniqueValues, autoColorMap, buildPalette, effectiveColorMode, makeFeatureColorFn, isPolygonFeature,
  type ColorMode,
} from '../utils/layerColors';
import { extractFeatureName } from '../utils/gisUtils';

interface Props {
  layer: ActiveGisLayer;
  onChange: (updates: Partial<ActiveGisLayer>) => void;
}

/**
 * Полигоны өнгө: анхдагчаар обьект бүр (нэр, талбай нь өөр) ӨӨР ӨӨР өнгөтэй, хил залгаа хөрш нь заавал өөр өнгөтэй.
 * Мөн нэг өнгө эсвэл баганын утгаар ангилах горим сонгож болно.
 */
export const CategoryColorEditor: React.FC<Props> = ({ layer, onChange }) => {
  const mode = effectiveColorMode(layer);
  const [showAll, setShowAll] = useState(false);
  const fields = useMemo(() => listCategoricalFields(layer.geojson), [layer.geojson]);
  const active = layer.colorByField;
  const values = useMemo(() => (active ? uniqueValues(layer.geojson, active) : []), [layer.geojson, active]);
  const colorFn = useMemo(() => makeFeatureColorFn(layer), [layer]);

  const features = useMemo(
    () =>
      (layer.geojson?.features ?? [])
        .map((f: any, i: number) => ({ f, i }))
        .filter((x: any) => isPolygonFeature(x.f)),
    [layer.geojson],
  );

  const setMode = (m: ColorMode) => {
    if (m === 'column') {
      const field = active || fields[0]?.field;
      onChange({ colorMode: 'column', colorByField: field, colorMap: field ? layer.colorMap ?? autoColorMap(layer.geojson, field) : undefined });
    } else {
      onChange({ colorMode: m });
    }
  };

  const radio = (m: ColorMode, label: string, hint: string, disabled = false) => (
    <label
      className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 cursor-pointer ${mode === m ? 'border-violet-500 bg-white' : 'border-slate-200 bg-white/60 hover:bg-white'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      <input type="radio" name={`colormode-${layer.id}`} checked={mode === m} disabled={disabled} onChange={() => setMode(m)} className="mt-0.5" />
      <span>
        <span className="block font-bold text-slate-800">{label}</span>
        <span className="block text-[10px] text-slate-500">{hint}</span>
      </span>
    </label>
  );

  const shownFeatures = showAll ? features : features.slice(0, 10);
  const shownValues = showAll ? values : values.slice(0, 12);

  return (
    <div className="space-y-2.5 rounded-xl border border-violet-200 bg-violet-50/50 p-3 text-xs">
      <div className="flex items-center gap-1.5 font-bold text-violet-900">
        <Palette className="h-4 w-4" /> Дүүргэлтийн өнгө
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {radio('distinct', 'Обьект бүр өөр өнгө', 'Хөрш полигонууд өөр өнгөтэй (автомат)')}
        {radio('single', 'Нэг өнгө', 'Бүх обьект ижил өнгөтэй')}
        {radio('column', 'Баганаар ангилах', 'Ижил утгатай обьект ижил өнгөтэй', fields.length === 0)}
      </div>

      {mode === 'distinct' && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ colorSeed: Math.floor(Math.random() * 100000) + 1, featureColorOverrides: undefined })}
              className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-white px-2 py-1 font-semibold text-violet-800 hover:bg-violet-100 cursor-pointer"
            >
              <Shuffle className="h-3.5 w-3.5" /> Өнгийг дахин холих
            </button>
            {(layer.featureColorOverrides && Object.keys(layer.featureColorOverrides).length > 0) || layer.colorSeed ? (
              <button
                type="button"
                onClick={() => onChange({ colorSeed: undefined, featureColorOverrides: undefined })}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Анхны өнгө
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {shownFeatures.map(({ f, i }: any) => (
              <label key={i} className="flex items-center gap-2 rounded-md bg-white px-2 py-1 border border-slate-200">
                <input
                  type="color"
                  value={colorFn(f)}
                  onChange={(e) => onChange({ featureColorOverrides: { ...(layer.featureColorOverrides || {}), [String(i)]: e.target.value } })}
                  className="h-6 w-8 shrink-0 cursor-pointer rounded border border-slate-300 p-0"
                />
                <span className="min-w-0 flex-1 truncate text-slate-800">{extractFeatureName(f.properties || {}, i, layer.nameField)}</span>
              </label>
            ))}
          </div>
          {features.length > 10 && (
            <button type="button" onClick={() => setShowAll((x) => !x)} className="font-semibold text-violet-700 hover:underline cursor-pointer">
              {showAll ? 'Цөөн харуулах' : `Бүх ${features.length} обьектийг харуулах`}
            </button>
          )}
        </>
      )}

      {mode === 'column' && (
        <>
          <select
            value={active || ''}
            onChange={(e) => {
              const field = e.target.value;
              onChange({ colorMode: 'column', colorByField: field || undefined, colorMap: field ? autoColorMap(layer.geojson, field) : undefined });
            }}
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
          >
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
                {shownValues.map((v) => (
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
            </>
          )}
        </>
      )}

      {mode === 'single' && <p className="text-[10px] text-violet-900/70">Дүүргэлтийн нэг өнгийг доорх «Дүүргэх өнгө»-өөс сонгоно.</p>}
    </div>
  );
};
