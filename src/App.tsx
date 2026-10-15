/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { CompetitionHero } from './components/CompetitionHero';
import { ExploreMode } from './components/ExploreMode';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminDashboard } from './components/AdminDashboard';
import { PuzzleArena } from './components/PuzzleArena';
import { CompetitionModal } from './components/CompetitionModal';
import { AuthModal } from './components/AuthModal';
import { DonationModal } from './components/DonationModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GradeLevel } from './types';
import { Heart, Phone, Award } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { mainMenuTab, setMainMenuTab, mapSubTab, setMapSubTab, currentUser, users, saveStatus } = useApp();
  // Админы холбоо барих утас (нийтэд ил: app_settings/public)
  const adminContact = users.find((u) => u.role === 'admin');
  const contactPhone = adminContact?.phone?.trim();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const [isCompetitionOpen, setIsCompetitionOpen] = useState(false);
  const [competitionGrade, setCompetitionGrade] = useState<GradeLevel>('9');

  const handleStartCompetition = (grade: GradeLevel) => {
    setCompetitionGrade(grade);
    setIsCompetitionOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* 5-Menu Unified Top Navigation with Map Sub-menu */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDonation={() => setIsDonationOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 1. Уралдаан */}
        {mainMenuTab === 'competition' && (
          <CompetitionHero
            onStartCompetition={handleStartCompetition}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {/* 2. Газрын зураг */}
        {mainMenuTab === 'explore' && (
          <ExploreMode onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {/* 3. Сорил */}
        {mainMenuTab === 'puzzles' && (
          <PuzzleArena onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {/* 4. Шилдэгүүд */}
        {mainMenuTab === 'leaderboard' && (
          <LeaderboardView onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {/* 6. Бүртгэл / Админ */}
        {mainMenuTab === 'admin_auth' && (
          <AdminDashboard onOpenAuth={() => setIsAuthOpen(true)} />
        )}

        {/* Fallback for map_system legacy state */}
        {mainMenuTab === 'map_system' && (
          <>
            {mapSubTab === 'competition' && (
              <CompetitionHero
                onStartCompetition={handleStartCompetition}
                onOpenAuth={() => setIsAuthOpen(true)}
              />
            )}
            {mapSubTab === 'explore' && (
              <ExploreMode onOpenAuth={() => setIsAuthOpen(true)} />
            )}
            {mapSubTab === 'puzzles' && (
              <PuzzleArena onOpenAuth={() => setIsAuthOpen(true)} />
            )}
            {mapSubTab === 'leaderboard' && (
              <LeaderboardView onOpenAuth={() => setIsAuthOpen(true)} />
            )}
          </>
        )}
      </main>

      {/* Footer with Donation / Дэмжлэг Callout */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 space-y-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50 via-amber-50/70 to-rose-50 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5 text-center sm:text-left flex-col sm:flex-row">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-sm">
                <Heart className="h-5 w-5 fill-white text-white animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="font-display font-black text-slate-900 text-sm">
                    Donation / Дэмжлэг:
                  </span>
                  <span className="rounded-lg bg-emerald-900 text-white px-2.5 py-0.5 font-mono text-xs font-bold">
                    Хаан банк (iban: MN60000500) 5094238427 — Б.Түвшинбаяр
                  </span>
                </div>
                <p className="text-slate-600 text-xs">
                  Төслийг дэмжсэн Танд чин сэтгэлээсээ <strong className="text-rose-700">Баярлалаа! ❤️</strong> Хандивлагч бүр өөрийн нэр дээр <strong>«Талархлын батламж»</strong> үүсгэн хэвлэж авах боломжтой.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDonationOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>Дэмжлэг & Талархлын батламж авах</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-slate-700">Газрын зургийг хэн сайн мэдэх вэ?</span>
            <span aria-hidden="true">·</span>
            <span>Интерактив уралдаан</span>
          </div>

          <div className="flex items-center gap-4 text-slate-600 flex-wrap">
            {currentUser &&
              (currentUser.role === 'admin' ||
                (currentUser.status === 'approved' &&
                  currentUser.isCompetitionConfirmed !== false)) && (
                <button
                  onClick={() => {
                    setMainMenuTab('competition');
                    setMapSubTab('competition');
                  }}
                  className={`hover:text-amber-600 transition-colors ${
                    mainMenuTab === 'competition' ? 'text-amber-600 font-bold' : ''
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
              className={`hover:text-amber-600 transition-colors ${
                mainMenuTab === 'explore' ? 'text-amber-600 font-bold' : ''
              }`}
            >
              Газрын зураг
            </button>
            <button
              onClick={() => {
                setMainMenuTab('puzzles');
                setMapSubTab('puzzles');
              }}
              className={`hover:text-amber-600 transition-colors ${
                mainMenuTab === 'puzzles' ? 'text-amber-600 font-bold' : ''
              }`}
            >
              Сорил
            </button>
            <button
              onClick={() => {
                setMainMenuTab('leaderboard');
                setMapSubTab('leaderboard');
              }}
              className={`hover:text-amber-600 transition-colors ${
                mainMenuTab === 'leaderboard' ? 'text-amber-600 font-bold' : ''
              }`}
            >
              Шилдэгүүд
            </button>
            {currentUser && (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="text-amber-700 hover:text-amber-600 font-bold transition-colors cursor-pointer"
              >
                Сургууль & Мэдээлэл засах
              </button>
            )}
            {currentUser?.role === 'admin' ? (
              <button
                onClick={() => setMainMenuTab('admin_auth')}
                className={`hover:text-amber-600 transition-colors ${
                  mainMenuTab === 'admin_auth' ? 'text-amber-600 font-bold' : ''
                }`}
              >
                Админ самбар
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="hover:text-amber-600 transition-colors cursor-pointer"
              >
                Хэрэглэгчийн бүртгэл / Нэвтрэх
              </button>
            )}
            <button
              onClick={() => setIsDonationOpen(true)}
              className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Heart className="h-3 w-3 fill-rose-600" />
              <span>Donation / Дэмжлэг</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <span className="font-bold text-slate-800">Холбоо барих:</span>
            {contactPhone ? (
              <a
                href={`tel:${contactPhone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-800 hover:text-emerald-600"
              >
                <Phone className="h-3.5 w-3.5" />
                {contactPhone}
              </a>
            ) : (
              <span className="text-slate-400">утасны дугаар удахгүй</span>
            )}
            {adminContact?.fullName && adminContact.fullName.includes('@') === false && (
              <span className="text-slate-500">· {adminContact.fullName}</span>
            )}
          </div>
        </div>
      </footer>

      {/* Админы өөрчлөлт хадгалагдаж буй эсэх (хадгалагдаагүй бол шууд харагдана) */}
      {currentUser?.role === 'admin' && saveStatus.state !== 'idle' && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-xl rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg ${
            saveStatus.state === 'error'
              ? 'bg-rose-600 text-white'
              : saveStatus.state === 'saving'
              ? 'bg-amber-500 text-slate-950'
              : 'bg-emerald-700 text-white'
          }`}
        >
          {saveStatus.state === 'saving' ? 'Хадгалж байна…' : saveStatus.message}
        </div>
      )}

      {/* Modals */}
      <CompetitionModal
        isOpen={isCompetitionOpen}
        onClose={() => setIsCompetitionOpen(false)}
        overrideGrade={competitionGrade}
        onOpenAuth={() => {
          setIsCompetitionOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenProfile={() => {
          setIsAuthOpen(false);
          setIsProfileOpen(true);
        }}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
