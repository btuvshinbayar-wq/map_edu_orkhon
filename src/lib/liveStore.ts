import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, where, writeBatch, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { toLiveDoc, type LiveSession } from './live';

const COL = 'liveSessions';
const WINDOW_MS = 12 * 3600_000; // сүүлийн 12 цагийн явцыг харуулна

/** Оролцогч өөрийн явцыг шинэчилнэ (уншилт үүсгэхгүй, 1 бичилт) */
export const publishLive = (s: LiveSession) => setDoc(doc(db, COL, s.userId), toLiveDoc(s));

export const removeOwnLive = (uid: string) => deleteDoc(doc(db, COL, uid));

/**
 * Админ шууд харна. Анхны ачаалал нь баримт бүр 1 унших, дараа нь өөрчлөлт бүр 1 унших.
 * Заавал unsubscribe хийж (таб хаахад) унших зогсооно.
 */
export function watchLive(cb: (sessions: LiveSession[]) => void, onError?: (e: Error) => void): Unsubscribe {
  const q = query(collection(db, COL), where('updatedAt', '>', Date.now() - WINDOW_MS));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as LiveSession)), (e) => onError?.(e));
}

/** Уралдаан дууссаны дараа шууд явцыг цэвэрлэнэ */
export async function clearAllLive(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  let n = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => { batch.delete(d.ref); n++; });
    await batch.commit();
  }
  return n;
}
