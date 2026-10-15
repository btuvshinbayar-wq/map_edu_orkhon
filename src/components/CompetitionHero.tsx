import React from 'react';
import {
  Sparkles,
  MapPin,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Compass,
  FileCheck,
  Puzzle,
  Trophy,
  Globe2,
  Users,
  GraduationCap,
  BookOpen,
  Lock,
  UserCheck,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GradeLevel } from '../types';

interface CompetitionHeroProps {
  onStartCompetition: (grade: GradeLevel) => void;
  onOpenAuth: () => void;
}

export const CompetitionHero: React.FC<CompetitionHeroProps> = ({
  onStartCompetition,
  onOpenAuth,
}) => {
  const { currentUser, setMainMenuTab, competitionSchedule, isCompetitionCurrentlyOpen } = useApp();

  const isConfirmedContestant =
    currentUser &&
    (currentUser.role === 'admin' ||
      (currentUser.status === 'approved' && currentUser.isCompetitionConfirmed !== false));

  const formatScheduleTime = (isoStr?: string) => {
    if (!isoStr) return 'Тодорхойгүй';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString('mn-MN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Gate 1: Only confirmed contestants (or admin) can enter the Уралдаан menu
  if (!currentUser || !isConfirmedContestant) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-xs w-full mx-auto text-center space-y-6 my-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-2.5 w-full">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center w-full">
            {!currentUser
              ? 'Уралдаан цэс рүү зөвхөн баталгаажсан оролцогчид нэвтэрнэ'
              : 'Танд Уралдаан цэс рүү нэвтрэх эрх нээгдээгүй байна'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-center w-full">
            {!currentUser
              ? 'Сайтад бүртгүүлсэн хэрэглэгчид Газрын зураг, Сорил, Олимпиад болон Шилдэгүүд цэсийг ашиглах эрхтэй. Харин «Уралдаан» цэс рүү зөвхөн уралдаанд оролцохоор Админ баталгаажуулсан оролцогчид нэвтэрнэ.'
              : `Сайн байна уу, ${currentUser.fullName}! Бүртгүүлсэн хэрэглэгчид зөвхөн Газрын зураг, Сорил, Олимпиад, Шилдэгүүд цэс рүү орох эрхтэй. «Уралдаан» цэс рүү зөвхөн уралдаанд оролцохоор батлагдсан оролцогчид нэвтэрнэ.`}
          </p>
        </div>

        {/* Competition Schedule Info Box */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 space-y-1.5 text-center w-full mx-auto">
          <div className="flex items-center justify-center gap-3 font-bold text-slate-900">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-amber-600" />
              Уралдааны цагийн хуваарь:
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isCompetitionCurrentlyOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {isCompetitionCurrentlyOpen ? 'Нээлттэй' : 'Хаалттай'}
            </span>
          </div>
          {competitionSchedule.mode === 'scheduled' && (
            <p className="text-[11px] text-slate-600 font-mono">
              Нээгдэх: {formatScheduleTime(competitionSchedule.startTime)} — Хаагдах:{' '}
              {formatScheduleTime(competitionSchedule.endTime)}
            </p>
          )}
          {competitionSchedule.announcementNote && (
            <p className="text-[11px] text-slate-600">{competitionSchedule.announcementNote}</p>
          )}
        </div>

        {!currentUser ? (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-sm transition-colors cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Хэрэглэгчийн бүртгэл / Нэвтрэх</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                Таны уралдааны төлөв:{' '}
                {currentUser.status === 'rejected'
                  ? 'Цуцлагдсан'
                  : 'Хүлээгдэж буй (Админ баталгаажуулаагүй)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setMainMenuTab('explore')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <Compass className="h-4 w-4" />
                <span>Газрын зураг руу орох</span>
              </button>
              <button
                type="button"
                onClick={() => setMainMenuTab('puzzles')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <Puzzle className="h-4 w-4" />
                <span>Сорил руу орох</span>
              </button>
              <button
                type="button"
                onClick={() => setMainMenuTab('leaderboard')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-colors cursor-pointer"
              >
                <Trophy className="h-4 w-4" />
                <span>Шилдэгүүд харах</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Gate 2: Confirmed contestant (not admin) trying to enter when competition is closed or outside scheduled time
  if (!isCompetitionCurrentlyOpen && currentUser.role !== 'admin') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-xs w-full mx-auto text-center space-y-6 my-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
          <Clock className="h-7 w-7" />
        </div>
        <div className="space-y-2.5 w-full">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Уралдааны баталгаажсан оролцогч: {currentUser.fullName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 text-center w-full">
            Уралдаан одоогоор хаалттай байна
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-center w-full">
            {competitionSchedule.mode === 'closed'
              ? 'Админ уралдааныг түр хаасан байна. Уралдаан нээгдэх үед дахин орно уу.'
              : 'Уралдаан зөвхөн Админы тохируулсан цагийн хуваарийн дагуу автоматаар нээгдэж, хаагдана.'}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-slate-800 space-y-2 max-w-lg mx-auto">
          <div className="font-bold text-amber-900 flex items-center justify-center gap-1.5">
            <Calendar className="h-4 w-4 text-amber-700" />
            <span>Товлогдсон цагийн хуваарь:</span>
          </div>
          {competitionSchedule.mode === 'scheduled' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono">
              <div className="rounded-lg bg-white border border-amber-200 p-2.5">
                <span className="block text-[10px] text-slate-500 uppercase">Нээгдэх цаг:</span>
                <strong className="text-emerald-700">
                  {formatScheduleTime(competitionSchedule.startTime)}
                </strong>
              </div>
              <div className="rounded-lg bg-white border border-amber-200 p-2.5">
                <span className="block text-[10px] text-slate-500 uppercase">Хаагдах цаг:</span>
                <strong className="text-rose-700">
                  {formatScheduleTime(competitionSchedule.endTime)}
                </strong>
              </div>
            </div>
          ) : (
            <p className="text-slate-600">Админ уралдааныг нээх хүртэл түр хүлээнэ үү.</p>
          )}
          {competitionSchedule.announcementNote && (
            <p className="text-xs text-amber-900 pt-1 font-medium">
              📢 {competitionSchedule.announcementNote}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => setMainMenuTab('explore')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Compass className="h-4 w-4" />
            <span>Газрын зураг үзэх</span>
          </button>
          <button
            type="button"
            onClick={() => setMainMenuTab('puzzles')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            <Puzzle className="h-4 w-4" />
            <span>Сорил ажиллах</span>
          </button>
        </div>
      </div>
    );
  }

  // 4 Official Competition Categories
  const CATEGORIES = [
    {
      id: '9' as GradeLevel,
      title: '9-р ангийн ангилал',
      subtitle: 'Монгол орон & Эх дэлхий',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
      accentColor: 'border-sky-300 hover:border-sky-400',
      btnColor: 'bg-sky-600 hover:bg-sky-500 text-white',
      ratio: '70% Монгол орон · 30% Дэлхийн газарзүй',
      icon: <MapPin className="h-6 w-6 text-sky-600" />,
      description:
        'Монгол орны 21 аймаг, хилийн зааг, хотууд, Алтай, Хангай, Хэнтийн уулс нуруу, томоохон гол нуур, байгалийн бүс бүслүүрийн интерактив шалгалт.',
      highlights: [
        '21 аймгийн байршил, төв хотууд',
        'Сэлэнгэ, Орхон, Хэрлэн гол, Хөвсгөл, Увс нуур',
        'Байгалийн бүсүүд & Газарзүйн тогтоц',
        'Дэлхийн томоохон улсууд & тивүүд',
      ],
      timer: '10 асуулт · Асуулт тус бүрт 30 секунд',
    },
    {
      id: '12' as GradeLevel,
      title: '12-р ангийн ангилал',
      subtitle: 'Дэлхийн газарзүй & Геополитик',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      accentColor: 'border-indigo-300 hover:border-indigo-400',
      btnColor: 'bg-indigo-600 hover:bg-indigo-500 text-white',
      ratio: '40% Монгол орон · 60% Дэлхийн газарзүй',
      icon: <Globe2 className="h-6 w-6 text-indigo-600" />,
      description:
        'Дэлхийн улс орнууд, стратегийн хоолой сувгууд (Малакка, Суэц, Панама, Ормуз), тектоник хавтан, эдийн засгийн газарзүй, томоохон орд сав газар.',
      highlights: [
        'Дэлхийн улсууд, нийслэлүүд, хилийн зааг',
        'Стратегийн далайн хоолойнууд & сувгууд',
        'Тектоник хавтан, галт уул, газар хөдлөлт',
        'Оюу толгой, Таван толгой, Эрдэнэт орд',
      ],
      timer: '10 асуулт · Асуулт тус бүрт 30 секунд',
    },
    {
      id: 'teacher' as GradeLevel,
      title: 'Багшийн ангилал',
      subtitle: 'Мэргэжлийн түвшин & Заах арга зүй',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      accentColor: 'border-amber-300 hover:border-amber-400',
      btnColor: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold',
      ratio: '50% Гүнзгийрүүлсэн Монгол · 50% Дэлхий & GIS',
      icon: <GraduationCap className="h-6 w-6 text-amber-600" />,
      description:
        'Газарзүйн багш нарын мэргэжлийн түвшний уралдаан: нарийвчилсан координат, масштаб, тусгал, геоморфологи, уур амьсгалын бүс, гео-детектив шинжилгээ.',
      highlights: [
        'Солбицол ба координат тайлах (WGS84)',
        'Масштаб, өндөржилт, хэвтээ хөндлөн огтлол',
        'Физик & нийгэм эдийн засгийн зүй тогтол',
        'Орон зайн логик & Цогц детектив даалгавар',
      ],
      timer: '10 асуулт · Асуулт тус бүрт 30 секунд',
    },
    {
      id: 'team' as GradeLevel,
      title: 'Багийн ангилал (Баг)',
      subtitle: 'Хамтын орон зайн сэтгэлгээ',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      accentColor: 'border-emerald-300 hover:border-emerald-400',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold',
      ratio: '3-5 сурагчийн баг · Хамтын тактик & Сорил',
      icon: <Users className="h-6 w-6 text-emerald-600" />,
      description:
        '3-5 гишүүнтэй багуудын хоорондох интерактив өрсөлдөөн: хамтран маршрут төлөвлөх, орон зайн таавар, “Аль нь буруу вэ?”, стратегийн логик сорилтууд.',
      highlights: [
        'Багийн нэрээр улсын чансаанд бүртгэгдэнэ',
        'Хамтран маршрут & зам төлөвлөх даалгавар',
        'Цогц зураг-таавар (Puzzle placement)',
        'Багийн гишүүн бүрийн нэртэй албан Батламж',
      ],
      timer: '10 асуулт · Асуулт тус бүрт 30 секунд',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-amber-50/80 via-white to-sky-50/60 p-6 sm:p-10 shadow-xs w-full">
        <div className="relative z-10 w-full max-w-none space-y-4 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-800">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            <span>Интерактив цахим систем 2026 · 4 Үндсэн Ангилал</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight w-full text-center">
            Газрын зургийг хэн сайн мэдэх вэ?
          </h1>

          <p className="text-base sm:text-lg font-bold text-amber-900 w-full text-center">
            Улсын Интерактив Уралдаан (9-р анги, 12-р анги, Багш, Багийн 4 ангиллаар)
          </p>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed w-full max-w-none text-center">
            Монгол орон, тив болон дэлхийн газрын зургийн мэдлэг, орон зайн сэтгэлгээг бодит интерактив газрын зураг дээр шууд дарж заан шалгах улсын цахим интерактив уралдаан.
          </p>

          {/* Competition Time / Status Banner */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 rounded-xl border border-amber-200/80 bg-white/90 px-4 py-2.5 text-xs shadow-2xs w-full">
            <span className="flex items-center gap-1.5 font-bold text-slate-800">
              <Clock className="h-4 w-4 text-amber-600" />
              Уралдааны төлөв:
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isCompetitionCurrentlyOpen
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {isCompetitionCurrentlyOpen
                ? competitionSchedule.mode === 'scheduled'
                  ? 'Цагийн хуваариар НЭЭЛТТЭЙ'
                  : 'НЭЭЛТТЭЙ'
                : 'ХААЛТТАЙ (Админ горимоор харагдаж байна)'}
            </span>
            {competitionSchedule.mode === 'scheduled' && (
              <span className="text-[11px] text-slate-600 font-mono">
                ({formatScheduleTime(competitionSchedule.startTime)} —{' '}
                {formatScheduleTime(competitionSchedule.endTime)})
              </span>
            )}
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => setMainMenuTab('admin_auth')}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
              >
                Цаг тохируулах (Админ) →
              </button>
            )}
          </div>

          {/* User Status Strip */}
          <div className="pt-2 w-full">
            {currentUser ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-xs w-full">
                <div className="flex items-center gap-2">
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                  ) : (
                    <Award className="h-4 w-4 text-amber-600" />
                  )}
                  <span className="font-semibold text-slate-900">{currentUser.fullName}</span>
                  <span className="text-slate-500">({currentUser.school})</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                    {currentUser.grade === '9'
                      ? '9-р анги'
                      : currentUser.grade === '12'
                      ? '12-р анги'
                      : currentUser.grade === 'teacher'
                      ? 'Багш'
                      : `Баг (${currentUser.teamName || 'Багийн ангилал'})`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Төлөв:</span>
                  {currentUser.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Баталгаажсан (Шалгалтад бэлэн)
                    </span>
                  ) : currentUser.status === 'pending' ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      Баталгаажуулалт хүлээгдэж буй
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold">Цуцлагдсан</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3 w-full">
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
                >
                  <Award className="h-4 w-4" />
                  <span>Хэрэглэгчийн бүртгэл / Нэвтрэх</span>
                </button>
                <button
                  onClick={() => setMainMenuTab('explore')}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Compass className="h-4 w-4 text-sky-600" />
                  <span>Газрын зураг & SHP Студи</span>
                </button>
                <button
                  onClick={() => setMainMenuTab('puzzles')}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Puzzle className="h-4 w-4 text-emerald-600" />
                  <span>Сорил сорих</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decorative background subtle glow */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-amber-100/40 via-sky-100/20 to-transparent blur-3xl" />
      </div>

      {/* 4 Official Competition Categories Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
                4
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Уралдааны 4 Үндсэн Ангилал
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Өөрийн хамаарах ангиллыг сонгон уралдааныг эхлүүлнэ үү.
            </p>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Бүх ангилалд албан ёсны цахим Батламж олгогдоно
          </span>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`rounded-2xl border-2 ${cat.accentColor} bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5`}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      {cat.icon}
                    </div>
                    <div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeColor}`}>
                        {cat.title}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-1">{cat.subtitle}</h3>
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  📊 {cat.ratio}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {cat.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  {cat.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Strip */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    {cat.timer}
                  </span>
                  <span className="font-semibold text-amber-800">Батламжтай</span>
                </div>

                <button
                  onClick={() => onStartCompetition(cat.id)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-xs cursor-pointer ${cat.btnColor}`}
                >
                  <span>{cat.title} — Уралдаан эхлүүлэх</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Navigation Cards: Газрын зураг & SHP, Сорил, Шилдэгүүд */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 1. Газрын зураг & SHP Card */}
        <div className="relative rounded-2xl border border-sky-200 bg-white p-5 space-y-3 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Compass className="h-5 w-5" />
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Бодит хиймэл дагуул + SHP</span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Газрын зураг & *.SHP Студи
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Бодит координаттай Shapefile (*.shp.zip), GeoJSON оруулах, хиймэл дагуулын зураг дээр давхарлах, хөрвүүлэх.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setMainMenuTab('explore')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-50 py-2.5 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <span>Газрын зураг үзэх</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Сорил Card */}
        <div className="relative rounded-2xl border border-emerald-200 bg-white p-5 space-y-3 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Puzzle className="h-5 w-5" />
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Логик & таавар</span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Сорил & Таавар
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Аймгуудын силуэт контур таах, “Аль нь буруу вэ?”, солбицол код тайлах, орон зайн логик болон газарзүйн детектив сорилтууд.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setMainMenuTab('puzzles')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span>Сорил сорих</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Шилдэгүүд Card */}
        <div className="relative rounded-2xl border border-amber-200 bg-white p-5 space-y-3 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Trophy className="h-5 w-5" />
              </span>
              <span className="text-[11px] text-slate-500 font-medium">4 ангиллын чансаа</span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Шилдэгүүдийн жагсаалт
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Уралдаанд өндөр оноо авсан сурагчид, багш нар болон багуудын улсын чансааны тэргүүлэгчдийн самбар.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setMainMenuTab('leaderboard')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <span>Чансаа харах</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <MapPin className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Интерактив вектор газрын зураг</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Монгол орны 21 аймаг ба дэлхийн газрын зургийг шууд дарж заах динамик шалгалтын систем.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Багшийн баталгаажуулалт</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Багш, админ оролцогчдын мэдээлэл, бүртгэлийг шалган баталгаажуулж, албан ёсны дүнгийн чансаа гаргана.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <FileCheck className="h-4 w-4" />
          </div>
          <h4 className="font-bold text-sm text-slate-900">Албан ёсны Цахим Батламж</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            4 ангилал тус бүрийн амжилттай оролцогчдод оноо, хувь, эрэмбэтэй цахим Батламж олгоно.
          </p>
        </div>
      </div>
    </div>
  );
};
