import area from '@turf/area';
import length from '@turf/length';
import simplify from '@turf/simplify';
import bbox from '@turf/bbox';
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson';

export type GeometryKind = 'line' | 'polygon' | 'point';

export interface ProcessOptions {
  /** Шугаман объект: энэ уртаас (км) богино бол хасна. Жишээ: 100 */
  minLengthKm?: number;
  /** Полигон: энэ талбайгаас (км²) бага бол хасна */
  minAreaKm2?: number;
  /** Нэрээр нь нэгтгэх талбар (жишээ нь 'NAME'). Нэг гол олон хэсэгт хуваагдсан байдаг тул шүүхээс өмнө нэгтгэнэ */
  mergeByField?: string;
  /** Нэргүй (хоосон) объектыг хасах эсэх (mergeByField-тэй хамт) */
  dropUnnamed?: boolean;
  /** Нэгтгэхдээ эдгээр талбарын ялгаатай утгуудыг жагсаалт болгон цуглуулна. Жишээ: ['aimag_name'] → properties.aimag_name = ['Булган','Хөвсгөл'] */
  collectFields?: string[];
  /** Хамгийн том N объектыг л үлдээх (сонголттой) */
  keepTop?: number;
  /** Simplify-ийн хүлцэл, градус (0.001 ≈ 100м). Анхдагч 0.002 */
  simplifyTolerance?: number;
  /** Координатын аравтын орон. Анхдагч 5 (~1м) */
  precision?: number;
  /** Хадгалах properties-ийн жагсаалт. Хоосон бол бүгдийг хадгална */
  keepProperties?: string[];
}

export interface ProcessStats {
  kind: GeometryKind;
  featuresBefore: number;
  featuresAfter: number;
  bytesBefore: number;
  bytesAfter: number;
  bbox: [number, number, number, number] | null;
  droppedBelowThreshold: number;
}

export interface ProcessResult {
  collection: FeatureCollection;
  stats: ProcessStats;
}

function detectKind(features: Feature[]): GeometryKind {
  for (const f of features) {
    const t = f.geometry?.type;
    if (!t) continue;
    if (t.includes('Polygon')) return 'polygon';
    if (t.includes('LineString')) return 'line';
    if (t.includes('Point')) return 'point';
  }
  return 'point';
}

function roundCoords(c: any, p: number): any {
  if (typeof c === 'number') return Number(c.toFixed(p));
  return c.map((x: any) => roundCoords(x, p));
}

function lineParts(g: Geometry): Position[][] {
  if (g.type === 'LineString') return [g.coordinates];
  if (g.type === 'MultiLineString') return g.coordinates;
  return [];
}

function addCollected(sets: Map<string, Set<string>>, props: any, fields: string[]) {
  for (const k of fields) {
    const v = props?.[k];
    if (v == null || String(v).trim() === '') continue;
    const set = sets.get(k) ?? new Set<string>();
    set.add(String(v).trim());
    sets.set(k, set);
  }
}

function collectedProps(sets: Map<string, Set<string>>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [k, set] of sets) out[k] = Array.from(set).sort((a, b) => a.localeCompare(b, 'mn'));
  return out;
}

/** Нэг гол олон сегментэд хуваагдсан бол нэг MultiLineString болгон нэгтгэнэ */
function mergeLinesByField(features: Feature[], field: string, dropUnnamed: boolean, collect: string[]): Feature[] {
  const groups = new Map<string, { props: any; parts: Position[][]; sets: Map<string, Set<string>> }>();
  const loose: Feature[] = [];
  for (const f of features) {
    if (!f.geometry) continue;
    const raw = f.properties?.[field];
    const name = raw == null ? '' : String(raw).trim();
    if (!name) {
      if (!dropUnnamed) loose.push(f);
      continue;
    }
    const g = groups.get(name) ?? { props: f.properties, parts: [] as Position[][], sets: new Map<string, Set<string>>() };
    g.parts.push(...lineParts(f.geometry));
    addCollected(g.sets, f.properties, collect);
    groups.set(name, g);
  }
  const merged: Feature[] = [];
  for (const [, g] of groups) {
    if (g.parts.length === 0) continue;
    merged.push({
      type: 'Feature',
      properties: { ...g.props, ...collectedProps(g.sets) },
      geometry: g.parts.length === 1
        ? { type: 'LineString', coordinates: g.parts[0] }
        : { type: 'MultiLineString', coordinates: g.parts },
    });
  }
  return merged.concat(loose);
}

