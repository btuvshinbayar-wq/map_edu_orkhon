import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  sendPasswordResetEmail, updatePassword,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  User, CompetitionAttempt, GradeLevel, MainMenuTab, MapSubTab, ActiveGisLayer, Question,
  LayerUsageStat, TaskPerformanceStat, CertificateConfig, CompetitionScheduleConfig,
  CompetitionTeam, DonationRecord, QuestionIssueReport,
} from '../types';
import { sound } from '../utils/audio';
import { generateComprehensiveGisQuestions, GisAutoTaskType } from '../utils/gisAutoQuestionGenerator';
import { auth, db } from '../lib/firebase';
import { defaultKV } from '../lib/kv';
import {
  loadQuestions, saveQuestions, loadLayerIndex, loadLayerData, saveLayer, deleteLayer, type LayerIndexEntry,
} from '../lib/content';
import {
  clean, getUserDoc, listUsers, saveUser, removeUser, saveAttemptDoc, removeAttempt, listAllAttempts,
  listOwnAttempts, listTopAttempts, listTeams, saveTeamDoc, removeTeam, listDonations, saveDonationDoc,
  removeDonation, listReports, saveReportDoc, removeReport, readSetting, writeSetting,
} from '../lib/store';
import { processLayer } from '../lib/layerProcessor';

type Result = { success: boolean; message: string; isAdmin?: boolean };
type TabId = 'competition' | 'explore' | 'puzzles' | 'leaderboard' | 'admin' | 'profile';

interface AppContextType {
  currentUser: User | null;
  authReady: boolean;
  users: User[];
  attempts: CompetitionAttempt[];
  refreshAttempts: () => Promise<void>;
  mainMenuTab: MainMenuTab;
  setMainMenuTab: (tab: MainMenuTab) => void;
  mapSubTab: MapSubTab;
  setMapSubTab: (tab: MapSubTab) => void;
  activeTab: TabId;
  isMuted: boolean;
  registerUser: (data: Omit<User, 'id' | 'status' | 'registeredAt'>) => Promise<Result>;
  loginUser: (identifier: string, password?: string) => Promise<Result>;
  resetPasswordEmail: (email: string) => Promise<Result>;
  logout: () => void;
  switchUser: (userId: string) => void;
  approveStudent: (userId: string) => void;
  rejectStudent: (userId: string) => void;
  approveAllPending: () => void;
  toggleUserMapAccess: (userId: string, grant: boolean) => void;
  batchSetUserMapAccess: (userIds: string[], grant: boolean) => void;
  deleteUser: (userId: string) => void;
  batchDeleteUsers: (userIds: string[]) => void;
  batchSetCompetitionConfirmed: (userIds: string[], confirmed: boolean) => void;
  saveAttempt: (attempt: Omit<CompetitionAttempt, 'id' | 'certificateNumber'>) => CompetitionAttempt;
  archiveAttempt: (attemptId: string, archive: boolean) => void;
  batchArchiveAttempts: (attemptIds: string[], archive: boolean) => void;
  deleteAttempt: (attemptId: string) => void;
  batchDeleteAttempts: (attemptIds: string[]) => void;
  setActiveTab: (tab: TabId) => void;
  toggleMute: () => void;
  updateAdminProfile: (updates: {
    fullName: string; organization: string; position: string;
    email?: string; phone?: string; aimag?: string; soum?: string;
  }) => void;
  updateUserProfile: (updates: {
    userId?: string; fullName: string; school: string; aimag: string; soum?: string; grade?: GradeLevel;
    phone?: string; email?: string; position?: string; password?: string;
  }) => Promise<Result>;
  gisLayers: ActiveGisLayer[];
  setGisLayers: React.Dispatch<React.SetStateAction<ActiveGisLayer[]>>;
  addGisLayer: (layer: ActiveGisLayer) => void;
  updateGisLayer: (id: string, updates: Partial<ActiveGisLayer>) => void;
  deleteGisLayer: (id: string) => void;
  resetGisLayers: () => void;
  customQuestions: Question[];
  addCustomQuestion: (question: Question) => void;
  updateCustomQuestion: (id: string, updates: Partial<Question>) => void;
  deleteCustomQuestion: (id: string) => void;
  batchDeleteCustomQuestions: (ids: string[]) => void;
  deleteCustomQuestionsByLayer: (layerName: string) => void;
  clearAllCustomQuestions: () => void;
  batchAddCustomQuestions: (questions: Question[]) => void;
  syncAllWithFirebase: () => Promise<{ questionsCount: number; layersCount: number }>;
  autoGenerateQuestionsFromGisLayers: (opts?: {
    layerIds?: string[]; taskTypes?: GisAutoTaskType[]; replaceExisting?: boolean; maxPerLayer?: number;
  }) => number;
  layerUsageStats: LayerUsageStat[];
  taskPerformanceStats: TaskPerformanceStat[];
  recordLayerView: (layerId: string, layerName: string, geometryType?: string) => void;
  recordTaskAttempt: (params: { objectName: string; layerName: string; geometryType?: string; isCorrect: boolean }) => void;
  certificateConfig: CertificateConfig;
  updateCertificateConfig: (updates: Partial<CertificateConfig>) => void;
  resetCertificateConfig: () => void;
  competitionSchedule: CompetitionScheduleConfig;
  updateCompetitionSchedule: (updates: Partial<CompetitionScheduleConfig>) => void;
  isCompetitionCurrentlyOpen: boolean;
  teams: CompetitionTeam[];
  createTeam: (teamData: Omit<CompetitionTeam, 'id' | 'createdAt'>) => Promise<boolean>;
  updateTeam: (id: string, updates: Partial<CompetitionTeam>) => Promise<boolean>;
  deleteTeam: (id: string) => Promise<boolean>;
  donations: DonationRecord[];
  submitDonation: (donorData: Omit<DonationRecord, 'id' | 'status' | 'submittedAt'>) => Promise<{ success: boolean; message: string; donation?: DonationRecord }>;
  reviewDonation: (id: string, status: 'approved' | 'rejected', adminNote?: string) => Promise<boolean>;
  deleteDonation: (id: string) => Promise<boolean>;
  questionReports: QuestionIssueReport[];
  submitQuestionReport: (reportData: Omit<QuestionIssueReport, 'id' | 'status' | 'createdAt'>) => Promise<{ success: boolean; message: string; report?: QuestionIssueReport }>;
  resolveQuestionReport: (
    reportId: string,
    params: {
      status: 'resolved' | 'dismissed'; adminNote?: string;
      applyQuestionUpdates?: { questionId: string; newTargetName: string; newTitle?: string; newExplanation?: string };
    },
  ) => Promise<boolean>;
  deleteQuestionReport: (id: string) => Promise<boolean>;
}

