import type { Question } from '../types';

/**
 * Үүсгэсэн даалгаврыг хадгалахаас өмнө засах цэвэр функцүүд.
 * Даалгавар нь сонголтуудыг хоёр газар хадгалдаг (options болон shpContourData.options) тул хоёуланг нь синхрон байлгана.
 */

const sameList = (a: string[] | undefined, b: string[]) =>
  Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);

function withOptions(q: Question, options: NonNullable<Question['options']>): Question {
  const oldOptions = q.options ?? [];
  const oldCorrect = oldOptions.find((o) => o.isCorrect);
  const newCorrect = options.find((o) => o.isCorrect);
  // "Зөв хариу = обьектийн нэр" төрлийн даалгаварт (контур, нэр, хөрш) targetName хариултаар дагаж өөрчлөгдөнө.
  // Талбай гэх мэт тоон хариулттай даалгаварт targetName нь обьектийн нэр хэвээр үлдэнэ.
  const targetIsAnswer = !!oldCorrect && oldCorrect.text === q.targetName;
  const next: Question = { ...q, options };
  if (targetIsAnswer && newCorrect) next.targetName = newCorrect.text;
  if (q.shpContourData) {
    const shp = { ...q.shpContourData };
    if (sameList(shp.options, oldOptions.map((o) => o.text))) shp.options = options.map((o) => o.text);
    if (targetIsAnswer && newCorrect) shp.targetName = newCorrect.text;
    next.shpContourData = shp;
  }
  return next;
}

export const editTitle = (q: Question, title: string): Question => ({ ...q, title });
export const editExplanation = (q: Question, explanation: string): Question => ({ ...q, explanation });
export const editPoints = (q: Question, points: number): Question => ({ ...q, points: Math.max(0, Math.round(points) || 0) });

export const editOptionText = (q: Question, idx: number, text: string): Question =>
  q.options ? withOptions(q, q.options.map((o, i) => (i === idx ? { ...o, text } : o))) : q;

export const setCorrectOption = (q: Question, idx: number): Question =>
  q.options ? withOptions(q, q.options.map((o, i) => ({ ...o, isCorrect: i === idx }))) : q;

export const editPinTolerance = (q: Question, km: number): Question =>
  q.mapPinData ? { ...q, mapPinData: { ...q.mapPinData, allowedDistanceKm: Math.max(1, Math.round(km) || 1) } } : q;

/** Хадгалахаас өмнө шалгах. Асуудал байвал мэдэгдэл буцаана, зөв бол null. */
export function validateDraft(q: Question): string | null {
  if (!q.title || !q.title.trim()) return 'Асуултын текст хоосон байна';
  if (!(q.points > 0)) return 'Оноо 0-ээс их байх ёстой';
  if (q.mapPinData) {
    if (!(q.mapPinData.allowedDistanceKm > 0)) return 'Зөвшөөрөгдөх зай 0-ээс их байх ёстой';
    return null;
  }
  if (q.options && q.options.length > 0) {
    if (q.options.some((o) => !o.text || !o.text.trim())) return 'Хоосон хариултын сонголт байна';
    const texts = q.options.map((o) => o.text.trim().toLowerCase());
    if (new Set(texts).size !== texts.length) return 'Ижил хариултын сонголт байна';
    const correct = q.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) return 'Яг нэг зөв хариулт сонгоно уу';
  }
  return null;
}
