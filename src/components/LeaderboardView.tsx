import React, { useEffect, useState } from 'react';
import { Trophy, Search, FileCheck, Users, GraduationCap, MapPin, Globe2, Lock, UserCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Certificate } from './Certificate';
import { GradeLevel } from '../types';

interface LeaderboardViewProps {
  onOpenAuth?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onOpenAuth }) => {
  const { attempts, currentUser, refreshAttempts } = useApp();

  // Шилдэгүүдийг зөвхөн энэ цонх нээгдэх үед нэг удаа уншина (унших квот хэмнэнэ)
  useEffect(() => {
    refreshAttempts().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GradeLevel>('all');
  const [activeCertificateAttemptId, setActiveCertificateAttemptId] = useState<string | null>(null);

  // Filter attempts by category & search (exclude archived attempts from active leaderboard)
  const filteredAttempts = attempts
    .filter((att) => {
      if (att.isArchived) return false;
      // Category filter
      if (categoryFilter !== 'all' && att.grade !== categoryFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          att.studentName.toLowerCase().includes(term) ||
          att.school.toLowerCase().includes(term) ||
          att.aimag.toLowerCase().includes(term) ||
          (att.teamName && att.teamName.toLowerCase().includes(term))
        );
      }
      return true;
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const viewingAttempt = attempts.find((a) => a.id === activeCertificateAttemptId);

  const getCategoryBadge = (grade: GradeLevel) => {
    switch (grade) {
      case '9':
        return <span className="rounded-full bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 text-[10px] font-bold">9-р анги</span>;
      case '12':
        return <span className="rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold">12-р анги</span>;
      case 'teacher':
        return <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">Багш</span>;
      case 'team':
        return <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">Баг (Багийн)</span>;
    }
  };

  const hasAccess =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.mapAndChallengeAccess !== false);

  if (!currentUser || !hasAccess) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-xs max-w-2xl mx-auto text-center space-y-5 my-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">
            {!currentUser
              ? 'Шилдэгүүд цэс рүү орохын тулд сайтад бүртгүүлнэ үү'
              : 'Хандах эрх хаалттай байна'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {!currentUser
              ? 'Сайтад бүртгүүлснээр Газрын зураг, Сорил, Олимпиад болон Шилдэгүүд цэс рүү орох эрх шууд нээгдэнэ.'
              : 'Админ таны хандах эрхийг түр хаасан байна. Шалгалтын комисс эсвэл багш-админд хандаж эрхээ нээлгэнэ үү.'}
          </p>
        </div>

        {!currentUser ? (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth()}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950 shadow-sm transition-colors cursor-pointer"
            >
              <UserCheck className="h-4 w-4" />
              <span>Хэрэглэгчийн бүртгэл / Нэвтрэх</span>
            </button>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>Хэрэглэгч: {currentUser.fullName} — Эрх хаагдсан</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Trophy className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Шилдэг Оролцогчдын Чансаа
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Газрын зургийг хэн сайн мэдэх вэ? · 4 ангиллын албан ёсны улсын чансаа
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Оролцогч, баг, сургууль, аймгаар..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
          />
        </div>
      </div>

      {/* Category Tabs: Бүх ангилал | 9-р анги | 12-р анги | Багш | Баг */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'Бүх ангилал' },
          { id: '9', label: '9-р анги' },
          { id: '12', label: '12-р анги' },
          { id: 'teacher', label: 'Багш' },
          { id: 'team', label: 'Баг (Багийн)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id as any)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold w-16 text-center">Байр</th>
              <th className="px-4 py-3 font-semibold">Оролцогч / Багийн нэр</th>
              <th className="px-4 py-3 font-semibold">Ангилал</th>
              <th className="px-4 py-3 font-semibold">Сургууль / Байгууллага</th>
              <th className="px-4 py-3 font-semibold">Аймаг / Хот</th>
              <th className="px-4 py-3 font-semibold">Нийт оноо</th>
              <th className="px-4 py-3 font-semibold">Амжилт</th>
              <th className="px-4 py-3 font-semibold text-right">Батламж</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAttempts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  Энэ ангилалд одоогоор оролцогчийн дүн бүртгэгдээгүй байна.
                </td>
              </tr>
            ) : (
              filteredAttempts.map((att, idx) => {
                const rank = idx + 1;
                return (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center">
                      {rank === 1 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold">
                          🥇
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold">
                          🥈
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/20 text-amber-900 font-bold">
                          🥉
                        </span>
                      ) : (
                        <span className="font-mono text-slate-500 font-semibold">{rank}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div>
                        {att.grade === 'team' && att.teamName ? (
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{att.teamName}</span>
                          </div>
                        ) : (
                          att.studentName
                        )}
                      </div>
                      {att.grade === 'team' && att.teamMembers && (
                        <span className="text-[10px] text-slate-500 font-normal block">
                          Гишүүд: {att.teamMembers}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {getCategoryBadge(att.grade)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {att.school}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {att.aimag}
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-black text-amber-800 font-mono text-sm">
                        {att.totalScore}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1">
                        / {att.maxScore}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          att.percentage >= 80
                            ? 'text-emerald-700'
                            : att.percentage >= 60
                            ? 'text-amber-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {att.percentage}%
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setActiveCertificateAttemptId(att.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        <FileCheck className="h-3.5 w-3.5 text-amber-700" />
                        <span>Батламж</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Certificate Modal View */}
      {viewingAttempt && (
        <Certificate
          attempt={viewingAttempt}
          onClose={() => setActiveCertificateAttemptId(null)}
        />
      )}
    </div>
  );
};
