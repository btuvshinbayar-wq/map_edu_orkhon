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

const qs = generateComprehensiveGisQuestions({ layers, gradeLevels: ['9', '12', 'teacher', 'team'] } as any);
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
assert(qs.every((q: any) => Array.isArray(q.gradeLevels) && q.gradeLevels.length > 0), 'асуулт бүр ангилалтай (9/12/багш/баг)');
assert(packBytes.every((b) => b < 1_000_000), 'бүх багц Firestore-ийн 1 МБ-д багтсан');
assert(total < 8_000_000, 'нийт сан 8 MB-аас бага (сурагч бүр нэг удаа татах хэмжээ)');
