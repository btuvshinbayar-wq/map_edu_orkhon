import type { Question } from '../types';
import { detectQuestionGisTaskType } from '../utils/gisAutoQuestionGenerator';

/**
 * Нэг төрлийн даалгаврын асуултыг НЭГ ДОР засах загвар (template) систем.
 *
 * Даалгавар бүрийн текст нь обьектийн нэр, давхаргын нэр, талбай гэх мэт утга агуулдаг. Эдгээр утгыг
 * {нэр}, {давхарга} гэх мэт placeholder болгон салгаж, загварыг нэг удаа засаад бүх даалгаварт өөр өөрийнх нь
 * утгаар дахин бичнэ. Ингэснээр 60 даалгаврын асуултыг 60 удаа биш 1 удаа засна.
 */

export const PLACEHOLDERS: { key: string; label: string }[] = [
  { key: 'нэр', label: 'Обьектийн нэр' },
  { key: 'давхарга', label: 'Давхаргын нэр' },
  { key: 'талбай', label: 'Талбай' },
  { key: 'төв', label: 'Солбицол' },
  { key: 'зай', label: 'Зай' },
  { key: 'бүс', label: 'Бүс нутаг' },
  { key: 'хариулт', label: 'Зөв хариулт (хөрш обьект)' },
  { key: 'дараалал', label: 'Зөв дараалал' },
  { key: 'тоо', label: 'Обьектийн тоо' },
  { key: 'чиглэл', label: 'Эвлүүлэх чиглэл' },
  { key: 'зүг', label: 'Чиглэлийн тайлбар' },
];

export type TemplateVars = Record<string, string>;
export interface QuestionTemplate { title: string; subtitle: string; explanation: string }

const hintValue = (q: Question, re: RegExp): string | undefined => {
  for (const h of q.shpContourData?.hints ?? []) {
    const m = h.match(re);
    if (m) return m[1].trim();
  }
  return undefined;
};

/** Даалгаврын өөрийнх нь утгууд (placeholder-т орох утгууд) */
export function deriveVars(q: Question): TemplateVars {
  const type = detectQuestionGisTaskType(q);
  const v: TemplateVars = {};
  const layer = q.shpContourData?.layerName ?? q.mapPinData?.subCategory;
  if (layer) v['давхарга'] = layer;

  if (type === 'area') {
    const n = hintValue(q, /^Обьект:\s*(.+)$/);
    if (n) v['нэр'] = n;
  } else if (type === 'neighbor') {
    const n = hintValue(q, /^Эх обьект:\s*(.+)$/);
    if (n) v['нэр'] = n;
    if (q.targetName) v['хариулт'] = q.targetName;
  } else if (type === 'assemble') {
    if (q.targetName) v['дараалал'] = q.targetName;
    const n = q.targetName ? q.targetName.split('➔').length : 0;
    if (n > 0) v['тоо'] = String(n);
    const dir = (q.title ?? '').match(/«([^»]+)»/);
    if (dir) v['чиглэл'] = dir[1];
    const sub = (q.subtitle ?? '').match(/ажиглан \(([^)]+)\) зөв эвлүүлнэ үү/);
    if (sub) v['зүг'] = sub[1];
  } else if (type === 'point_placement') {
    const n = q.mapPinData?.targetName ?? q.targetName;
    if (n) v['нэр'] = n;
  } else if (q.targetName) {
    v['нэр'] = q.targetName;
  }
  // Тоон утгууд: hint, гарчиг, тайлбарын аль нэгээс (хэлбэр нь текст бүрт өөр байдаг тул утгыг тэндээс нь шууд авна)
  const texts = [...(q.shpContourData?.hints ?? []), q.title ?? '', q.subtitle ?? '', q.explanation ?? ''];
  const grab = (re: RegExp): string | undefined => {
    for (const t of texts) {
      const m = t.match(re);
      if (m) return m[1].trim();
    }
    return undefined;
  };
  const area = grab(/(?:Талбай:|талбайн хэмжээ(?: нь)?)\s*(~?[\d,.]+\s*км²)/);
  if (area) v['талбай'] = area;
  const center = grab(/(\d+\.\d+°[NS],\s*\d+\.\d+°[EW])/);
  if (center) v['төв'] = center;
  const dist = grab(/зай\s*(~?[\d,.]+\s*км)/);
  if (dist) v['зай'] = dist;
  if (type === 'point_placement') {
    const region = grab(/солбицолд \((.+)\) оршдог/);
    if (region) v['бүс'] = region;
  }
  return v;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const B = '(?<![\\p{L}\\p{N}])';
