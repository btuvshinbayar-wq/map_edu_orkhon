import React from 'react';
import {
  X,
  Download,
  Printer,
  FileText,
  Trophy,
  Compass,
  CheckCircle2,
  Users,
  Clock,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';
import { exportToDocx, exportToPdf } from '../utils/documentExport';
import { useApp } from '../context/AppContext';

interface CompetitionGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { normalizeScoring, describeRules, type RulesConfigLike } from '../lib/scoring';

/** Удирдамжийн хэвлэх/татах (Word, PDF) текст: хугацаа болон хурдны урамшуулал нь админы тохиргоотой таарна */
export const buildCompetitionGuidelinesHtml = (cfg?: RulesConfigLike | null): string => {
  const sc = normalizeScoring(cfg);
  return `
<h2>НЭГ. ЕРӨНХИЙ МЭДЭЭЛЭЛ БА ЗОРИЛГО</h2>
<p>
  <strong>1.1. Уралдааны нэр:</strong> «Газрын зургийг хэн сайн мэдэх вэ?» Улсын цахим интерактив уралдаан
</p>
<p>
  <strong>1.2. Зорилго:</strong> Ерөнхий боловсролын сургуулийн сурагчид болон газарзүйн багш нарын Монгол орон, тив, дэлхийн физик болон нийгэм-эдийн засгийн газарзүйн мэдлэгийг сорих, орчин үеийн газарзүйн мэдээллийн систем (GIS, вектор контур, хиймэл дагуулын зураг) дээр ажиллах чадвар, орон зайн сэтгэлгээг хөгжүүлэхэд оршино.
</p>
<p>
  <strong>1.3. Хамрах хүрээ:</strong> Улсын хэмжээний ЕБС-ийн сурагчид болон Газарзүйн багш нар цахим платформоор дамжуулан орон зай харгалзахгүйгээр оролцоно.
</p>

<h2>ХОЁР. УРАЛДААНЫ АНГИЛАЛ БА АГУУЛГЫН ХАРЬЦАА</h2>
<p>Уралдаан нь дараах <strong>4 үндсэн ангиллаар</strong> явагдана:</p>
<table>
  <thead>
    <tr>
      <th>№</th>
      <th>Ангилал</th>
      <th>Оролцогчид</th>
      <th>Агуулгын харьцаа</th>
      <th>Гол сэдэв ба онцлог</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><strong>9-р ангийн ангилал</strong></td>
      <td>ЕБС-ийн дунд ангийн сурагчид (6–9-р анги)</td>
      <td>70% Монгол орон · 30% Дэлхийн газарзүй</td>
      <td>Монгол орны 21 аймаг, сумд, уул нурууд, гол мөрөн, нуур, байгалийн бүс бүслүүр, дэлхийн тив ба томоохон улсууд</td>
    </tr>
    <tr>
      <td>2</td>
      <td><strong>12-р ангийн ангилал</strong></td>
      <td>ЕБС-ийн ахлах ангийн сурагчид (10–12-р анги)</td>
      <td>40% Монгол орон · 60% Дэлхийн газарзүй</td>
      <td>Дэлхийн улс орнууд, нийслэл хотууд, стратегийн далайн хоолой ба сувгууд, тектоник хавтан, эдийн засгийн газарзүй, ашигт малтмалын орд газрууд</td>
    </tr>
    <tr>
      <td>3</td>
      <td><strong>Багшийн ангилал</strong></td>
      <td>ЕБС-ийн Газарзүй, Байгалийн ухааны багш нар</td>
      <td>50% Гүнзгийрүүлсэн Монгол · 50% Дэлхий & GIS</td>
      <td>WGS84 солбицол ба координат тайлах, масштаб, хэвтээ хөндлөн огтлол, геоморфологи, орон зайн цогц шинжилгээ</td>
    </tr>
    <tr>
      <td>4</td>
      <td><strong>Багийн ангилал</strong></td>
      <td>3–5 сурагчийн бүрэлдэхүүнтэй багууд</td>
      <td>Хамтын орон зайн тактик ба логик сорил</td>
      <td>Хамтран маршрут төлөвлөх, силуэт эвлүүлэх, “Аль нь буруу вэ?”, газарзүйн детектив даалгавар</td>
    </tr>
  </tbody>
</table>

<h2>ГУРАВ. ДААЛГАВРЫН БҮТЭЦ БА 9 ТӨРӨЛ</h2>
<p>
  Уралдаан болон сорилын сан нь бодит <strong>Shapefile (*.shp) / GeoJSON</strong> вектор давхаргууд дээр суурилсан дараах <strong>9 төрлийн интерактив даалгавраас</strong> бүрдэнэ:
</p>
<ol>
  <li><strong>Газрын зураг дээрх контур таних (Талбай / Polygon):</strong> Улсын хил дотор тодруулсан аймаг, сум, нуур эсвэл бүс нутгийг зөв нэрлэх.</li>
  <li><strong>Цэгэн объект нэрлэх (Point Object):</strong> Газрын зураг дээр улаан цэгээр тэмдэглэгдсэн уулын оргил, хот, суурин, орд газрыг таних.</li>
  <li><strong>Шугаман объект таних (Line / River / Ridge):</strong> Тодруулсан гол мөрөн, уулсын нуруу, хилийн шугамыг таних.</li>
  <li><strong>Хэлбэр (Силуэт) контур хараад таах:</strong> Газрын зургийн суурьгүйгээр зөвхөн тухайн объектын геометр хэлбэр дүрсийг хараад ямар объект болохыг олох.</li>
  <li><strong>Газрын зурагт цэг тавих (Map Pin Placement):</strong> Өгөгдсөн газарзүйн объектыг хоосон контур зураг дээр хулганаар (эсвэл дэлгэц дээр) дарж байршлыг заах.</li>
  <li><strong>Солбицол ба Координат тайлах (WGS84 Coordinate):</strong> Өгөгдсөн өргөрөг, уртрагийн солбицлоор ямар газарзүйн объект байгааг тодорхойлох.</li>
  <li><strong>Хөрш зэргэлдээ объектын логик:</strong> Тухайн объекттой хил залган оршдог эсвэл хамгийн ойр орших газарзүйн объектыг олох.</li>
  <li><strong>Хэмжээ ба эрэмбэ харьцуулах:</strong> Газарзүйн объектуудыг талбай, урт, өндөр эсвэл байршлаар нь (баруунаас зүүн, хойноос урагш) харьцуулах.</li>
  <li><strong>«Аль нь буруу вэ?» (Гео-Детектив):</strong> Өгөгдсөн 4 баримт эсвэл байршлаас газарзүйн хувьд ташаа мэдээллийг илрүүлэх.</li>
</ol>

<h2>ДӨРӨВ. БҮРТГЭЛ БА ЗОХИОН БАЙГУУЛАЛТЫН ЖУРАМ</h2>
<ul>
  <li><strong>4.1. Цахим бүртгэл:</strong> Оролцогч бүр платформын «Хэрэглэгчийн бүртгэл» хэсэгт өөрийн овог нэр, аймаг/хот, сум/дүүрэг, сургууль, ангилал болон холбоо барих мэдээллээ үнэн зөв оруулж бүртгүүлнэ.</li>
  <li><strong>4.2. Бэлтгэл болон Дадлага («Сорил» цэс):</strong> Сайтад бүртгүүлсэн бүх сурагч, багш нар уралдаан эхлэхээс өмнө «Газрын зураг», «Сорил» цэсүүдийг чөлөөтэй ашиглаж, давхарга болон даалгаврын төрлүүдээр (контур таах, нэр тодорхойлох, талбай, хөрш, эвлүүлэх, цэг байрлуулах) дадлага хийх боломжтой.</li>
  <li><strong>4.3. Уралдааны эрх баталгаажуулалт:</strong> Албан ёсны «Уралдаан» цэс рүү зөвхөн Зохион байгуулах комисс (Админ)-оос эрхийг нь баталгаажуулсан оролцогчид товлогдсон цагийн хуваарийн дагуу нэвтэрч шалгалтаа өгнө.</li>
</ul>

<h2>ТАВ. ДҮГНЭХ АРГАЧЛАЛ БА ОНООНЫ СИСТЕМ</h2>
<table>
  <thead>
    <tr>
      <th>Үзүүлэлт</th>
      <th>Шалгуур ба тайлбар</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Асуултын тоо ба Хугацаа</strong></td>
      <td>Нэг удаагийн уралдааны сорил: <strong>${describeRules(cfg)}</strong> өгөгдөнө.</td>
    </tr>
    <tr>
      <td><strong>Үндсэн оноо ба Хурдны урамшуулал</strong></td>
      <td>Зөв хариулт бүр суурь оноо авахаас гадна <strong>хурдан хариулах тусам өндөр оноо</strong> авна: оноо = суурь оноо × (1 + ${sc.speedBonusPercent}% × үлдсэн хугацаа ÷ нийт хугацаа). Зөв хариултыг <strong>хамгийн бага хугацаанд</strong> хийсэн нь хамгийн өндөр оноо авна. Буруу эсвэл цаг дууссан хариулт 0 оноотой.</td>
    </tr>
    <tr>
      <td><strong>Байршлын нарийвчлал (Pin Accuracy)</strong></td>
      <td>Газрын зураг дээр цэг хатгах даалгаварт бодит координат хүртэлх зайг километрээр тооцоолж, 0–100% нарийвчлалын оноо олгоно.</td>
    </tr>
    <tr>
      <td><strong>Эрэмбэлэх зарчим (Tie-break)</strong></td>
      <td>Байрыг нийт оноогоор тогтооно. Оноо тэнцсэн тохиолдолд <strong>зарцуулсан нийт хугацаа бага</strong> нь дээр эрэмбэлэгдэнэ.</td>
    </tr>
  </tbody>
</table>

<h2>ЗУРГАА. ШАГНАЛ УРАМШУУЛАЛ БА ЦАХИМ БАТЛАМЖ</h2>
<ul>
  <li><strong>6.1. Албан ёсны Цахим Батламж (QR баталгаажуулалттай):</strong> Уралдаанд оролцсон оролцогч болон баг тус бүрт авсан оноо, нарийвчлалын хувь, зарцуулсан хугацаа, дахин давтагдашгүй дугаар бүхий албан ёсны Цахим Батламж автоматаар олгогдоно.</li>
  <li><strong>6.2. Ангилал тус бүрийн шагналт байрууд:</strong>
    <ul>
      <li><strong>Тэргүүн байр (I байр):</strong> Алтан өргөмжлөл, медаль, үнэ бүхий шагнал</li>
      <li><strong>Дэд байр (II байр):</strong> Мөнгөн өргөмжлөл, медаль, үнэ бүхий шагнал</li>
      <li><strong>Гутгаар байр (III байр):</strong> Хүрэл өргөмжлөл, медаль, үнэ бүхий шагнал</li>
      <li><strong>Тусгай байр (IV–V байр):</strong> Тусгай байрын өргөмжлөл, дурсгалын зүйл</li>
    </ul>
  </li>
  <li><strong>6.3. Шилдэг сургууль ба Шилдэг бэлтгэсэн багш:</strong> Хамгийн олон сурагч амжилттай оролцуулж, нийлбэр чансаагаар тэргүүлсэн сургууль болон удирдсан газарзүйн багшийг шалгаруулж «Шилдэг Ментор Багш» батламжаар шагнана.</li>
</ul>

<h2>ДОЛОО. ШУДАРГА ӨРСӨЛДӨӨН БА ТЕХНИКИЙН ШААРДЛАГА</h2>
<ul>
  <li>Оролцогчид компьютер, таблет эсвэл ухаалаг гар утасны аль ч төхөөрөмжөөс интернет орчинд оролцох боломжтой (Газрын зургийн контурыг тод харахын тулд компьютер эсвэл таблет ашиглахыг зөвлөж байна).</li>
  <li>Уралдааны явцад хуудас дахин ачаалах (Refresh), бусад туслах программ ашиглах, нэг бүртгэлээр олон төхөөрөмжөөс зэрэг нэвтрэхийг хориглоно.</li>
  <li>Даалгавартай холбоотой санал, залруулгыг сурагч, багш нар «Сорил» цэсний <strong>«Алдаа мэдээлэх»</strong> товчоор дамжуулан Зохион байгуулах комисст шууд илгээх боломжтой.</li>
</ul>
`;
};

export const COMPETITION_GUIDELINES_HTML = buildCompetitionGuidelinesHtml();

export const CompetitionGuidelinesModal: React.FC<CompetitionGuidelinesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { certificateConfig, competitionSchedule } = useApp();

  if (!isOpen) return null;

  const title = '«Газрын зургийг хэн сайн мэдэх вэ?» Улсын интерактив уралдааны удирдамж';

  const handleDownloadWord = () => {
    exportToDocx(title, buildCompetitionGuidelinesHtml(competitionSchedule), 'Газрын_зургийг_хэн_сайн_мэдэх_вэ_Удирдамж');
  };

  const handlePrintPdf = () => {
    exportToPdf(title, buildCompetitionGuidelinesHtml(competitionSchedule));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-amber-50 via-white to-sky-50 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-xs">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                  Албан ёсны удирдамж · 2026
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                «Газрын зургийг хэн сайн мэдэх вэ?» Уралдааны удирдамж
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
              title="Word (.doc) файлаар татаж авах"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Word (.doc) татах</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
              title="PDF болгон хадгалах эсвэл хэвлэх"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PDF / Хэвлэх</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 p-2 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              title="Хаах"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Guidelines Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Official Header Banner inside Document */}
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-5 text-center space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
              {certificateConfig.organizationSubtitle || 'МОНГОЛ УЛСЫН ЕРӨНХИЙ БОЛОВСРОЛЫН СУРГУУЛИУДЫН ДУНДАХ'}
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              «ГАЗРЫН ЗУРГИЙГ ХЭН САЙН МЭДЭХ ВЭ?» УЛСЫН ЦАХИМ ИНТЕРАКТИВ УРАЛДААНЫ УДИРДАМЖ
            </h1>
            {competitionSchedule.announcementNote && (
              <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 inline-block mt-1">
                📢 {competitionSchedule.announcementNote}
              </p>
            )}
          </div>

          {/* Section 1 */}
          <div className="space-y-2.5">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Compass className="h-4 w-4 text-amber-600 shrink-0" />
              <span>НЭГ. ЕРӨНХИЙ МЭДЭЭЛЭЛ БА ЗОРИЛГО</span>
            </h3>
            <div className="space-y-2 pl-1">
              <p>
                <strong className="text-slate-900">1.1. Уралдааны нэр:</strong> «Газрын зургийг хэн сайн мэдэх вэ?» Улсын цахим интерактив уралдаан.
              </p>
              <p>
                <strong className="text-slate-900">1.2. Зорилго:</strong> ЕБС-ийн сурагчид болон газарзүйн багш нарын Монгол орон, тив, дэлхийн физик болон нийгэм-эдийн засгийн газарзүйн мэдлэгийг сорих, орчин үеийн газарзүйн мэдээллийн систем (GIS, вектор SHP контур, хиймэл дагуулын зураг) дээр ажиллах чадвар, орон зайн сэтгэлгээг хөгжүүлэхэд оршино.
              </p>
              <p>
                <strong className="text-slate-900">1.3. Хамрах хүрээ:</strong> Улсын хэмжээний ЕБС-ийн сурагчид (9, 12-р анги, багийн ангилал) болон Газарзүйн багш нар цахим платформоор дамжуулан орон зай харгалзахгүйгээр оролцоно.
              </p>
            </div>
          </div>

          {/* Section 2: 4 Categories */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Users className="h-4 w-4 text-sky-600 shrink-0" />
              <span>ХОЁР. УРАЛДААНЫ 4 ҮНДСЭН АНГИЛАЛ БА АГУУЛГА</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sky-900">1. 9-р ангийн ангилал</span>
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                    70% Монгол · 30% Дэлхий
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Монгол орны 21 аймаг, сумд, Алтай, Хангай, Хэнтийн уулс, томоохон гол мөрөн, нуур, байгалийн бүс бүслүүр, дэлхийн тив ба улсууд.
                </p>
              </div>

              <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-indigo-900">2. 12-р ангийн ангилал</span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                    40% Монгол · 60% Дэлхий
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Дэлхийн улс орнууд, нийслэлүүд, стратегийн хоолой ба сувгууд (Суэц, Панама, Малакка), тектоник хавтан, эдийн засгийн газарзүй, томоохон орд газрууд.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900">3. Багшийн ангилал</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    50% Монгол · 50% Дэлхий & GIS
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  WGS84 солбицол ба координат тайлах, масштаб, өндөржилт, геоморфологи, уур амьсгалын бүс, орон зайн цогц шинжилгээ.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-black text-emerald-900">4. Багийн ангилал (3–5 сурагч)</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Хамтын тактик & Логик
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  3–5 гишүүнтэй багуудын хамтын өрсөлдөөн: маршрут төлөвлөх, контур таавар, “Аль нь буруу вэ?”, стратегийн сорилтууд.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: 9 Task Types */}
          <div className="space-y-3">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>ГУРАВ. ДААЛГАВРЫН БҮТЭЦ БА ИНТЕРАКТИВ 9 ТӨРӨЛ</span>
            </h3>
            <p className="text-xs text-slate-600">
              Даалгаврууд нь бодит вектор давхаргууд (*.shp / GeoJSON) дээр тулгуурлан дараах 9 төрлөөр явагдана:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              {[
                { num: '1', title: 'Контур таних (Талбай)', desc: 'Газрын зурагт тодруулсан аймаг, сум, нуур, бүсийг нэрлэх' },
                { num: '2', title: 'Цэгэн объект нэрлэх', desc: 'Улаан цэгээр тэмдэглэсэн оргил, хот, орд газрыг таних' },
                { num: '3', title: 'Шугаман объект таних', desc: 'Тодруулсан гол мөрөн, уулсын нуруу, хилийн шугамыг олох' },
                { num: '4', title: 'Хэлбэр (Силуэт) таах', desc: 'Суурь зураггүйгээр зөвхөн объектын геометр хэлбэрээр таних' },
                { num: '5', title: 'Газрын зурагт цэг тавих', desc: 'Өгөгдсөн объектыг контур зураг дээр дарж байршлыг заах' },
                { num: '6', title: 'Солбицол & Координат', desc: 'Өргөрөг, уртрагийн солбицлоор газарзүйн объектыг олох' },
                { num: '7', title: 'Хөрш зэргэлдээ объект', desc: 'Хил залган оршдог эсвэл хамгийн ойр орших объектыг олох' },
                { num: '8', title: 'Хэмжээ ба эрэмбэ', desc: 'Талбай, урт, өндөр эсвэл байршлаар нь харьцуулах' },
                { num: '9', title: '«Аль нь буруу вэ?»', desc: 'Өгөгдсөн 4 өгөгдлөөс газарзүйн хувьд бурууг нь илрүүлэх' },
              ].map((item) => (
                <div key={item.num} className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-slate-950 text-[10px] font-black shrink-0">
                      {item.num}
                    </span>
                    <span>{item.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-6.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 & 5: Registration & Scoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <ShieldCheck className="h-4 w-4 text-sky-600" />
                <span>ДӨРӨВ. БҮРТГЭЛ БА ЗОХИОН БАЙГУУЛАЛТ</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                <li>
                  <strong className="text-slate-900">Бүртгүүлэх:</strong> Оролцогч өөрийн овог нэр, аймаг/хот, сум/дүүрэг, сургууль, ангиллаа үнэн зөв бөглөж бүртгүүлнэ.
                </li>
                <li>
                  <strong className="text-slate-900">Дадлага хийх («Сорил» цэс):</strong> Бүртгэлтэй хэрэглэгчид уралдаан эхлэхээс өмнө «Сорил» цэсэнд давхарга болон 9 төрлөөр хязгааргүй дадлага хийнэ.
                </li>
                <li>
                  <strong className="text-slate-900">Уралдааны эрх:</strong> Албан ёсны «Уралдаан» цэс рүү зөвхөн Админ баталгаажуулсан оролцогчид товлосон цагт нэвтэрнэ.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>ТАВ. ДҮГНЭХ АРГАЧЛАЛ БА ЧАНСАА</span>
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                <li>
                  <strong className="text-slate-900">Хугацаа:</strong> Уралдаан: <strong>{describeRules(competitionSchedule)}</strong> өгөгдөнө.
                </li>
                <li>
                  <strong className="text-slate-900">Оноо тооцоолол:</strong> Суурь оноо × (1 + хурдны урамшуулал): хурдан зөв хариулсан нь өндөр оноо авна.
                </li>
                <li>
                  <strong className="text-slate-900">Чансаа эрэмбэлэх:</strong> Нийт оноо тэнцвэл зарцуулсан нийт хугацаагаар (бага хугацаа зарцуулсан нь дээрээ) эрэмбэлнэ.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 6: Awards & Certificates */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-emerald-200/70 pb-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>ЗУРГАА. ШАГНАЛ УРАМШУУЛАЛ БА ЦАХИМ БАТЛАМЖ</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Ангилал тус бүрийн шагналт байр:</span>
                </div>
                <p className="text-slate-600 pl-5">
                  4 ангилал тус бүрт I, II, III болон Тусгай байр шалгаруулж Өргөмжлөл, медаль, үнэ бүхий шагналаар шагнана.
                </p>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-amber-600" />
                  <span>Албан ёсны Цахим Батламж:</span>
                </div>
                <p className="text-slate-600 pl-5">
                  Оролцогч болон багийн гишүүн бүрт оноо, хувь, дахин давтагдашгүй дугаар бүхий хэвлэх боломжтой Цахим Батламж олгоно.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 shrink-0">
          <span className="text-xs text-slate-500">
            Та удирдамжийг Word (.doc) файлаар татаж авч сургууль, аймгийнхаа нэрийг нэмж засварлах боломжтой.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Word (.doc) татах</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PDF / Хэвлэх</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
