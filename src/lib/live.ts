/**
 * Уралдааны шууд явц. Оролцогч бүр өөрийн `liveSessions/{uid}` баримтыг асуулт бүрийн дараа шинэчилнэ,
 * админ зөвхөн нээлттэй таб дээр onSnapshot-оор шууд хардаг (таб хаахад унших зогсоно).
 */
export type LiveStatus = 'in_progress' | 'finished';

export interface LiveSession {
  userId: string;
  name: string;
  school: string;
  aimag: string;
  grade: string; // '9' | '12' | 'teacher' | 'team'
  status: LiveStatus;
  total: number; // нийт асуулт
  answered: number; // хариулсан асуулт
  correct: number; // зөв хариулт
  score: number; // одоогийн оноо
  maxScore: number;
  elapsedMs: number; // нийт зарцуулсан хугацаа
  leaves?: number; // цонх сольсон удаа
  awayMs?: number; // цонхоос гарсан нийт хугацаа
  away?: boolean; // ОДОО цонхоос гарсан байна
  startedAt: number; // ms
  updatedAt: number; // ms
}

/** Түр зуурын (хөдөлгөөнгүй) гэж үзэх хугацаа */
export const STALE_MS = 2 * 60_000;

export type DisplayStatus = 'finished' | 'active' | 'stalled';

export const displayStatus = (s: LiveSession, now: number): DisplayStatus =>
  s.status === 'finished' ? 'finished' : now - s.updatedAt > STALE_MS ? 'stalled' : 'active';

export interface LiveSummary {
  participants: number;
  active: number;
  stalled: number;
  finished: number;
  avgScore: number;
  topScore: number;
  avgProgress: number; // 0..1
}

export function summarizeLive(sessions: LiveSession[], now: number): LiveSummary {
  const out: LiveSummary = { participants: sessions.length, active: 0, stalled: 0, finished: 0, avgScore: 0, topScore: 0, avgProgress: 0 };
  if (sessions.length === 0) return out;
  let scoreSum = 0, progSum = 0;
  for (const s of sessions) {
    const st = displayStatus(s, now);
    out[st] += 1;
    scoreSum += s.score;
    out.topScore = Math.max(out.topScore, s.score);
    progSum += s.total > 0 ? Math.min(1, s.answered / s.total) : 0;
  }
  out.avgScore = Math.round(scoreSum / sessions.length);
  out.avgProgress = progSum / sessions.length;
  return out;
}

/** Шууд эрэмбэ: оноо өндөр нь, тэнцвэл хугацаа бага нь, дараа нь эхэлснийг нь */
export function rankLive(sessions: LiveSession[]): LiveSession[] {
  return [...sessions].sort((a, b) => b.score - a.score || a.elapsedMs - b.elapsedMs || a.startedAt - b.startedAt);
}

/** Firestore-д бичих утга: тогтсон, хязгаартай талбарууд (rules-тэй таарна) */
export function toLiveDoc(s: LiveSession): Record<string, string | number | boolean> {
  const clip = (v: string, n: number) => String(v ?? '').slice(0, n);
  return {
    userId: s.userId,
    name: clip(s.name, 80),
    school: clip(s.school, 80),
    aimag: clip(s.aimag, 40),
    grade: clip(s.grade, 10),
    status: s.status,
    total: Math.max(0, Math.round(s.total)),
    answered: Math.max(0, Math.round(s.answered)),
    correct: Math.max(0, Math.round(s.correct)),
    score: Math.max(0, Math.round(s.score)),
    maxScore: Math.max(0, Math.round(s.maxScore)),
    elapsedMs: Math.max(0, Math.round(s.elapsedMs)),
    leaves: Math.max(0, Math.round(s.leaves ?? 0)),
    awayMs: Math.max(0, Math.round(s.awayMs ?? 0)),
    away: !!s.away,
    startedAt: Math.round(s.startedAt),
    updatedAt: Math.round(s.updatedAt),
  };
}
