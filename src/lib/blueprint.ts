import type { BlueprintRule, Question } from '../types';
import { detectQuestionGisTaskType } from '../utils/gisAutoQuestionGenerator';
import { layerIdFromFeatureId } from './contentLogic';

/**
 * Уралдааны бүрэлдэхүүн: ангилал тус бүрт "ямар давхаргаас, ямар төрлийн даалгавраас хэдийг" оруулахыг тогтооно.
 * Жишээ нь 9-р анги: Аймгийн хилээс контур таах 3, Гол мөрнөөс нэр тодорхойлох 4, Цэг байрлуулах 3.
 */

/** Даалгаврын давхаргын түлхүүр: давхаргын ID (нэр солигдсон ч хэвээр), үгүй бол нэрээр */
export const layerKeyOf = (q: Question): string => {
  const id = layerIdFromFeatureId(q.shpContourData?.featureId);
  if (id) return id;
  return `name:${q.shpContourData?.layerName || q.mapPinData?.subCategory || 'Бусад'}`;
};

export const layerLabelOf = (q: Question): string => q.shpContourData?.layerName || q.mapPinData?.subCategory || 'Бусад';

export const taskTypeOf = (q: Question): string => detectQuestionGisTaskType(q);

export const matchesRule = (q: Question, r: Pick<BlueprintRule, 'layer' | 'type'>): boolean =>
  (!r.layer || layerKeyOf(q) === r.layer) && (!r.type || taskTypeOf(q) === r.type);

/** Хүчинтэй мөрүүд (тоо > 0) */
export const activeRules = (rules?: BlueprintRule[] | null): BlueprintRule[] =>
  (rules ?? []).filter((r) => Math.round(Number(r.count)) > 0).map((r) => ({ ...r, count: Math.min(100, Math.round(Number(r.count))) }));

export const blueprintTotal = (rules?: BlueprintRule[] | null): number => activeRules(rules).reduce((a, r) => a + r.count, 0);

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Shortage { rule: BlueprintRule; wanted: number; got: number }
export interface PickResult { picked: Question[]; shortages: Shortage[]; perRule: Record<string, Question[]> }

/**
 * Бүрэлдэхүүнээр даалгавар сонгоно. Нарийн заасан мөрийг (давхарга + төрөл) түрүүлж бөглөнө: ингэснээр "аль ч давхарга,
 * аль ч төрөл" гэсэн ерөнхий мөр нарийн мөрийн даалгаврыг булааж авахгүй. Нэг даалгавар хоёр удаа орохгүй.
 * Бэлэн даалгавар хүрэхгүй бол байгаагаар нь өгч, дутуу байгааг `shortages`-д мэдээлнэ.
 */
export function pickByBlueprint(
  pool: Question[],
  rules: BlueprintRule[],
  opts: { rng?: () => number; shuffleOrder?: boolean } = {},
): PickResult {
  const rng = opts.rng ?? Math.random;
  const list = activeRules(rules);
  const spec = (r: BlueprintRule) => (r.layer ? 1 : 0) + (r.type ? 1 : 0);
  const order = list.map((r, i) => ({ r, i })).sort((a, b) => spec(b.r) - spec(a.r) || a.i - b.i);
  const used = new Set<string>();
  const byIndex = new Map<number, Question[]>();
  const shortages: Shortage[] = [];

  for (const { r, i } of order) {
    const cands = shuffled(pool.filter((q) => !used.has(q.id) && matchesRule(q, r)), rng);
    const take = cands.slice(0, r.count);
    take.forEach((q) => used.add(q.id));
    byIndex.set(i, take);
    if (take.length < r.count) shortages.push({ rule: r, wanted: r.count, got: take.length });
  }

  const perRule: Record<string, Question[]> = {};
  list.forEach((r, i) => { perRule[r.id] = byIndex.get(i) ?? []; });
  const ordered = list.flatMap((_, i) => byIndex.get(i) ?? []);
  return { picked: opts.shuffleOrder === false ? ordered : shuffled(ordered, rng), shortages, perRule };
}

/** Админы самбарт: тухайн сангаас бүрэлдэхүүн хэдийг нь хангах боломжтойг урьдчилан тооцно (санамсаргүй биш, тогтмол) */
export function previewBlueprint(pool: Question[], rules: BlueprintRule[]): PickResult {
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  return pickByBlueprint(pool, rules, { rng, shuffleOrder: false });
}

export const newRuleId = () => `bp_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
