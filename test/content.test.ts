import { needsRefresh, packQuestions, unpackQuestions } from '../src/lib/contentLogic.ts';
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

assert(needsRefresh(undefined, 0) === true, 'cache хоосон бол татна');
assert(needsRefresh(3, 3) === false, 'хувилбар ижил бол татахгүй (0 байт)');
assert(needsRefresh(3, 4) === true, 'админ шинэчилсэн (4) бол дахин татна');

const qs = Array.from({ length: 115 }, (_, i) => ({ id: `q${i}`, text: `Асуулт ${i}` }));
const packs = packQuestions(qs);
assert(packs.length === 6, '115 асуулт → 6 багц (115 унших биш 6 унших)');
assert(packs.map(p => p.id).join() === [...packs.map(p => p.id)].sort().join(), 'багцын ID эрэмбэтэй (p000, p001 ...)');
const back = unpackQuestions(packs);
assert(back.length === 115 && back.every((q, i) => q.id === `q${i}`), 'задлахад дараалал алдагдаагүй');

// Хэмжээгээр багцлах: асуулт бүр 150 KB геометртэй
const heavy = Array.from({ length: 30 }, (_, i) => ({ id: `h${i}`, geo: 'x'.repeat(150_000) }));
const hp = packQuestions(heavy);
const enc = new TextEncoder();
assert(hp.every(p => enc.encode(JSON.stringify(p)).length < 1_000_000), `30 хүнд асуулт ${hp.length} багцад хуваагдаж, багц бүр <1 МБ`);
assert(hp.flatMap(p => p.items).length === 30, 'хүнд асуулт алдагдаагүй');
let threw = false; try { packQuestions([{ id: 'x', geo: 'y'.repeat(950_000) }]); } catch { threw = true; }
assert(threw, '900 KB-аас том ганц асуултыг тодорхой мэдэгдэлтэйгээр татгалзана');
