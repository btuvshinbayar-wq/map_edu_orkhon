/**
 * Уралдааны оноо: ЗӨВ хариултыг ХАМГИЙН БАГА ХУГАЦААНД хийсэн нь хамгийн өндөр оноо авна.
 *
 *   оноо = суурь оноо × (1 + хурдны урамшуулал × (1 − зарцуулсан хугацаа / хугацааны хязгаар))
 *
 *  - Яг л цаг дуусах мөчид зөв хариулбал суурь оноог л авна.
 *  - Тэр даруй зөв хариулбал суурь оноо + хамгийн их урамшуулал (анхдагч +50%).
 *  - Буруу эсвэл цаг дууссан хариулт 0.
 *  Оноо тэнцвэл нийт зарцуулсан хугацаа БАГА нь дээгүүр байрлана.
 */
export interface ScoringConfig {
  /** Нэг асуултад өгөх хугацаа (секунд) */
  secondsPerQuestion: number;
  /** Хамгийн хурдан хариултын нэмэлт урамшуулал, суурь оноонд хувиар (0 = хурдны урамшуулалгүй) */
  speedBonusPercent: number;
}

export const DEFAULT_SCORING: ScoringConfig = { secondsPerQuestion: 30, speedBonusPercent: 50 };

export const normalizeScoring = (c?: Partial<ScoringConfig> | null): ScoringConfig => ({
  secondsPerQuestion: Math.min(600, Math.max(5, Math.round(Number(c?.secondsPerQuestion) || DEFAULT_SCORING.secondsPerQuestion))),
  speedBonusPercent: Math.min(300, Math.max(0, Number.isFinite(Number(c?.speedBonusPercent)) && c?.speedBonusPercent !== undefined ? Number(c.speedBonusPercent) : DEFAULT_SCORING.speedBonusPercent)),
});

/** Нэг асуултад авах оноо */
export function pointsForAnswer(base: number, isCorrect: boolean, elapsedMs: number, cfg: ScoringConfig): number {
  if (!isCorrect || !(base > 0)) return 0;
  const limitMs = cfg.secondsPerQuestion * 1000;
  const t = Math.min(limitMs, Math.max(0, elapsedMs));
  const left = 1 - t / limitMs; // 1 = тэр даруй, 0 = цаг дууссан мөч
  return Math.round(base * (1 + (cfg.speedBonusPercent / 100) * left));
}

/** Нэг асуултаас авч болох дээд оноо (тэр даруй зөв хариулбал) */
export const maxPointsForQuestion = (base: number, cfg: ScoringConfig): number =>
  Math.round(base * (1 + cfg.speedBonusPercent / 100));

export interface Rankable {
  totalScore: number;
  totalTimeMs?: number;
  completedAt?: string;
}

/** Эрэмбэ: оноо өндөр нь, тэнцвэл нийт хугацаа бага нь, түүнийг ч тэнцвэл эрт дуусгасан нь дээгүүр */
export function compareAttempts(a: Rankable, b: Rankable): number {
  if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
  const ta = a.totalTimeMs ?? Number.POSITIVE_INFINITY;
  const tb = b.totalTimeMs ?? Number.POSITIVE_INFINITY;
  if (ta !== tb) return ta - tb;
  return (a.completedAt ?? '').localeCompare(b.completedAt ?? '');
}

export const formatDuration = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------------
// Уралдааны дүрэм: асуултын тоо, нэг асуултын хугацаа. Нийтийн тохиргоо + ангилал тус бүрийн тохиргоо
// ---------------------------------------------------------------------------
export type CategoryId = '9' | '12' | 'teacher' | 'team';
export const CATEGORY_IDS: CategoryId[] = ['9', '12', 'teacher', 'team'];
export const CATEGORY_LABEL: Record<CategoryId, string> = { '9': '9-р анги', '12': '12-р анги', teacher: 'Багш', team: 'Баг' };

export const DEFAULT_QUESTION_COUNT = 10;

import type { BlueprintRule } from '../types';

