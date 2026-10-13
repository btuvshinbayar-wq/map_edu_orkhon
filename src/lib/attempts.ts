import { addDoc, collection, getDocs, limit, orderBy, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface AttemptInput {
  displayName: string;   // leaderboard-д харуулах нэр (users унших шаардлагагүй болгохын тулд хуулна)
  school?: string;
  grade: string;         // '9' | '12' | 'teacher' | 'team'
  totalScore: number;
  correct: number;
  totalQuestions: number;
  timeSpentSec: number;
}

export async function submitAttempt(a: AttemptInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Нэвтэрнэ үү');
  const ref = await addDoc(collection(db, 'attempts'), { ...a, userId: uid, completedAt: serverTimestamp() });
  return ref.id;
}

/** Шилдэг 50. Шууд сонсогч (onSnapshot) БИШ — гараар шинэчлэх товчтой байх тул унших тоо хэмнэгдэнэ. */
export async function getLeaderboard(grade?: string) {
  const q = grade
    ? query(collection(db, 'attempts'), where('grade', '==', grade), orderBy('totalScore', 'desc'), limit(50))
    : query(collection(db, 'attempts'), orderBy('totalScore', 'desc'), limit(50));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
