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

/** Асуултын харьяалагдах давхаргын ID (featureId нь `${layerId}_f_${index}` хэлбэртэй) */
export const layerIdFromFeatureId = (fid?: string): string | null =>
  fid && fid.includes('_f_') ? fid.split('_f_')[0] : null;

const rename = (t: unknown, from: string, to: string) =>
  typeof t === 'string' && from ? t.split(from).join(to) : t;

/**
 * Давхаргын нэр солигдоход түүнээс үүсгэсэн бүх асуултын нэрийг (layerName, subCategory, гарчиг,
 * тайлбар, hint) шинэ нэрээр солино. Давхаргын ID эсвэл хуучин нэрээр таньна.
 */
export function renameLayerInQuestions<T extends Record<string, any>>(qs: T[], layerId: string, oldName: string, newName: string): T[] {
  return qs.map((q) => {
    const sameLayer =
      layerIdFromFeatureId(q.shpContourData?.featureId) === layerId ||
      q.shpContourData?.layerName === oldName ||
      q.mapPinData?.subCategory === oldName;
    if (!sameLayer) return q;
    const c: any = { ...q };
    if (c.shpContourData) {
      c.shpContourData = {
        ...c.shpContourData, layerName: newName,
        hints: c.shpContourData.hints?.map((h: string) => rename(h, oldName, newName)),
      };
    }
    if (c.mapPinData?.subCategory === oldName) c.mapPinData = { ...c.mapPinData, subCategory: newName };
    c.explanation = rename(c.explanation, oldName, newName);
    c.title = rename(c.title, oldName, newName);
    c.subtitle = rename(c.subtitle, oldName, newName);
    return c as T;
  });
}

/**
 * Firestore массив дотор массивыг (nested arrays) хүлээж авдаггүй, харин GeoJSON координат
 * `[[lon, lat], ...]` хэлбэртэй. Тиймээс асуултын багцыг ТЕКСТ (JSON) болгож хадгална.
 */
export const encodePack = (items: QuestionLike[]): { json: string } => ({ json: JSON.stringify(items) });

export const decodePack = (data: { json?: string; items?: QuestionLike[] }): QuestionLike[] =>
  typeof data.json === 'string' ? (JSON.parse(data.json) as QuestionLike[]) : data.items ?? [];

/** Firestore-ийн "nested arrays are not supported" дүрмийг шалгана (тест, оношилгоонд) */
export function hasNestedArray(v: unknown): boolean {
  if (Array.isArray(v)) return v.some((x) => Array.isArray(x) || hasNestedArray(x));
  if (v && typeof v === 'object') return Object.values(v as object).some(hasNestedArray);
  return false;
}
