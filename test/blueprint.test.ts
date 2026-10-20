import { generateComprehensiveGisQuestions } from '../src/utils/gisAutoQuestionGenerator.ts';
import { pickByBlueprint, previewBlueprint, layerKeyOf, taskTypeOf, matchesRule, blueprintTotal, activeRules } from '../src/lib/blueprint.ts';
import { renameLayerInQuestions } from '../src/lib/contentLogic.ts';
import { resolveCompetitionRules } from '../src/lib/scoring.ts';
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

const ring = (cx: number, cy: number, r: number) => { const pts = Array.from({ length: 16 }, (_, k) => [cx + r * Math.cos((k / 16) * 6.283), cy + r * Math.sin((k / 16) * 6.283)]); pts.push(pts[0]); return pts; };
const polyLayer = (id: string, name: string, n: number, off: number) => ({
  id, name, visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Polygon', featureCount: n, nameField: 'nm', createdAt: '',
  geojson: { type: 'FeatureCollection', features: Array.from({ length: n }, (_, i) => ({ type: 'Feature', properties: { nm: `${name} ${i}` }, geometry: { type: 'Polygon', coordinates: [ring(90 + off + i * 1.3, 44 + (i % 4) * 0.8, 0.3 + i * 0.02)] } })) },
});
const cityLayer = { id: 'ct', name: 'Хотууд', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Point', featureCount: 10, nameField: 'nm', createdAt: '',
  geojson: { type: 'FeatureCollection', features: Array.from({ length: 10 }, (_, i) => ({ type: 'Feature', properties: { nm: `Хот ${i}` }, geometry: { type: 'Point', coordinates: [95 + i, 45 + i * 0.2] } })) } };
const layers: any[] = [polyLayer('ai', 'Аймаг', 12, 0), polyLayer('lk', 'Нуур', 10, 3), cityLayer];
const pool = generateComprehensiveGisQuestions({ layers, gradeLevels: ['9'] } as any) as any[];
const count = (qs: any[], f: (q: any) => boolean) => qs.filter(f).length;
let sd = 3; const rng = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
console.log(`   сан: ${pool.length} даалгавар, ${new Set(pool.map(taskTypeOf)).size} төрөл, ${new Set(pool.map(layerKeyOf)).size} давхарга`);

// 1) Давхарга + төрөл нэгэн зэрэг
const rules = [
  { id: 'a', layer: 'ai', type: 'contour_shape', count: 3 },
  { id: 'b', layer: 'lk', type: 'area', count: 2 },
  { id: 'c', layer: 'ct', type: 'point_placement', count: 4 },
];
const r1 = pickByBlueprint(pool, rules, { rng });
assert(r1.picked.length === 9 && r1.shortages.length === 0, `бүрэлдэхүүн: 3 + 2 + 4 = 9 даалгавар, дутуу байхгүй (${r1.picked.length})`);
assert(count(r1.picked, (q) => layerKeyOf(q) === 'ai' && taskTypeOf(q) === 'contour_shape') === 3, 'Аймгаас контур таах яг 3');
assert(count(r1.picked, (q) => layerKeyOf(q) === 'lk' && taskTypeOf(q) === 'area') === 2, 'Нууруас талбай яг 2');
assert(count(r1.picked, (q) => layerKeyOf(q) === 'ct' && taskTypeOf(q) === 'point_placement') === 4, 'Хотоос цэг байрлуулах яг 4');
assert(new Set(r1.picked.map((q) => q.id)).size === 9, 'ижил даалгавар давхардаагүй');
assert(Object.values(r1.perRule).every((v, i) => v.length === rules[i].count), 'мөр бүрийн дүн зөв');

// 2) Зөвхөн төрлөөр / зөвхөн давхаргаар
const r2 = pickByBlueprint(pool, [{ id: 'x', type: 'neighbor', count: 4 }, { id: 'y', layer: 'ct', count: 2 }], { rng });
assert(count(r2.picked, (q) => taskTypeOf(q) === 'neighbor') >= 4 && r2.picked.length === 6, 'зөвхөн төрлөөр (аль ч давхаргаас 4 хөрш) + зөвхөн давхаргаар (Хотоос 2)');

// 3) Нарийн мөрийг түрүүлж бөглөнө: ерөнхий мөр түүнийг булаахгүй
const tight = pool.filter((q) => layerKeyOf(q) === 'lk' && taskTypeOf(q) === 'contour_shape');
const r3 = pickByBlueprint(tight.concat(pool.filter((q) => layerKeyOf(q) !== 'lk')), [{ id: 'any', count: 6 }, { id: 'sp', layer: 'lk', type: 'contour_shape', count: tight.length }], { rng });
assert(count(r3.picked, (q) => layerKeyOf(q) === 'lk' && taskTypeOf(q) === 'contour_shape') === tight.length && r3.shortages.length === 0, `ерөнхий мөр (жагсаалтад эхэнд) нарийн мөрийн ${tight.length} даалгаврыг булаасангүй`);

