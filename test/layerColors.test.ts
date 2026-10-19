import { buildPalette, uniqueValues, listCategoricalFields, autoColorMap, featureFillColor, UNKNOWN_VALUE } from '../src/utils/layerColors.ts';
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

const kinds = ['Нуур', 'Нуур', 'Хөв', 'Хөв', 'Хөв', 'Далай', null, ''];
const fc: any = { type: 'FeatureCollection', features: kinds.map((k, i) => ({
  type: 'Feature', properties: { name: `О${i}`, type: k, zone: i % 2 ? 'А' : 'Б', code: 'X' }, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
})) };

const uv = uniqueValues(fc, 'type');
assert(uv[0].value === 'Хөв' && uv[0].count === 3, 'утгууд олон тохиолдсоноос эрэмбэлэгдсэн');
assert(uv.some((v) => v.value === UNKNOWN_VALUE && v.count === 2), 'хоосон/null утга "Тодорхойгүй" болсон');
const fields = listCategoricalFields(fc).map((f) => f.field);
assert(fields.includes('type') && fields.includes('zone'), 'ангилахад тохирох баганууд олдсон');
assert(!fields.includes('name'), 'обьект бүрт өөр утгатай багана (нэр) хасагдсан');
assert(!fields.includes('code'), 'нэг л утгатай багана хасагдсан');

