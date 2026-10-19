import { pointsForAnswer, maxPointsForQuestion, compareAttempts, normalizeScoring, DEFAULT_SCORING } from '../src/lib/scoring.ts';
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const cfg = DEFAULT_SCORING; // 30 сек, +50%

assert(pointsForAnswer(10, true, 0, cfg) === 15, 'тэр даруй зөв хариулбал суурь оноо + 50% = 15');
assert(pointsForAnswer(10, true, 30000, cfg) === 10, 'цаг дуусах мөчид зөв хариулбал зөвхөн суурь оноо = 10');
assert(pointsForAnswer(10, true, 15000, cfg) === 13 || pointsForAnswer(10, true, 15000, cfg) === 12, 'хугацааны хагаст зөв хариулбал дундаж ~12.5');
assert(pointsForAnswer(10, false, 1000, cfg) === 0, 'буруу хариулт 0 (хурдан ч гэсэн)');
assert(pointsForAnswer(10, true, 99999, cfg) === 10 && pointsForAnswer(10, true, -5, cfg) === 15, 'хугацааны хязгаараас гадуур утгыг хязгаарлана');

// ХАМГИЙН ЧУХАЛ: хурдан нь үргэлж дээд оноо (монотон буурдаг)
let prev = Infinity, monotone = true;
for (let ms = 0; ms <= 30000; ms += 250) { const p = pointsForAnswer(20, true, ms, cfg); if (p > prev) monotone = false; prev = p; }
assert(monotone, 'хариулах хугацаа нэмэгдэх тусам оноо ХЭЗЭЭ Ч нэмэгддэггүй (хурдан = өндөр оноо)');
assert(pointsForAnswer(10, true, 3000, cfg) > pointsForAnswer(10, true, 20000, cfg), '3 секундэд хариулсан нь 20 секундэд хариулснаас өндөр оноотой');

// Зөв хариулсан хурдан оролцогч > мөн адил зөв хариулсан удаан оролцогч
const fast = [2000, 3000, 2500].map((t) => pointsForAnswer(10, true, t, cfg)).reduce((a, b) => a + b, 0);
const slow = [22000, 25000, 28000].map((t) => pointsForAnswer(10, true, t, cfg)).reduce((a, b) => a + b, 0);
assert(fast > slow, `3 зөв хариулттай хурдан оролцогч (${fast}) > удаан оролцогч (${slow})`);

// Хурдны урамшууллыг админ тохируулж/унтрааж болно
assert(pointsForAnswer(10, true, 0, { ...cfg, speedBonusPercent: 0 }) === 10, 'урамшуулал 0% бол оноо хугацаанаас үл хамаарна');
assert(pointsForAnswer(10, true, 0, { secondsPerQuestion: 60, speedBonusPercent: 100 }) === 20, '+100% бол тэр даруй хариулахад 2 дахин');
assert(maxPointsForQuestion(10, cfg) === 15, 'нэг асуултын дээд оноо 15');

const norm = normalizeScoring({ secondsPerQuestion: 2, speedBonusPercent: -10 });
assert(norm.secondsPerQuestion === 5 && norm.speedBonusPercent === 0, 'буруу тохиргоо аюулгүй хязгаарт орно');
assert(normalizeScoring(undefined).secondsPerQuestion === 30 && normalizeScoring({ speedBonusPercent: 0 }).speedBonusPercent === 0, 'анхдагч утга, 0% хүчинтэй');

// Эрэмбэ
const list = [
  { id: 'a', totalScore: 100, totalTimeMs: 90000, completedAt: '2026-10-20T10:00:00Z' },
  { id: 'b', totalScore: 120, totalTimeMs: 200000, completedAt: '2026-10-20T10:05:00Z' },
  { id: 'c', totalScore: 120, totalTimeMs: 150000, completedAt: '2026-10-20T10:03:00Z' },
  { id: 'd', totalScore: 120, totalTimeMs: 150000, completedAt: '2026-10-20T10:01:00Z' },
  { id: 'e', totalScore: 120 },
];
const sorted = [...list].sort(compareAttempts).map((x) => x.id).join('');
assert(sorted === 'dcbea', `эрэмбэ: оноо → бага хугацаа → эрт дуусгасан (${sorted}); хугацаагүй нь сүүлд`);

// ====== Асуултын тоо, хугацаа: нийтийн + ангилал тус бүрийн тохиргоо ======
import { resolveCompetitionRules, normalizeQuestionCount, describeRules, totalSeconds, formatMinutes } from '../src/lib/scoring.ts';
const d0 = resolveCompetitionRules(undefined, '9');
assert(d0.questionCount === 10 && d0.secondsPerQuestion === 30 && d0.speedBonusPercent === 50, 'тохиргоогүй бол анхдагч: 10 асуулт, 30 сек, +50%');
const cfg1 = { questionsPerAttempt: 15, secondsPerQuestion: 45 };
assert(resolveCompetitionRules(cfg1, '12').questionCount === 15 && resolveCompetitionRules(cfg1, 'teacher').secondsPerQuestion === 45, 'нийтийн тохиргоо бүх ангилалд');
const cfg2 = { ...cfg1, categorySettings: { '9': { questionCount: 8 }, teacher: { questionCount: 20, secondsPerQuestion: 60 }, team: { secondsPerQuestion: 90 } } };
assert(resolveCompetitionRules(cfg2, '9').questionCount === 8 && resolveCompetitionRules(cfg2, '9').secondsPerQuestion === 45, '9-р анги: зөвхөн асуултын тоог дарж, хугацаа нийтийнхээр');
assert(resolveCompetitionRules(cfg2, 'teacher').questionCount === 20 && resolveCompetitionRules(cfg2, 'teacher').secondsPerQuestion === 60, 'Багш: тоо ба хугацаа хоёуланг нь дарсан');
assert(resolveCompetitionRules(cfg2, 'team').questionCount === 15 && resolveCompetitionRules(cfg2, 'team').secondsPerQuestion === 90, 'Баг: зөвхөн хугацааг дарсан');
assert(resolveCompetitionRules(cfg2, '12').questionCount === 15, 'тусгай тохиргоогүй ангилал нийтийнхээ дагана');
assert(resolveCompetitionRules({ categorySettings: { '9': { questionCount: 0, secondsPerQuestion: undefined } } }, '9').questionCount === 10, 'хоосон/0 утга нь "нийтийнхээр" гэсэн үг');
assert(normalizeQuestionCount(0) === 10 && normalizeQuestionCount(-3) === 10 && normalizeQuestionCount(500) === 100 && normalizeQuestionCount('12') === 12 && normalizeQuestionCount(7.6) === 8, 'асуултын тоо аюулгүй хязгаарт (1-100)');
assert(resolveCompetitionRules({ categorySettings: { '12': { secondsPerQuestion: 2 } } }, '12').secondsPerQuestion === 5, 'хугацаа 5-600 сек хязгаарт');
assert(totalSeconds(d0) === 300 && totalSeconds(d0, 4) === 120, 'нийт хугацаа: 10×30=300 сек, 4 даалгавар л байвал 120');
assert(formatMinutes(300) === '5 мин' && formatMinutes(330) === '5 мин 30 сек' && formatMinutes(45) === '45 сек', 'хугацааны хэлбэр');
assert(describeRules(cfg1) === '15 даалгавар, даалгавар тус бүрт 45 секунд', 'бүх ангилал ижил бол нэг мөр');
assert(describeRules(cfg2).includes('Багш: 20 даалгавар × 60 секунд') && describeRules(cfg2).includes('9-р анги: 8 даалгавар × 45 секунд'), 'ялгаатай бол ангилал бүрээр');
