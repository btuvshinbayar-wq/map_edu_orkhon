import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Compass,
  Trophy,
  Zap,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronRight,
  Flame,
  Award,
  Layers,
  Clock,
  Play,
  Share2,
  Globe2,
  MapPin,
  Info,
  Check,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ALL_MAP_TOPICS,
  MapGameTopic,
  MapTargetItem,
  MONGOLIA_AIMAGS_TOPIC,
} from '../data/ilike2learnData';
import { sound } from '../utils/audio';
import { detectBestNameField, extractFeatureName } from '../utils/gisUtils';

type GameMode = 'locate' | 'speed' | 'identify' | 'explore';

export const Ilike2learnMapGame: React.FC = () => {
  const { currentUser, saveAttempt, gisLayers } = useApp();

  // Selected Topic
  const [selectedTopicId, setSelectedTopicId] = useState<string>('mn_aimags');
  const [gameMode, setGameMode] = useState<GameMode>('locate');

  // Custom Layer Topic integration if user selects a GIS layer
  const activeTopic: MapGameTopic = useMemo(() => {
    // If selected is custom layer ID
    const foundCustom = gisLayers.find((l) => l.id === selectedTopicId);
    if (foundCustom && foundCustom.geojson?.features) {
      const features = foundCustom.geojson.features;
      const bestCol = detectBestNameField(features);
      const items: MapTargetItem[] = features.map((f: any, idx: number) => {
        const p = f.properties || {};
        const name = extractFeatureName(p, idx, bestCol);
        const center = p.CENTER || p.CAPITAL || p.TYPE || '';
        return {
          id: String(p.id || p.ID || idx),
          name: String(name),
          nameEn: String(p.NAME_EN || name),
          subtitle: String(center),
          hint: `${name} нь энэ давхаргын ${idx + 1}-р обьект юм.`,
          category: 'custom',
          geojsonFeature: f,
          facts: Object.entries(p)
            .filter(([k]) => !k.startsWith('_'))
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`),
        };
      });

      return {
        id: foundCustom.id,
        title: foundCustom.name,
        subtitle: `Админы оруулсан ${items.length} обьекттой бодит вектор давхарга`,
        icon: '📁',
        category: 'custom',
        description: 'Энэхүү SHP/GeoJSON давхаргын бүх обьектуудыг нэг бүрчлэн таньж олох интерактив тоглоом.',
        totalItems: items.length,
        viewBox: '0 0 1000 550',
        aspectRatio: '16/9',
        items,
      };
    }

    const preset = ALL_MAP_TOPICS.find((t) => t.id === selectedTopicId);
    return preset || MONGOLIA_AIMAGS_TOPIC;
  }, [selectedTopicId, gisLayers]);

  // Game Play State
  const [isGameActive, setIsGameActive] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Target Queue
  const [remainingItems, setRemainingItems] = useState<MapTargetItem[]>([]);
  const [currentTarget, setCurrentTarget] = useState<MapTargetItem | null>(null);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());

  // Feedback State
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [flashWrongId, setFlashWrongId] = useState<string | null>(null);
  const [flashCorrectId, setFlashCorrectId] = useState<string | null>(null);
  const [highlightTargetHint, setHighlightTargetHint] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Selected item for practice exploration mode
  const [inspectedItem, setInspectedItem] = useState<MapTargetItem | null>(null);

  // Multiple Choice for 'identify' mode
  const [identifyChoices, setIdentifyChoices] = useState<MapTargetItem[]>([]);

  // Scores & Counters
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [currentMistakesOnTarget, setCurrentMistakesOnTarget] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [speedTimeLeft, setSpeedTimeLeft] = useState(60);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Sound pronunciation helper
  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'mn-MN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore if speech not supported
    }
  };

  // Start / Restart Game
  const startNewGame = (topic = activeTopic, mode = gameMode) => {
    const shuffled = [...topic.items].sort(() => 0.5 - Math.random());
    const firstTarget = shuffled[0] || null;

    setRemainingItems(shuffled);
    setCurrentTarget(firstTarget);
    setDiscoveredIds(new Set());
    setHoveredItemId(null);
    setFlashWrongId(null);
    setFlashCorrectId(null);
    setHighlightTargetHint(false);
    setFeedbackMessage(null);
    setInspectedItem(null);

    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setMistakesCount(0);
    setCurrentMistakesOnTarget(0);
    setTotalAttempts(0);
    setTimerSeconds(0);
    setSpeedTimeLeft(60);

    setIsGameActive(true);
    setIsGameOver(false);

    if (mode === 'identify' && firstTarget) {
      generateIdentifyChoices(firstTarget, topic.items);
    }

    if (firstTarget && mode !== 'explore') {
      speakText(firstTarget.name);
    }
  };

  // Generate 4 options for identify mode
  const generateIdentifyChoices = (target: MapTargetItem, allItems: MapTargetItem[]) => {
    const distractors = allItems.filter((i) => i.id !== target.id).sort(() => 0.5 - Math.random()).slice(0, 3);
    const choices = [target, ...distractors].sort(() => 0.5 - Math.random());
    setIdentifyChoices(choices);
  };

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isGameActive && !isGameOver) {
      if (gameMode === 'speed') {
        interval = setInterval(() => {
          setSpeedTimeLeft((prev) => {
            if (prev <= 1) {
              handleGameOver();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        interval = setInterval(() => {
          setTimerSeconds((prev) => prev + 1);
        }, 1000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGameActive, isGameOver, gameMode]);

  // Handle Game Over
  const handleGameOver = () => {
    setIsGameOver(true);
    setIsGameActive(false);
    sound.playSuccess();

    // Calculate score & save attempt
    if (currentUser) {
      const accuracy = totalAttempts > 0 ? Math.round(((totalAttempts - mistakesCount) / totalAttempts) * 100) : 100;
      const finalScore = score + discoveredIds.size * 10;
      const maxPts = activeTopic.totalItems * 20;
      saveAttempt({
        userId: currentUser.id,
        studentName: currentUser.fullName,
        studentCode: currentUser.studentCode,
        grade: currentUser.grade,
        school: currentUser.school,
        aimag: currentUser.aimag,
        startedAt: new Date(Date.now() - timerSeconds * 1000).toISOString(),
        completedAt: new Date().toISOString(),
        totalScore: finalScore,
        maxScore: maxPts,
        percentage: Math.max(0, Math.min(100, accuracy)),
        mongoliaScore: finalScore,
        mongoliaMaxScore: maxPts,
        mongoliaCount: activeTopic.totalItems,
        worldScore: 0,
        worldMaxScore: 0,
        worldCount: 0,
        answers: [],
      });
    }
  };

  // Handle Item Click (Map polygon or option button)
  const handleItemClick = (clickedItem: MapTargetItem) => {
    if (gameMode === 'explore') {
      // Practice exploration mode
      setInspectedItem(clickedItem);
      speakText(clickedItem.name);
      sound.playClick();
      return;
    }

    if (!isGameActive || isGameOver || !currentTarget) return;

    setTotalAttempts((prev) => prev + 1);

    // Is it correct?
    if (clickedItem.id === currentTarget.id) {
      // CORRECT!
      sound.playSuccess();
      setFlashCorrectId(clickedItem.id);
      setTimeout(() => setFlashCorrectId(null), 700);

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) setBestStreak(newStreak);

      const basePoints = currentMistakesOnTarget === 0 ? 100 : currentMistakesOnTarget === 1 ? 50 : 25;
      const streakBonus = (newStreak - 1) * 15;
      setScore((prev) => prev + basePoints + streakBonus);

      // Add to discovered
      const newDiscovered = new Set(discoveredIds);
      newDiscovered.add(clickedItem.id);
      setDiscoveredIds(newDiscovered);

      setFeedbackMessage(`Зөв! 🎉 Та ${clickedItem.name}-ийг амжилттай оллоо.`);
      setCurrentMistakesOnTarget(0);
      setHighlightTargetHint(false);

      // Advance to next target
      const nextRemaining = remainingItems.filter((i) => i.id !== currentTarget.id);
      setRemainingItems(nextRemaining);

      if (nextRemaining.length === 0) {
        // All items completed!
        setTimeout(() => {
          handleGameOver();
        }, 800);
      } else {
        const nextTarget = nextRemaining[0];
        setCurrentTarget(nextTarget);

        if (gameMode === 'identify') {
          generateIdentifyChoices(nextTarget, activeTopic.items);
        }

        setTimeout(() => {
          speakText(nextTarget.name);
        }, 500);
      }
    } else {
      // WRONG!
      sound.playError();
      setFlashWrongId(clickedItem.id);
      setTimeout(() => setFlashWrongId(null), 600);

      setStreak(0);
      setMistakesCount((prev) => prev + 1);
      setCurrentMistakesOnTarget((prev) => prev + 1);

      setFeedbackMessage(
        `Энэ бол "${clickedItem.name}". Та "${currentTarget.name}"-ийг олох ёстой!`
      );
    }
  };

  // Show Hint / Flash Target Area
  const handleShowHint = () => {
    if (!currentTarget) return;
    setHighlightTargetHint(true);
    sound.playClick();
    setTimeout(() => {
      setHighlightTargetHint(false);
    }, 2500);
  };

  // Accuracy %
  const accuracyPercent = useMemo(() => {
    if (totalAttempts === 0) return 100;
    const acc = Math.round(((totalAttempts - mistakesCount) / totalAttempts) * 100);
    return Math.max(0, Math.min(100, acc));
  }, [totalAttempts, mistakesCount]);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 p-6 shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 font-black text-xl shadow-md">
                🎮
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                  ilike2learn Интерактив Газрын Зураг Тоглоом
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                    Сонгодог тоглоом
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Монгол орны 21 аймаг, хот суурин, уулс, дэлхийн тивүүд болон админы оруулсан бүх вектор давхаргыг газрын зураг дээр зааж олох интерактив сорил.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                voiceEnabled
                  ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-xs'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
              title={voiceEnabled ? 'Дуут дуудлага асаалттай' : 'Дуут дуудлага хаалттай'}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>{voiceEnabled ? 'Дуудлага: Асаалттай' : 'Дуу хаалттай'}</span>
            </button>

            <button
              onClick={() => startNewGame()}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-all cursor-pointer hover:scale-105"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Шинээр эхлэх</span>
            </button>
          </div>
        </div>

        {/* Topic Selector Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Сэдэв:
          </span>

          {ALL_MAP_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setSelectedTopicId(topic.id);
                startNewGame(topic);
              }}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedTopicId === topic.id
                  ? 'bg-slate-900 text-white shadow-md ring-2 ring-amber-500/50'
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
              }`}
            >
              <span className="text-sm">{topic.icon}</span>
              <span>{topic.title}</span>
              <span
                className={`rounded-md px-1.5 py-0.2 text-[10px] font-mono ${
                  selectedTopicId === topic.id ? 'bg-slate-800 text-amber-300' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {topic.totalItems}
              </span>
            </button>
          ))}

          {/* Admin / Custom GIS layers */}
          {gisLayers.length > 0 && (
            <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 pl-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Вектор/SHP:</span>
              {gisLayers.map((layer) => (
                <button
                  key={layer.id}
                  onClick={() => {
                    setSelectedTopicId(layer.id);
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedTopicId === layer.id
                      ? 'bg-emerald-700 text-white shadow-md'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{layer.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Горим:
          </span>
          <button
            onClick={() => {
              setGameMode('locate');
              startNewGame(activeTopic, 'locate');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              gameMode === 'locate'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white/70 hover:bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>🎯 Олж дар! (Сонгодог)</span>
          </button>

          <button
            onClick={() => {
              setGameMode('speed');
              startNewGame(activeTopic, 'speed');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              gameMode === 'speed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white/70 hover:bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>⚡ 60-сек Спринт</span>
          </button>

          <button
            onClick={() => {
              setGameMode('identify');
              startNewGame(activeTopic, 'identify');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              gameMode === 'identify'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white/70 hover:bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>❓ Тэмдэглэснийг таах</span>
          </button>

          <button
            onClick={() => {
              setGameMode('explore');
              startNewGame(activeTopic, 'explore');
            }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-bold transition-all cursor-pointer ${
              gameMode === 'explore'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white/70 hover:bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>📖 Чөлөөт дадлага & Судлах</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Game Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Map Interactive Board */}
        <div className="lg:col-span-3 space-y-4">
          {/* Target Prompt Box (ilike2learn trademark header) */}
          <div className="rounded-2xl border-2 border-amber-400/90 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-2xl shadow-md">
                  {gameMode === 'explore' ? '🔍' : '🎯'}
                </div>

                <div>
                  <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    {gameMode === 'locate' && 'Дарна уу / Газрын зураг дээрээс олно уу:'}
                    {gameMode === 'speed' && 'Хамгийн хурднаар олж дарна уу:'}
                    {gameMode === 'identify' && 'Шар өнгөөр тэмдэглэгдсэн энэ ямар бүс вэ?'}
                    {gameMode === 'explore' && 'Газрын зураг дээр дурын аймаг/бүс дээр дарж мэдээллийг үзнэ үү'}
                  </div>

                  {gameMode !== 'explore' && currentTarget ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {currentTarget.name}
                      </span>
                      {currentTarget.subtitle && (
                        <span className="text-xs text-slate-500 font-medium">
                          ({currentTarget.subtitle})
                        </span>
                      )}
                      <button
                        onClick={() => speakText(currentTarget.name)}
                        className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
                        title="Дуудах"
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : gameMode === 'explore' ? (
                    <div className="text-base font-bold text-slate-800">
                      {inspectedItem ? inspectedItem.name : 'Газрын зураг дээрээс дурын обьектийг сонгоорой'}
                    </div>
                  ) : (
                    <div className="text-base font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>Баяр хүргэе! Бүх {activeTopic.totalItems} обьектийг амжилттай оллоо.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* In-Game Actions & Show Hint */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {gameMode !== 'explore' && currentTarget && (
                  <button
                    onClick={handleShowHint}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs"
                    title="Зөвлөгөө авах эсвэл хаана байгааг 2 секунд заалгах"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-700" />
                    <span>Зааж өгөх</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Feedback banner */}
            {feedbackMessage && (
              <div
                className={`mt-3 rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center gap-2 transition-all ${
                  feedbackMessage.includes('Зөв')
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300 animate-pulse'
                }`}
              >
                {feedbackMessage.includes('Зөв') ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMessage}</span>
              </div>
            )}
          </div>

          {/* Identify Mode 4-Options Choice Bar */}
          {gameMode === 'identify' && currentTarget && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-xs">
              <p className="text-xs font-bold text-indigo-900 mb-2.5 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-indigo-600" />
                Шар өнгөөр анивчиж буй бүсийг сонгоно уу:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {identifyChoices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleItemClick(choice)}
                    className="rounded-xl border border-indigo-200 bg-white hover:bg-indigo-600 hover:text-white p-3 text-xs font-bold text-slate-800 shadow-xs transition-all text-center cursor-pointer active:scale-95"
                  >
                    {choice.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Map Canvas Card */}
          <div className="relative rounded-3xl border border-slate-200 bg-slate-900/95 overflow-hidden shadow-xl p-3 sm:p-5">
            {/* Compass / Watermark */}
            <div className="absolute top-5 left-5 z-10 pointer-events-none flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-xs">
              <Compass className="h-4 w-4 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />
              <span className="font-bold tracking-wider">{activeTopic.title}</span>
            </div>

            {/* SVG Interactive Map Vector Layer */}
            <div className="w-full flex items-center justify-center min-h-[380px] sm:min-h-[460px] max-h-[560px]">
              <svg
                viewBox={activeTopic.viewBox}
                className="w-full h-full max-h-[540px] drop-shadow-2xl transition-all select-none"
                style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}
              >
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="correctGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="wrongGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                  <linearGradient id="targetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>

                <rect width="1000" height="600" fill="url(#grid)" />

                {/* Map Target Items (SVG Polygons / Paths) */}
                {activeTopic.items.map((item) => {
                  const isDiscovered = discoveredIds.has(item.id);
                  const isHovered = hoveredItemId === item.id;
                  const isWrongFlash = flashWrongId === item.id;
                  const isCorrectFlash = flashCorrectId === item.id;
                  const isIdentifyTarget = gameMode === 'identify' && currentTarget?.id === item.id;
                  const isHintTarget = highlightTargetHint && currentTarget?.id === item.id;
                  const isInspected = inspectedItem?.id === item.id;

                  // Fill color logic
                  let fillColor = '#1e293b'; // Slate 800 default unrevealed
                  let strokeColor = '#475569';
                  let strokeWidth = 1.5;

                  if (isDiscovered) {
                    fillColor = '#10b981'; // Emerald discovered
                    strokeColor = '#34d399';
                    strokeWidth = 2;
                  } else if (isCorrectFlash) {
                    fillColor = 'url(#correctGrad)';
                    strokeColor = '#a7f3d0';
                    strokeWidth = 3;
                  } else if (isWrongFlash) {
                    fillColor = 'url(#wrongGrad)';
                    strokeColor = '#fda4af';
                    strokeWidth = 3;
                  } else if (isIdentifyTarget || isHintTarget) {
                    fillColor = 'url(#targetGrad)';
                    strokeColor = '#fef08a';
                    strokeWidth = 3;
                  } else if (isInspected) {
                    fillColor = '#38bdf8';
                    strokeColor = '#e0f2fe';
                    strokeWidth = 2.5;
                  } else if (isHovered) {
                    fillColor = '#334155'; // Hover slate
                    strokeColor = '#f59e0b'; // Amber border
                    strokeWidth = 2;
                  }

                  return (
                    <g
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                      className="cursor-pointer transition-all duration-200"
                    >
                      {/* Polygon Path */}
                      {item.svgPath ? (
                        <path
                          d={item.svgPath}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          className={`transition-all duration-300 ${
                            isIdentifyTarget || isHintTarget ? 'animate-pulse' : ''
                          }`}
                        />
                      ) : item.centerCoords ? (
                        <circle
                          cx={item.centerCoords.x}
                          cy={item.centerCoords.y}
                          r={28}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                        />
                      ) : null}

                      {/* Display Label ONLY IF DISCOVERED or in EXPLORE MODE or ON HOVER (Avoid leaking during quiz) */}
                      {(isDiscovered || isHovered || gameMode === 'explore') && item.centerCoords && (
                        <g pointerEvents="none">
                          <text
                            x={item.centerCoords.x}
                            y={item.centerCoords.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#ffffff"
                            fontSize="11"
                            fontWeight="bold"
                            className="select-none font-sans drop-shadow-md"
                            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}
                          >
                            {isDiscovered || gameMode === 'explore'
                              ? item.name.replace(' аймаг', '').replace(' хот', '')
                              : isHovered
                              ? '?'
                              : ''}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom In-Map Bar */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300 border-t border-slate-800 pt-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <span>Ногоон: Олсон ({discoveredIds.size}/{activeTopic.totalItems})</span>
                <span className="text-slate-600">|</span>
                <span className="flex h-2.5 w-2.5 rounded-full bg-slate-700"></span>
                <span>Бараан: Хараахан олоогүй ({activeTopic.totalItems - discoveredIds.size})</span>
              </div>

              <div className="flex items-center gap-3 font-mono">
                {gameMode === 'speed' ? (
                  <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                    <Clock className="h-4 w-4" />
                    Үлдсэн хугацаа: {speedTimeLeft} сек
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-4 w-4" />
                    Хугацаа: {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Stats & Item Browser */}
        <div className="space-y-4">
          {/* Live Score & Streak Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Тоглоомын Үзүүлэлт
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                <Trophy className="h-3 w-3" />
                Нийт: {activeTopic.totalItems}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Оноо</div>
                <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{score}</div>
              </div>

              <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
                <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  Цуврал
                </div>
                <div className="text-2xl font-black text-amber-900 font-mono mt-0.5">
                  {streak}
                  <span className="text-xs font-normal text-amber-600 ml-1">
                    (Дээд: {bestStreak})
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                <div className="text-[11px] text-emerald-700 font-medium">Оновч</div>
                <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                  {accuracyPercent}%
                </div>
              </div>

              <div className="rounded-xl bg-sky-50 p-3 border border-sky-100">
                <div className="text-[11px] text-sky-700 font-medium">Олсон</div>
                <div className="text-xl font-black text-sky-900 font-mono mt-0.5">
                  {discoveredIds.size} / {activeTopic.totalItems}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Явц:</span>
                <span className="font-bold text-slate-800">
                  {Math.round((discoveredIds.size / activeTopic.totalItems) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(discoveredIds.size / activeTopic.totalItems) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Inspected Item / Discovery Info Card */}
          {inspectedItem ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <h4 className="font-bold text-sky-950 text-sm">{inspectedItem.name}</h4>
                </div>
                <button
                  onClick={() => speakText(inspectedItem.name)}
                  className="p-1 rounded-md hover:bg-sky-200 text-sky-800"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              {inspectedItem.subtitle && (
                <p className="text-xs text-sky-800 font-semibold">{inspectedItem.subtitle}</p>
              )}

              {inspectedItem.facts && inspectedItem.facts.length > 0 && (
                <ul className="space-y-1.5 text-xs text-sky-900">
                  {inspectedItem.facts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-sky-500 shrink-0">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            /* Items List (Click to learn or review) */
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 max-h-[380px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  {activeTopic.title} ({activeTopic.items.length})
                </span>
                <span className="text-[10px] text-slate-400">Нэрс</span>
              </div>

              <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 scrollbar-thin">
                {activeTopic.items.map((item) => {
                  const isDone = discoveredIds.has(item.id);
                  const isCurrent = currentTarget?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : isCurrent
                          ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300 ring-1 ring-amber-400'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : isCurrent ? (
                          <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0 animate-ping"></span>
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0"></span>
                        )}
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.center && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {item.center}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Game Over Victory Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-amber-300 bg-white p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-scale-up">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-4xl shadow-lg">
              🏆
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Баяр хүргэе! Тоглоом дууслаа
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Та "{activeTopic.title}" сэдвийн бүх байршлыг амжилттай давлаа!
              </p>
            </div>

            {/* Score Badges */}
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Нийт оноо</div>
                <div className="text-xl font-black text-amber-600 font-mono mt-0.5">{score}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Оновч</div>
                <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">{accuracyPercent}%</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Дээд цуврал</div>
                <div className="text-xl font-black text-sky-600 font-mono mt-0.5">{bestStreak} 🔥</div>
              </div>
            </div>

            {/* Result Tier */}
            <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 border border-amber-200 font-medium">
              {accuracyPercent >= 90
                ? '🌟 Газарзүйн Мастер зэрэг хүртлээ! Гайхалтай мэдлэгтэй байна.'
                : accuracyPercent >= 70
                ? '👍 Маш сайн тоглолоо! Цаашид улам сайжруулаарай.'
                : '💪 Дахин дасгалжиж 100% оноо аваарай!'}
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => startNewGame()}
                className="flex-1 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white py-3 text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Дахин тоглох</span>
              </button>

              <button
                onClick={() => setIsGameOver(false)}
                className="rounded-2xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 text-xs font-semibold transition-all cursor-pointer"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
