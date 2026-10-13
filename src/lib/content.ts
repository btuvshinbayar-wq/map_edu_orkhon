import {
  collection, doc, getDoc, getDocs, setDoc, writeBatch, query, orderBy,
} from 'firebase/firestore';
import type { FeatureCollection } from 'geojson';
import { db } from './firebase';
import { defaultKV, type KV } from './kv';
import { chunkJson, joinChunks } from './layerProcessor';
import { needsRefresh, packQuestions, unpackQuestions, type QuestionLike } from './contentLogic';
export type { QuestionLike };

/**
 * ЗАРЧИМ: хэрэглэгч бүр хуудас нээхэд зөвхөн 1 жижиг баримт (app_settings/content) уншина.
 * Хувилбар нь cache-тэй ижил бол өөр юу ч татахгүй (0 byte). Админ өөрчлөлт хийх бүрт хувилбар нэмэгдэнэ.
 */

export interface ContentVersions { questionsVersion: number; gisVersion: number }

export interface LayerIndexEntry {
  id: string;
  name: string;
  category?: string;
  kind: 'line' | 'polygon' | 'point';
  featureCount: number;
  bbox: [number, number, number, number] | null;
  sizeBytes: number;
  chunks: number;
  version: number; // давхарга бүрийн өөрийн хувилбар
}

const VERSIONS_REF = () => doc(db, 'app_settings', 'content');

// ---------- Хувилбар ----------

async function readVersions(): Promise<ContentVersions> {
  const snap = await getDoc(VERSIONS_REF());
  const d = snap.exists() ? (snap.data() as Partial<ContentVersions>) : {};
  return { questionsVersion: d.questionsVersion ?? 0, gisVersion: d.gisVersion ?? 0 };
}

async function bump(field: keyof ContentVersions): Promise<number> {
  const cur = await readVersions();
  const next = cur[field] + 1;
  await setDoc(VERSIONS_REF(), { ...cur, [field]: next }, { merge: true });
  return next;
}

// ---------- Асуултууд (сурагч/админ унших) ----------

export async function loadQuestions(kv: KV = defaultKV()): Promise<QuestionLike[]> {
  const { questionsVersion } = await readVersions(); // 1 унших
  const cachedVer = await kv.get<number>('q:ver');
  if (!needsRefresh(cachedVer, questionsVersion)) {
    const cached = await kv.get<QuestionLike[]>('q:data');
    if (cached) return cached;
  }
  const snap = await getDocs(query(collection(db, 'questionPacks'), orderBy('__name__')));
  const qs = unpackQuestions(snap.docs.map((d) => d.data() as { items: QuestionLike[] }));
  await kv.set('q:data', qs);
  await kv.set('q:ver', questionsVersion);
  return qs;
}

// ---------- Асуултууд (админ бичих) ----------

export async function saveQuestions(all: QuestionLike[]): Promise<void> {
  const old = await getDocs(collection(db, 'questionPacks'));
  const packs = packQuestions(all);
  const batch = writeBatch(db);
  old.forEach((d) => batch.delete(d.ref));
  for (const p of packs) batch.set(doc(db, 'questionPacks', p.id), { items: p.items });
  await batch.commit();
  await bump('questionsVersion');
}

// ---------- GIS давхарга ----------

export async function loadLayerIndex(kv: KV = defaultKV()): Promise<LayerIndexEntry[]> {
  const { gisVersion } = await readVersions(); // 1 унших
  const cachedVer = await kv.get<number>('gis:ver');
  if (!needsRefresh(cachedVer, gisVersion)) {
    const cached = await kv.get<LayerIndexEntry[]>('gis:index');
    if (cached) return cached;
  }
  const snap = await getDocs(collection(db, 'gisLayers'));
  const index = snap.docs.map((d) => d.data() as LayerIndexEntry);
  await kv.set('gis:index', index);
  await kv.set('gis:ver', gisVersion);
  return index;
}

/** Зөвхөн хэрэглэгч нээсэн давхаргын геометрийг татна, хувилбар ижил бол cache-ээс. */
export async function loadLayerData(entry: LayerIndexEntry, kv: KV = defaultKV()): Promise<FeatureCollection> {
  const key = `gis:data:${entry.id}`;
  const cached = await kv.get<{ version: number; fc: FeatureCollection }>(key);
  if (cached && cached.version === entry.version) return cached.fc;

  const snap = await getDocs(query(collection(db, 'gisLayerData', entry.id, 'chunks'), orderBy('n')));
  const json = joinChunks(snap.docs.map((d) => (d.data() as { n: number; text: string }).text));
  const fc = JSON.parse(json) as FeatureCollection;
  await kv.set(key, { version: entry.version, fc });
  return fc;
}

export async function saveLayer(
  id: string,
  meta: { name: string; category?: string; kind: LayerIndexEntry['kind']; bbox: LayerIndexEntry['bbox'] },
  fc: FeatureCollection,
): Promise<LayerIndexEntry> {
  const json = JSON.stringify(fc);
  const chunks = chunkJson(json);

  const prev = await getDoc(doc(db, 'gisLayers', id));
  const version = prev.exists() ? ((prev.data() as LayerIndexEntry).version ?? 0) + 1 : 1;

  // Хуучин хэсгүүдийг цэвэрлээд шинээр бичнэ
  const oldChunks = await getDocs(collection(db, 'gisLayerData', id, 'chunks'));
  const batch = writeBatch(db);
  oldChunks.forEach((d) => batch.delete(d.ref));
  chunks.forEach((text, n) => batch.set(doc(db, 'gisLayerData', id, 'chunks', String(n).padStart(3, '0')), { n, text }));
  const entry: LayerIndexEntry = {
    id, ...meta,
    featureCount: fc.features.length,
    sizeBytes: new TextEncoder().encode(json).length,
    chunks: chunks.length,
    version,
  };
  batch.set(doc(db, 'gisLayers', id), entry);
  await batch.commit();
  await bump('gisVersion');
  return entry;
}

export async function deleteLayer(id: string): Promise<void> {
  const oldChunks = await getDocs(collection(db, 'gisLayerData', id, 'chunks'));
  const batch = writeBatch(db);
  oldChunks.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'gisLayers', id));
  await batch.commit();
  await bump('gisVersion');
}

/** Админд: нийт давхаргын хэмжээг харуулах (квот хянах). */
export const totalLayerBytes = (index: LayerIndexEntry[]) => index.reduce((s, l) => s + l.sizeBytes, 0);

