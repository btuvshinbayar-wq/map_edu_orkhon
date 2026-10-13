// Firebase-гүй цэвэр логик (тест хийхэд хялбар)
export interface QuestionLike { id: string; [k: string]: unknown }

export const PACK_SIZE = 20;

export const needsRefresh = (cached: number | undefined, remote: number) =>
  cached === undefined || cached !== remote;

export function packQuestions(qs: QuestionLike[], size = PACK_SIZE): { id: string; items: QuestionLike[] }[] {
  const packs: { id: string; items: QuestionLike[] }[] = [];
  for (let i = 0; i < qs.length; i += size) {
    packs.push({ id: `p${String(i / size).padStart(3, '0')}`, items: qs.slice(i, i + size) });
  }
  return packs;
}

export const unpackQuestions = (packs: { items: QuestionLike[] }[]): QuestionLike[] =>
  packs.flatMap((p) => p.items);