const A = '(?![\\p{L}\\p{N}])';

/** Текст доторх утгуудыг placeholder болгоно (урт утгыг түрүүлж, үгийн хилийг баримтална) */
export function toTemplate(text: string, vars: TemplateVars): string {
  let out = text ?? '';
  const entries = Object.entries(vars).filter(([, val]) => val && val.length > 0).sort((a, b) => b[1].length - a[1].length);
  for (const [key, val] of entries) {
    out = out.replace(new RegExp(`${B}${esc(val)}${A}`, 'gu'), `{${key}}`);
  }
  return out;
}

/** Загварыг даалгаврын утгаар дүүргэнэ. Утга нь олдохгүй placeholder-ийг хэвээр үлдээнэ. */
export function render(template: string, vars: TemplateVars): string {
  return template.replace(/\{([^{}]+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export function deriveTemplate(q: Question): { template: QuestionTemplate; vars: TemplateVars } {
  const vars = deriveVars(q);
  return {
    vars,
    template: {
      title: toTemplate(q.title, vars),
      subtitle: toTemplate(q.subtitle ?? '', vars),
      explanation: toTemplate(q.explanation ?? '', vars),
    },
  };
}

/** Даалгаврын текстийг (гарчиг / дэд гарчиг / тайлбар) шинэ загвараар солино. Өгөөгүй талбар хэвээр. */
export function applyTemplate(q: Question, patch: Partial<QuestionTemplate>): Question {
  const { vars } = deriveTemplate(q);
  const next: Question = { ...q };
  if (patch.title !== undefined) next.title = render(patch.title, vars);
  if (patch.subtitle !== undefined) next.subtitle = render(patch.subtitle, vars);
  if (patch.explanation !== undefined) next.explanation = render(patch.explanation, vars);
  return next;
}

/** Бүлэг даалгаврын загварууд адил эсэх. Ялгаатай бол сүүлийнх нь харагдах загварыг буцаана. */
export function commonTemplate(qs: Question[]): { template: QuestionTemplate; uniform: boolean; distinct: number } {
  if (qs.length === 0) return { template: { title: '', subtitle: '', explanation: '' }, uniform: true, distinct: 0 };
  const all = qs.map((q) => deriveTemplate(q).template);
  const key = (t: QuestionTemplate) => `${t.title}\u0000${t.subtitle}\u0000${t.explanation}`;
  const counts = new Map<string, { t: QuestionTemplate; n: number }>();
  for (const t of all) {
    const c = counts.get(key(t));
    if (c) c.n += 1;
    else counts.set(key(t), { t, n: 1 });
  }
  const top = Array.from(counts.values()).sort((a, b) => b.n - a.n)[0];
  return { template: top.t, uniform: counts.size === 1, distinct: counts.size };
}

/** Загварт ашигласан боловч зарим даалгаварт утгагүй placeholder-ийн жагсаалт */
export function missingPlaceholders(template: string, qs: Question[]): string[] {
  const used = Array.from(template.matchAll(/\{([^{}]+)\}/g)).map((m) => m[1]);
  const miss = new Set<string>();
  for (const k of used) if (qs.some((q) => !(k in deriveVars(q)))) miss.add(k);
  return Array.from(miss);
}

/** Олон даалгаварт зэрэг "хайх → солих" (гарчиг, дэд гарчиг, тайлбар, hint дотор) */
export function findReplace(q: Question, find: string, replacement: string): Question {
  if (!find) return q;
  const rep = (t?: string) => (typeof t === 'string' ? t.split(find).join(replacement) : t);
  const next: any = { ...q, title: rep(q.title), subtitle: rep(q.subtitle), explanation: rep(q.explanation) };
  if (q.shpContourData?.hints) next.shpContourData = { ...q.shpContourData, hints: q.shpContourData.hints.map((h) => rep(h) as string) };
  return next as Question;
}
