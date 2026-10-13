import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  ShieldCheck,
  UserCheck,
  LogOut,
  ChevronDown,
  Trophy,
  Compass,
  Puzzle,
  Award,
  Key,
  MapPin,
  Heart,
  BookOpen,
  UserCog,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenDonation: () => void;
  onOpenProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenDonation, onOpenProfile }) => {
  const {
    currentUser,
    users,
    mainMenuTab,
    setMainMenuTab,
    setMapSubTab,
    isMuted,
    toggleMute,
    switchUser,
    logout,
    customQuestions,
    gisLayers,
  } = useApp();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const canAccessCompetitionMenu =
    currentUser &&
    (currentUser.role === 'admin' ||
      (currentUser.status === 'approved' && currentUser.isCompetitionConfirmed !== false));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Topmost Centered Title Bar (Header хамгийн дээд хэсэгт цэснүүдийн дээр голлуулан байрлуулсан гарчиг) */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-amber-50/70 via-white to-sky-50/70 py-2.5 px-4">
        <div className="mx-auto max-w-7xl flex items-center justify-center">
          <button
            onClick={() => {
              const targetTab = canAccessCompetitionMenu ? 'competition' : 'explore';
              setMainMenuTab(targetTab);
              setMapSubTab(targetTab);
            }}
            className="group cursor-pointer focus:outline-none flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-center"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-xs group-hover:scale-105 transition-transform shrink-0">
                MN
              </div>
              <span className="font-display text-base sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                Газрын зургийг хэн сайн мэдэх вэ? интерактив уралдаан
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Primary Navigation Bar (Үндсэн цэснүүд) */}
      <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left spacer on desktop so menus stay centered */}
        <div className="hidden lg:flex items-center w-36 shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Үндсэн цэс
          </span>
        </div>

        {/* Center: Primary Menus */}
        <nav className="hidden lg:flex items-center justify-center gap-7 text-sm font-medium flex-1">
          {/* 1. Уралдаан (Зөвхөн уралдаанд оролцохоор батлагдсан оролцогчид болон админд харагдана) */}
          {canAccessCompetitionMenu && (
            <button
              onClick={() => {
                setMainMenuTab('competition');
                setMapSubTab('competition');
              }}
              className={`transition-colors flex items-center gap-1.5 py-1.5 ${
                mainMenuTab === 'competition'
                  ? 'text-amber-600 font-bold border-b-2 border-amber-600 pb-0.5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Уралдаан</span>
            </button>
          )}

          {/* 2. Газрын зураг */}
          <button
            onClick={() => {
              setMainMenuTab('explore');
              setMapSubTab('explore');
            }}
            className={`relative transition-colors flex items-center gap-1.5 py-1.5 ${
              mainMenuTab === 'explore'
                ? 'text-amber-600 font-bold border-b-2 border-amber-600 pb-0.5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="h-4 w-4 text-sky-500" />
            <span>Газрын зураг</span>
            {gisLayers.length > 0 && (
              <span className="rounded-full bg-sky-100 text-sky-800 px-1.5 py-0.2 text-[10px] font-bold">
                {gisLayers.length}
              </span>
            )}
          </button>

          {/* 3. Сорил */}
          <button
            onClick={() => {
              setMainMenuTab('puzzles');
              setMapSubTab('puzzles');
            }}
            className={`transition-colors flex items-center gap-1.5 py-1.5 ${
              mainMenuTab === 'puzzles'
                ? 'text-amber-600 font-bold border-b-2 border-amber-600 pb-0.5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Puzzle className="h-4 w-4 text-emerald-500" />
            <span>Сорил</span>
          </button>

          {/* 5. Олимпиад */}
          <button
            onClick={() => setMainMenuTab('olympiad')}
            className={`transition-colors flex items-center gap-1.5 py-1.5 ${
              mainMenuTab === 'olympiad'
                ? 'text-amber-600 font-bold border-b-2 border-amber-600 pb-0.5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="h-4 w-4 text-indigo-500" />
            <span>Олимпиад</span>
          </button>

          {/* 6. Шилдэгүүд */}
          <button
            onClick={() => {
              setMainMenuTab('leaderboard');
              setMapSubTab('leaderboard');
            }}
            className={`transition-colors flex items-center gap-1.5 py-1.5 ${
              mainMenuTab === 'leaderboard'
                ? 'text-amber-600 font-bold border-b-2 border-amber-600 pb-0.5'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>Шилдэгүүд</span>
          </button>

          {/* 6. Админ удирдлага (Зөвхөн Админ эрхээр нэвтэрсэн үед харагдана) */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setMainMenuTab('admin_auth')}
              className={`relative transition-colors flex items-center gap-1.5 py-1.5 ${
                mainMenuTab === 'admin_auth'
                  ? 'text-amber-600 font-bold border-b-2 border-amber-600 pb-0.5'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Админ самбар</span>
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Actions & User Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Eye-Catching Donation / Дэмжлэг Button */}
          <button
            onClick={onOpenDonation}
            className="group relative inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 bg-[length:200%_100%] px-3.5 py-2 text-xs font-black text-white shadow-md shadow-rose-500/25 hover:shadow-lg hover:shadow-rose-500/40 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer border border-rose-300/40"
            title="Хаан банк (iban: MN60000500) 5094238427 Б.Түвшинбаяр — Төслийг дэмжих"
          >
            <Heart className="h-3.5 w-3.5 fill-white text-white animate-pulse shrink-0" />
            <span>Donation / Дэмжлэг</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            title={isMuted ? 'Дуу асаах' : 'Дуу хаах'}
          >
            {isMuted ? <VolumeX className="h-4 w-4 text-slate-400" /> : <Volume2 className="h-4 w-4 text-amber-600" />}
          </button>

          {/* User Account / Quick Switcher */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              {onOpenProfile && (
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                  title="Өөрийн сургууль болон хувийн мэдээллээ засах"
                >
                  <UserCog className="h-3.5 w-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Мэдээлэл засах</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                >
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5 text-sky-600" />
                  )}
                  <span className="max-w-[120px] truncate font-medium">{currentUser.fullName}</span>
                  <span className="text-slate-500 text-[11px]">
                    {currentUser.role === 'admin'
                      ? '(Админ)'
                      : currentUser.grade === 'teacher'
                      ? '(Багш)'
                      : currentUser.grade === 'team'
                      ? `(${currentUser.teamName || 'Баг'})`
                      : `(${currentUser.grade}-р анги)`}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>

                {/* Quick Profile Dropdown & Switcher */}
                {isSwitcherOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 text-xs"
                    onClick={() => setIsSwitcherOpen(false)}
                  >
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="font-bold text-slate-900">{currentUser.fullName}</p>
                      <p className="text-[11px] text-slate-600 truncate">
                        🏫 {currentUser.organization || currentUser.school}
                      </p>
                      {currentUser.aimag && (
                        <p className="text-[11px] text-slate-500 truncate">
                          📍 {currentUser.aimag}
                          {currentUser.soum ? `, ${currentUser.soum}` : ''}
                        </p>
                      )}
                      {(currentUser.position || currentUser.notes) && (
                        <p className="text-[10px] text-amber-700 font-medium truncate mt-0.5">
                          {currentUser.position || currentUser.notes}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Төлөв:</span>
                        <span
                          className={`font-semibold ${
                            currentUser.status === 'approved'
                              ? 'text-emerald-600'
                              : currentUser.status === 'pending'
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {currentUser.status === 'approved'
                            ? 'Баталгаажсан'
                            : currentUser.status === 'pending'
                            ? 'Хүлээгдэж буй'
                            : 'Цуцлагдсан'}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Key className="h-3 w-3 text-amber-500" />
                          API түлхүүр:
                        </span>
                        <span className="font-mono text-slate-700">
                          {currentUser.userApiKey ? 'Холбогдсон ✓' : 'Бүртгэлгүй'}
                        </span>
                      </div>

                      {onOpenProfile && (
                        <button
                          type="button"
                          onClick={onOpenProfile}
                          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer shadow-2xs"
                        >
                          <UserCog className="h-3.5 w-3.5" />
                          <span>Сургууль & Хувийн мэдээлэл засах</span>
                        </button>
                      )}
                    </div>


                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={onOpenAuth}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-amber-700 hover:bg-amber-50 rounded-md transition-colors font-medium cursor-pointer"
                      >
                        + Шинээр бүртгүүлэх / Өөр хаягаар нэвтрэх
                      </button>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 rounded-md transition-colors font-medium cursor-pointer"
                      >
                        <LogOut className="h-3 w-3" />
                        Системээс гарах
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-xs"
            >
              Бүртгүүлэх / Нэвтрэх
            </button>
          )}
        </div>
      </div>

      {/* Mobile Main Menu bar */}
      <div className="flex lg:hidden border-t border-slate-200 px-2 py-2 justify-around text-[11px] font-medium bg-white overflow-x-auto">
        {canAccessCompetitionMenu && (
          <button
            onClick={() => {
              setMainMenuTab('competition');
              setMapSubTab('competition');
            }}
            className={`py-1 px-2.5 rounded whitespace-nowrap flex items-center gap-1 ${
              mainMenuTab === 'competition' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-600'
            }`}
          >
            Уралдаан
          </button>
        )}
        <button
          onClick={() => {
            setMainMenuTab('explore');
            setMapSubTab('explore');
          }}
          className={`py-1 px-2.5 rounded whitespace-nowrap flex items-center gap-1 ${
            mainMenuTab === 'explore' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-600'
          }`}
        >
          Газрын зураг
        </button>
        <button
          onClick={() => {
            setMainMenuTab('puzzles');
            setMapSubTab('puzzles');
          }}
          className={`py-1 px-2.5 rounded whitespace-nowrap flex items-center gap-1 ${
            mainMenuTab === 'puzzles' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-600'
          }`}
        >
          Сорил
        </button>
        <button
          onClick={() => setMainMenuTab('olympiad')}
          className={`py-1 px-2.5 rounded whitespace-nowrap flex items-center gap-1 ${
            mainMenuTab === 'olympiad' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-600'
          }`}
        >
          Олимпиад
        </button>
        <button
          onClick={() => {
            setMainMenuTab('leaderboard');
            setMapSubTab('leaderboard');
          }}
          className={`py-1 px-2.5 rounded whitespace-nowrap flex items-center gap-1 ${
            mainMenuTab === 'leaderboard' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-600'
          }`}
        >
          Шилдэгүүд
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setMainMenuTab('admin_auth')}
            className={`py-1 px-2.5 rounded whitespace-nowrap flex items-center gap-1 ${
              mainMenuTab === 'admin_auth' ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-600'
            }`}
          >
            Админ
            {pendingCount > 0 && (
              <span className="rounded-full bg-rose-500 px-1 text-[9px] text-white">
                {pendingCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={onOpenDonation}
          className="py-1 px-2.5 rounded-lg whitespace-nowrap flex items-center gap-1 bg-gradient-to-r from-rose-600 to-amber-500 text-white font-bold shadow-2xs cursor-pointer"
        >
          <Heart className="h-3 w-3 fill-white text-white" />
          <span>Дэмжлэг</span>
        </button>
      </div>
    </header>
  );
};
