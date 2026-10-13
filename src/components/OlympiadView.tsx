import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Sparkles,
  Search,
  Download,
  Printer,
  AlertCircle,
  FileText,
  RefreshCw,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OLYMPIAD_MATERIALS, OlympiadTask } from '../data/olympiadMaterials';
import { exportToDocx, exportToPdf } from '../utils/documentExport';

interface OlympiadViewProps {
  onOpenAuth?: () => void;
}

export const OlympiadView: React.FC<OlympiadViewProps> = ({ onOpenAuth }) => {
  const { currentUser } = useApp();

  const [activeScope, setActiveScope] = useState<'all' | 'international' | 'national'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<OlympiadTask>(OLYMPIAD_MATERIALS[0]);

  // AI Solution State
  const [userPrompt, setUserPrompt] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [solutionHtml, setSolutionHtml] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered materials
  const filteredTasks = useMemo(() => {
    return OLYMPIAD_MATERIALS.filter((task) => {
      if (activeScope !== 'all' && task.scope !== activeScope) return false;
      if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          task.title.toLowerCase().includes(term) ||
          task.summary.toLowerCase().includes(term) ||
          task.questionDetails.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [activeScope, selectedCategory, searchTerm]);

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
              ? 'Олимпиад цэс рүү орохын тулд сайтад бүртгүүлнэ үү'
              : 'Газрын зураг, сорил, олимпиадын эрх хаалттай байна'}
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
              <Trophy className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Газарзүйн Олимпиад (Монгол ба Олон Улс - iGeo)
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Монголын Улсын болон Олон улсын (iGeo) олимпиадын албан ёсны даалгаврууд
          </p>
        </div>

        {/* Scope Tabs */}
        <div className="flex rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveScope('all')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeScope === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Бүх даалгавар
          </button>
          <button
            onClick={() => setActiveScope('international')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeScope === 'international'
                ? 'bg-sky-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌐 Олон улс (iGeo)
          </button>
          <button
            onClick={() => setActiveScope('national')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeScope === 'national'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇲🇳 Улсын олимпиад
          </button>
        </div>
      </div>

      {/* Main Grid: Left Tasks List (1/3), Right Detail & AI Solver (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search & Category */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Олимпиадын нэр, сэдэв, онолоор хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {['all', 'Физик газарзүй', 'Нийгэм-эдийн засаг', 'Талбайн судалгаа', 'Картографи & GIS', 'Геополитик'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors border ${
                    selectedCategory === cat
                      ? 'border-amber-300 bg-amber-50 text-amber-900 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'all' ? 'Бүх төрөл' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks Cards */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTask(t);
                  setSolutionHtml(null);
                  setErrorMessage(null);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selectedTask?.id === t.id
                    ? 'border-amber-400 bg-amber-50/70 text-slate-900 shadow-xs ring-1 ring-amber-400'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      t.scope === 'international'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {t.scope === 'international' ? 'iGeo' : 'Улсын олимпиад'} · {t.year}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{t.points} оноо</span>
                </div>

                <h3 className="font-bold text-xs text-slate-900 line-clamp-2 mt-1">{t.title}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{t.summary}</p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>{t.category}</span>
                  <span className="text-amber-700 font-semibold">{t.taskType}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Detail Panel & AI Solver */}
        <div className="lg:col-span-7 space-y-5">
          {selectedTask && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-xs">
              {/* Task Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      selectedTask.scope === 'international'
                        ? 'bg-sky-50 text-sky-800 border border-sky-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {selectedTask.scope === 'international' ? 'ОЛОН УЛС (iGeo)' : 'МОНГОЛЫН УЛСЫН ОЛИМПИАД'}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {selectedTask.year} он · {selectedTask.stage}
                  </span>
                </div>

                <span className="rounded bg-slate-100 px-2.5 py-1 text-xs text-slate-700 font-bold">
                  {selectedTask.points} онооны даалгавар
                </span>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedTask.title}</h2>
                <p className="text-xs text-slate-500 mt-1">{selectedTask.summary}</p>
              </div>

              {/* Problem Details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                  <FileText className="h-4 w-4 text-amber-600" />
                  <span>Албан ёсны даалгаврын эх бичвэр:</span>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-xs">
                  {selectedTask.questionDetails}
                </pre>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                  Эх сурвалж: {selectedTask.sourceDocument}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
