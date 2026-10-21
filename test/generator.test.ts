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

// ---- Firestore-ийн "nested arrays" дүрэм: бодит үүсгэсэн асуултаар шалгах ----
import { encodePack, decodePack, hasNestedArray } from '../src/lib/contentLogic.ts';
const sample = packs[0];
assert(hasNestedArray({ items: sample.items }), 'ХУУЧИН хэлбэр (items массив) нь nested array агуулдаг тул Firestore татгалзах байсан (алдааг баталгаажуулав)');
const stored = encodePack(sample.items);
assert(!hasNestedArray(stored), 'ШИНЭ хэлбэр ({json: текст}) nested array агуулаагүй, Firestore хүлээн авна');
assert(JSON.stringify(decodePack(stored)) === JSON.stringify(sample.items), 'задлахад асуултууд бүрэн ижил (координат алдагдаагүй)');
assert(packs.every((p) => !hasNestedArray(encodePack(p.items))), `${packs.length} багц бүгд Firestore-д хадгалагдах хэлбэртэй`);

// ---- Даалгавар засах (урьдчилан харах): бүх төрлийн бодит даалгавар дээр ----
import { editOptionText, setCorrectOption, editTitle, editPoints, editPinTolerance, validateDraft } from '../src/lib/draftEdit.ts';
const firstOfType = new Map<string, any>();
for (const q of all as any[]) if (!firstOfType.has(q.gisAutoTaskType)) firstOfType.set(q.gisAutoTaskType, q);
for (const [type, q0] of firstOfType) {
  assert(validateDraft(q0) === null, `[${type}] үүсгэсэн даалгавар шалгалтыг давна`);
  if (q0.options?.length) {
    const ci = q0.options.findIndex((o: any) => o.isCorrect);
    const wi = q0.options.findIndex((o: any) => !o.isCorrect);
    // зөв хариултын текстийг засвал
    const e1 = editOptionText(q0, ci, 'ШИНЭ ЗӨВ');
    assert(e1.options!.filter((o) => o.isCorrect).length === 1 && e1.options![ci].text === 'ШИНЭ ЗӨВ', `[${type}] зөв хариултын текст засагдсан`);
    const targetWasAnswer = q0.options[ci].text === q0.targetName;
    assert(!targetWasAnswer || (e1.targetName === 'ШИНЭ ЗӨВ' && (!e1.shpContourData || e1.shpContourData.targetName === 'ШИНЭ ЗӨВ')), `[${type}] targetName хариултыг дагасан (${targetWasAnswer ? 'тийм' : 'тоон/өөр хариулттай тул хэвээр'})`);
    assert(targetWasAnswer || e1.targetName === q0.targetName, `[${type}] обьектийн нэр хариултаас хамаарахгүй бол өөрчлөгдөөгүй`);
    if (q0.shpContourData?.options && q0.shpContourData.options.join('|') === q0.options.map((o: any) => o.text).join('|'))
      assert(e1.shpContourData!.options.join('|') === e1.options!.map((o) => o.text).join('|'), `[${type}] options ба shpContourData.options синхрон`);
    // зөв хариулт солих
    const e2 = setCorrectOption(q0, wi);
    assert(e2.options!.filter((o) => o.isCorrect).length === 1 && e2.options![wi].isCorrect, `[${type}] зөв хариулт солигдсон`);
    // хоосон / давхардсан сонголтыг илрүүлэх
    assert(validateDraft(editOptionText(q0, wi, '')) !== null, `[${type}] хоосон сонголтыг илрүүлнэ`);
  }
}
const pin = firstOfType.get('point_placement');
assert(editPinTolerance(pin, 120).mapPinData.allowedDistanceKm === 120, 'цэг байрлуулахад зөвшөөрөгдөх зайг засна');
assert(validateDraft(editTitle(pin, '  ')) !== null, 'хоосон асуултын текстийг илрүүлнэ');
assert(editPoints(pin, 25.4).points === 25, 'оноо засагдсан');

