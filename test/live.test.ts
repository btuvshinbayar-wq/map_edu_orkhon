import { summarizeLive, rankLive, displayStatus, toLiveDoc, STALE_MS, type LiveSession } from '../src/lib/live.ts';
const assert = (c: boolean, m: string) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) process.exitCode = 1; };
const now = 1_000_000_000;
const mk = (o: Partial<LiveSession>): LiveSession => ({ userId: 'u', name: 'A', school: 'S', aimag: 'X', grade: '9', status: 'in_progress', total: 10, answered: 5, correct: 4, score: 60, maxScore: 150, elapsedMs: 40000, startedAt: now - 90000, updatedAt: now - 5000, ...o });
const list = [
  mk({ userId: '1', score: 90, elapsedMs: 50000 }),
  mk({ userId: '2', score: 120, elapsedMs: 70000, status: 'finished', answered: 10 }),
  mk({ userId: '3', score: 120, elapsedMs: 60000, status: 'finished', answered: 10 }),
  mk({ userId: '4', score: 30, updatedAt: now - STALE_MS - 1000 }),
];
assert(displayStatus(list[0], now) === 'active' && displayStatus(list[1], now) === 'finished' && displayStatus(list[3], now) === 'stalled', 'төлөв: явж буй / дууссан / хөдөлгөөнгүй (>2 мин)');
const sm = summarizeLive(list, now);
assert(sm.participants === 4 && sm.active === 1 && sm.finished === 2 && sm.stalled === 1, 'нийт тоо, явж буй, дууссан, хөдөлгөөнгүй зөв');
assert(sm.topScore === 120 && sm.avgScore === Math.round((90 + 120 + 120 + 30) / 4), 'дээд ба дундаж оноо зөв');
assert(rankLive(list).map((s) => s.userId).join('') === '3214', 'шууд эрэмбэ: оноо, тэнцвэл хугацаа бага нь (3 → 2 → 1 → 4)');
assert(summarizeLive([], now).participants === 0, 'хоосон жагсаалт алдаагүй');
const d = toLiveDoc(mk({ name: 'x'.repeat(200), score: -5, answered: 3.6 }));
assert((d.name as string).length === 80 && d.score === 0 && d.answered === 4, 'DB-д бичих утга хязгаарлагдсан (урт, сөрөг, бутархай)');
assert(Object.keys(d).length === 17, '17 тогтсон талбар (rules-ийн жагсаалттай таарна)');
assert(d.leaves === 0 && d.away === false && toLiveDoc(mk({ leaves: 3, awayMs: 9000.4, away: true })).awayMs === 9000, 'цонх сольсон, одоо гарсан төлөв бичигдэнэ');
