import { Question, GradeLevel } from '../types';

// Static pre-populated question bank is cleared so that all tasks are added manually or via the Admin Generator
export const INTERACTIVE_MAP_PIN_QUESTIONS: Question[] = [];

export const ALL_EXPANDED_QUESTIONS: Question[] = [];

export function getExpandedCompetitionQuestions(
  grade: GradeLevel,
  totalCount: number = 10,
  customQuestions: Question[] = []
): Question[] {
  const matchingCustom = customQuestions.filter(
    (q) => !q.gradeLevels || q.gradeLevels.includes(grade)
  );
  const sourcePool = matchingCustom.length > 0 ? matchingCustom : customQuestions;
  const shuffled = [...sourcePool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(totalCount, shuffled.length));
}
