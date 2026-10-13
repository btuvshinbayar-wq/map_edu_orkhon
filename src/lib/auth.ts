import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User as FbUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface StudentProfile {
  fullName: string;
  phone?: string;
  school?: string;
  aimag?: string;
  soum?: string;
  grade?: string;
  category?: string; // '9' | '12' | 'teacher' ...
}

export interface SessionState {
  user: FbUser | null;
  profile: (StudentProfile & { email: string; role: string; status: string; isCompetitionConfirmed: boolean; mapAndChallengeAccess: boolean }) | null;
  isAdmin: boolean;
}

/** Сурагч бүртгүүлэх. Нууц үгийг Firebase Auth хэшлэж хадгална, манай DB-д ХЭЗЭЭ Ч орохгүй. */
export async function registerStudent(email: string, password: string, p: StudentProfile): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  // Rules: role='student', status='pending', админ тохируулдаг талбарууд false байх ёстой
  await setDoc(doc(db, 'users', cred.user.uid), {
    ...p,
    email: email.trim().toLowerCase(),
    role: 'student',
    status: 'pending',
    isCompetitionConfirmed: false,
    mapAndChallengeAccess: false,
    registeredAt: serverTimestamp(),
  });
}

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const logout = () => signOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email.trim());

/** Нэвтрэлтийн төлөв + профайл + админ эсэхийг (admins/{uid} баримтаар) тодорхойлно. */
export function watchSession(cb: (s: SessionState) => void): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return cb({ user: null, profile: null, isAdmin: false });
    const [adminSnap, profSnap] = await Promise.all([
      getDoc(doc(db, 'admins', user.uid)),
      getDoc(doc(db, 'users', user.uid)),
    ]);
    cb({
      user,
      profile: profSnap.exists() ? (profSnap.data() as SessionState['profile']) : null,
      isAdmin: adminSnap.exists(),
    });
  });
}
