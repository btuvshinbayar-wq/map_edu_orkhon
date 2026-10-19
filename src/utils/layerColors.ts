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


// ===========================================================================
// Обьект бүрийг өөр өнгөөр дүүргэх (зураг дээрх аймгийн газрын зураг шиг):
// хөрш полигонууд (хил залгаа) ЗААВАЛ өөр өнгөтэй байхаар автоматаар оноодог.
// ===========================================================================

/** Ялгарах тод өнгөнүүд (аймгийн газрын зургийн палитр шиг) */
export const DISTINCT_PALETTE = [
  '#3aa655', '#e8478a', '#2f7fd6', '#e03b3b', '#f7a531',
  '#8e44ad', '#f4d03f', '#17a2a2', '#9c6b4e', '#7ed957',
];

type Ring = number[][];

function polygonRings(geom: any): Ring[] {
  if (!geom) return [];
  if (geom.type === 'Polygon') return geom.coordinates as Ring[];
  if (geom.type === 'MultiPolygon') return (geom.coordinates as Ring[][]).flat();
  return [];
}

export const isPolygonFeature = (f: any): boolean => f?.geometry?.type === 'Polygon' || f?.geometry?.type === 'MultiPolygon';

/**
 * Хөрш полигонуудыг олно: хилийн цэгүүдийг `tol` градус дотор нь тааруулна.
 * Нэг хилийн хоёр тал өөр өөр нягтралтай цэгтэй байж болох тул хилийг `tol` зайтай цэгээр нягтруулж шалгана.
 */
export function computeAdjacency(fc: FeatureCollection | undefined, tol = 0.004): number[][] {
  const feats = fc?.features ?? [];
  const adj: Set<number>[] = feats.map(() => new Set<number>());
  const cells = new Map<string, Set<number>>();
  const key = (x: number, y: number) => `${Math.floor(x / tol)},${Math.floor(y / tol)}`;

  feats.forEach((f, idx) => {
    for (const ring of polygonRings(f.geometry)) {
      for (let i = 0; i < ring.length; i++) {
        const [x1, y1] = ring[i];
        const nxt = ring[i + 1];
        let steps = 1;
        if (nxt) steps = Math.min(2000, Math.max(1, Math.ceil(Math.max(Math.abs(nxt[0] - x1), Math.abs(nxt[1] - y1)) / tol)));
        for (let k = 0; k < steps; k++) {
          const x = nxt ? x1 + ((nxt[0] - x1) * k) / steps : x1;
          const y = nxt ? y1 + ((nxt[1] - y1) * k) / steps : y1;
          const ck = key(x, y);
          let set = cells.get(ck);
          if (!set) { set = new Set<number>(); cells.set(ck, set); }
          set.add(idx);
        }
      }
    }
  });

  for (const [ck, owners] of cells) {
    const [cx, cy] = ck.split(',').map(Number);
    const near = new Set<number>(owners);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      cells.get(`${cx + dx},${cy + dy}`)?.forEach((o) => near.add(o));
    }
    for (const a of owners) for (const b of near) if (a !== b) { adj[a].add(b); adj[b].add(a); }
  }
  return adj.map((s) => Array.from(s));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** seed=0 бол палитр хэвээр, бусад үед тогтмол (seed-ээр) холигдоно */
