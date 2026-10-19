import { IntegrityTracker, normalizeMaxLeaves, limitExceeded } from '../src/lib/integrity.ts';
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };

let t = new IntegrityTracker(); t.start();
// 1) Таб солих: visibilitychange(hidden) + blur зэрэг ирнэ → НЭГ удаа гэж тоолно
t.setQuestion(2);
t.leave('hidden', 1000); t.leave('blur', 1001);
assert(t.isAway, 'таб солихөд "цонхоос гарсан" төлөвт орно');
assert(t.clear('hidden', 6000) === null && t.isAway, 'зөвхөн нэг нөхцөл арилахад үргэлжилнэ (focus ирээгүй)');
const ev = t.clear('blur', 6100)!;
assert(ev && t.count === 1 && ev.ms === 5100 && ev.question === 2 && ev.kinds.includes('hidden'), 'hidden + blur нэг мөчлөг: 1 удаа, 5.1 сек, 2-р асуултын үед');
assert(t.totalAwayMs === 5100, 'нийт зайлсан хугацаа нэмэгдсэн');

// 2) Богино фокус алдалт (мэдэгдэл, санамсаргүй товшилт) тоологдохгүй
t.leave('blur', 10000); assert(t.clear('blur', 10300) === null && t.count === 1, '0.3 сек фокус алдсан нь тоологдохгүй');
// ... гэхдээ 0.7 сек-ээс удаан бол тоологдоно
t.leave('blur', 20000); assert(t.clear('blur', 21000) !== null && t.count === 2, '1 сек фокус алдсан нь тоологдоно');
// ... хугацаа нь богино ч табыг далд болговол (hidden) заавал тоологдоно
t.leave('hidden', 30000); assert(t.clear('hidden', 30100) !== null && t.count === 3, 'таб далд болсон нь богино ч тоологдоно');

// 3) Бүтэн дэлгэц
t.markFullscreen();
assert(t.fullscreenExit(40000)!.kinds[0] === 'fullscreen_exit' && t.count === 4, 'бүтэн дэлгэцээс гарсан нь тоологдоно');
const t2 = new IntegrityTracker(); t2.start();
assert(t2.fullscreenExit(1) === null && t2.count === 0, 'бүтэн дэлгэц асаагаагүй бол гарах нь тоологдохгүй');

// 4) Хориглосон үйлдэл, хугацаа дуусах
t.blockedAction(); t.blockedAction();
t.leave('blur', 50000);
t.stop(53000); // уралдаан дуусах үед гарсан хэвээр байвал мөчлөгийг хаана
const r = t.report();
assert(r.windowLeaves === 5 && r.blockedActions === 2 && r.fullscreenUsed, 'тайлан: 5 удаа гарсан, 2 хориглосон оролдлого, бүтэн дэлгэц хэрэглэсэн');
assert(r.events.length === 5 && r.awayMs === 5100 + 1000 + 100 + 3000, 'үйл явдал бүр хадгалагдаж, нийт хугацаа зөв');
t.leave('blur', 60000); assert(t.count === 5, 'уралдаан дууссаны дараах шилжилтийг тоолохгүй');

// 5) Үйл явдлын тоо хязгаартай (DB-ийн баримт томрохгүй)
const t3 = new IntegrityTracker(700, 3); t3.start();
for (let i = 0; i < 10; i++) { t3.leave('hidden', i * 100); t3.clear('hidden', i * 100 + 50); }
assert(t3.count === 10 && t3.report().events.length === 3, '10 удаа гарсан ч бүртгэх жагсаалт 3-аар хязгаарлагдсан, тоо нь зөв');

// 6) Хязгаар
assert(normalizeMaxLeaves(undefined) === 0 && normalizeMaxLeaves(-3) === 0 && normalizeMaxLeaves(99) === 20 && normalizeMaxLeaves('3') === 3, 'дээд тоо аюулгүй хязгаарт');
assert(!limitExceeded(5, 0) && !limitExceeded(3, 3) && limitExceeded(4, 3), 'хязгаар: 0 = хязгааргүй, 3 бол 4 дэх нь хэтэрсэн');
t3.markTerminated('limit'); assert(t3.report().terminated && t3.report().terminatedReason === 'limit', 'автоматаар дуусгасан гэж тэмдэглэнэ');
