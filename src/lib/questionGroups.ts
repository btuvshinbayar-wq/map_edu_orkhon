import type { Question } from '../types';
import { GIS_AUTO_TASK_TYPE_LABELS, detectQuestionGisTaskType } from '../utils/gisAutoQuestionGenerator';

export interface QuestionGroup { key: string; label: string; type: string; layer: string; ids: string[] }

export const layerNameOf = (q: Question): string => q.shpContourData?.layerName || q.mapPinData?.subCategory || 'Бусад';

export const typeLabelOf = (q: Question): string => {
  const id = detectQuestionGisTaskType(q);
  return (GIS_AUTO_TASK_TYPE_LABELS.find((t) => t.id === id)?.label || 'Бусад').replace(/^\d+\.\s*/, '');
};

/** Нэг давхарга + нэг төрлийн даалгавруудыг бүлэглэнэ: бүлэг дотор асуулт ижил загвартай тул нэг дор засна. */
export function groupQuestions(qs: Question[]): QuestionGroup[] {
  const m = new Map<string, QuestionGroup>();
  for (const q of qs) {
    const type = detectQuestionGisTaskType(q);
    const layer = layerNameOf(q);
    const key = `${type}|${layer}`;
    const g = m.get(key) ?? { key, label: `${typeLabelOf(q)} · ${layer}`, type, layer, ids: [] };
    g.ids.push(q.id);
    m.set(key, g);
  }
  return Array.from(m.values()).sort((a, b) => a.layer.localeCompare(b.layer, 'mn') || a.type.localeCompare(b.type));
}
