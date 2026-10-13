import {
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, orderBy, limit, writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { User, CompetitionAttempt, CompetitionTeam, DonationRecord, QuestionIssueReport } from '../types';

/** Firestore undefined утга хүлээж авдаггүй тул цэвэрлэнэ. Нууц талбаруудыг хэзээ ч DB-д бичихгүй. */
export function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
const stripSecrets = (u: User): Omit<User, 'password' | 'userApiKey'> => {
  const { password: _p, userApiKey: _k, ...rest } = u;
  return rest;
};

// ---------------- Хэрэглэгч ----------------
export const getUserDoc = async (uid: string): Promise<User | null> => {
  const s = await getDoc(doc(db, 'users', uid));
  return s.exists() ? ({ ...(s.data() as User), id: uid }) : null;
};
export const listUsers = async (): Promise<User[]> => {
  const s = await getDocs(collection(db, 'users'));
  return s.docs.map((d) => ({ ...(d.data() as User), id: d.id }));
};
export const saveUser = (u: User) => setDoc(doc(db, 'users', u.id), clean(stripSecrets(u)), { merge: true });
export const removeUser = (id: string) => deleteDoc(doc(db, 'users', id));

// ---------------- Оролдлого ----------------
export const saveAttemptDoc = (a: CompetitionAttempt) => setDoc(doc(db, 'attempts', a.id), clean(a));
export const removeAttempt = (id: string) => deleteDoc(doc(db, 'attempts', id));
export const listAllAttempts = async (): Promise<CompetitionAttempt[]> => {
  const s = await getDocs(collection(db, 'attempts'));
  return s.docs.map((d) => ({ ...(d.data() as CompetitionAttempt), id: d.id }));
};
export const listOwnAttempts = async (uid: string): Promise<CompetitionAttempt[]> => {
  const s = await getDocs(query(collection(db, 'attempts'), where('userId', '==', uid)));
  return s.docs.map((d) => ({ ...(d.data() as CompetitionAttempt), id: d.id }));
};
/** Ангилал бүрийн шилдэг N. Composite index: grade + totalScore (firestore.indexes.json) */
export const listTopAttempts = async (grades: string[], perGrade = 20): Promise<CompetitionAttempt[]> => {
  const res = await Promise.all(
    grades.map((g) =>
      getDocs(query(collection(db, 'attempts'), where('grade', '==', g), orderBy('totalScore', 'desc'), limit(perGrade))),
    ),
  );
  return res.flatMap((s) => s.docs.map((d) => ({ ...(d.data() as CompetitionAttempt), id: d.id })));
};

// ---------------- Баг ----------------
export const listTeams = async (): Promise<CompetitionTeam[]> =>
  (await getDocs(collection(db, 'teams'))).docs.map((d) => ({ ...(d.data() as CompetitionTeam), id: d.id }));
export const saveTeamDoc = (t: CompetitionTeam) => setDoc(doc(db, 'teams', t.id), clean(t), { merge: true });
export const removeTeam = (id: string) => deleteDoc(doc(db, 'teams', id));

// ---------------- Хандив ----------------
export const listDonations = async (uid: string | null): Promise<DonationRecord[]> => {
  const q = uid ? query(collection(db, 'donations'), where('userId', '==', uid)) : collection(db, 'donations');
  return (await getDocs(q)).docs.map((d) => ({ ...(d.data() as DonationRecord), id: d.id }));
};
export const saveDonationDoc = (d: DonationRecord) => setDoc(doc(db, 'donations', d.id), clean(d), { merge: true });
export const removeDonation = (id: string) => deleteDoc(doc(db, 'donations', id));

// ---------------- Асуултын алдааны мэдэгдэл ----------------
export const listReports = async (): Promise<QuestionIssueReport[]> =>
  (await getDocs(collection(db, 'questionReports'))).docs.map((d) => ({ ...(d.data() as QuestionIssueReport), id: d.id }));
export const saveReportDoc = (r: QuestionIssueReport) => setDoc(doc(db, 'questionReports', r.id), clean(r), { merge: true });
export const removeReport = (id: string) => deleteDoc(doc(db, 'questionReports', id));

// ---------------- Тохиргоо (нийтэд ил) ----------------
export async function readSetting<T>(name: string): Promise<T | null> {
  const s = await getDoc(doc(db, 'app_settings', name));
  return s.exists() ? (s.data() as T) : null;
}
export async function writeSetting(name: string, data: unknown): Promise<void> {
  const json = JSON.stringify(data);
  if (json.length > 900_000) throw new Error('Тохиргооны өгөгдөл хэт том (1 MB-аас бага байх ёстой). Зургийн хэмжээг багасгана уу.');
  await setDoc(doc(db, 'app_settings', name), JSON.parse(json), { merge: false });
}

export { writeBatch };
