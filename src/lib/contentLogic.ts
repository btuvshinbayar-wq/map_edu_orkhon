// Firebase-гүй цэвэр логик (тест хийхэд хялбар)
export interface QuestionLike { id: string; [k: string]: unknown }

export const PACK_SIZE = 20;

export const needsRefresh = (cached: number | undefined, remote: number) =>
  cached === undefined || cached !== remote;

export const MAX_PACK_BYTES = 600_000; // Firestore-ийн 1 MiB хязгаараас аюулгүй зайтай

const byteLen = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length;

/**
 * Асуултуудыг багцлана: нэг багцад ихдээ `size` асуулт БА ихдээ `maxBytes` байт.
 * Асуулт бүр өөрийн геометрийг агуулдаг тул тоогоор нь биш хэмжээгээр нь хуваана.
 */
export function packQuestions(
  qs: QuestionLike[], size = PACK_SIZE, maxBytes = MAX_PACK_BYTES,
): { id: string; items: QuestionLike[] }[] {
  const packs: { items: QuestionLike[] }[] = [];
  let cur: QuestionLike[] = [];
  let curBytes = 0;
  for (const q of qs) {
    const b = byteLen(q);
    if (b > 900_000) throw new Error(`Асуулт "${String((q as any).title ?? q.id)}" хэт том (${Math.round(b / 1024)} KB). Давхаргаа хөнгөлнө үү.`);
    if (cur.length > 0 && (cur.length >= size || curBytes + b > maxBytes)) {
      packs.push({ items: cur }); cur = []; curBytes = 0;
    }
    cur.push(q); curBytes += b;
  }
  if (cur.length) packs.push({ items: cur });
  return packs.map((p, i) => ({ id: `p${String(i).padStart(3, '0')}`, items: p.items }));
}

export const unpackQuestions = (packs: { items: QuestionLike[] }[]): QuestionLike[] =>
  packs.flatMap((p) => p.items);
