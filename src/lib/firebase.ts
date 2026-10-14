import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Зөвхөн Auth + Firestore. Realtime Database, Analytics, Anonymous auth ХЭРЭГЛЭХГҮЙ.
//
// Firebase web config нь олон нийтэд ил байхаар зохиогдсон (нууц биш). Хамгаалалт нь
// firestore.rules болон Authorized domains дээр. Тиймээс build хувьсагч (VITE_FIREBASE_*)
// тохируулагдаагүй ч сайт ажиллахын тулд анхдагч утгыг энд оруулсан. Хувьсагч өгвөл тэр давамгайлна.
const env = (import.meta as any).env ?? {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAqQ86oGi67_MYnz8bbwNMCpXg2VBS_TrI',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'map-edu-orkhon.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'map-edu-orkhon',
  appId: env.VITE_FIREBASE_APP_ID || '1:419495447124:web:98460504d9dc42573ebbc1',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