// ---- Загвар: нэг төрлийн даалгаврын асуултыг нэг дор засах ----
import { deriveTemplate, applyTemplate, render, commonTemplate, missingPlaceholders, findReplace, deriveVars } from '../src/lib/questionTemplates.ts';
const tTypes = new Map<string, any[]>();
for (const q of all as any[]) { const t = q.gisAutoTaskType; tTypes.set(t, [...(tTypes.get(t) ?? []), q]); }
for (const [type, qs] of tTypes) {
  // 1) загварыг утгаар нь буцааж дүүргэхэд эх текстийг яг гаргана
  const rt = qs.every((q) => { const { template, vars } = deriveTemplate(q); return render(template.title, vars) === q.title && render(template.subtitle, vars) === q.subtitle && render(template.explanation, vars) === q.explanation; });
  assert(rt, `[${type}] ${qs.length} даалгавар: загвар → буцааж дүүргэхэд эх текст яг таарна`);
  // 2) нэг төрөл, нэг давхарга → бүгд ижил загвартай (нэг удаа засахад хангалттай)
  const sameLayer = qs.filter((q) => deriveVars(q)['давхарга'] === 'Нуур');
  const c = commonTemplate(sameLayer);
  if (!c.uniform) { const m = new Map<string, string>(); for (const q of sameLayer) { const d = deriveTemplate(q); m.set(d.template.title + ' ‖ ' + d.template.explanation, JSON.stringify(d.vars)); } console.log('   ялгаатай загварууд:', Array.from(m.entries()).slice(0, 3).map(([k, v]) => `\n     ${k}\n     vars=${v}`).join('')); }
  assert(c.uniform, `[${type}] Нуур давхаргын ${sameLayer.length} даалгавар (гарчиг, дэд гарчиг, тайлбар) бүгд ИЖИЛ загвартай (${c.distinct})`);
}
// 3) загварыг нэг удаа засахад бүх даалгавар өөр өөрийнхөө утгаар шинэчлэгдэнэ
const areaQs = tTypes.get('area')!.filter((q: any) => q.shpContourData?.layerName === 'Нуур');
const edited = areaQs.map((q: any) => applyTemplate(q, { title: 'Ямар талбайтай вэ? «{нэр}» ({давхарга})' }));
assert(edited.every((q: any, i: number) => q.title === `Ямар талбайтай вэ? «${deriveVars(areaQs[i])['нэр']}» (Нуур)`), `талбай: ${areaQs.length} даалгаврын асуулт нэг загвараар засагдаж, обьект бүрийн нэр хадгалагдсан`);
assert(new Set(edited.map((q: any) => q.title)).size === areaQs.length, 'засварын дараа асуулт бүр өөр обьектийн нэртэй хэвээр');
assert(edited.every((q: any, i: number) => q.explanation === areaQs[i].explanation && JSON.stringify(q.options) === JSON.stringify(areaQs[i].options)), 'тайлбар, хариултын сонголт өөрчлөгдөөгүй');
assert(missingPlaceholders('{нэр} {дараалал}', areaQs).includes('дараалал'), 'тухайн төрөлд утгагүй placeholder-ийг анхааруулна');
const fr = findReplace(areaQs[0], 'километр', 'км');
assert(fr.title === areaQs[0].title || !areaQs[0].title.includes('километр'), 'хайх/солих ажиллана');

// ---- Дотоод тооцооллын талбар (_areaKm2, _lengthKm) асуултад цухуйх ёсгүй ----
const leaked = (all as any[]).filter((q) => /_areaKm2|_lengthKm/.test(JSON.stringify(q)));
assert(leaked.length === 0, `дотоод _areaKm2/_lengthKm талбар ${all.length} даалгаврын аль нэгэнд ч цухуйгаагүй (${leaked.length})`);

// ====== 30-аас олон обьект: бүх обьектоор даалгавар үүсгэнэ ======
const bigRing = (cx: number, cy: number, r: number) => { const pts = Array.from({ length: 12 }, (_, k) => [cx + r * Math.cos((k / 12) * 6.283), cy + r * Math.sin((k / 12) * 6.283)]); pts.push(pts[0]); return pts; };
const bigLayer = (n: number): any => ({
  id: 'big', name: 'Сум', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Polygon', featureCount: n, nameField: 'nm', createdAt: '',
  geojson: { type: 'FeatureCollection', features: Array.from({ length: n }, (_, i) => ({ type: 'Feature', properties: { nm: `Сум ${i}` }, geometry: { type: 'Polygon', coordinates: [bigRing(88 + (i % 40) * 0.6, 42 + Math.floor(i / 40) * 0.6, 0.1 + (i % 7) * 0.01)] } })) },
});
const bq = (types: string[], n: number, extra: any = {}) => generateComprehensiveGisQuestions({ layers: [bigLayer(n)], enabledTypes: types, ...extra } as any) as any[];
for (const [type, label] of [['contour_shape', 'хэлбэр дүрс таах'], ['name_by_attribute', 'нэр тодорхойлох'], ['area', 'талбай'], ['point_placement', 'цэг байрлуулах']] as const) {
  const out = bq([type], 100);
  assert(out.length === 100, `${label}: 100 обьектоос ${out.length} даалгавар (өмнө 30 хүрдэг байсан)`);
  assert(new Set(out.map((q) => q.shpContourData.featureId)).size === 100, `${label}: 100 өөр обьект бүгд орсон (давхардалгүй)`);
}
const nb = bq(['neighbor'], 100);
assert(nb.length > 30, `хөрш: 100 обьектоос ${nb.length} даалгавар (>30)`);
const asm100 = bq(['assemble'], 100), asm10 = bq(['assemble'], 10);
assert(asm100.length === 25 && asm10.length === 5, `эвлүүлэх: обьектийн тоонд уялдана (100 → ${asm100.length}, 10 → ${asm10.length}; өмнө дандаа дээд тал нь 6)`);
assert(bq(['contour_shape'], 20).length === 20, 'цөөн обьекттой давхарга хэвээр (20 → 20)');
assert(bq(['contour_shape'], 100, { maxQuestionsPerLayer: 40 }).length === 40, 'хэрэв заавал хязгаарлавал maxQuestionsPerLayer үйлчилнэ');
const huge = bq(['contour_shape'], 1500);
const idx = huge.map((q) => Number(q.shpContourData.featureId.split('_f_')[1]));
assert(huge.length === 1000 && Math.max(...idx) > 1000, `1500 обьекттой давхарга: 1000-аар хязгаарлаж, ЭХНИЙ 1000 биш санамсаргүй сонгосон (хамгийн их индекс ${Math.max(...idx)})`);
assert(bq(['contour_shape'], 1500, { maxFeaturesPerLayer: 1500 }).length === 1500, 'maxFeaturesPerLayer-ээр хязгаарыг өөрчилж болно');