// Зөвхөн энэ төхөөрөмж дээр хадгалагдах (DB-д очихгүй) түлхүүрүүд
const LS_LAYER_STATS = 'geo_layer_usage_stats_v2';
const LS_TASK_STATS = 'geo_task_perf_stats_v2';

export const DEFAULT_COMPETITION_SCHEDULE: CompetitionScheduleConfig = {
  mode: 'open',
  startTime: '2026-10-08T09:00',
  endTime: '2026-10-15T18:00',
  durationMinutesPerQuestion: 30,
  announcementNote: 'Уралдаанд оролцохоор баталгаажсан оролцогчид товлосон цагт оролцоно уу.',
};

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  topSubtitle: 'Газарзүйн интерактив цахим шалгалт 2026',
  mainTitle: 'БАТЛАМЖ',
  competitionName: '"Газрын зургийг хэн сайн мэдэх вэ?" интерактив уралдаан',
  recipientPrefix: 'Энэхүү батламжийг',
  bodyText:
    'Монгол орны болон тив, дэлхийн газрын зургийн мэдлэг, орон зайн сэтгэлгээг шалгах интерактив уралдаанд амжилттай оролцож, өндөр ур чадвар үзүүлсэн тул батламжлав.',
  stampLines: 'Шалгасан | ✓ БАТЛАВ | 2026',
  partners: [],
};

const GRADES_FOR_LEADERBOARD = ['9', '12', 'teacher', 'team'];

const readLS = <T,>(key: string, fallback: T): T => {
  try { const s = localStorage.getItem(key); return s ? (JSON.parse(s) as T) : fallback; } catch { return fallback; }
};
const writeLS = (key: string, v: unknown) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } };

