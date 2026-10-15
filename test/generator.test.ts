import { generateComprehensiveGisQuestions } from '../src/utils/gisAutoQuestionGenerator.ts';
import { processLayer } from '../src/lib/layerProcessor.ts';
import { packQuestions } from '../src/lib/contentLogic.ts';
import type { Feature, FeatureCollection } from 'geojson';

const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const kb = (n: number) => `${(n / 1024).toFixed(0)} KB`;

// Голууд: 60 гол × 30 сегмент → ArcGIS-ийн хүснэгт шиг. processLayer-ээр нэгтгэж, шүүж, хөнгөлнө
const rivers: Feature[] = [];
for (let r = 0; r < 70; r++) {
  let lon = 90 + rnd() * 20, lat = 44 + rnd() * 6;
  for (let s = 0; s < 30; s++) {
    const c = [[lon, lat]];
    for (let i = 0; i < 40; i++) { lon += 0.0016 * (0.8 + rnd() * 0.4); lat += 0.0016 * (rnd() - 0.5) * 0.8; c.push([lon, lat]); }
    rivers.push({ type: 'Feature', properties: { gid: r, name_mn: `Гол ${r}`, aimag_name: r % 2 ? 'Хөвсгөл' : 'Булган' }, geometry: { type: 'LineString', coordinates: c } });
  }
}
const riverRes = processLayer({ type: 'FeatureCollection', features: rivers }, {
  mergeByField: 'gid', collectFields: ['aimag_name'], keepProperties: ['gid', 'name_mn', 'aimag_name'], minLengthKm: 100, simplifyTolerance: 0.002,
});

// Нуурууд (полигон): 40 нуур, дугуй хэлбэртэй 400 цэгтэй
const lakes: Feature[] = [];
for (let k = 0; k < 40; k++) {
  const cx = 90 + rnd() * 20, cy = 44 + rnd() * 6, rad = 0.05 + rnd() * 0.3, ring: number[][] = [];
  for (let i = 0; i < 400; i++) { const a = (i / 400) * 2 * Math.PI; const rr = rad * (0.85 + rnd() * 0.3); ring.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); }
  ring.push(ring[0]);
  lakes.push({ type: 'Feature', properties: { name_mn: `Нуур ${k}` }, geometry: { type: 'Polygon', coordinates: [ring] } });
}
const lakeRes = processLayer({ type: 'FeatureCollection', features: lakes }, { keepProperties: ['name_mn'], simplifyTolerance: 0.002 });

const mk = (id: string, name: string, res: typeof riverRes, geometryType: any) => ({
  id, name, visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType,
  featureCount: res.collection.features.length, geojson: res.collection, nameField: 'name_mn', createdAt: new Date().toISOString(),
});
const layers = [mk('l1', 'Гол мөрөн', riverRes, 'LineString'), mk('l2', 'Нуур', lakeRes, 'Polygon')] as any[];
console.log(`Голын давхарга: ${riverRes.stats.featuresAfter} гол, ${kb(riverRes.stats.bytesAfter)}; нуур: ${lakeRes.stats.featuresAfter}, ${kb(lakeRes.stats.bytesAfter)}`);

const qs = generateComprehensiveGisQuestions({ layers } as any);
const sizes = qs.map((q) => new TextEncoder().encode(JSON.stringify(q)).length);
const total = sizes.reduce((a, b) => a + b, 0);
const byType = new Map<string, number>();
qs.forEach((q: any) => byType.set(q.type, (byType.get(q.type) ?? 0) + 1));
console.log('Төрөл тус бүрийн асуулт:', Object.fromEntries(byType));
console.log(`Нийт ${qs.length} асуулт, ${kb(total)}; хамгийн том асуулт ${kb(Math.max(...sizes))}`);

const packs = packQuestions(qs as any);
const packBytes = packs.map((p) => new TextEncoder().encode(JSON.stringify(p)).length);
console.log(`Багц: ${packs.length}, хамгийн том багц ${kb(Math.max(...packBytes))}`);

assert(qs.length > 0, 'давхаргуудаас асуулт үүссэн');
assert(qs.every((q: any) => Array.isArray(q.gradeLevels) && q.gradeLevels.length === 0), 'үүсгэсэн даалгавар ангилалгүй: зөвхөн Сорилд орно, уралдаанд админ сонгоно');
assert(packBytes.every((b) => b < 1_000_000), 'бүх багц Firestore-ийн 1 МБ-д багтсан');
assert(total < 8_000_000, 'нийт сан 8 MB-аас бага (сурагч бүр нэг удаа татах хэмжээ)');

// ---- Давхаргын нэр солих: бүх төрлийн даалгавар шинэ нэрээр харагдах ёстой ----
import { renameLayerInQuestions, layerIdFromFeatureId } from '../src/lib/contentLogic.ts';
const cities: Feature[] = Array.from({ length: 25 }, (_, i) => ({
  type: 'Feature', properties: { name_mn: `Хот ${i}` }, geometry: { type: 'Point', coordinates: [100 + i * 0.4, 45 + (i % 5) * 0.3] },
}));
const cityRes = processLayer({ type: 'FeatureCollection', features: cities }, { keepProperties: ['name_mn'] });
const layers3 = [...layers, mk('l3', 'Хотууд', cityRes, 'Point')] as any[];
const all = generateComprehensiveGisQuestions({ layers: layers3 } as any);
const kinds = new Set(all.map((q: any) => q.gisAutoTaskType));
console.log('Бүх төрлөөр үүсгэсэн:', all.length, 'асуулт; даалгаврын төрөл:', Array.from(kinds).join(', '));

const OLD = 'Нуур', NEW = 'Усан сан (шинэ нэр)';
const target = all.filter((q: any) => q.shpContourData?.layerName === OLD || q.mapPinData?.subCategory === OLD || layerIdFromFeatureId(q.shpContourData?.featureId) === 'l2');
const renamed = renameLayerInQuestions(all as any[], 'l2', OLD, NEW);
const stale = (renamed as any[]).filter((q) => {
  const hit = (t: any) => typeof t === 'string' && t.includes(`${OLD}`) && !t.includes(NEW);
  return q.shpContourData?.layerName === OLD || q.mapPinData?.subCategory === OLD || (q.shpContourData?.hints || []).some(hit);
});
assert(target.length > 0, `нууры давхаргын ${target.length} асуулт олдсон`);
assert(stale.length === 0, 'нэр солих үед хуучин нэр бүхий асуулт үлдээгүй (layerName, hints, subCategory)');
assert((renamed as any[]).filter((q) => q.shpContourData?.layerName === NEW).length > 0, 'шинэ нэр асуултад бичигдсэн');
const other = (renamed as any[]).filter((q, i) => !target.includes(all[i]));
assert(other.every((q: any, i) => JSON.stringify(q) === JSON.stringify(all.filter((x) => !target.includes(x))[i])), 'бусад давхаргын асуулт өөрчлөгдөөгүй');