export interface CategoryRuleOverride {
  questionCount?: number;
  secondsPerQuestion?: number;
  /** Давхарга, төрлөөр тогтоосон бүрэлдэхүүн. Байвал асуултын тоо нь мөрүүдийн нийлбэр болно */
  blueprint?: BlueprintRule[];
  /** Сонгосон даалгаврыг холих эсэх (анхдагч: холино) */
  shuffleBlueprint?: boolean;
}

export interface RulesConfigLike {
  questionsPerAttempt?: number;
  secondsPerQuestion?: number;
  speedBonusPercent?: number;
  categorySettings?: Partial<Record<CategoryId, CategoryRuleOverride>>;
}

export interface CompetitionRules {
  /** Нэг оролдлогод өгөх асуултын тоо */
  questionCount: number;
  secondsPerQuestion: number;
  speedBonusPercent: number;
  /** Бүрэлдэхүүн (давхарга, төрлөөр) тогтоосон бол тэр мөрүүд, үгүй бол undefined (санамсаргүй сонголт) */
  blueprint?: BlueprintRule[];
  shuffleBlueprint?: boolean;
}

export const normalizeQuestionCount = (v: unknown, fallback = DEFAULT_QUESTION_COUNT): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n >= 1 ? Math.min(100, n) : fallback;
};

const hasValue = (v: unknown) => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) && Number(v) > 0;

/**
 * Тухайн ангилалд хэрэглэх дүрэм. Ангилалд тусгай утга өгсөн бол тэр, үгүй бол нийтийн тохиргоо.
 */
export function resolveCompetitionRules(cfg: RulesConfigLike | null | undefined, grade: string): CompetitionRules {
  const base = normalizeScoring(cfg);
  const baseCount = normalizeQuestionCount(cfg?.questionsPerAttempt);
  const o = (cfg?.categorySettings ?? {})[grade as CategoryId];
  const bp = (o?.blueprint ?? []).filter((r) => Math.round(Number(r.count)) > 0).map((r) => ({ ...r, count: Math.min(100, Math.round(Number(r.count))) }));
  const bpTotal = bp.reduce((a, r) => a + r.count, 0);
  return {
    // Бүрэлдэхүүн тогтоосон бол асуултын тоо = мөрүүдийн нийлбэр
    questionCount: bp.length > 0 ? normalizeQuestionCount(bpTotal) : hasValue(o?.questionCount) ? normalizeQuestionCount(o!.questionCount, baseCount) : baseCount,
    secondsPerQuestion: hasValue(o?.secondsPerQuestion)
      ? normalizeScoring({ ...cfg, secondsPerQuestion: o!.secondsPerQuestion }).secondsPerQuestion
      : base.secondsPerQuestion,
    speedBonusPercent: base.speedBonusPercent,
    ...(bp.length > 0 ? { blueprint: bp, shuffleBlueprint: o?.shuffleBlueprint !== false } : {}),
  };
}

/** Уралдааны нийт хугацаа (асуулт × секунд), секундээр */
export const totalSeconds = (r: CompetitionRules, available?: number): number =>
  (available === undefined ? r.questionCount : Math.min(r.questionCount, available)) * r.secondsPerQuestion;

export const formatMinutes = (sec: number): string => {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m} мин${s ? ` ${s} сек` : ''}` : `${s} сек`;
};

/** Хүнд ойлгомжтой тайлбар: бүх ангилал ижил бол нэг мөр, өөр бол ангилал бүрээр */
export function describeRules(cfg: RulesConfigLike | null | undefined): string {
  const rs = CATEGORY_IDS.map((g) => ({ g, r: resolveCompetitionRules(cfg, g) }));
  const same = rs.every((x) => x.r.questionCount === rs[0].r.questionCount && x.r.secondsPerQuestion === rs[0].r.secondsPerQuestion);
  if (same) return `${rs[0].r.questionCount} даалгавар, даалгавар тус бүрт ${rs[0].r.secondsPerQuestion} секунд`;
  return rs.map((x) => `${CATEGORY_LABEL[x.g]}: ${x.r.questionCount} даалгавар × ${x.r.secondsPerQuestion} секунд`).join('; ');
}
