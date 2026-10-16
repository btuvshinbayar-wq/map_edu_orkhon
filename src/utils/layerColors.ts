import type { FeatureCollection } from 'geojson';

/** Давхаргын атрибутын утгаар (жишээ нь "төрөл", "аймаг") полигоныг өөр өөр өнгөөр дүүргэх туслах функцүүд. */

export const UNKNOWN_VALUE = 'Тодорхойгүй';

export interface ValueCount { value: string; count: number }
export interface FieldInfo { field: string; unique: number }

const BASE_COLORS = [
  '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac',
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#17becf', '#bcbd22', '#7f7f7f',
];

/** n ялгаатай өнгө. Эхний 20 нь тогтмол хос палитр, түүнээс олон бол алтан өнцгөөр hue тарааж үүсгэнэ. */
export function buildPalette(n: number): string[] {
  const out = BASE_COLORS.slice(0, Math.min(n, BASE_COLORS.length));
  for (let i = BASE_COLORS.length; i < n; i++) {
    const hue = Math.round((i * 137.508) % 360);
    const sat = 60 + (i % 3) * 10;
    const light = 45 + ((i >> 1) % 3) * 8;
    out.push(hslToHex(hue, sat, light));
  }
  return out;
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

export const valueKey = (v: unknown): string => {
  if (v === null || v === undefined) return UNKNOWN_VALUE;
  const s = String(v).trim();
  return s === '' ? UNKNOWN_VALUE : s;
};

/** Тухайн баганын ялгаатай утгууд ба тоо (олон тохиолдсоноос нь эхэлж) */
export function uniqueValues(fc: FeatureCollection | undefined, field: string): ValueCount[] {
  const m = new Map<string, number>();
  for (const f of fc?.features ?? []) {
    const k = valueKey(f.properties?.[field]);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'mn'));
}

/**
 * Өнгөөр ангилахад тохирох баганууд: 2-оос олон ялгаатай утгатай, гэхдээ хэт олон биш (анхдагчаар ≤ 60).
 * Обьект бүрт өөр утгатай (нэр, ID гэх мэт) багана өнгөөр ангилахад хэрэггүй тул хасна.
 */
export function listCategoricalFields(fc: FeatureCollection | undefined, maxUnique = 60): FieldInfo[] {
  const feats = fc?.features ?? [];
  if (feats.length === 0) return [];
  const fields = new Set<string>();
  feats.slice(0, 200).forEach((f) => Object.keys(f.properties ?? {}).forEach((k) => fields.add(k)));
  const out: FieldInfo[] = [];
  for (const field of fields) {
    const unique = uniqueValues(fc, field).length;
    if (unique >= 2 && unique <= maxUnique && unique < feats.length) out.push({ field, unique });
  }
  return out.sort((a, b) => a.unique - b.unique || a.field.localeCompare(b.field));
}

/** Утга тус бүрт өнгө оноосон map. `prev` дахь өмнөх өнгийг хадгална (админ гараар сольсныг алдахгүй). */
export function autoColorMap(fc: FeatureCollection | undefined, field: string, prev: Record<string, string> = {}): Record<string, string> {
  const values = uniqueValues(fc, field);
  const palette = buildPalette(values.length);
  const out: Record<string, string> = {};
  values.forEach((v, i) => { out[v.value] = prev[v.value] ?? palette[i]; });
  return out;
}

/** Обьектийн дүүргэлтийн өнгө: ангилал тохируулсан бол утгаар нь, үгүй бол давхаргын нэг өнгө. */
export function featureFillColor(
  layer: { fillColor: string; colorByField?: string; colorMap?: Record<string, string> },
  feature: { properties?: Record<string, unknown> | null } | undefined,
): string {
  if (!layer.colorByField || !layer.colorMap) return layer.fillColor;
  return layer.colorMap[valueKey(feature?.properties?.[layer.colorByField])] ?? layer.fillColor;
}