for (const n of [3, 20, 45, 120]) {
  const p = buildPalette(n);
  assert(p.length === n && new Set(p).size === n && p.every((c) => /^#[0-9a-f]{6}$/.test(c)), `${n} өнгө: бүгд ялгаатай, зөв HEX`);
}
const map = autoColorMap(fc, 'type');
assert(Object.keys(map).length === 4 && new Set(Object.values(map)).size === 4, '4 утга → 4 өөр өнгө');
const edited = { ...map, Нуур: '#123456' };
const again = autoColorMap(fc, 'type', edited);
assert(again.Нуур === '#123456', 'гараар сольсон өнгө дахин ангилахад хадгалагдсан');

const layer = { fillColor: '#999999', colorByField: 'type', colorMap: map };
assert(featureFillColor(layer, fc.features[0]) === map.Нуур, 'обьект утгынхаа өнгөөр дүүрнэ');
assert(featureFillColor(layer, fc.features[6]) === map[UNKNOWN_VALUE], 'null утга "Тодорхойгүй"-н өнгөөр');
assert(featureFillColor({ fillColor: '#999999' }, fc.features[0]) === '#999999', 'ангилал байхгүй бол хуучин нэг өнгө');
assert(featureFillColor({ ...layer, colorMap: {} }, fc.features[0]) === '#999999', 'өнгө оноогдоогүй утга нэг өнгөөр (алдаагүй)');

// ====== Обьект бүр өөр өнгө: хөрш полигонууд өөр өнгөтэй байх ======
import { assignDistinctColors, computeAdjacency, makeFeatureColorFn, effectiveColorMode, DISTINCT_PALETTE } from '../src/utils/layerColors.ts';

let seed = 11; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
// Бодит бүс нутгийн хилтэй адил: жигд бус торлолт. Хил залгаа полигонууд хилийн цэгийг хуваалцана.
const COLS = 30, ROWS = 20;
const lattice: number[][][] = Array.from({ length: ROWS + 1 }, (_, r) => Array.from({ length: COLS + 1 }, (_, c) => [100 + c * 0.2 + (rnd() - 0.5) * 0.12, 44 + r * 0.2 + (rnd() - 0.5) * 0.12]));
// Хилийн дундуур цэг нэмж (өөр өөр нягтралтай), тус бүр полигон хил дээрээ ӨӨРӨӨ "хялбарчлагдсан" мэт 0.0015° хэлбэлзэнэ
const mid = (a: number[], b: number[], n: number) => Array.from({ length: n }, (_, k) => [a[0] + ((b[0] - a[0]) * (k + 1)) / (n + 1) + (rnd() - 0.5) * 0.01, a[1] + ((b[1] - a[1]) * (k + 1)) / (n + 1) + (rnd() - 0.5) * 0.01]);
const jit = (p: number[]) => [p[0] + (rnd() - 0.5) * 0.003, p[1] + (rnd() - 0.5) * 0.003];
const cells: any[] = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  const a = lattice[r][c], b = lattice[r][c + 1], d = lattice[r + 1][c + 1], e = lattice[r + 1][c];
  const ring = [a, ...mid(a, b, (c + r) % 3), b, ...mid(b, d, (c * r) % 3), d, ...mid(d, e, (c + 2 * r) % 3), e, ...mid(e, a, (r + 2 * c) % 3)].map(jit);
  ring.push(ring[0]);
  cells.push({ type: 'Feature', properties: { name: `О${r}_${c}` }, geometry: { type: 'Polygon', coordinates: [ring] } });
}
const mosaic: any = { type: 'FeatureCollection', features: cells };

const t1 = Date.now();
const colors = assignDistinctColors(mosaic);
const ms = Date.now() - t1;
const edgeNeighbors: [number, number][] = [];
for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
  if (c + 1 < COLS) edgeNeighbors.push([r * COLS + c, r * COLS + c + 1]);
  if (r + 1 < ROWS) edgeNeighbors.push([r * COLS + c, (r + 1) * COLS + c]);
}
const clash = edgeNeighbors.filter(([a, b]) => colors[a] === colors[b]);
console.log(`   ${cells.length} полигон: ${ms} мс, ${new Set(colors).size} өөр өнгө, хөрш холбоос ${computeAdjacency(mosaic).reduce((s, x) => s + x.length, 0) / 2}`);
assert(colors.every((c) => c && /^#[0-9a-f]{6}$/i.test(c)), 'полигон бүр өнгөтэй');
assert(clash.length === 0, `хил залгаа ${edgeNeighbors.length} хос бүгд ӨӨР өнгөтэй (давхцал ${clash.length}), хилийн цэгүүд тус бүрдээ хялбарчлагдсан, өөр нягтралтай байсан ч`);
assert(new Set(colors).size <= DISTINCT_PALETTE.length, `${new Set(colors).size} өнгөөр хангалттай (палитр ${DISTINCT_PALETTE.length})`);
assert(ms < 3000, `600 полигоныг ${ms} мс-д боловсруулсан`);
assert(JSON.stringify(assignDistinctColors(mosaic)) === JSON.stringify(colors), 'тогтмол: дахин тооцоход ижил (хэрэглэгч бүрт ижил өнгө харагдана)');
const shuffled = assignDistinctColors(mosaic, 5);
assert(JSON.stringify(shuffled) !== JSON.stringify(colors) && edgeNeighbors.every(([a, b]) => shuffled[a] !== shuffled[b]), 'өнгийг холих (seed) нь өөр өнгө өгөх ч хөрш өөр өнгөтэй хэвээр');

// Layer түвшин: шүүгдсэн обьект (selectedFeatureIndices) дээр ч өнгө хэвээр, горимууд
const layerP: any = { fillColor: '#999999', geometryType: 'Polygon', geojson: mosaic };
const fn = makeFeatureColorFn(layerP);
assert(cells.every((f, i) => fn(f) === colors[i]), 'makeFeatureColorFn обьект бүрт зөв өнгө буцаана');
const subset = [cells[7], cells[8]];
assert(fn(subset[0]) === colors[7] && fn(subset[1]) === colors[8], 'зөвхөн хэсэг обьектийг үзүүлэхэд ч өнгө өөрчлөгдөхгүй');
assert(makeFeatureColorFn({ ...layerP, featureColorOverrides: { '7': '#010203' } })(cells[7]) === '#010203', 'нэг обьектийн өнгийг гараар солих');
assert(effectiveColorMode(layerP) === 'distinct', 'полигон давхарга анхдагчаар обьект бүр өөр өнгөтэй');
assert(effectiveColorMode({ fillColor: '#000', geometryType: 'Point' }) === 'single', 'цэг/шугам давхарга нэг өнгөтэй хэвээр');
assert(makeFeatureColorFn({ ...layerP, colorMode: 'single' })(cells[3]) === '#999999', '"нэг өнгө" горим сонговол хуучин шигээ');
assert(effectiveColorMode({ ...layerP, colorByField: 'name' }) === 'column', 'багана сонгосон бол баганаар (хуучин тохиргоо хадгалагдана)');

// Нягт: нэг хилээр хуваалцсан хоёр дөрвөлжин
const two: any = { type: 'FeatureCollection', features: [
  { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } },
  { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[1, 0], [2, 0], [2, 1], [1, 0.5], [1, 1], [1, 1], [1, 0]]] } },
  { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[5, 5], [6, 5], [6, 6], [5, 6], [5, 5]]] } },
] };
const adj2 = computeAdjacency(two);
assert(adj2[0].includes(1) && !adj2[0].includes(2), 'хил залгаа хос хөрш, холын полигон хөрш биш');

// Градус биш (метрийн) координаттай давхарга хөлдөөхгүй
const t2 = Date.now();
const metric: any = { type: 'FeatureCollection', features: Array.from({ length: 50 }, (_, i) => ({ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[1e6 + i * 1e5, 5e6], [1e6 + i * 1e5 + 9e4, 5e6], [1e6 + i * 1e5 + 9e4, 5e6 + 9e4], [1e6 + i * 1e5, 5e6]]] } })) };
const mc = assignDistinctColors(metric);
assert(Date.now() - t2 < 500 && mc.every((c) => !!c), 'метрийн координаттай давхарга хөлдөхгүй, өнгөтэй хэвээр');