// 4) Дутуу: бэлэн даалгавар хүрэхгүй
const r4 = pickByBlueprint(pool, [{ id: 'big', layer: 'ct', type: 'point_placement', count: 99 }], { rng });
assert(r4.shortages.length === 1 && r4.shortages[0].wanted === 99 && r4.shortages[0].got === 10 && r4.picked.length === 10, '99 хүсэхэд байгаа 10-ыг өгч, дутууг мэдээлнэ');
const r5 = pickByBlueprint(pool, [{ id: 'none', layer: 'үгүй', count: 3 }], { rng });
assert(r5.picked.length === 0 && r5.shortages[0].got === 0, 'огт байхгүй давхаргаас 0, алдаагүй');

// 5) Дараалал
const seq = pickByBlueprint(pool, rules, { rng, shuffleOrder: false }).picked.map((q) => layerKeyOf(q)).join('');
assert(seq === 'aiaiailklkctctctct', `холихгүй бол мөрийн дарааллаар: 3 аймаг, 2 нуур, 4 хот (${seq})`);
const mixedSets = new Set<string>(); for (let i = 0; i < 12; i++) mixedSets.add(pickByBlueprint(pool.slice(), [{ id: 'm', layer: 'ct', type: 'point_placement', count: 6 }], { rng }).picked.map((q) => q.id).join(','));
assert(mixedSets.size > 1, 'санамсаргүй сонголт: оролдлого бүрт өөр даалгавар, өөр дараалал');

// 6) Давхаргын нэр солигдсон ч бүрэлдэхүүн хэвээр (давхаргын ID-аар таньдаг)
const renamed = renameLayerInQuestions(pool, 'lk', 'Нуур', 'Усан сан (шинэ)') as any[];
assert(count(renamed, (q) => matchesRule(q, { layer: 'lk' })) === count(pool, (q) => matchesRule(q, { layer: 'lk' })) && count(renamed, (q) => matchesRule(q, { layer: 'lk' })) > 0, 'давхаргын нэр солигдсон ч бүрэлдэхүүн тэр давхаргыг олно');

// 7) Дүрмийн нийлбэр
assert(blueprintTotal(rules) === 9 && activeRules([{ id: 'z', count: 0 }]).length === 0, 'нийт асуулт = мөрүүдийн нийлбэр, 0 тоотой мөрийг тооцохгүй');
const rr = resolveCompetitionRules({ questionsPerAttempt: 10, secondsPerQuestion: 30, categorySettings: { '9': { blueprint: rules }, '12': { questionCount: 7 } } }, '9');
assert(rr.questionCount === 9 && rr.blueprint!.length === 3 && rr.shuffleBlueprint === true, 'бүрэлдэхүүнтэй ангилалд асуултын тоо = 9 (10-г дарна)');
assert(resolveCompetitionRules({ categorySettings: { '12': { questionCount: 7 } } }, '12').blueprint === undefined, 'бүрэлдэхүүнгүй ангилал хуучин дүрмээр');
assert(resolveCompetitionRules({ categorySettings: { '9': { blueprint: rules, shuffleBlueprint: false } } }, '9').shuffleBlueprint === false, 'холихгүй гэж тохируулж болно');

// 8) Урьдчилсан харагдац нь тогтмол
const p1 = previewBlueprint(pool, rules).picked.map((q) => q.id).join(','), p2 = previewBlueprint(pool, rules).picked.map((q) => q.id).join(',');
assert(p1 === p2 && p1.length > 0, 'админы урьдчилсан тооцоо тогтмол (дахин тооцоход ижил)');

// 9) Давхаргын ID-г даалгаврын БҮХ төрлөөс таньна (өмнө нь зөвхөн контураас таньдаг байсан)
import { layerIdFromFeatureId } from '../src/lib/contentLogic.ts';
for (const suf of ['f_3', 'area_9', 'nb_3', 'pin_5', 'asm_1', 'name_0']) assert(layerIdFromFeatureId(`user_1730000_ab12c_${suf}`) === 'user_1730000_ab12c', `featureId "_${suf}" дагавараас давхаргын ID (доод зураастай ID-тай ч)`);
assert(layerIdFromFeatureId('foo') === null && layerIdFromFeatureId(undefined) === null, 'таних боломжгүй бол null');
const byType = new Map<string, Set<string>>(); for (const q of pool) { const t = taskTypeOf(q); byType.set(t, (byType.get(t) ?? new Set()).add(layerKeyOf(q))); }
assert([...byType.values()].every((set) => [...set].every((k) => ['ai', 'lk', 'ct'].includes(k))), 'бүх 6 төрлийн даалгаврын давхаргын түлхүүр нь давхаргын ID (ai/lk/ct)');
