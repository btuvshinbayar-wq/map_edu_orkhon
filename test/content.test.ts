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
