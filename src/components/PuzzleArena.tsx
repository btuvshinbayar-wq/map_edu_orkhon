import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Puzzle,
  Compass,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
  Layers,
  Lock,
  Eye,
  UserCheck,
  AlertCircle,
  Flag,
  Send,
  X,
} from 'lucide-react';
import { Question, QuestionIssueReport } from '../types';
import { sound } from '../utils/audio';
import { useApp } from '../context/AppContext';
import { ShpContourViewer } from './ShpContourViewer';
import { InteractiveMapPinQuestion } from './InteractiveMapPinQuestion';
import { RealLeafletMap, BasemapType } from './RealLeafletMap';
import {
  getActiveLayerFeatures,
  extractFeatureName,
} from '../utils/gisUtils';
import {
  GIS_AUTO_TASK_TYPE_LABELS,
  GisAutoTaskType,
  detectQuestionGisTaskType,
} from '../utils/gisAutoQuestionGenerator';

type ChallengeViewMode = 'isolated_contour' | 'interactive_layer_map';

interface PuzzleArenaProps {
  onOpenAuth?: () => void;
}

export const PuzzleArena: React.FC<PuzzleArenaProps> = ({ onOpenAuth }) => {
  const {
    gisLayers,
    customQuestions,
    recordTaskAttempt,
    currentUser,
    submitQuestionReport,
  } = useApp();

  // Filter layer selector: 'all' or specific layerName
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<string>('all');
  // Filter by 9 Task Types: 'all' or specific GisAutoTaskType
  const [selectedTaskTypeFilter, setSelectedTaskTypeFilter] = useState<'all' | GisAutoTaskType>('all');
  // Challenge mode: 1) Isolated SHP contour with masked name & DBF attributes, 2) Full layer interactive map with hidden names
  const [challengeMode, setChallengeMode] = useState<ChallengeViewMode>('isolated_contour');
  const [basemap, setBasemap] = useState<BasemapType>('satellite');

  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Report Issue ("Алдаа мэдээлэх") modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportIssueType, setReportIssueType] =
    useState<QuestionIssueReport['issueType']>('wrong_answer');
  const [reportSuggestedAnswer, setReportSuggestedAnswer] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportToast, setReportToast] = useState<string | null>(null);

  // Helper to get the layer name associated with an admin-prepared question
  const getQuestionLayerName = (q: Question): string => {
    if (q.shpContourData?.layerName) return q.shpContourData.layerName;
    if (q.mapPinData?.subCategory) return q.mapPinData.subCategory;
    return '';
  };

  // Strictly only layers that actually have Admin-prepared questions in customQuestions!
  // Layers with 0 prepared questions are NEVER shown in Сорил.
  const layersWithQuestions = useMemo(() => {
    const map = new Map<
      string,
      { layerName: string; count: number; color: string; layerObj?: (typeof gisLayers)[0] }
    >();

    customQuestions.forEach((q) => {
      const lName = getQuestionLayerName(q);
      if (!lName) return;
      const existing = map.get(lName);
      if (existing) {
        existing.count += 1;
      } else {
        const matchedLayer = gisLayers.find(
          (l) => l.name.trim().toLowerCase() === lName.trim().toLowerCase()
        );
        map.set(lName, {
          layerName: lName,
          count: 1,
          color: matchedLayer?.color || '#0284c7',
          layerObj: matchedLayer,
        });
      }
    });

    return Array.from(map.values());
  }, [customQuestions, gisLayers]);

  // If selectedLayerFilter no longer has questions, reset to 'all'
  useEffect(() => {
    if (
      selectedLayerFilter !== 'all' &&
      !layersWithQuestions.some((l) => l.layerName === selectedLayerFilter)
    ) {
      setSelectedLayerFilter('all');
    }
  }, [selectedLayerFilter, layersWithQuestions]);

  // Questions filtered by selected layer (before task type filter) so we can show counts per task type
  const layerFilteredQuestions = useMemo<Question[]>(() => {
    if (selectedLayerFilter === 'all') {
      return customQuestions;
    }
    return customQuestions.filter((q) => getQuestionLayerName(q) === selectedLayerFilter);
  }, [customQuestions, selectedLayerFilter]);

  // Task type counts within the currently selected layer (or all layers)
  const taskTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    GIS_AUTO_TASK_TYPE_LABELS.forEach((t) => {
      counts[t.id] = 0;
    });
    layerFilteredQuestions.forEach((q) => {
      const tType = detectQuestionGisTaskType(q);
      counts[tType] = (counts[tType] || 0) + 1;
    });
    return counts;
  }, [layerFilteredQuestions]);

  // Build questions strictly from Admin's prepared customQuestions filtered by Layer AND Task Type
  const poolQuestions = useMemo<Question[]>(() => {
    if (selectedTaskTypeFilter === 'all') {
      return layerFilteredQuestions;
    }
    return layerFilteredQuestions.filter(
      (q) => detectQuestionGisTaskType(q) === selectedTaskTypeFilter
    );
  }, [layerFilteredQuestions, selectedTaskTypeFilter]);

  useEffect(() => {
    setSelectedQuestionIdx(0);
    setIsAnswered(false);
    setSelectedAnswer(null);
  }, [selectedLayerFilter, selectedTaskTypeFilter, challengeMode]);

  const currentQ: Question | undefined =
    poolQuestions.length > 0
      ? poolQuestions[selectedQuestionIdx % poolQuestions.length]
      : undefined;

  // Find the layer that corresponds to currentQ for interactive_layer_map mode
  const currentActiveLayer = useMemo(() => {
    const qLayerName = currentQ ? getQuestionLayerName(currentQ) : '';
    if (qLayerName) {
      return gisLayers.find(
        (l) => l.name.trim().toLowerCase() === qLayerName.trim().toLowerCase()
      );
    }
    if (selectedLayerFilter !== 'all') {
      return gisLayers.find(
        (l) => l.name.trim().toLowerCase() === selectedLayerFilter.trim().toLowerCase()
      );
    }
    return undefined;
  }, [gisLayers, selectedLayerFilter, currentQ]);

  const handleSelectAnswer = (ansIdOrText: string, correctCheck: boolean) => {
    if (isAnswered) return;
    setSelectedAnswer(ansIdOrText);
    setIsAnswered(true);
    setIsCorrect(correctCheck);

    if (currentQ) {
      const lName =
        currentQ.shpContourData?.layerName ||
        currentActiveLayer?.name ||
        'Вектор давхарга';
      const geom =
        currentQ.shpContourData?.geometryType ||
        currentActiveLayer?.geometryType ||
        'Polygon';
      recordTaskAttempt({
        objectName: currentQ.targetName,
        layerName: lName,
        geometryType: geom,
        isCorrect: correctCheck,
      });
    }

    if (correctCheck) {
      sound.playSuccess();
      setScore((prev) => prev + (currentQ?.points || 15) + streak * 2);
      setStreak((prev) => prev + 1);
    } else {
      sound.playError();
      setStreak(0);
    }
  };

  // When user clicks directly on a feature on the nameless interactive map in Сорил
  const handleMapFeatureClick = (properties: any) => {
    if (isAnswered || !currentQ) return;
    const clickedName = extractFeatureName(
      properties,
      0,
      currentActiveLayer?.nameField
    );
    const target = (currentQ.targetName || '').trim();
    const right = clickedName.trim().toLowerCase() === target.toLowerCase();
    handleSelectAnswer(clickedName, right);
  };

  const handleNext = () => {
    if (poolQuestions.length === 0) return;
    setIsAnswered(false);
    setSelectedAnswer(null);
    setSelectedQuestionIdx((prev) => (prev + 1) % poolQuestions.length);
  };

  const hasChallengeAccess =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.mapAndChallengeAccess !== false);

  if (!currentUser || !hasChallengeAccess) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-xs max-w-2xl mx-auto text-center space-y-5 my-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">
            {!currentUser
              ? 'Сорил ашиглахын тулд сайтад бүртгүүлнэ үү'
              : 'Газрын зураг, сорил ашиглах эрх хаалттай байна'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {!currentUser
              ? 'Сайтад бүртгүүлснээр газрын зураг болон интерактив сорилыг ашиглах эрх шууд нээгдэнэ.'
              : 'Админ таны "Газрын зураг, сорил ашиглах эрх"-ийг түр хаасан байна. Шалгалтын комисс эсвэл багш-админд хандаж эрхээ нээлгэнэ үү.'}
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
              <span>Сайтад бүртгүүлэх / Нэвтрэх</span>
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

  const handleOpenReportModal = () => {
    if (!currentQ) return;
    setReportIssueType('wrong_answer');
    setReportSuggestedAnswer('');
    setReportDescription('');
    setIsReportModalOpen(true);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQ || !currentUser) return;
    if (!reportSuggestedAnswer.trim() && !reportDescription.trim()) return;

    const layerName =
      currentQ.shpContourData?.layerName ||
      currentActiveLayer?.name ||
      'Газрын зургийн давхарга';

    const res = await submitQuestionReport({
      questionId: currentQ.id,
      questionTitle: currentQ.title,
      layerName,
      currentTargetName: currentQ.targetName,
      currentOptions: currentQ.options?.map((o) => o.text),
      reporterUserId: currentUser.id,
      reporterName: currentUser.fullName,
      reporterSchool: currentUser.school,
      reporterGrade: currentUser.grade,
      reporterContact: currentUser.phone || currentUser.email,
      issueType: reportIssueType,
      suggestedCorrectAnswer: reportSuggestedAnswer.trim(),
      description: reportDescription.trim(),
    });

    setIsReportModalOpen(false);
    setReportToast(res.message);
    setTimeout(() => setReportToast(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Report Success Toast */}
      {reportToast && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-950 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{reportToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setReportToast(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Puzzle className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Сорил (Админы вектор зураг дээрх даалгавар)
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Админы оруулсан зурагнаас сонгосон (эсвэл бүх) обьектуудын нэрийг нууцлан контур болон газрын зураг дээр таах сорил
          </p>
        </div>

        {/* Stats Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-slate-500">Оноо:</span>
            <span className="font-bold text-slate-900 font-mono">{score}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs shadow-xs">
            <Zap className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-slate-500">Цуврал:</span>
            <span className="font-bold text-sky-700 font-mono">{streak}x</span>
          </div>
        </div>
      </div>

      {/* Filter Bar: 1. Choose Layer (ONLY layers that have Admin-prepared questions) & Challenge View Mode */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Layer Filter Pills (Strictly only layers with >0 questions) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-sky-600" />
              1. Давхарга сонгох:
            </span>

            <button
              type="button"
              onClick={() => setSelectedLayerFilter('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                selectedLayerFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Бүх даалгавартай давхарга ({customQuestions.length})
            </button>

            {layersWithQuestions.map((grp) => {
              const isSel = selectedLayerFilter === grp.layerName;
              return (
                <button
                  key={grp.layerName}
                  type="button"
                  onClick={() => setSelectedLayerFilter(grp.layerName)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                    isSel
                      ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: isSel ? '#ffffff' : grp.color }}
                  />
                  <span>{grp.layerName}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                      isSel ? 'bg-sky-700 text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    {grp.count}
                  </span>
                </button>
              );
            })}

            {layersWithQuestions.length === 0 && (
              <span className="text-xs text-slate-400 italic">
                (Одоогоор админ даалгавар бэлтгэсэн давхарга алга байна)
              </span>
            )}
          </div>

          {/* Mode Switcher: Isolated Contour vs Full Map with Hidden Names */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setChallengeMode('isolated_contour')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                challengeMode === 'isolated_contour'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>1. Таслан авсан контураар таах</span>
            </button>

            <button
              type="button"
              onClick={() => setChallengeMode('interactive_layer_map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                challengeMode === 'interactive_layer_map'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-sky-600" />
              <span>2. Нэргүй газрын зураг дээр олох</span>
            </button>
          </div>
        </div>

        {/* 2. Choose from the 9 Task Types */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
              <Puzzle className="h-3.5 w-3.5 text-emerald-600" />
              2. Даалгаврын 9 төрлөөс сонгох:
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Идэвхтэй даалгавар: <b className="text-slate-900">{poolQuestions.length}</b>
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedTaskTypeFilter('all')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                selectedTaskTypeFilter === 'all'
                  ? 'bg-slate-900 text-white font-bold border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Бүх төрөл ({layerFilteredQuestions.length})
            </button>

            {GIS_AUTO_TASK_TYPE_LABELS.map((t) => {
              const count = taskTypeCounts[t.id] || 0;
              const isSel = selectedTaskTypeFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTaskTypeFilter(isSel ? 'all' : t.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer border ${
                    isSel
                      ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-2xs'
                      : count > 0
                      ? 'bg-white text-slate-800 border-slate-200 hover:bg-emerald-50 font-semibold'
                      : 'bg-slate-50/70 text-slate-400 border-slate-200/70 hover:bg-slate-100'
                  }`}
                  title={t.shortDesc}
                >
                  <span>{t.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-mono ${
                      isSel
                        ? 'bg-emerald-700 text-white'
                        : count > 0
                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Challenge Stage */}
      {currentQ ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas: Isolated Contour OR Nameless Vector Layer Map */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  <Lock className="h-3 w-3" />
                  Обьектийн нэр нууцлагдсан
                </span>
                {currentQ.shpContourData?.layerName && (
                  <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                    Давхарга: {currentQ.shpContourData.layerName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenReportModal}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800 transition-colors shadow-2xs cursor-pointer"
                  title="Энэхүү сорил, даалгавар дээр алдаа байвал админд мэдэгдэж засуулах хүсэлт илгээх"
                >
                  <Flag className="h-3 w-3 text-rose-600" />
                  <span>Алдаа мэдээлэх</span>
                </button>
                <span className="text-xs text-slate-500 font-mono">
                  {(selectedQuestionIdx % poolQuestions.length) + 1} / {poolQuestions.length} обьект
                </span>
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {challengeMode === 'interactive_layer_map'
                ? `🎯 Газрын зураг дээрх нэр нь нууцлагдсан обьектуудаас "${currentQ.targetName}"-ийг олж товшино уу (эсвэл баруун талаас сонгоно уу)`
                : currentQ.title}
            </h3>

            {currentQ.type === 'interactive_map_pin' || currentQ.mapPinData ? (
              <InteractiveMapPinQuestion
                question={currentQ}
                hasAnswered={isAnswered}
                onAnswer={(ok, distKm) => {
                  handleSelectAnswer(`${distKm.toFixed(1)} км зайд цэг тавьсан`, ok);
                }}
              />
            ) : challengeMode === 'isolated_contour' && currentQ.shpContourData ? (
              <ShpContourViewer
                geojson={currentQ.shpContourData.geojson}
                geometryType={currentQ.shpContourData.geometryType}
                maskedProperties={currentQ.shpContourData.maskedProperties}
                realProperties={currentQ.shpContourData.realProperties}
                targetName={currentQ.shpContourData.targetName}
                hasAnswered={isAnswered}
                isCorrect={isCorrect}
                categoryLabel={currentQ.shpContourData.categoryLabel}
                hints={currentQ.shpContourData.hints}
              />
            ) : (
              <div className="space-y-2">
                {(() => {
                  const boundaryLayer = gisLayers.find((l) => {
                    const n = String(l.name || '').toLowerCase().trim();
                    const id = String(l.id || '').toLowerCase().trim();
                    return (
                      n === 'country_boundary' ||
                      n.includes('country_boundary') ||
                      id.includes('country_boundary') ||
                      n.includes('улсын хил')
                    );
                  });
                  const layersForChallenge: typeof gisLayers = [];
                  if (boundaryLayer && boundaryLayer.id !== currentActiveLayer?.id) {
                    layersForChallenge.push({
                      ...boundaryLayer,
                      visible: true,
                      fillOpacity: 0,
                      weight: Math.max(2, boundaryLayer.weight || 2.5),
                    });
                  }
                  if (currentActiveLayer) {
                    layersForChallenge.push({ ...currentActiveLayer, visible: true });
                  }
                  return (
                    <RealLeafletMap
                      tileType={basemap}
                      onTileTypeChange={setBasemap}
                      vectorLayers={layersForChallenge}
                      hideLabels={!isAnswered}
                      onFeatureSelect={handleMapFeatureClick}
                      mapHeightClass="h-[460px]"
                    />
                  );
                })()}
                <p className="text-[11px] text-slate-500">
                  🔒 Сорилын горимд газрын зураг дээрх обьектуудын нэр нууцлагдсан байгаа. Та хариулснаар жинхэнэ нэрс ил болно.
                </p>
              </div>
            )}

            {/* Feedback & Explanation Box */}
            {isAnswered && (
              <div
                className={`rounded-xl border p-4 text-xs space-y-2 transition-all ${
                  isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-sm">
                  <div className="flex items-center gap-1.5">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Зөв таалаа! (+{currentQ.points || 15} оноо)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-rose-600" />
                        <span>Буруу хариуллаа! (Таны сонгосон: {selectedAnswer})</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleNext}
                    className="rounded-lg bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-xs cursor-pointer"
                  >
                    Дараагийн обьект →
                  </button>
                </div>
                <p className="text-slate-700 pt-1 leading-relaxed">
                  <span className="font-semibold text-slate-900">Жинхэнэ нэр: </span>
                  <span className="text-emerald-800 font-bold">{currentQ.targetName}</span>
                  <br />
                  {currentQ.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Interactive Options Deck */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Хариултын хувилбарууд:
                </h4>
                <span className="text-[11px] font-semibold text-amber-700">
                  +{currentQ.points || 15} оноо
                </span>
              </div>

              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="space-y-2">
                  {currentQ.options.map((opt, idx) => {
                    const isPicked = selectedAnswer === opt.id || selectedAnswer === opt.text;
                    let btnClass =
                      'border-slate-200 bg-white text-slate-800 hover:border-sky-400 hover:bg-sky-50/40';
                    if (isAnswered) {
                      if (opt.isCorrect)
                        btnClass =
                          'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold shadow-2xs';
                      else if (isPicked && !opt.isCorrect)
                        btnClass = 'border-rose-500 bg-rose-50 text-rose-900';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isAnswered}
                        onClick={() => handleSelectAnswer(opt.text, opt.isCorrect)}
                        className={`w-full text-left rounded-xl border p-3 text-xs transition-all flex items-center gap-2.5 cursor-pointer ${btnClass}`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                            isAnswered && opt.isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-950 space-y-1.5">
                  <div className="font-bold text-amber-900">📍 Газрын зурагт цэг байрлуулах даалгавар</div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    Зүүн талын интерактив газрын зураг дээр хулганаар товшин цэг тавьж, «Байршлыг баталгаажуулах» товчийг дарж хариулна уу.
                  </p>
                </div>
              )}

              {/* Next Button */}
              {isAnswered && (
                <button
                  onClick={handleNext}
                  className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm mt-3 cursor-pointer"
                >
                  Дараагийн сорил руу очих →
                </button>
              )}
            </div>

            {/* Quick Skip & Report Error Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {!isAnswered && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Дараагийн обьект</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenReportModal}
                className={`${
                  isAnswered ? 'sm:col-span-2' : ''
                } w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-100 py-2.5 px-3 text-xs font-bold text-rose-800 transition-colors shadow-xs cursor-pointer`}
              >
                <Flag className="h-3.5 w-3.5 text-rose-600" />
                <span>⚠️ Алдаа мэдээлэх (Засуулах)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
          <p className="text-sm font-bold text-slate-800">
            Одоогоор сорилын даалгаврын сан хоосон байна.
          </p>
          <p className="text-xs text-slate-500">
            Админ удирдлагын самбарын «Шалгалтын асуултын сан» эсвэл «Даалгавар Бэлтгэгч» цэснээс даалгавруудыг гараас болон вектор зурагнаас оруулна уу.
          </p>
        </div>
      )}

      {/* Modal: "Алдаа мэдээлэх" (Report Question Error to Admin) */}
      {isReportModalOpen && currentQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-rose-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 text-xs text-slate-800">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shrink-0">
                  <Flag className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Даалгавар, сорилын алдаа мэдээлэх
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Алдаатай даалгаврыг Админд мэдэгдэж зөв хувилбараар засуулах хүсэлт илгээх
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Question Context Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span>
                  Давхарга:{' '}
                  <b className="text-slate-800">
                    {currentQ.shpContourData?.layerName || currentActiveLayer?.name || 'Газрын зураг'}
                  </b>
                </span>
                <span>
                  Илгээгч: <b className="text-slate-800">{currentUser?.fullName}</b>
                </span>
              </div>
              <div className="font-bold text-slate-900 text-xs">{currentQ.title}</div>
              {currentQ.options && currentQ.options.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[10px] text-slate-500 mr-1">Одоогийн сонголтууд:</span>
                  {currentQ.options.map((o, i) => (
                    <span
                      key={i}
                      className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700"
                    >
                      {String.fromCharCode(65 + i)}. {o.text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Ямар төрлийн алдаа илэрсэн бэ? *
                </label>
                <select
                  value={reportIssueType}
                  onChange={(e) => setReportIssueType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800 focus:border-rose-500 focus:outline-none"
                >
                  <option value="wrong_answer">Зөв хариулт нь буруу тохируулагдсан байна</option>
                  <option value="wrong_name">Обьектийн нэр эсвэл талбай/урт буруу байна</option>
                  <option value="wrong_shape">Газрын зургийн контур / байршил зөрүүтэй байна</option>
                  <option value="typo_or_options">Асуултын найруулга эсвэл сонголтууд дээр үсгийн алдаа байна</option>
                  <option value="other">Бусад шалтгаан</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Зөв хувилбар / Зөв хариулт нь юу байх ёстой вэ? *
                </label>
                <input
                  type="text"
                  required
                  value={reportSuggestedAnswer}
                  onChange={(e) => setReportSuggestedAnswer(e.target.value)}
                  placeholder="Жишээ нь: Хөвсгөл нуур (эсвэл зөв урт, талбай, нэрийг бичнэ үү)..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none"
                />
                {currentQ.options && currentQ.options.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-500">Сонголтоос шууд дарж оруулах:</span>
                    {currentQ.options.map((opt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReportSuggestedAnswer(opt.text)}
                        className="rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-900 cursor-pointer"
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Тайлбар / Яагаад алдаатай гэж үзэж байгаа тухай тэмдэглэл:
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Админд зориулж алдааны тайлбар болон хэрхэн засах саналаа дэлгэрэнгүй бичнэ үү..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-4 py-2 font-bold text-slate-700 cursor-pointer"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 font-bold text-white shadow-sm transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Админд засуулах хүсэлт илгээх</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
