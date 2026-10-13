import React, { useState, useMemo } from 'react';
import { auth } from '../lib/firebase';
import {
  BookOpen,
  Search,
  Filter,
  Layers,
  Sparkles,
  Puzzle,
  Compass,
  FileText,
  Printer,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  Download,
  HelpCircle,
  MapPin,
  Globe2,
  ChevronRight,
  ShieldCheck,
  Key,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ALL_EXPANDED_QUESTIONS } from '../data/expandedQuestions';
import { Question, GradeLevel, QuestionCategory, QuestionType } from '../types';
import { GEOGRAPHY_KNOWLEDGE_BASE } from '../data/curriculumKnowledgeBase';
import { exportToDocx, exportToPdf } from '../utils/documentExport';

export const QuestionBankView: React.FC = () => {
  const { currentUser, setActiveTab, setMainMenuTab, setMapSubTab, customQuestions } = useApp();

  const [selectedGrade, setSelectedGrade] = useState<'all' | GradeLevel>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | QuestionCategory>('all');
  const [selectedType, setSelectedType] = useState<'all' | string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modal for previewing a single question or printing test paper
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printGrade, setPrintGrade] = useState<GradeLevel>('9');
  const [printCount, setPrintCount] = useState<number>(20);
  const [includeAnswerKey, setIncludeAnswerKey] = useState<boolean>(true);

  // AI Question Bank Generator State
  const [activeMainTab, setActiveMainTab] = useState<'existing_bank' | 'ai_generator'>('existing_bank');
  const [aiGrade, setAiGrade] = useState<GradeLevel>('9');
  const [aiChapterId, setAiChapterId] = useState<string>('ch_9_1');
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiDifficulty, setAiDifficulty] = useState<string>('дунд ба ахисан');
  const [aiSelectedTypes, setAiSelectedTypes] = useState<string[]>([
    'Сонгох тест',
    'Зураг-таавар',
    'Аль нь буруу вэ?',
    'Код тайлах (Солбицол)',
  ]);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedHtml, setAiGeneratedHtml] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedTitle, setAiGeneratedTitle] = useState<string>('');

  const currentAiTextbook =
    GEOGRAPHY_KNOWLEDGE_BASE.textbooks.find((tb) => tb.grade === aiGrade) ||
    GEOGRAPHY_KNOWLEDGE_BASE.textbooks[0];

  const currentAiChapter =
    currentAiTextbook.chapters.find((ch) => ch.id === aiChapterId) ||
    currentAiTextbook.chapters[0];

  const handleGenerateAiQuestions = async () => {
    setIsAiGenerating(true);
    setAiError(null);

    const title = `${aiGrade}-р ангийн Газарзүйн Шалгалтын Даалгавар (${currentAiChapter?.title || 'Бүлэг'})`;
    setAiGeneratedTitle(title);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (currentUser?.userApiKey?.trim()) {
        headers['x-gemini-api-key'] = currentUser.userApiKey.trim();
      }
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch('/api/question-bank/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          grade: aiGrade,
          chapterTitle: currentAiChapter?.title,
          count: aiQuestionCount,
          questionTypes: aiSelectedTypes,
          difficulty: aiDifficulty,
          contextData: {
            textbook: currentAiTextbook.title,
            chapter: currentAiChapter,
            rubrics: GEOGRAPHY_KNOWLEDGE_BASE.evaluationRubrics.find((r) => r.grade === aiGrade),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Даалгавар үүсгэхэд алдаа гарлаа.');
      }

      setAiGeneratedHtml(data.contentHtml);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI сервис холбогдоход алдаа гарлаа. Өөрийн API түлхүүрийг шалгана уу.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Combined dataset from custom questions (admin created/synced) and expanded bank
  const combinedQuestions = useMemo(() => {
    return [...customQuestions, ...ALL_EXPANDED_QUESTIONS];
  }, [customQuestions]);

  // Filtered dataset
  const filteredQuestions = useMemo(() => {
    return combinedQuestions.filter((q) => {
      if (selectedGrade !== 'all' && q.gradeLevels && !q.gradeLevels.includes(selectedGrade)) {
        return false;
      }
      if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
      if (selectedType !== 'all' && q.type !== selectedType) return false;
      if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const inTitle = q.title.toLowerCase().includes(term);
        const inSubtitle = q.subtitle?.toLowerCase().includes(term) ?? false;
        const inTarget = q.targetName.toLowerCase().includes(term);
        const inExplanation = q.explanation.toLowerCase().includes(term);
        return inTitle || inSubtitle || inTarget || inExplanation;
      }
      return true;
    });
  }, [selectedGrade, selectedCategory, selectedType, selectedDifficulty, searchTerm, combinedQuestions]);

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuestions.slice(start, start + itemsPerPage);
  }, [filteredQuestions, currentPage]);

  const resetFilters = () => {
    setSelectedGrade('all');
    setSelectedCategory('all');
    setSelectedType('all');
    setSelectedDifficulty('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Helper for type labels
  const getTypeBadge = (type: QuestionType) => {
    switch (type) {
      case 'map_puzzle_placement':
        return { label: 'Зураг-таавар', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'odd_one_out':
        return { label: 'Аль нь буруу вэ?', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'coordinate_cipher':
        return { label: 'Код тайлах (Солбицол)', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
      case 'shp_contour_guess':
        return { label: 'Бодит SHP контур', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'silhouette_guess':
        return { label: 'Силуэт таавар', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'spatial_logic':
        return { label: 'Логик байршил', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' };
      case 'route_planning':
        return { label: 'Маршрут төлөвлөх', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
      case 'change_detection':
        return { label: 'Өөрчлөлт илрүүлэх', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' };
      case 'geo_detective':
        return { label: 'Газарзүйн детектив', color: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30' };
      case 'map_click_aimag':
      case 'map_click_country':
      case 'map_click_feature':
      case 'identify_region':
        return { label: 'Газрын зураг дээр заах', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      default:
        return { label: 'Сонгох тест', color: 'bg-slate-700/50 text-slate-300 border-slate-600' };
    }
  };

  const handleStartPracticeInPuzzles = () => {
    setMainMenuTab('map_system');
    setMapSubTab('puzzles');
    setActiveTab('puzzles');
  };

  // Generate printable test
  const printTestQuestions = useMemo(() => {
    const ratioMn = printGrade === '9' ? 0.7 : 0.4;
    const mnCount = Math.round(printCount * ratioMn);
    const wdCount = printCount - mnCount;

    const mnPool = ALL_EXPANDED_QUESTIONS.filter(
      (q) => q.category === 'mongolia' && q.gradeLevels.includes(printGrade)
    );
    const wdPool = ALL_EXPANDED_QUESTIONS.filter(
      (q) => q.category === 'world' && q.gradeLevels.includes(printGrade)
    );

    const mnSample = [...mnPool].sort(() => Math.random() - 0.5).slice(0, mnCount);
    const wdSample = [...wdPool].sort(() => Math.random() - 0.5).slice(0, wdCount);

    return [...mnSample, ...wdSample];
  }, [printGrade, printCount, isPrintModalOpen]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <BookOpen className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Газарзүйн Даалгаврын Сан ({combinedQuestions.length})
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            9 ба 12-р ангийн сурагчид, багш нарт зориулсан бүх төрлийн таавар, сорил, интерактив практик даалгаврууд
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors shadow"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            Сорил хэвлэх / PDF татах
          </button>

          <button
            onClick={handleStartPracticeInPuzzles}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Puzzle className="h-4 w-4" />
            Таавар талбарт тоглох
          </button>
        </div>
      </div>

      {/* Main Nav Tabs: 500+ Сан vs AI Боловсруулагч */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveMainTab('existing_bank')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeMainTab === 'existing_bank'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Бэлэн Даалгаврын Сан (500+)</span>
        </button>

        <button
          onClick={() => setActiveMainTab('ai_generator')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeMainTab === 'ai_generator'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Сэдэвчилсэн Даалгавар Боловсруулагч (DOCX / PDF)</span>
        </button>
      </div>

      {/* TAB 2: AI QUESTION GENERATOR */}
      {activeMainTab === 'ai_generator' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  Сурах бичгийн бүлэг сэдвээр AI шалгалтын материал боловсруулах
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Эх сурвалжийн JSON агуулгын хүрээнд сорил, хариултын түлхүүр, тайлбарыг автоматаар бэлтгэж Word / PDF хэлбэрээр татаж авах
                </p>
              </div>

              {/* Grade Selector (7-12) */}
              <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-semibold self-start sm:self-auto overflow-x-auto">
                {(['7', '8', '9', '10', '11', '12'] as GradeLevel[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setAiGrade(g);
                      const tb = GEOGRAPHY_KNOWLEDGE_BASE.textbooks.find((t) => t.grade === g);
                      if (tb && tb.chapters[0]) setAiChapterId(tb.chapters[0].id);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 transition-all whitespace-nowrap ${
                      aiGrade === g
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {g}-р анги
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Бүлэг сэдвийг сонгох ({currentAiTextbook.title})
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentAiTextbook.chapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setAiChapterId(ch.id)}
                    className={`text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between gap-3 ${
                      aiChapterId === ch.id
                        ? 'border-amber-500/60 bg-amber-500/15 text-slate-100 ring-1 ring-amber-500/30'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <span className="text-amber-400">Бүлэг {ch.chapterNumber}:</span>
                        <span className="text-slate-200">{ch.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{ch.summary}</p>
                    </div>
                    <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono shrink-0">
                      {ch.allocatedHours} цаг
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Configuration Row: Question Count, Difficulty, Question Types */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Даалгаврын тоо:</label>
                <select
                  value={aiQuestionCount}
                  onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value={5}>5 даалгавар (Богино сорил)</option>
                  <option value={10}>10 даалгавар (Ээлжит хичээлийн шалгалт)</option>
                  <option value={15}>15 даалгавар (Нэгжийн шалгалт)</option>
                  <option value={20}>20 даалгавар (Улирлын шалгалт / Олимпиад)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Хүндрэлийн түвшин:</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAiDifficulty(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                >
                  <option value="суурь ба дунд">Суурь ба дунд (I-III түвшин)</option>
                  <option value="дунд ба ахисан">Дунд ба ахисан (III-V түвшин)</option>
                  <option value="олимпиад ба гүнзгийрүүлсэн">Олимпиад ба гүнзгийрүүлсэн (V-VI түвшин)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Даалгаврын хэлбэрүүд:</label>
                <div className="text-[11px] text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-2">
                  <span>Зураг-таавар, солбицол, сонгох, аль нь буруу вэ, маршрут</span>
                </div>
              </div>
            </div>

            {/* Generate Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Эх сурвалж: {currentAiTextbook.title} (JSON Knowledge Base)
              </span>

              <button
                onClick={handleGenerateAiQuestions}
                disabled={isAiGenerating}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>AI даалгавар боловсруулж байна...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{aiQuestionCount} даалгавар бүхий шалгалтын материал үүсгэх</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {aiError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{aiError}</p>
              </div>
            )}
          </div>

          {/* Generated Result Container */}
          {aiGeneratedHtml && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5">
                    ДААЛГАВАР АМЖИЛТТАЙ БЭЛТГЭГДЛЭЭ
                  </span>
                  <h2 className="text-base font-bold text-slate-100 mt-1">{aiGeneratedTitle}</h2>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToDocx(aiGeneratedTitle, aiGeneratedHtml)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white shadow transition-all cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>DOCX (Word) татах</span>
                  </button>
                  <button
                    onClick={() => exportToPdf(aiGeneratedTitle, aiGeneratedHtml)}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-white shadow transition-all cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>PDF / Хэвлэх</span>
                  </button>
                </div>
              </div>

              {/* Rendered Printable Preview */}
              <div className="rounded-xl border border-slate-800 bg-white text-slate-900 p-8 shadow-inner overflow-x-auto text-xs leading-relaxed max-h-[700px] overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: aiGeneratedHtml }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: EXISTING 500+ QUESTION BANK */}
      {activeMainTab === 'existing_bank' && (
        <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Нийт даалгаврын сан</span>
          <p className="mt-1 text-2xl font-black text-amber-400">{combinedQuestions.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Админы болон системийн сан</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">9-р анги (Монгол 70/30)</span>
          <p className="mt-1 text-2xl font-black text-emerald-400">
            {combinedQuestions.filter((q) => !q.gradeLevels || q.gradeLevels.includes('9')).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Суурь боловсрол</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">12-р анги (Монгол 40/60)</span>
          <p className="mt-1 text-2xl font-black text-sky-400">
            {combinedQuestions.filter((q) => !q.gradeLevels || q.gradeLevels.includes('12')).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Бүрэн дунд боловсрол</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">Багш & Багийн ангилал</span>
          <p className="mt-1 text-2xl font-black text-purple-400">
            {combinedQuestions.filter((q) => !q.gradeLevels || q.gradeLevels.includes('teacher') || q.gradeLevels.includes('team')).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Багш болон багийн сорил</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Даалгаврын нэр, асуулт, аймаг, улс, тайлбараар хайх..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
            >
              Арилгах
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Grade selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold mr-1">Уралдаан/Анги:</span>
            <button
              onClick={() => {
                setSelectedGrade('all');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedGrade === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Бүх асуулт
            </button>
            <button
              onClick={() => {
                setSelectedGrade('9');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedGrade === '9'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              9-р анги
            </button>
            <button
              onClick={() => {
                setSelectedGrade('12');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedGrade === '12'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              12-р анги
            </button>
            <button
              onClick={() => {
                setSelectedGrade('teacher');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedGrade === 'teacher'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Багш
            </button>
            <button
              onClick={() => {
                setSelectedGrade('team');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedGrade === 'team'
                  ? 'bg-purple-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Баг
            </button>
          </div>

          {/* Category selection */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold mr-1">Хамрах хүрээ:</span>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Бүх нутаг
            </button>
            <button
              onClick={() => {
                setSelectedCategory('mongolia');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-colors ${
                selectedCategory === 'mongolia'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🇲🇳</span> Монгол
            </button>
            <button
              onClick={() => {
                setSelectedCategory('world');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 transition-colors ${
                selectedCategory === 'world'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🌍</span> Дэлхий
            </button>
          </div>

          {/* Type dropdown / selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Төрөл:</span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Даалгаврын төрөл сонгох"
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="all">Бүх төрөл</option>
              <option value="shp_contour_guess">🗺️ Бодит SHP контур (Нэр, аттрибют нуусан)</option>
              <option value="map_puzzle_placement">🧩 Зураг-таавар (Drag/Place)</option>
              <option value="odd_one_out">❌ “Аль нь буруу вэ?” / Илүүдэх</option>
              <option value="coordinate_cipher">🔐 Код тайлах (Солбицол)</option>
              <option value="silhouette_guess">👤 Силуэт таавар</option>
              <option value="spatial_logic">🧭 “Хэн хаана байна?” Логик</option>
              <option value="route_planning">🗺️ Маршрут төлөвлөх</option>
              <option value="change_detection">🔄 Өөрчлөлт илрүүлэх</option>
              <option value="geo_detective">🕵️‍♂️ Газарзүйн детектив</option>
              <option value="map_click_aimag">📍 Аймгийн байршил заах</option>
              <option value="map_click_country">🌍 Улс заах</option>
              <option value="multiple_choice">📝 Сонгох тест</option>
            </select>
          </div>

          {/* Reset button */}
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors underline"
          >
            Шүүлтүүр цэвэрлэх
          </button>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Олдсон даалгавар: <strong className="text-amber-400">{filteredQuestions.length}</strong> / {combinedQuestions.length}
        </span>
        <span>
          Хуудас {currentPage} / {totalPages || 1}
        </span>
      </div>

      {/* Questions Grid */}
      {filteredQuestions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-200">
            {combinedQuestions.length === 0
              ? 'Даалгаврын сан одоогоор хоосон байна'
              : 'Шүүлтүүрт тохирох даалгавар олдсонгүй'}
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
            {combinedQuestions.length === 0
              ? 'Зөвхөн админ багшийн оруулсан бодит даалгавар, зургууд энд хадгалагдана. Анхдагчаар хиймэл асуулт байхгүй.'
              : 'Хайх үг эсвэл анги, сэдвийн шүүлтүүрээ өөрчилж үзнэ үү.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedList.map((q) => {
          const typeBadge = getTypeBadge(q.type);
          return (
            <div
              key={q.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-all shadow hover:shadow-lg"
            >
              <div className="space-y-3">
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${typeBadge.color}`}
                    >
                      {typeBadge.label}
                    </span>
                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300 font-semibold">
                      {q.category === 'mongolia' ? '🇲🇳 Монгол' : '🌍 Дэлхий'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {q.points} оноо
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-slate-100 text-xs leading-snug line-clamp-2">
                    {q.title}
                  </h3>
                  {q.subtitle && (
                    <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                      {q.subtitle}
                    </p>
                  )}
                </div>

                {/* Target Information */}
                <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 px-2.5 py-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Зорилтот объект:</span>
                  <span className="font-semibold text-slate-200">{q.targetName}</span>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>Анги:</span>
                  <span className="font-semibold text-slate-300">
                    {q.gradeLevels.join(', ')}-р анги
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewQuestion(q)}
                    className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    Дэлгэрэнгүй
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            Өмнөх
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            {totalPages > 7 && <span className="text-slate-500 text-xs px-1">...</span>}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            Дараах
          </button>
        </div>
      )}
        </div>
      )}

      {/* Detail Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setPreviewQuestion(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold px-2 py-0.5 border border-amber-500/30">
                {previewQuestion.category === 'mongolia' ? 'Монголын газарзүй' : 'Дэлхийн газарзүй'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {previewQuestion.points} оноо · {previewQuestion.gradeLevels.join(', ')}-р анги
              </span>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-100">{previewQuestion.title}</h2>
              {previewQuestion.subtitle && (
                <p className="mt-1 text-xs text-slate-300">{previewQuestion.subtitle}</p>
              )}
            </div>

            {/* SHP Contour preview info */}
            {previewQuestion.shpContourData && (
              <div className="space-y-2 rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-2">
                  <span>🗺️ Бодит SHP Вектор Контур & Нууцалсан DBF Шинж чанар</span>
                  <span className="font-mono text-[10px] text-slate-400">{previewQuestion.shpContourData.geometryType}</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(previewQuestion.shpContourData.maskedProperties).map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1 text-[11px]">
                      <span className="text-slate-400">{k}:</span>
                      <span className="font-mono text-slate-200">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Map Pin Question Info */}
            {previewQuestion.mapPinData && (
              <div className="space-y-2 rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    Интерактив газрын зурагт цэг тавих байршил:
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Зөвшөөрөгдөх алдаа: &lt; {previewQuestion.mapPinData.allowedDistanceKm || 50} км
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Обьектийн нэр:</span>
                    <span className="font-bold text-emerald-400">{previewQuestion.mapPinData.targetName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Бодит координат:</span>
                    <span className="font-mono text-amber-400">
                      {previewQuestion.mapPinData.targetLat.toFixed(4)}°N, {previewQuestion.mapPinData.targetLng.toFixed(4)}°E
                    </span>
                  </div>
                  {previewQuestion.mapPinData.elevationOrMetric && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Хэмжээс/Өндөр:</span>
                      <span className="text-slate-200">{previewQuestion.mapPinData.elevationOrMetric}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Answer Options if applicable */}
            {previewQuestion.options && (
              <div className="space-y-2 rounded-xl bg-slate-950 p-3.5 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Хариултын хувилбарууд:
                </span>
                {previewQuestion.options.map((opt, i) => (
                  <div
                    key={opt.id}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border ${
                      opt.isCorrect
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <span>
                      {String.fromCharCode(65 + i)}. {opt.text}
                    </span>
                    {opt.isCorrect && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Зөв хариулт
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Explanation */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Газарзүйн тайлбар & зөвлөмж:</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {previewQuestion.explanation}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Хаах
              </button>
              <button
                onClick={() => {
                  setPreviewQuestion(null);
                  handleStartPracticeInPuzzles();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow"
              >
                <Puzzle className="h-3.5 w-3.5" />
                Тааварт тоглож шалгах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Test Paper Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100">
                Газарзүйн Сорилын Хуудас Бэлтгэх & Хэвлэх
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Багш Б.Түвшинбаяр болон хичээл заагч багш нарт зориулсан 9, 12-р ангийн улсын стандартын харьцаатай сорилын хуудас.
            </p>

            {/* Test generation controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-slate-950 p-4 border border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Анги сонгох:
                </label>
                <select
                  value={printGrade}
                  onChange={(e) => setPrintGrade(e.target.value as GradeLevel)}
                  aria-label="Анги сонгох"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="9">9-р анги (Монгол 70% · Дэлхий 30%)</option>
                  <option value="12">12-р анги (Монгол 40% · Дэлхий 60%)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Асуултын тоо:
                </label>
                <select
                  value={printCount}
                  onChange={(e) => setPrintCount(Number(e.target.value))}
                  aria-label="Асуултын тоо"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value={10}>10 асуулт</option>
                  <option value={20}>20 асуулт (Стандарт сорил)</option>
                  <option value={30}>30 асуулт (Улсын олимпиад)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Зөв хариултын түлхүүр:
                </label>
                <button
                  onClick={() => setIncludeAnswerKey(!includeAnswerKey)}
                  className={`w-full rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                    includeAnswerKey
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {includeAnswerKey ? '✓ Түлхүүртэй бэлтгэх' : '✕ Зөвхөн сурагчийн хуудас'}
                </button>
              </div>
            </div>

            {/* Preview of the printable test */}
            <div className="max-h-96 overflow-y-auto space-y-3 rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs">
              <div className="text-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm text-slate-100">
                  ЕРӨНХИЙ БОЛОВСРОЛЫН СУРГУУЛИЙН {printGrade}-Р АНГИЙН ГАЗАРЗҮЙН ШАЛГАЛТ
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Хувилбар: А · Харьцаа: {printGrade === '9' ? 'Монгол 70% / Дэлхий 30%' : 'Монгол 40% / Дэлхий 60%'} · Хугацаа: 40 минут
                </p>
                <div className="flex justify-between text-[11px] text-slate-400 mt-3 border-t border-slate-800/60 pt-2 px-2">
                  <span>Сурагчийн овог нэр: _________________________</span>
                  <span>Сургууль, анги: ________________</span>
                  <span>Огноо: ________</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {printTestQuestions.map((q, idx) => (
                  <div key={q.id} className="space-y-1.5">
                    <p className="font-semibold text-slate-200">
                      {idx + 1}. {q.title}
                      <span className="text-[10px] text-amber-400 ml-2 font-mono">
                        ({q.category === 'mongolia' ? 'Монгол' : 'Дэлхий'} · {q.points} оноо)
                      </span>
                    </p>
                    {q.options && (
                      <div className="grid grid-cols-2 gap-1.5 pl-4 text-slate-300 text-[11px]">
                        {q.options.map((opt, i) => (
                          <div key={opt.id}>
                            {String.fromCharCode(65 + i)}) {opt.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {includeAnswerKey && (
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <h4 className="font-bold text-emerald-400 text-xs mb-2">
                    Зөв хариултын түлхүүр & Тайлбар (Багшид зориулав):
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-300">
                    {printTestQuestions.map((q, idx) => (
                      <div key={q.id} className="p-1.5 bg-slate-900 rounded border border-slate-800">
                        <strong>№{idx + 1}:</strong> {q.targetName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Print Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Хэвлэх товч дарснаар хөтчийн хэвлэх цонх нээгдэнэ.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Болих
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow"
                >
                  <Printer className="h-4 w-4" />
                  Хэвлэх (Print / PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
