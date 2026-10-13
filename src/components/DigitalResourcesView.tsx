import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Download,
  Video,
  BookOpen,
  Sparkles,
  ExternalLink,
  MapPin,
  Globe2,
  CheckCircle2,
  Compass,
  Mountain,
  Waves,
  Sun,
  Printer,
  ChevronRight,
  Eye,
  FileCode,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const DigitalResourcesView: React.FC = () => {
  const { setMainMenuTab, setMapSubTab, setActiveTab } = useApp();
  const [activeCategory, setActiveCategory] = useState<'all' | 'atlas' | 'worksheets' | 'video' | 'teacher'>('all');
  const [downloadSuccessModal, setDownloadSuccessModal] = useState<string | null>(null);

  // Jump to Interactive Map
  const handleJumpToMap = () => {
    setMainMenuTab('map_system');
    setMapSubTab('explore');
    setActiveTab('explore');
  };

  // Jump to Puzzles
  const handleJumpToPuzzles = () => {
    setMainMenuTab('map_system');
    setMapSubTab('puzzles');
    setActiveTab('puzzles');
  };

  const handleDownload = (resourceTitle: string) => {
    setDownloadSuccessModal(resourceTitle);
    setTimeout(() => {
      setDownloadSuccessModal(null);
    }, 3500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Газарзүйн Цахим Хэрэглэгдэхүүний Сан
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Багш, сурагчдад зориулсан интерактив атлас, контур зургийн ажлын хуудас, симуляци болон арга зүйн материалууд
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs font-semibold self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Бүх хэрэглэгдэхүүн
          </button>
          <button
            onClick={() => setActiveCategory('atlas')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeCategory === 'atlas'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🗺️ Атлас & Симуляци
          </button>
          <button
            onClick={() => setActiveCategory('worksheets')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeCategory === 'worksheets'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📑 Контур зураг / PDF
          </button>
          <button
            onClick={() => setActiveCategory('video')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeCategory === 'video'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎬 Видео контент
          </button>
          <button
            onClick={() => setActiveCategory('teacher')}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              activeCategory === 'teacher'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            👨‍🏫 Багшийн арга зүй
          </button>
        </div>
      </div>

      {/* Hero Interactive Showcase Card */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/15 via-indigo-950/40 to-slate-950 p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-sky-500/20 text-sky-300 text-[11px] font-bold px-2 py-0.5 border border-sky-500/30">
              ОНЦЛОХ ЦАХИМ ХЭРЭГЛЭГДЭХҮҮН
            </span>
            <span className="text-[11px] text-slate-400">Шууд хөтөч дээрээс ашиглах боломжтой</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Монгол орны хиймэл дагуулын GIS болон Вектор цахим атлас
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Энэхүү платформ нь зөвхөн уралдаан төдийгүй 21 аймгийн хил, уул нурууд, гол мөрөн, нуурууд болон дэлхийн тив далайн бодит хиймэл дагуулын (Esri World Satellite) үе давхаргыг агуулсан цогц цахим хэрэглэгдэхүүн юм.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleJumpToMap}
              className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
            >
              <Compass className="h-4 w-4" />
              Бодит хиймэл дагуулын газрын зургийг нээх
            </button>
            <button
              onClick={handleJumpToPuzzles}
              className="flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              Таавар талбарыг турших
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0 w-full md:w-auto">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center">
            <Mountain className="h-5 w-5 text-amber-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-slate-200 block">4374 м</span>
            <span className="text-[10px] text-slate-400">Хүйтэн оргил</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center">
            <Waves className="h-5 w-5 text-sky-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-slate-200 block">1124 км</span>
            <span className="text-[10px] text-slate-400">Орхон гол</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center">
            <Sun className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-slate-200 block">21 Аймаг</span>
            <span className="text-[10px] text-slate-400">Засаг захиргаа</span>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-center">
            <Globe2 className="h-5 w-5 text-purple-400 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-slate-200 block">6 Тив 4 Далай</span>
            <span className="text-[10px] text-slate-400">Дэлхийн бүсүүд</span>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Resource 1: Contour Map Grade 9 */}
        {(activeCategory === 'all' || activeCategory === 'worksheets') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 border border-amber-500/30">
                  9-р анги · Контур зураг
                </span>
                <span className="text-[10px] text-slate-400 font-mono">PDF · Хэвлэхэд бэлэн</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm">
                Монгол орны 21 аймгийн засаг захиргаа, төв хотуудын контур зураг
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Сурагчид аймгуудын хил хязгаарыг таних, төв хотууд болон ашигт малтмалын ордуудыг тэмдэглэх стандарт ажлын хуудас.
              </p>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Агуулга:</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  21 аймгийн хил, 330 сумын төв, хойд мөсөн далайн ай сав, төмөр замын шугам.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload('Монгол орны 21 аймгийн контур ажлын хуудас (PDF)')}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors w-full"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              Контур зураг татах (PDF)
            </button>
          </div>
        )}

        {/* Resource 2: World Contour Map Grade 12 */}
        {(activeCategory === 'all' || activeCategory === 'worksheets') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 border border-sky-500/30">
                  12-р анги · Контур зураг
                </span>
                <span className="text-[10px] text-slate-400 font-mono">PDF · A4 хэмжээ</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm">
                Дэлхийн улс төр, эдийн засгийн газарзүйн контур ажлын хуудас
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Дэлхийн 190 гаруй улс, томоохон хоолой, суваг (Суэц, Панам, Малакка) болон эдийн засгийн төвүүдийг тэмдэглэх дадлага.
              </p>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Агуулга:</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Тивүүд, их наймын орнууд, түүхий эдийн тээврийн гол усан замууд.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload('Дэлхийн улс төрийн контур зураг (PDF)')}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors w-full"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" />
              Контур зураг татах (PDF)
            </button>
          </div>
        )}

        {/* Resource 3: Interactive Topo Simulator */}
        {(activeCategory === 'all' || activeCategory === 'atlas') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                  Интерактив · Симуляци
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">Онлайн ажиллах</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm">
                Газарзүйн өндөржилтийн зүсэлт ба Азимут, Налуу тооцоолуур
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Топографийн зургийн өгөгдөл, изогипс шугамуудыг уншиж уулын өндөр, налуугийн өнцөг болон луужингийн азимутыг тодорхойлох интерактив модуль.
              </p>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Шалгах чадвар:</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  3D гадарга таних, хэвтээ ба босоо масштаб, харагдах байдал шинжлэх.
                </p>
              </div>
            </div>

            <button
              onClick={handleJumpToMap}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600/30 border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-600/40 transition-colors w-full"
            >
              <Compass className="h-3.5 w-3.5" />
              Интерактив зургийг нээх
            </button>
          </div>
        )}

        {/* Resource 4: Teacher Guide by B.Tuvshinbayar */}
        {(activeCategory === 'all' || activeCategory === 'teacher') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 border border-purple-500/30">
                  Арга зүй · Багшид
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Б.Түвшинбаяр багш</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm">
                “Газарзүйн детектив” ба Багаар ажиллах бүтээлч шатны удирдамж
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Уралдааны II болон III шатанд ашиглагдах экспедицийн маршрут илрүүлэх, баримт нотолгоо цуглуулж дүгнэлт гаргах даалгаврын арга зүйн хөтөлбөр.
              </p>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Шалгуурууд:</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Логик дүгнэлт 30%, Газрын зургийн байршил 40%, Багийн тайлан 30%.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload('Багаар ажиллах Газарзүйн детектив удирдамж (PDF)')}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors w-full"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" />
              Арга зүйн зөвлөмж татах (PDF)
            </button>
          </div>
        )}

        {/* Resource 5: Water Basins Digital Map */}
        {(activeCategory === 'all' || activeCategory === 'atlas') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold px-2 py-0.5 border border-cyan-500/30">
                  Ус зүй · Цахим атлас
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">Интерактив</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm">
                Монгол орны гадагш урсгалтай ба урсгалгүй 3 их ай савын атлас
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Хойд мөсөн далайн ай сав, Номхон далайн ай сав болон Төв Азийн гадагш урсгалгүй ай савын хилийн зааг, томоохон гол нууруудын харьцуулалт.
              </p>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Онцлог:</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Сэлэнгэ, Хэрлэн, Онон, Халх гол, Увс нуур, Хөвсгөл нуурын гидрологи.
                </p>
              </div>
            </div>

            <button
              onClick={handleJumpToMap}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors w-full"
            >
              <Eye className="h-3.5 w-3.5 text-cyan-400" />
              Газрын зураг дээр харах
            </button>
          </div>
        )}

        {/* Resource 6: Video Lessons */}
        {(activeCategory === 'all' || activeCategory === 'video') && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 border border-rose-500/30">
                  Видео хичээл · ЭЕШ & Олимпиад
                </span>
                <span className="text-[10px] text-slate-400 font-mono">15 мин цуврал</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm">
                “Газрын зургийн таних тэмдэг, солбицол ба масштаб тооцоолох нь”
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Бодит координатын систем (өргөрөг, уртраг) ашиглан байршил тодорхойлох, масштабын дагуу зайн болон талбайн бодит хэмжээг тооцох видеот тайлбар.
              </p>
              <div className="rounded-xl bg-slate-950 p-2.5 border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Шалгах жишээ:</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  47°55′N 106°55′E солбицлоор Улаанбаатар хотын төвийг тооцоолох жишээ.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDownload('Координат ба масштабын дасгал ажлын хуудас (PDF)')}
              className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors w-full"
            >
              <Download className="h-3.5 w-3.5 text-rose-400" />
              Дасгалын даалгавар татах
            </button>
          </div>
        )}
      </div>

      {/* Download Confirmation Toast */}
      {downloadSuccessModal && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/50 bg-slate-900 p-4 shadow-2xl flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100">Файл амжилттай бэлтгэгдлээ!</h4>
            <p className="text-[11px] text-slate-400">{downloadSuccessModal}</p>
          </div>
        </div>
      )}
    </div>
  );
};
