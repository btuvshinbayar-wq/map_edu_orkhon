import React, { useEffect, useMemo, useState } from 'react';
import { Radio, Users, Trophy, MonitorPlay, Trash2, Lock, Unlock, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { watchLive, clearAllLive } from '../lib/liveStore';
import { displayStatus, rankLive, summarizeLive, type LiveSession } from '../lib/live';
import { formatDuration } from '../lib/scoring';

const CATS: { id: string; label: string }[] = [
  { id: 'all', label: 'Бүгд' },
  { id: '9', label: '9-р анги' },
  { id: '12', label: '12-р анги' },
  { id: 'teacher', label: 'Багш' },
  { id: 'team', label: 'Баг' },
];
const catLabel = (g: string) => CATS.find((c) => c.id === g)?.label || g;

const STATUS_STYLE = {
  active: { label: 'Явж байна', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  stalled: { label: 'Хөдөлгөөнгүй', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  finished: { label: 'Дууссан', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
} as const;

/**
 * Уралдааны явцыг админ дэлгэцээр ШУУД харуулах, хянах самбар.
 * Таб нээлттэй байх үед л Firestore-ийг сонсоно (таб хаахад зогсоно).
 */
export const LiveCompetitionMonitor: React.FC = () => {
  const { competitionSchedule, updateCompetitionSchedule, isCompetitionCurrentlyOpen } = useApp();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cat, setCat] = useState('all');
  const [now, setNow] = useState(() => Date.now());
  const [projector, setProjector] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  useEffect(() => {
    const unsub = watchLive(
      (list) => { setSessions(list); setConnected(true); setError(null); setLastUpdate(Date.now()); },
      (e) => { setError(e.message); setConnected(false); },
    );
    return () => unsub(); // таб хаахад шууд сонсогч зогсож унших квот хэмнэгдэнэ
  }, []);

  // "Хөдөлгөөнгүй", зарцуулсан хугацааг шинэчлэх (өгөгдөл татахгүй, зөвхөн дахин тооцно)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const inCat = (s: LiveSession) => cat === 'all' || s.grade === cat;
  const filtered = useMemo(() => sessions.filter(inCat), [sessions, cat]);
  const ranked = useMemo(() => rankLive(filtered), [filtered]);
  const sum = useMemo(() => summarizeLive(filtered, now), [filtered, now]);
  const awayNow = filtered.filter((s) => s.away && s.status !== 'finished').length;
  const switchers = filtered.filter((s) => (s.leaves ?? 0) > 0).length;
  const catCounts = useMemo(() => {
    const m: Record<string, number> = { all: sessions.length };
    sessions.forEach((s) => { m[s.grade] = (m[s.grade] || 0) + 1; });
    return m;
  }, [sessions]);

  const toggleOpen = () => updateCompetitionSchedule({ mode: isCompetitionCurrentlyOpen ? 'closed' : 'open' });

  const card = (label: string, value: React.ReactNode, tone = 'text-slate-900') => (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className={`text-xl font-black ${tone}`}>{value}</div>
    </div>
  );

  const bar = (s: LiveSession) => (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${s.total > 0 ? Math.min(100, (s.answered / s.total) * 100) : 0}%` }} />
    </div>
  );

  // ---------- Дэлгэцэд гаргах горим (проектор) ----------
  if (projector) {
    const groups = (cat === 'all' ? CATS.filter((c) => c.id !== 'all') : CATS.filter((c) => c.id === cat)).map((c) => ({
      ...c,
      list: rankLive(sessions.filter((s) => s.grade === c.id)).slice(0, 10),
    })).filter((g) => g.list.length > 0);
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950 p-6 text-white" data-testid="projector">
        <div className="mx-auto max-w-6xl">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400">Шууд дамжуулалт</div>
              <h2 className="text-3xl font-black">«Газрын зургийг хэн сайн мэдэх вэ?» уралдаан</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-sm text-slate-300">
                <div>
                  Оролцогч <strong className="text-white">{sum.participants}</strong> · Явж буй <strong className="text-emerald-400">{sum.active}</strong> · Дууссан{' '}
                  <strong className="text-sky-400">{sum.finished}</strong>
                </div>
                <div className="text-xs text-slate-500">{new Date(now).toLocaleTimeString('mn-MN')}</div>
              </div>
              <button type="button" onClick={() => setProjector(false)} className="rounded-xl bg-white/10 p-2 hover:bg-white/20 cursor-pointer" aria-label="Дэлгэцийн горимоос гарах">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          {groups.length === 0 && <p className="py-24 text-center text-xl text-slate-400">Одоогоор оролцогч алга. Уралдаан эхлэхийг хүлээж байна…</p>}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {groups.map((g) => (
              <div key={g.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-black text-amber-300">
                  <Trophy className="h-5 w-5" /> {g.label}
                </h3>
                <ol className="space-y-2">
                  {g.list.map((s, i) => {
                    const st = displayStatus(s, now);
                    return (
                      <li key={s.userId} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2">
                        <span className={`w-8 text-center text-2xl font-black ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-500'}`}>{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-lg font-bold">{s.name}</div>
                          <div className="truncate text-xs text-slate-400">{s.school}</div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full bg-emerald-400" style={{ width: `${s.total ? (s.answered / s.total) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-amber-300">{s.score}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatDuration(s.elapsedMs)} · {st === 'finished' ? 'дууссан' : `${s.answered}/${s.total}`}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Radio className={`h-4 w-4 ${connected ? 'text-emerald-600' : 'text-slate-400'}`} />
          <h3 className="text-sm font-black text-slate-900">Уралдааны шууд хяналт</h3>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${connected ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>
            {connected ? '● Шууд холбогдсон' : 'Холбогдож байна…'}
          </span>
          {lastUpdate && <span className="text-[10px] text-slate-500">Сүүлд шинэчлэгдсэн: {new Date(lastUpdate).toLocaleTimeString('mn-MN')}</span>}
          <div className="ml-auto flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={toggleOpen}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold cursor-pointer ${isCompetitionCurrentlyOpen ? 'border-rose-300 bg-white text-rose-700 hover:bg-rose-50' : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'}`}
              title="Уралдааныг шууд хаах эсвэл нээх"
            >
              {isCompetitionCurrentlyOpen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              {isCompetitionCurrentlyOpen ? 'Уралдааныг хаах' : 'Уралдааныг нээх'}
            </button>
            <button
              type="button"
              onClick={() => setProjector(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer"
            >
              <MonitorPlay className="h-3.5 w-3.5" /> Дэлгэцэд гаргах
            </button>
            <button
              type="button"
              disabled={sessions.length === 0}
              onClick={async () => {
                if (confirm('Шууд хяналтын жагсаалтыг цэвэрлэх үү? (Албан ёсны үр дүн «Оролдлого» хэсэгт хэвээр үлдэнэ)')) await clearAllLive();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Цэвэрлэх
            </button>
          </div>
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Шууд холболтын алдаа: {error}</p>}
        <p className="text-[11px] text-slate-500">
          Оролцогч асуулт бүрийг хариулах бүрт явц шинэчлэгдэнэ. Энэ таб нээлттэй байх хооронд л өгөгдөл уншигдана (квот хэмнэнэ).
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${cat === c.id ? 'bg-amber-500 font-bold text-slate-950' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {c.label} ({catCounts[c.id] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {card('Оролцогч', <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{sum.participants}</span>)}
        {card('Явж байгаа', sum.active, 'text-emerald-600')}
        {card('Хөдөлгөөнгүй', sum.stalled, 'text-amber-600')}
        {card('Дууссан', sum.finished, 'text-sky-600')}
        {card('Дундаж оноо', sum.avgScore)}
        {card('Хамгийн өндөр оноо', sum.topScore, 'text-amber-700')}
        {card('Одоо цонхоос гарсан', awayNow, awayNow > 0 ? 'text-rose-600' : 'text-slate-900')}
        {card('Цонх сольсон хүн', switchers, switchers > 0 ? 'text-rose-600' : 'text-slate-900')}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="w-12 px-3 py-2 text-center font-semibold">Байр</th>
                <th className="px-3 py-2 font-semibold">Оролцогч</th>
                <th className="px-3 py-2 font-semibold">Ангилал</th>
                <th className="px-3 py-2 font-semibold">Сургууль</th>
                <th className="w-44 px-3 py-2 font-semibold">Явц</th>
                <th className="px-3 py-2 font-semibold">Зөв</th>
                <th className="px-3 py-2 font-semibold">Оноо</th>
                <th className="px-3 py-2 font-semibold">Хугацаа</th>
                <th className="px-3 py-2 font-semibold" title="Өөр цонх, таб руу шилжсэн тоо">Цонх</th>
                <th className="px-3 py-2 font-semibold">Төлөв</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranked.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                    Одоогоор уралдаанд оролцож буй хүн алга. Оролцогч эхлэхэд энд шууд харагдана.
                  </td>
                </tr>
              )}
              {ranked.map((s, i) => {
                const st = displayStatus(s, now);
                const style = STATUS_STYLE[st];
                // Дуусаагүй оролцогчийн хугацаа шууд нэмэгдэнэ (сүүлийн хариултаас хойш)
                const running = st === 'active' ? Math.max(0, now - s.updatedAt) : 0;
                return (
                  <tr key={s.userId} className={s.away && st !== 'finished' ? 'bg-rose-50/70' : st === 'stalled' ? 'bg-amber-50/40' : ''}>
                    <td className="px-3 py-2 text-center font-black text-slate-700">{i + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{s.name}</td>
                    <td className="px-3 py-2 text-slate-600">{catLabel(s.grade)}</td>
                    <td className="px-3 py-2 text-slate-600">{s.school}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {bar(s)}
                        <span className="shrink-0 font-mono text-[10px] text-slate-500">{s.answered}/{s.total}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono">{s.correct}</td>
                    <td className="px-3 py-2 font-mono font-black text-amber-800">{s.score}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{formatDuration(s.elapsedMs + running)}</td>
                    <td className="px-3 py-2 font-mono">
                      {(s.leaves ?? 0) > 0 ? (
                        <span className="rounded-md border border-rose-300 bg-rose-50 px-1.5 py-0.5 font-bold text-rose-700" title={`Нийт ${formatDuration(s.awayMs ?? 0)} гарсан`}>
                          {s.leaves}× · {formatDuration(s.awayMs ?? 0)}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {s.away && st !== 'finished' ? (
                        <span className="rounded-full border border-rose-400 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">⚠ Цонхоос гарсан</span>
                      ) : (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${style.cls}`}>{style.label}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