export function seededPalette(seed: number, extra = 0): string[] {
  const base = [...DISTINCT_PALETTE, ...buildPalette(DISTINCT_PALETTE.length + extra).slice(DISTINCT_PALETTE.length)];
  if (!seed) return base;
  const rnd = mulberry32(seed);
  const out = [...base];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Полигон бүрт өнгө ононо. Хөрш бүр өөр өнгөтэй (greedy graph coloring), хамгийн олон хөрштэйгээс нь эхэлнэ.
 * Полигон биш обьект (цэг, шугам) нь null. Үр дүн нь тогтмол: хэрэглэгч бүрт ижил өнгө харагдана.
 */
export function assignDistinctColors(fc: FeatureCollection | undefined, seed = 0): (string | null)[] {
  const feats = fc?.features ?? [];
  const out: (string | null)[] = feats.map(() => null);
  const polyIdx = feats.map((f, i) => (isPolygonFeature(f) ? i : -1)).filter((i) => i >= 0);
  if (polyIdx.length === 0) return out;

  // Хэт олон полигон, эсвэл координат градус биш (метрийн проекц гэх мэт, хэт том утгатай) бол хөршийг тооцохгүй
  // (хөлдөхөөс сэргийлнэ), палитрыг дараалан хуваарилна.
  let maxAbs = 0;
  for (const i of polyIdx) for (const ring of polygonRings(feats[i].geometry)) { const p0 = ring[0]; if (p0) maxAbs = Math.max(maxAbs, Math.abs(p0[0]), Math.abs(p0[1])); }
  const tooMany = polyIdx.length > 4000 || maxAbs > 1000;
  const adj = tooMany ? feats.map(() => [] as number[]) : computeAdjacency(fc);
  const order = [...polyIdx].sort((a, b) => adj[b].length - adj[a].length || a - b);
  const maxDeg = Math.max(0, ...polyIdx.map((i) => adj[i].length));
  const palette = seededPalette(seed, Math.max(0, maxDeg + 1 - DISTINCT_PALETTE.length));
  const colorIdx = new Map<number, number>();

  if (tooMany) {
    polyIdx.forEach((i, n) => out[i] = palette[n % palette.length]);
    return out;
  }
  // Хөршөөс өөр өнгөнүүдээс хамгийн цөөн ашиглагдсаныг сонгоно: газрын зураг 4 өнгөөр биш, палитрын бүх өнгөөр баялаг харагдана
  const usage: number[] = [];
  const spread = Math.min(DISTINCT_PALETTE.length, palette.length);
  for (const i of order) {
    const used = new Set<number>();
    for (const n of adj[i]) if (colorIdx.has(n)) used.add(colorIdx.get(n)!);
    let best = -1;
    for (let c = 0; c < spread; c++) {
      if (used.has(c)) continue;
      if (best === -1 || (usage[c] ?? 0) < (usage[best] ?? 0)) best = c;
    }
    if (best === -1) { best = spread; while (used.has(best)) best++; } // 10-аас олон өөр өнгөтэй хөрштэй ховор тохиолдол
    colorIdx.set(i, best);
    usage[best] = (usage[best] ?? 0) + 1;
    out[i] = palette[best % palette.length];
  }
  return out;
}

export type ColorMode = 'distinct' | 'single' | 'column';

export interface ColorableLayer {
  fillColor: string;
  geometryType?: string;
  geojson?: FeatureCollection | any;
  colorMode?: ColorMode;
  colorSeed?: number;
  colorByField?: string;
  colorMap?: Record<string, string>;
  featureColorOverrides?: Record<string, string>;
}

/** Давхаргын өнгөний горим: тохируулаагүй бол полигон давхарга өөрөө "обьект бүр өөр өнгөтэй" */
export function effectiveColorMode(layer: ColorableLayer): ColorMode {
  if (layer.colorMode) return layer.colorMode;
  if (layer.colorByField) return 'column';
  const t = layer.geometryType || '';
  const polygonish = t.includes('Polygon') || (t === 'Mixed' && (layer.geojson?.features ?? []).some(isPolygonFeature));
  return polygonish ? 'distinct' : 'single';
}

const distinctCache = new WeakMap<object, Map<number, { colors: (string | null)[]; index: Map<any, number> }>>();

/** Нэг давхаргын обьект бүрийн дүүргэлтийн өнгө буцаах функц */
export function makeFeatureColorFn(layer: ColorableLayer): (feature: any) => string {
  const mode = effectiveColorMode(layer);
  if (mode === 'single') return () => layer.fillColor;
  if (mode === 'column') return (f) => featureFillColor(layer, f);

  const geo = layer.geojson as FeatureCollection | undefined;
  if (!geo) return () => layer.fillColor;
  const seed = layer.colorSeed ?? 0;
  let perSeed = distinctCache.get(geo);
  if (!perSeed) { perSeed = new Map(); distinctCache.set(geo, perSeed); }
  let entry = perSeed.get(seed);
  if (!entry) {
    entry = { colors: assignDistinctColors(geo, seed), index: new Map(geo.features.map((f, i) => [f, i])) };
    perSeed.set(seed, entry);
  }
  const { colors, index } = entry;
  const overrides = layer.featureColorOverrides;
  return (f) => {
    const i = index.get(f);
    if (i === undefined) return layer.fillColor;
    return overrides?.[String(i)] ?? colors[i] ?? layer.fillColor;
  };
}
