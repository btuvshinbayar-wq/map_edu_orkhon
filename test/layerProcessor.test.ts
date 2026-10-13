import { processLayer, chunkJson, joinChunks } from '../src/lib/layerProcessor.ts';
import type { Feature, FeatureCollection } from 'geojson';

let seed = 42;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

// Урсгалыг ~нарийн цэгээр (шовгор бус, жигд) үүсгэнэ
function walk(lon: number, lat: number, pts: number, step: number): number[][] {
  const out = [[lon, lat]];
  for (let i = 0; i < pts; i++) {
    lon += step * (0.8 + rnd() * 0.4);
    lat += step * (rnd() - 0.5) * 0.8;
    out.push([+lon.toFixed(12), +lat.toFixed(12)]);
  }
  return out;
}

const features: Feature[] = [];
// 60 урт гол: тус бүр 30 сегментэд хуваагдсан (сегмент бүр ~7км, нийт ~200км)
for (let r = 0; r < 60; r++) {
  let lon = 90 + rnd() * 20, lat = 44 + rnd() * 6;
  for (let s = 0; s < 30; s++) {
    const line = walk(lon, lat, 40, 0.0016);
    features.push({ type: 'Feature', properties: { NAME: `Гол ${r}`, ID: r * 100 + s }, geometry: { type: 'LineString', coordinates: line } });
    [lon, lat] = line[line.length - 1] as [number, number];
  }
}
// 8,900 богино горхи (нэгтгэсэн ч <100км)
for (let k = 0; k < 8900; k++) {
  const line = walk(90 + rnd() * 20, 44 + rnd() * 6, 25, 0.0015);
  features.push({ type: 'Feature', properties: { NAME: `Горхи ${k}` }, geometry: { type: 'LineString', coordinates: line } });
}
// 40 нэргүй урт-ойролцоо сегмент
for (let k = 0; k < 40; k++) features.push({ type: 'Feature', properties: { NAME: '' }, geometry: { type: 'LineString', coordinates: walk(95, 46, 30, 0.0015) } });

const fc: FeatureCollection = { type: 'FeatureCollection', features };
const t0 = Date.now();
const res = processLayer(fc, { mergeByField: 'NAME', dropUnnamed: true, minLengthKm: 100, simplifyTolerance: 0.002, precision: 5 });
const ms = Date.now() - t0;
const s = res.stats;
console.log(`гол: ${s.featuresBefore} → ${s.featuresAfter} объект; ${(s.bytesBefore/1024/1024).toFixed(2)} MB → ${(s.bytesAfter/1024).toFixed(0)} KB; ${ms} мс`);
assert(s.kind === 'line', 'шугаман төрлийг таньсан');
assert(s.featuresAfter === 60, '60 урт гол үлдсэн (сегментүүдийг нэрээр нэгтгэсний дараа)');
assert(res.collection.features.every(f => (f.properties as any)._lengthKm >= 100), 'үлдсэн бүр ≥100 км');
assert(s.bytesAfter < 1_000_000, 'Firestore-ийн 1 MiB-д багтана');
assert(!JSON.stringify(res.collection).match(/\d\.\d{6,}/), 'координат 5 оронд тоймлогдсон');

// Нэгтгэхгүйгээр шууд шүүвэл голууд алдагдахыг харуулах (7км сегмент < 100км)
const naive = processLayer(fc, { minLengthKm: 100 });
assert(naive.stats.featuresAfter === 0, 'нэгтгэхгүй бол сегмент тус бүр <100км тул бүгд алдагдана (иймээс нэгтгэх шаардлагатай)');

// Полигон: талбайгаар шүүх
const poly = (cx: number, cy: number, w: number): Feature => ({ type: 'Feature', properties: { NAME: `Нуур ${cx.toFixed(2)}` }, geometry: { type: 'Polygon', coordinates: [[[cx,cy],[cx+w,cy],[cx+w,cy+w],[cx,cy+w],[cx,cy]]] } });
const lakes: FeatureCollection = { type: 'FeatureCollection', features: [poly(100,47,0.5), poly(101,47,0.05), poly(102,47,0.2), poly(103,47,0.01)] };
const pr = processLayer(lakes, { minAreaKm2: 100 });
console.log('нуур:', pr.stats.featuresBefore, '→', pr.stats.featuresAfter, pr.collection.features.map(f => (f.properties as any)._areaKm2 + ' км²').join(', '));
assert(pr.stats.kind === 'polygon' && pr.stats.featuresAfter === 2, '≥100км² 2 нуур үлдсэн');
assert(pr.collection.features[0].id === 0, 'featureId (id) оноогдсон, том нь эхэнд');

// Хэсэглэлт
const big = 'Мөнгөн'.repeat(200_000);
const ch = chunkJson(big);
const enc = new TextEncoder();
assert(ch.length > 1 && ch.every(c => enc.encode(c).length < 1_048_576 * 0.95), `том JSON ${ch.length} хэсэгт хуваагдсан, хэсэг бүр <1 MiB`);
assert(joinChunks(ch) === big, 'хэсгүүдийг буцааж нийлүүлэхэд ижил');

// ArcGIS-ийн хүснэгт шиг: нэг гол сум бүрээр таслагдсан, gid ижил, аймаг өөр өөр
const mk = (gid: number, nm: string, aimag: string, len: number, c: number[][]): Feature => ({
  type: 'Feature', properties: { gid, name_mn: nm, aimag_name: aimag, glength: len, Area: 484760 },
  geometry: { type: 'LineString', coordinates: c },
});
const arc: FeatureCollection = { type: 'FeatureCollection', features: [
  mk(554, 'Агарын гол', 'Хөвсгөл', 93, [[100,50],[100.1,50.1]]),
  mk(554, 'Агарын гол', 'Хөвсгөл', 93, [[100.1,50.1],[100.2,50.15]]),
  mk(554, 'Агарын гол', 'Булган', 93, [[100.2,50.15],[100.3,50.2]]),
  mk(6094, 'Аваргын гол', 'Булган', 73, [[104,49],[104.2,49.1]]),
] };
const ar = processLayer(arc, { mergeByField: 'gid', collectFields: ['aimag_name'], keepProperties: ['gid','name_mn','glength','aimag_name'], simplifyTolerance: 0 });
const r554 = ar.collection.features.find(f => (f.properties as any).gid === 554)!;
console.log('gid 554:', JSON.stringify(r554.properties));
assert(ar.stats.featuresAfter === 2, 'gid-ээр 4 сегмент → 2 гол болсон');
assert(JSON.stringify((r554.properties as any).aimag_name) === JSON.stringify(['Булган','Хөвсгөл']), 'аймгуудын жагсаалт цугласан');
assert(!('Area' in (r554.properties as any)), 'keepProperties-ээс гадна талбарууд хасагдсан');
