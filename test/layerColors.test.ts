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