const errMsg = (e: any): string => {
  const code: string = e?.code || '';
  if (code.includes('email-already-in-use')) return 'Энэ имэйл хаяг өмнө нь бүртгэгдсэн байна.';
  if (code.includes('weak-password')) return 'Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой.';
  if (code.includes('invalid-email')) return 'Имэйл хаягийн хэлбэр буруу байна.';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return 'Имэйл эсвэл нууц үг буруу байна.';
  if (code.includes('too-many-requests')) return 'Хэт олон оролдлого хийлээ. Хэсэг хугацааны дараа дахин оролдоно уу.';
  if (code.includes('network')) return 'Сүлжээний алдаа. Интернэт холболтоо шалгана уу.';
  if (code.includes('permission-denied')) return 'Эрх хүрэлцэхгүй байна.';
  return e?.message || 'Алдаа гарлаа.';
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const kv = useMemo(() => defaultKV(), []);

  // ---------- Төлөв ----------
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [publicAdmin, setPublicAdmin] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<CompetitionAttempt[]>([]);
  const [teams, setTeams] = useState<CompetitionTeam[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [questionReports, setQuestionReports] = useState<QuestionIssueReport[]>([]);
  const [gisLayers, setGisLayers] = useState<ActiveGisLayer[]>([]);
  const [customQuestions, setCustomQuestions] = useState<Question[]>([]);
  const [certificateConfig, setCertificateConfig] = useState<CertificateConfig>(DEFAULT_CERTIFICATE_CONFIG);
  const [competitionSchedule, setCompetitionSchedule] = useState<CompetitionScheduleConfig>(DEFAULT_COMPETITION_SCHEDULE);
  const [layerUsageStats, setLayerUsageStats] = useState<LayerUsageStat[]>(() => readLS(LS_LAYER_STATS, []));
  const [taskPerformanceStats, setTaskPerformanceStats] = useState<TaskPerformanceStat[]>(() => readLS(LS_TASK_STATS, []));
  const [mainMenuTab, setMainMenuTabState] = useState<MainMenuTab>('explore');
  const [mapSubTab, setMapSubTabState] = useState<MapSubTab>('explore');
  const [activeTab, setActiveTabState] = useState<TabId>('explore');
  const [isMuted, setIsMuted] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const layerIndexRef = useRef<Map<string, LayerIndexEntry>>(new Map());
  const questionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layerTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const questionsRef = useRef<Question[]>([]);
  questionsRef.current = customQuestions;
  const layersRef = useRef<ActiveGisLayer[]>([]);
  layersRef.current = gisLayers;

  useEffect(() => { writeLS(LS_LAYER_STATS, layerUsageStats); }, [layerUsageStats]);
  useEffect(() => { writeLS(LS_TASK_STATS, taskPerformanceStats); }, [taskPerformanceStats]);
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  // ---------- Навигаци ----------
  const setMainMenuTab = (tab: MainMenuTab) => {
    setMainMenuTabState(tab);
    if (tab === 'competition' || tab === 'explore' || tab === 'puzzles' || tab === 'leaderboard') {
      setActiveTabState(tab); setMapSubTabState(tab);
    } else if (tab === 'admin_auth') setActiveTabState('admin');
  };
  const setMapSubTab = (tab: MapSubTab) => { setMapSubTabState(tab); setMainMenuTabState(tab as any); setActiveTabState(tab); };
  const setActiveTab = (tab: TabId) => {
    setActiveTabState(tab);
    if (tab === 'admin') setMainMenuTabState('admin_auth');
    else if (tab === 'competition' || tab === 'explore' || tab === 'puzzles' || tab === 'leaderboard') {
      setMainMenuTabState(tab as any); setMapSubTabState(tab);
    }
  };
  const toggleMute = () => { const n = !isMuted; setIsMuted(n); sound.setMuted(n); };

  // ---------- Контент (асуулт, давхарга): cache-тэй ----------
  const loadContent = useCallback(async () => {
    const [qs, index] = await Promise.all([loadQuestions(kv), loadLayerIndex(kv)]);
    setCustomQuestions(qs as unknown as Question[]);
    layerIndexRef.current = new Map(index.map((e) => [e.id, e]));
    const layers = await Promise.all(
      index.map(async (e): Promise<ActiveGisLayer> => {
        const fc = await loadLayerData(e, kv);
        const p = (e.props ?? {}) as Partial<ActiveGisLayer>;
        return {
          visible: true, color: '#0f766e', fillColor: '#14b8a6', fillOpacity: 0.3, weight: 2,
          geometryType: 'Mixed', createdAt: new Date().toISOString(),
          ...p, id: e.id, name: e.name, featureCount: e.featureCount, geojson: fc,
        };
      }),
    );
    setGisLayers(layers);
    return { questionsCount: qs.length, layersCount: layers.length };
  }, [kv]);

  const loadSettings = useCallback(async () => {
    const [sched, cert, pub] = await Promise.all([
      readSetting<CompetitionScheduleConfig>('competition').catch(() => null),
      readSetting<CertificateConfig>('certificate').catch(() => null),
      readSetting<{ adminName?: string; adminPosition?: string; adminOrg?: string }>('public').catch(() => null),
    ]);
    if (sched) setCompetitionSchedule({ ...DEFAULT_COMPETITION_SCHEDULE, ...sched });
    if (cert) setCertificateConfig({ ...DEFAULT_CERTIFICATE_CONFIG, ...cert, partners: Array.isArray(cert.partners) ? cert.partners : [] });
    if (pub) {
      setPublicAdmin({
        id: 'public_admin', fullName: pub.adminName || 'Админ', email: '', phone: '', school: pub.adminOrg || '',
        organization: pub.adminOrg || '', position: pub.adminPosition || '', aimag: '', soum: '', grade: '12',
        studentCode: 'ADMIN', role: 'admin', status: 'approved', registeredAt: '',
      } as User);
    }
  }, []);

  // Нэвтрэхээс өмнө ч уншигдах тохиргоо (3 унших)
  useEffect(() => { loadSettings().catch(() => {}); }, [loadSettings]);

  // ---------- Нэвтрэлтийн төлөв ----------
  const applySession = useCallback(async (uid: string, email: string) => {
    const [adminSnap, profile] = await Promise.all([getDoc(doc(db, 'admins', uid)), getUserDoc(uid)]);
    const admin = adminSnap.exists();
    setIsAdmin(admin);
    let me: User | null = profile;
    if (!me && admin) {
      me = {
        id: uid, fullName: email, email, phone: '', school: '', organization: '', position: 'Админ', aimag: '', soum: '',
        grade: '12', studentCode: 'ADMIN', role: 'admin', status: 'approved', mapAndChallengeAccess: true,
        isCompetitionConfirmed: true, registeredAt: new Date().toISOString(),
      } as User;
    }
    if (me && admin) me = { ...me, role: 'admin', status: 'approved' }; // эрхийг admins/{uid}-аас л тодорхойлно
    setCurrentUser(me);
    return { admin, me };
  }, []);

  const loadPrivate = useCallback(async (uid: string, admin: boolean) => {
    await loadContent().catch((e) => console.warn('content load', e));
    if (admin) {
      const [u, a, t, d, r] = await Promise.all([
        listUsers(), listAllAttempts(), listTeams(), listDonations(null), listReports(),
      ]);
      setUsers(u); setAttempts(a); setTeams(t); setDonations(d); setQuestionReports(r);
    } else {
      setDonations(await listDonations(uid).catch(() => []));
    }
  }, [loadContent]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fb) => {
      try {
        if (!fb) {
          setCurrentUser(null); setIsAdmin(false); setUsers([]); setAttempts([]); setTeams([]);
          setDonations([]); setQuestionReports([]); setGisLayers([]); setCustomQuestions([]);
        } else {
          const { admin } = await applySession(fb.uid, fb.email || '');
          await loadPrivate(fb.uid, admin);
        }
      } catch (e) {
        console.warn('session load error', e);
      } finally {
        setAuthReady(true);
      }
    });
    return unsub;
  }, [applySession, loadPrivate]);

  // Админ биш хэрэглэгчид: шилдэгүүдийг зөвхөн Шилдэгүүд цонх нээгдэх үед (гараар) уншина
  const refreshAttempts = useCallback(async () => {
    if (!auth.currentUser) return;
    if (isAdmin) { setAttempts(await listAllAttempts()); return; }
    const [top, own] = await Promise.all([listTopAttempts(GRADES_FOR_LEADERBOARD, 20), listOwnAttempts(auth.currentUser.uid)]);
    const byId = new Map<string, CompetitionAttempt>();
    [...top, ...own].forEach((a) => byId.set(a.id, a));
    setAttempts(Array.from(byId.values()));
  }, [isAdmin]);

  const syncAllWithFirebase = async () => {
    const res = await loadContent();
    if (isAdmin) {
      const [u, a, t, d, r] = await Promise.all([listUsers(), listAllAttempts(), listTeams(), listDonations(null), listReports()]);
      setUsers(u); setAttempts(a); setTeams(t); setDonations(d); setQuestionReports(r);
    }
    return res;
  };

  // ---------- Бүртгэл / нэвтрэлт ----------
  const registerUser = async (data: Omit<User, 'id' | 'status' | 'registeredAt'>): Promise<Result> => {
    const email = data.email.trim().toLowerCase();
    if (!email.includes('@')) return { success: false, message: 'Зөв имэйл хаяг оруулна уу.' };
    if (!data.password) return { success: false, message: 'Нууц үгээ оруулна уу.' };
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, data.password);
      const { password: _pw, ...rest } = data;
      const profile: User = {
        ...rest, email, id: cred.user.uid, status: 'pending',
        mapAndChallengeAccess: true, isCompetitionConfirmed: false, registeredAt: new Date().toISOString(),
      };
      await saveUser(profile);
      sound.playSuccess();
      return { success: true, message: 'Амжилттай бүртгэгдлээ! Админ баталгаажуулсны дараа уралдаанд орно.' };
    } catch (e) {
      return { success: false, message: errMsg(e) };
    }
  };

  const loginUser = async (identifier: string, password = ''): Promise<Result> => {
    const email = identifier.trim().toLowerCase();
    if (!email.includes('@')) return { success: false, message: 'Имэйл хаягаа оруулна уу.' };
    if (!password) return { success: false, message: 'Нууц үгээ оруулна уу.' };
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const adm = await getDoc(doc(db, 'admins', cred.user.uid)).then((d) => d.exists()).catch(() => false);
      return { success: true, message: 'Тавтай морил!', isAdmin: adm };
    } catch (e) {
      return { success: false, message: errMsg(e) };
    }
  };

  const resetPasswordEmail = async (email: string): Promise<Result> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true, message: 'Нууц үг сэргээх холбоосыг имэйл рүү илгээлээ.' };
    } catch (e) { return { success: false, message: errMsg(e) }; }
  };

  const logout = () => { signOut(auth).catch(() => {}); };
  const switchUser = (_userId: string) => { /* Firebase Auth-д өөр хүнийг дуурайх боломжгүй (аюулгүй байдал) */ };

  // ---------- Хэрэглэгчийн удирдлага (админ) ----------
  const patchUsers = (ids: string[], fn: (u: User) => User) => {
    const set = new Set(ids);
    setUsers((prev) => prev.map((u) => {
      if (!set.has(u.id)) return u;
      const next = fn(u);
      saveUser(next).catch((e) => console.warn('user save', e));
      return next;
    }));
    if (currentUser && set.has(currentUser.id)) setCurrentUser((c) => (c ? fn(c) : c));
  };
  const me = () => currentUser?.fullName || 'Админ';

  const approveStudent = (id: string) => {
    patchUsers([id], (u) => ({ ...u, status: 'approved', isCompetitionConfirmed: true, mapAndChallengeAccess: true, verifiedAt: new Date().toISOString(), verifiedBy: me() }));
    sound.playSuccess();
  };
  const rejectStudent = (id: string) => {
    patchUsers([id], (u) => ({ ...u, status: 'rejected', isCompetitionConfirmed: false, verifiedAt: new Date().toISOString(), verifiedBy: me() }));
  };
  const approveAllPending = () => {
    const ids = users.filter((u) => u.status === 'pending' && u.role !== 'admin').map((u) => u.id);
    patchUsers(ids, (u) => ({ ...u, status: 'approved', isCompetitionConfirmed: true, mapAndChallengeAccess: true, verifiedAt: new Date().toISOString(), verifiedBy: me() }));
    sound.playSuccess();
  };
  const toggleUserMapAccess = (id: string, grant: boolean) => patchUsers([id], (u) => ({ ...u, mapAndChallengeAccess: grant }));
  const batchSetUserMapAccess = (ids: string[], grant: boolean) => patchUsers(ids, (u) => ({ ...u, mapAndChallengeAccess: grant }));
  const batchSetCompetitionConfirmed = (ids: string[], confirmed: boolean) => patchUsers(ids, (u) => ({ ...u, isCompetitionConfirmed: confirmed }));
  // Анхаар: Firebase Auth-ийн бүртгэлийг клиентээс устгах боломжгүй. Профайл л устна.
  const deleteUser = (id: string) => { setUsers((p) => p.filter((u) => u.id !== id)); removeUser(id).catch(() => {}); };
  const batchDeleteUsers = (ids: string[]) => ids.forEach(deleteUser);

  const updateAdminProfile: AppContextType['updateAdminProfile'] = (u) => {
    if (!currentUser) return;
    const next: User = {
      ...currentUser, fullName: u.fullName.trim() || currentUser.fullName,
      school: u.organization.trim(), organization: u.organization.trim(), position: u.position.trim(), notes: u.position.trim(),
      phone: u.phone ?? currentUser.phone, aimag: u.aimag ?? currentUser.aimag, soum: u.soum ?? currentUser.soum,
    };
    setCurrentUser(next);
    saveUser(next).catch((e) => console.warn(e));
    writeSetting('public', { adminName: next.fullName, adminPosition: next.position || '', adminOrg: next.organization || '' }).catch(() => {});
    sound.playSuccess();
  };

  const updateUserProfile: AppContextType['updateUserProfile'] = async (u) => {
    const targetId = u.userId || currentUser?.id;
    const target = users.find((x) => x.id === targetId) || (currentUser?.id === targetId ? currentUser : null);
    if (!target) return { success: false, message: 'Хэрэглэгч олдсонгүй. Эхлээд системд нэвтэрнэ үү.' };
    if (!u.fullName.trim() || !u.school.trim()) return { success: false, message: 'Овог нэр болон сургууль/байгууллагын нэрээ заавал бөглөнө үү.' };
    const grade = u.grade || target.grade;
    const next: User = {
      ...target, fullName: u.fullName.trim(), school: u.school.trim(), organization: u.school.trim(),
      aimag: u.aimag.trim() || target.aimag, soum: u.soum !== undefined ? u.soum.trim() || 'Төв' : target.soum,
      grade, role: target.role === 'admin' ? 'admin' : grade === 'teacher' ? 'teacher' : 'student',
      phone: u.phone !== undefined ? u.phone.trim() : target.phone,
      position: u.position !== undefined ? u.position.trim() : target.position,
    };
    try {
      await saveUser(next);
      if (u.password && u.password.trim() && target.id === auth.currentUser?.uid) {
        await updatePassword(auth.currentUser!, u.password.trim());
      }
    } catch (e: any) {
      if (e?.code === 'auth/requires-recent-login')
        return { success: false, message: 'Нууц үг солихын тулд дахин нэвтэрч орно уу.' };
      return { success: false, message: errMsg(e) };
    }
    setUsers((p) => p.map((x) => (x.id === next.id ? next : x)));
    if (currentUser?.id === next.id) setCurrentUser(next);
    sound.playSuccess();
    return { success: true, message: 'Таны сургууль болон хувийн мэдээлэл амжилттай хадгалагдлаа!' };
  };

  // ---------- Оролдлого ----------
  const saveAttempt: AppContextType['saveAttempt'] = (data) => {
    const certNum = `MN-GEO-2026-${data.grade}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
    const a: CompetitionAttempt = { ...data, id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, certificateNumber: certNum, isArchived: false };
    setAttempts((p) => [a, ...p]);
    saveAttemptDoc(a).catch((e) => console.warn('attempt save failed', e));
    return a;
  };
  const patchAttempts = (ids: string[], fn: (a: CompetitionAttempt) => CompetitionAttempt) => {
    const set = new Set(ids);
    setAttempts((p) => p.map((a) => {
      if (!set.has(a.id)) return a;
      const n = fn(a); saveAttemptDoc(n).catch(() => {}); return n;
    }));
  };
  const archiveAttempt = (id: string, archive: boolean) => { patchAttempts([id], (a) => ({ ...a, isArchived: archive, archivedAt: archive ? new Date().toISOString() : undefined })); sound.playClick(); };
  const batchArchiveAttempts = (ids: string[], archive: boolean) => { patchAttempts(ids, (a) => ({ ...a, isArchived: archive, archivedAt: archive ? new Date().toISOString() : undefined })); sound.playSuccess(); };
  const deleteAttempt = (id: string) => { setAttempts((p) => p.filter((a) => a.id !== id)); removeAttempt(id).catch(() => {}); };
  const batchDeleteAttempts = (ids: string[]) => ids.forEach(deleteAttempt);

  // ---------- Асуулт (админ засахад 1.5 сек хүлээгээд бүгдийг нэг дор хадгална) ----------
  const persistQuestions = () => {
    if (questionsTimer.current) clearTimeout(questionsTimer.current);
    questionsTimer.current = setTimeout(() => {
      saveQuestions(clean(questionsRef.current) as any).catch((e) => console.warn('questions save', e));
    }, 1500);
  };
  const mutateQuestions = (fn: (q: Question[]) => Question[]) => {
    setCustomQuestions((prev) => { const n = fn(prev); questionsRef.current = n; return n; });
    persistQuestions();
  };
  const addCustomQuestion = (q: Question) => { if (q?.id) { mutateQuestions((p) => [q, ...p.filter((x) => x.id !== q.id)]); sound.playSuccess(); } };
  const updateCustomQuestion = (id: string, up: Partial<Question>) => mutateQuestions((p) => p.map((q) => (q.id === id ? { ...q, ...up } : q)));
  const deleteCustomQuestion = (id: string) => mutateQuestions((p) => p.filter((q) => q.id !== id));
  const batchDeleteCustomQuestions = (ids: string[]) => { const s = new Set(ids); mutateQuestions((p) => p.filter((q) => !s.has(q.id))); };
  const deleteCustomQuestionsByLayer = (layerName: string) =>
    mutateQuestions((p) => p.filter((q: any) => (q.layerName ?? q.shpContourData?.layerName) !== layerName));
  const clearAllCustomQuestions = () => mutateQuestions(() => []);
  const batchAddCustomQuestions = (qs: Question[]) => {
    const ids = new Set(qs.map((q) => q.id));
    mutateQuestions((p) => [...qs, ...p.filter((x) => !ids.has(x.id))]);
    sound.playSuccess();
  };
  const autoGenerateQuestionsFromGisLayers: AppContextType['autoGenerateQuestionsFromGisLayers'] = (opts) => {
    const generated = generateComprehensiveGisQuestions({
      layers: gisLayers, selectedLayerIds: opts?.layerIds, enabledTypes: opts?.taskTypes, maxQuestionsPerLayer: opts?.maxPerLayer ?? 54,
    });
    if (generated.length === 0) return 0;
    if (opts?.replaceExisting) mutateQuestions(() => generated);
    else { const ids = new Set(generated.map((q) => q.id)); mutateQuestions((p) => [...generated, ...p.filter((x) => !ids.has(x.id))]); }
    sound.playSuccess();
    return generated.length;
  };

  // ---------- GIS давхарга ----------
  const PERSISTED_LAYER_KEYS = ['name', 'color', 'fillColor', 'fillOpacity', 'weight', 'nameField', 'selectedFeatureIndices', 'notes', 'isOfficial', 'geojson'];
  const persistLayer = (id: string) => {
    const t = layerTimers.current.get(id); if (t) clearTimeout(t);
    layerTimers.current.set(id, setTimeout(async () => {
      const l = layersRef.current.find((x) => x.id === id); if (!l) return;
      try {
        // Автомат хамгаалалт: координатыг 5 оронд тоймлоно (геометрийг өөрчлөхгүй, хэмжээг багасгана)
        const { collection: fc, stats } = processLayer(l.geojson, { simplifyTolerance: 0, precision: 5 });
        const { geojson: _g, ...props } = l;
        const entry = await saveLayer(id, { name: l.name, kind: stats.kind, bbox: stats.bbox, props: clean(props) }, fc);
        layerIndexRef.current.set(id, entry);
      } catch (e) { console.error('Давхарга хадгалж чадсангүй:', e); }
    }, 1500));
  };
  const addGisLayer = (layer: ActiveGisLayer) => {
    if (!layer?.id) return;
    setGisLayers((p) => [layer, ...p.filter((l) => l.id !== layer.id)]);
    layersRef.current = [layer, ...layersRef.current.filter((l) => l.id !== layer.id)];
    persistLayer(layer.id);
    sound.playSuccess();
  };
  const updateGisLayer = (id: string, up: Partial<ActiveGisLayer>) => {
    setGisLayers((p) => p.map((l) => (l.id === id ? { ...l, ...up } : l)));
    layersRef.current = layersRef.current.map((l) => (l.id === id ? { ...l, ...up } : l));
    // Зөвхөн харагдац (visible) солигдсон бол DB-д бичихгүй
    if (Object.keys(up).some((k) => PERSISTED_LAYER_KEYS.includes(k))) persistLayer(id);
  };
  const deleteGisLayer = (id: string) => {
    setGisLayers((p) => p.filter((l) => l.id !== id));
    deleteLayer(id).catch((e) => console.warn(e));
  };
  const resetGisLayers = () => { gisLayers.forEach((l) => deleteLayer(l.id).catch(() => {})); setGisLayers([]); sound.playSuccess(); };

  // ---------- Статистик (энэ төхөөрөмж дээр) ----------
  const recordLayerView: AppContextType['recordLayerView'] = (layerId, layerName, geometryType = 'Polygon') => {
    if (!layerName) return;
    const now = new Date().toISOString();
    setLayerUsageStats((prev) => {
      const i = prev.findIndex((s) => s.layerId === layerId || s.layerName === layerName);
      if (i >= 0) { const u = [...prev]; u[i] = { ...u[i], mapViews: u[i].mapViews + 1, lastActiveAt: now }; return u; }
      return [...prev, { layerId: layerId || `layer_${Date.now()}`, layerName, geometryType, mapViews: 1, quizAttempts: 0, correctCount: 0, wrongCount: 0, lastActiveAt: now }];
    });
  };
  const recordTaskAttempt: AppContextType['recordTaskAttempt'] = ({ objectName, layerName, geometryType = 'Polygon', isCorrect }) => {
    if (!objectName) return;
    const now = new Date().toISOString();
    const cleanLayer = layerName || 'Ерөнхий давхарга';
    const key = `${cleanLayer}__${objectName}`.toLowerCase();
    setTaskPerformanceStats((prev) => {
      const i = prev.findIndex((t) => t.taskId === key);
      if (i >= 0) { const u = [...prev]; u[i] = { ...u[i], attempts: u[i].attempts + 1, correct: u[i].correct + (isCorrect ? 1 : 0), wrong: u[i].wrong + (isCorrect ? 0 : 1), lastAttemptedAt: now }; return u; }
      return [...prev, { taskId: key, objectName, layerName: cleanLayer, geometryType, attempts: 1, correct: isCorrect ? 1 : 0, wrong: isCorrect ? 0 : 1, lastAttemptedAt: now }];
    });
  };

  // ---------- Тохиргоо ----------
  const updateCertificateConfig = (up: Partial<CertificateConfig>) => {
    const next = { ...certificateConfig, ...up };
    setCertificateConfig(next);
    writeSetting('certificate', next).catch((e) => console.warn(e));
  };
  const resetCertificateConfig = () => { setCertificateConfig(DEFAULT_CERTIFICATE_CONFIG); writeSetting('certificate', DEFAULT_CERTIFICATE_CONFIG).catch(() => {}); };
  const updateCompetitionSchedule = (up: Partial<CompetitionScheduleConfig>) => {
    const next = { ...competitionSchedule, ...up };
    setCompetitionSchedule(next);
    writeSetting('competition', next).catch((e) => console.warn(e));
    sound.playSuccess();
  };
  const isCompetitionCurrentlyOpen = (() => {
    if (competitionSchedule.mode === 'open') return true;
    if (competitionSchedule.mode === 'closed') return false;
    const s = competitionSchedule.startTime ? new Date(competitionSchedule.startTime).getTime() : 0;
    const e = competitionSchedule.endTime ? new Date(competitionSchedule.endTime).getTime() : Infinity;
    if (!isNaN(s) && nowTick < s) return false;
    if (!isNaN(e) && nowTick > e) return false;
    return true;
  })();

  // ---------- Баг ----------
  const createTeam: AppContextType['createTeam'] = async (data) => {
    const t: CompetitionTeam = { ...data, id: `team_${Date.now()}`, createdAt: new Date().toISOString() };
    try {
      await saveTeamDoc(t);
      setTeams((p) => [t, ...p]);
      patchUsers([t.leaderUserId, ...(t.memberUserIds || [])], (u) => ({ ...u, teamId: t.id, teamName: t.name, isCompetitionConfirmed: true }));
      sound.playSuccess();
      return true;
    } catch (e) { console.warn(e); return false; }
  };
  const updateTeam: AppContextType['updateTeam'] = async (id, up) => {
    try { setTeams((p) => p.map((t) => (t.id === id ? { ...t, ...up } : t))); await saveTeamDoc({ id, ...up } as CompetitionTeam); return true; } catch { return false; }
  };
  const deleteTeam: AppContextType['deleteTeam'] = async (id) => {
    setTeams((p) => p.filter((t) => t.id !== id));
    patchUsers(users.filter((u) => u.teamId === id).map((u) => u.id), (u) => ({ ...u, teamId: undefined, teamName: undefined }));
    try { await removeTeam(id); return true; } catch { return false; }
  };

  // ---------- Хандив ----------
  const submitDonation: AppContextType['submitDonation'] = async (data) => {
    const d: DonationRecord = { ...data, userId: auth.currentUser?.uid, id: `donor_${Date.now()}`, bankName: data.bankName || 'Хаан банк', status: 'pending', submittedAt: new Date().toISOString() };
    try {
      await saveDonationDoc(d);
      setDonations((p) => [d, ...p]);
      sound.playSuccess();
      return { success: true, message: 'Хандивын мэдээлэл амжилттай илгээгдлээ. Админ шалгаж баталгаажуулсны дараа талархлын батламж идэвхжинэ.', donation: d };
    } catch (e) { return { success: false, message: errMsg(e) }; }
  };
  const reviewDonation: AppContextType['reviewDonation'] = async (id, status, adminNote) => {
    const cur = donations.find((d) => d.id === id); if (!cur) return false;
    const next: DonationRecord = {
      ...cur, status, reviewedAt: new Date().toISOString(), reviewedBy: currentUser?.fullName || 'Админ',
      certificateNumber: status === 'approved' ? cur.certificateNumber || `DONOR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` : cur.certificateNumber,
      adminNote: adminNote !== undefined ? adminNote : cur.adminNote,
    };
    try { await saveDonationDoc(next); setDonations((p) => p.map((d) => (d.id === id ? next : d))); sound.playSuccess(); return true; } catch { return false; }
  };
  const deleteDonation: AppContextType['deleteDonation'] = async (id) => {
    setDonations((p) => p.filter((d) => d.id !== id)); try { await removeDonation(id); return true; } catch { return false; }
  };

  // ---------- Асуултын алдааны мэдэгдэл ----------
  const submitQuestionReport: AppContextType['submitQuestionReport'] = async (data) => {
    const r: QuestionIssueReport = { ...data, id: `rep_${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() } as QuestionIssueReport;
    try { await saveReportDoc(r); setQuestionReports((p) => [r, ...p]); return { success: true, message: 'Мэдэгдэл илгээгдлээ. Баярлалаа!', report: r }; }
    catch (e) { return { success: false, message: errMsg(e) }; }
  };
  const resolveQuestionReport: AppContextType['resolveQuestionReport'] = async (reportId, params) => {
    const now = new Date().toISOString();
    const fix = params.applyQuestionUpdates;
    if (fix && fix.newTargetName.trim()) {
      const clean_ = fix.newTargetName.trim();
      const q = customQuestions.find((x) => x.id === fix.questionId);
      if (q) {
        let options = q.options ? [...q.options] : undefined;
        if (options?.length) {
          if (options.some((o) => o.text.trim().toLowerCase() === clean_.toLowerCase())) {
            options = options.map((o) => ({ ...o, isCorrect: o.text.trim().toLowerCase() === clean_.toLowerCase() }));
          } else {
            let replaced = false;
            options = options.map((o) => {
              if (!replaced && (o.isCorrect || o.text.trim() === q.targetName.trim())) { replaced = true; return { ...o, text: clean_, isCorrect: true }; }
              return { ...o, isCorrect: false };
            });
            if (!replaced && options[0]) options[0] = { ...options[0], text: clean_, isCorrect: true };
          }
        }
        updateCustomQuestion(fix.questionId, {
          targetName: clean_, options,
          title: fix.newTitle?.trim() || q.title,
          explanation: fix.newExplanation?.trim() || q.explanation,
          shpContourData: q.shpContourData ? { ...q.shpContourData, targetName: clean_, options: options ? options.map((o) => o.text) : q.shpContourData.options } : q.shpContourData,
        } as Partial<Question>);
      }
    }
    const cur = questionReports.find((r) => r.id === reportId); if (!cur) return false;
    const next = { ...cur, status: params.status, adminNote: params.adminNote ?? cur.adminNote, resolvedAt: now, resolvedBy: currentUser?.fullName || 'Админ' } as QuestionIssueReport;
    try { await saveReportDoc(next); setQuestionReports((p) => p.map((r) => (r.id === reportId ? next : r))); return true; } catch { return false; }
  };
  const deleteQuestionReport: AppContextType['deleteQuestionReport'] = async (id) => {
    setQuestionReports((p) => p.filter((r) => r.id !== id)); try { await removeReport(id); return true; } catch { return false; }
  };

  // Гэрчилгээ, хандивын цонхонд "админ" хүний нэрийг харуулахад хэрэгтэй
  const usersForUi = useMemo(() => {
    if (isAdmin) return users;
    const list: User[] = currentUser ? [currentUser] : [];
    if (publicAdmin) list.push(publicAdmin);
    return list;
  }, [isAdmin, users, currentUser, publicAdmin]);

  return (
    <AppContext.Provider
      value={{
        currentUser, authReady, users: usersForUi, attempts, refreshAttempts, mainMenuTab, setMainMenuTab, mapSubTab, setMapSubTab,
        activeTab: mapSubTab, isMuted, registerUser, loginUser, resetPasswordEmail, logout, switchUser, approveStudent, rejectStudent,
        approveAllPending, toggleUserMapAccess, batchSetUserMapAccess, deleteUser, batchDeleteUsers, batchSetCompetitionConfirmed,
        saveAttempt, archiveAttempt, batchArchiveAttempts, deleteAttempt, batchDeleteAttempts, setActiveTab, toggleMute,
        updateAdminProfile, updateUserProfile, gisLayers, setGisLayers, addGisLayer, updateGisLayer, deleteGisLayer,
        resetGisLayers, customQuestions, addCustomQuestion, updateCustomQuestion, deleteCustomQuestion, batchDeleteCustomQuestions,
        deleteCustomQuestionsByLayer, clearAllCustomQuestions, batchAddCustomQuestions, syncAllWithFirebase,
        autoGenerateQuestionsFromGisLayers, layerUsageStats, taskPerformanceStats, recordLayerView, recordTaskAttempt,
        certificateConfig, updateCertificateConfig, resetCertificateConfig, competitionSchedule, updateCompetitionSchedule,
        isCompetitionCurrentlyOpen, teams, createTeam, updateTeam, deleteTeam, donations, submitDonation, reviewDonation,
        deleteDonation, questionReports, submitQuestionReport, resolveQuestionReport, deleteQuestionReport,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};