function mergePolygonsByField(features: Feature[], field: string, dropUnnamed: boolean, collect: string[]): Feature[] {
  const groups = new Map<string, { props: any; polys: Position[][][]; sets: Map<string, Set<string>> }>();
  const loose: Feature[] = [];
  for (const f of features) {
    if (!f.geometry) continue;
    const raw = f.properties?.[field];
    const name = raw == null ? '' : String(raw).trim();
    if (!name) {
      if (!dropUnnamed) loose.push(f);
      continue;
    }
    const g = groups.get(name) ?? { props: f.properties, polys: [] as Position[][][], sets: new Map<string, Set<string>>() };
    addCollected(g.sets, f.properties, collect);
    if (f.geometry.type === 'Polygon') g.polys.push(f.geometry.coordinates);
    else if (f.geometry.type === 'MultiPolygon') g.polys.push(...f.geometry.coordinates);
    groups.set(name, g);
  }
  const merged: Feature[] = [];
  for (const [, g] of groups) {
    if (g.polys.length === 0) continue;
    merged.push({
      type: 'Feature',
      properties: { ...g.props, ...collectedProps(g.sets) },
      geometry: g.polys.length === 1
        ? { type: 'Polygon', coordinates: g.polys[0] }
        : { type: 'MultiPolygon', coordinates: g.polys },
    });
  }
  return merged.concat(loose);
}

export function processLayer(input: FeatureCollection, opts: ProcessOptions = {}): ProcessResult {
  const precision = opts.precision ?? 5;
  const tolerance = opts.simplifyTolerance ?? 0.002;
  const bytesBefore = JSON.stringify(input).length;
  const featuresBefore = input.features.length;

  let features = input.features.filter((f) => f && f.geometry);
  const kind = detectKind(features);

  if (opts.mergeByField) {
    if (kind === 'line') features = mergeLinesByField(features, opts.mergeByField, !!opts.dropUnnamed, opts.collectFields ?? []);
    else if (kind === 'polygon') features = mergePolygonsByField(features, opts.mergeByField, !!opts.dropUnnamed, opts.collectFields ?? []);
  }

  // Хэмжээгээр нь тооцоолж шүүх
  let dropped = 0;
  const measured: { f: Feature; size: number }[] = [];
  for (const f of features) {
    let size = 0;
    if (kind === 'line') size = length(f as any, { units: 'kilometers' });
    else if (kind === 'polygon') size = area(f as any) / 1_000_000; // км²
    const min = kind === 'line' ? opts.minLengthKm : kind === 'polygon' ? opts.minAreaKm2 : undefined;
    if (min !== undefined && size < min) {
      dropped++;
      continue;
    }
    measured.push({ f, size });
  }

  measured.sort((a, b) => b.size - a.size);
  const limited = opts.keepTop ? measured.slice(0, opts.keepTop) : measured;

  const out: Feature[] = limited.map(({ f, size }, i) => {
    let g: Feature = f;
    if (kind !== 'point' && tolerance > 0) {
      g = simplify(f as any, { tolerance, highQuality: false, mutate: false }) as Feature;
    }
    const props: Record<string, any> = {};
    const src = f.properties ?? {};
    const keys = opts.keepProperties?.length ? opts.keepProperties : Object.keys(src);
    for (const k of keys) if (k in src) props[k] = src[k];
    if (kind === 'line') props._lengthKm = Math.round(size);
    if (kind === 'polygon') props._areaKm2 = Math.round(size);
    return {
      type: 'Feature',
      id: i, // featureId: асуулт нь геометрийг давхарга дотроос энэ ID-аар хайна
      properties: props,
      geometry: { ...g.geometry, coordinates: roundCoords((g.geometry as any).coordinates, precision) } as Geometry,
    };
  });

  const collection: FeatureCollection = { type: 'FeatureCollection', features: out };
  const bytesAfter = JSON.stringify(collection).length;
  return {
    collection,
    stats: {
      kind,
      featuresBefore,
      featuresAfter: out.length,
      bytesBefore,
      bytesAfter,
      bbox: out.length ? (bbox(collection) as [number, number, number, number]) : null,
      droppedBelowThreshold: dropped,
    },
  };
}

/**
 * Firestore-ийн нэг баримт 1 MiB хүртэл. Хэтэрвэл мөр хэлбэрээр хэсэглэнэ.
 * Монгол үсэг UTF-8-д 2 байт тул аюулгүй зайтай (700 KB) хуваана.
 */
export function chunkJson(json: string, maxBytes = 700_000): string[] {
  const enc = new TextEncoder();
  if (enc.encode(json).length <= maxBytes) return [json];
  const chunks: string[] = [];
  let start = 0;
  const step = Math.floor(maxBytes / 2); // дээд тал нь 2 байт/тэмдэгт
  while (start < json.length) {
    chunks.push(json.slice(start, start + step));
    start += step;
  }
  return chunks;
}

export const joinChunks = (chunks: string[]) => chunks.join('');
