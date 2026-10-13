import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  Trophy,
  Zap,
  Sparkles,
  RotateCcw,
  Eye,
  CheckCircle2,
  ChevronRight,
  Share2,
  Check,
  Globe2,
  Mountain,
  Waves,
  Building2,
  Pickaxe,
  Clock,
  HelpCircle,
  Maximize2,
  Award,
  Flame,
  ArrowRight,
} from 'lucide-react';
import {
  GEOGUESSR_TARGETS,
  GeoGuessrTarget,
  calculateHaversineDistanceKm,
  calculateGeoGuessrScore,
} from '../data/geoGuessrData';
import { sound } from '../utils/audio';
import { useApp } from '../context/AppContext';

type RegionFilter = 'all' | 'mongolia' | 'world';
type SubCategoryFilter =
  | 'all'
  | 'nature_mountain'
  | 'lakes_rivers'
  | 'cities_history'
  | 'mining_industry'
  | 'world_wonders'
  | 'world_nature'
  | 'world_capitals';

interface RoundResult {
  roundNumber: number;
  target: GeoGuessrTarget;
  guessLat: number;
  guessLng: number;
  distanceKm: number;
  score: number;
  ratingBadge: string;
  ratingColor: string;
  timeSpentSec: number;
}

export const GeoGuessrQuiz: React.FC = () => {
  const { isMuted } = useApp();

  // Game Configuration State
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('mongolia');
  const [subCategoryFilter, setSubCategoryFilter] = useState<SubCategoryFilter>('all');
  const [gameMode, setGameMode] = useState<'match_5' | 'endless' | 'timed'>('match_5');

  // Active Game State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const totalRounds = 5;
  const [roundTargets, setRoundTargets] = useState<GeoGuessrTarget[]>([]);
  const [currentTargetIndex, setCurrentTargetIndex] = useState<number>(0);

  // In-Round Guessing State
  const [playerGuess, setPlayerGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [isRoundEvaluated, setIsRoundEvaluated] = useState<boolean>(false);
  const [currentRoundResult, setCurrentRoundResult] = useState<RoundResult | null>(null);
  const [roundHistory, setRoundHistory] = useState<RoundResult[]>([]);
  const [isGameFinished, setIsGameFinished] = useState<boolean>(false);

  // Clues & UI state
  const [showPhotoClue, setShowPhotoClue] = useState<boolean>(false);
  const [showTextClues, setShowTextClues] = useState<boolean>(false);
  const [basemapType, setBasemapType] = useState<'satellite' | 'topo' | 'clean'>('satellite');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const guessMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Summary Map Ref
  const summaryMapRef = useRef<HTMLDivElement>(null);
  const summaryMapInstanceRef = useRef<L.Map | null>(null);

  // Filter available targets
  const availableTargets = useMemo(() => {
    return GEOGUESSR_TARGETS.filter((t) => {
      if (regionFilter !== 'all' && t.regionCategory !== regionFilter) return false;
      if (subCategoryFilter !== 'all' && t.subCategory !== subCategoryFilter) return false;
      return true;
    });
  }, [regionFilter, subCategoryFilter]);

  const currentTarget: GeoGuessrTarget | undefined = roundTargets[currentTargetIndex];

  // Tile Layer URLs
  const basemapUrls = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: 'Esri Satellite',
      maxZoom: 18,
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attr: 'OpenTopoMap',
      maxZoom: 16,
    },
    clean: {
      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      attr: 'CartoDB Clean',
      maxZoom: 18,
    },
  };

  // Start a New Game Match
  const startNewGame = () => {
    const shuffled = [...availableTargets].sort(() => Math.random() - 0.5);
    const count = gameMode === 'match_5' ? Math.min(5, shuffled.length) : Math.min(10, shuffled.length);
    const chosen = shuffled.slice(0, count);

    setRoundTargets(chosen);
    setCurrentTargetIndex(0);
    setCurrentRound(1);
    setPlayerGuess(null);
    setIsRoundEvaluated(false);
    setCurrentRoundResult(null);
    setRoundHistory([]);
    setIsGameFinished(false);
    setShowPhotoClue(false);
    setShowTextClues(false);
    setTimeLeft(30);
    setIsPlaying(true);

    sound.playClick();
  };

  // Timer for Timed mode
  useEffect(() => {
    if (!isPlaying || isRoundEvaluated || isGameFinished || gameMode !== 'timed') return;

    if (timeLeft <= 0) {
      // Auto submit with default or current guess
      handleConfirmGuess();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, isRoundEvaluated, isGameFinished, timeLeft, gameMode]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial Center: Mongolia if region is mongolia, else global
    const initialCenter: [number, number] = regionFilter === 'mongolia' ? [46.86, 103.84] : [25.0, 15.0];
    const initialZoom = regionFilter === 'mongolia' ? 5 : 2;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    const initialTiles = L.tileLayer(basemapUrls[basemapType].url, {
      maxZoom: basemapUrls[basemapType].maxZoom,
    }).addTo(map);

    tileLayerRef.current = initialTiles;
    mapInstanceRef.current = map;

    // Click handler to drop guess pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isRoundEvaluated) return; // Cannot change after submit

      const { lat, lng } = e.latlng;
      setPlayerGuess({ lat, lng });

      // Update or create guess marker
      if (guessMarkerRef.current) {
        guessMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const guessIcon = L.divIcon({
          className: 'geoguessr-user-pin',
          html: `
            <div style="
              background: #0284c7;
              color: white;
              border: 3px solid white;
              border-radius: 9999px;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              font-size: 14px;
              transform: translate(-50%, -50%);
            ">
              📍
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([lat, lng], { icon: guessIcon }).addTo(map);
        guessMarkerRef.current = marker;
      }

      sound.playClick();
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isPlaying]);

  // Update basemap tiles when switched
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTiles = L.tileLayer(basemapUrls[basemapType].url, {
      maxZoom: basemapUrls[basemapType].maxZoom,
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [basemapType]);

  // Reset view for each new round
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentTarget) return;

    // Clear previous markers & polylines
    if (guessMarkerRef.current) {
      map.removeLayer(guessMarkerRef.current);
      guessMarkerRef.current = null;
    }
    if (targetMarkerRef.current) {
      map.removeLayer(targetMarkerRef.current);
      targetMarkerRef.current = null;
    }
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    setPlayerGuess(null);
    setIsRoundEvaluated(false);
    setCurrentRoundResult(null);
    setShowPhotoClue(false);
    setShowTextClues(false);
    setTimeLeft(30);

    // Re-center map based on category
    if (currentTarget.regionCategory === 'mongolia') {
      map.setView([46.86, 103.84], 5);
    } else {
      map.setView([25.0, 15.0], 2);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [currentTargetIndex, isPlaying]);

  // Handle Confirm Guess / Submit
  const handleConfirmGuess = () => {
    if (!currentTarget || !mapInstanceRef.current) return;

    // If no guess placed, use center of map as fallback
    const map = mapInstanceRef.current;
    const guess = playerGuess || {
      lat: map.getCenter().lat,
      lng: map.getCenter().lng,
    };

    const targetLat = currentTarget.lat;
    const targetLng = currentTarget.lng;

    // Calculate distance
    const distanceKm = calculateHaversineDistanceKm(guess.lat, guess.lng, targetLat, targetLng);
    const { score, ratingBadge, ratingColor } = calculateGeoGuessrScore(
      distanceKm,
      currentTarget.regionCategory
    );

    const result: RoundResult = {
      roundNumber: currentRound,
      target: currentTarget,
      guessLat: guess.lat,
      guessLng: guess.lng,
      distanceKm,
      score,
      ratingBadge,
      ratingColor,
      timeSpentSec: 30 - timeLeft,
    };

    setCurrentRoundResult(result);
    setRoundHistory((prev) => [...prev, result]);
    setIsRoundEvaluated(true);

    if (score >= 3500) {
      sound.playSuccess();
    } else {
      sound.playError();
    }

    // Render Target Marker 🎯
    const targetIcon = L.divIcon({
      className: 'geoguessr-target-pin',
      html: `
        <div style="
          background: #059669;
          color: white;
          border: 3px solid white;
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          gap: 4px;
          transform: translate(-50%, -50%);
        ">
          <span>🎯</span>
          <span>${currentTarget.name}</span>
        </div>
      `,
      iconSize: [0, 0],
    });

    const targetMarker = L.marker([targetLat, targetLng], { icon: targetIcon }).addTo(map);
    targetMarkerRef.current = targetMarker;

    // Draw animated connection flight line
    const flightPath = L.polyline(
      [
        [guess.lat, guess.lng],
        [targetLat, targetLng],
      ],
      {
        color: '#f59e0b',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 8',
      }
    ).addTo(map);

    polylineRef.current = flightPath;

    // Fit map bounds to show both guess and target
    const bounds = L.latLngBounds([[guess.lat, guess.lng], [targetLat, targetLng]]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
  };

  // Next Round / Finish Game
  const handleNextRound = () => {
    if (gameMode === 'match_5' && currentRound >= totalRounds) {
      setIsGameFinished(true);
      return;
    }

    if (currentTargetIndex + 1 < roundTargets.length) {
      setCurrentTargetIndex((prev) => prev + 1);
      setCurrentRound((prev) => prev + 1);
    } else {
      // In endless mode, pick new target
      const shuffled = [...availableTargets].sort(() => Math.random() - 0.5);
      setRoundTargets((prev) => [...prev, ...shuffled.slice(0, 5)]);
      setCurrentTargetIndex((prev) => prev + 1);
      setCurrentRound((prev) => prev + 1);
    }
  };

  // Total Score Calculation
  const totalScore = useMemo(() => {
    return roundHistory.reduce((sum, r) => sum + r.score, 0);
  }, [roundHistory]);

  const maxPossibleScore = (gameMode === 'match_5' ? totalRounds : roundHistory.length) * 5000;

  // Final Rank & Title
  const finalRank = useMemo(() => {
    const ratio = totalScore / (maxPossibleScore || 25000);
    if (ratio >= 0.92) return { title: '👑 Газарзүйн Их Магистр (Grandmaster)', badge: 'bg-amber-500 text-slate-950', desc: 'Монгол ба дэлхийн газарзүйг төгс эзэмшсэн шилдэг шинжээч!' };
    if (ratio >= 0.80) return { title: '🥇 Алтан Шинжээч (Gold Explorer)', badge: 'bg-amber-100 text-amber-900 border border-amber-300', desc: 'Маш нарийн мэдрэмж, өндөр орон зайн сэтгэлгээтэй!' };
    if (ratio >= 0.60) return { title: '🥈 Мөнгөн Аялагч (Silver Navigator)', badge: 'bg-slate-200 text-slate-800 border border-slate-300', desc: 'Газарзүйн суурь мэдлэг маш сайн байна!' };
    if (ratio >= 0.40) return { title: '🥉 Хүрэл Жуулчин (Bronze Scout)', badge: 'bg-amber-800 text-white', desc: 'Дахин давтаж оноогоо ахиулах боломжтой!' };
    return { title: '🌱 Газарзүйн Суралцагч (Apprentice)', badge: 'bg-slate-100 text-slate-700', desc: 'Газрын зургаа сайтар судалж дахин оролдоно уу!' };
  }, [totalScore, maxPossibleScore]);

  // Share score text
  const handleShareResult = () => {
    const emojiMap = roundHistory.map((r) => (r.score >= 4500 ? '🎯' : r.score >= 3500 ? '🔥' : r.score >= 2000 ? '👌' : '💨')).join('');
    const text = `🗺️ GeoGuessr Map Quiz: ${totalScore.toLocaleString()} / ${maxPossibleScore.toLocaleString()} оноо!\nҮр дүн: ${emojiMap}\nЦол: ${finalRank.title}\n"Газрын зургийг хэн сайн мэдэх вэ." интерактив уралдаан`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  // Render Summary Map after game finishes
  useEffect(() => {
    if (!isGameFinished || !summaryMapRef.current || summaryMapInstanceRef.current) return;

    const map = L.map(summaryMapRef.current, {
      center: regionFilter === 'mongolia' ? [46.86, 103.84] : [25.0, 15.0],
      zoom: regionFilter === 'mongolia' ? 5 : 2,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer(basemapUrls[basemapType].url, {
      maxZoom: basemapUrls[basemapType].maxZoom,
    }).addTo(map);

    summaryMapInstanceRef.current = map;

    const allBounds = L.latLngBounds([]);

    // Draw all round paths
    roundHistory.forEach((r, idx) => {
      const colors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const roundColor = colors[idx % colors.length];

      // User pin
      L.marker([r.guessLat, r.guessLng], {
        icon: L.divIcon({
          className: 'summary-user-pin',
          html: `<div style="background:${roundColor};color:white;border:2px solid white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${idx + 1}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(map);

      // Target pin
      L.marker([r.target.lat, r.target.lng], {
        icon: L.divIcon({
          className: 'summary-target-pin',
          html: `<div style="background:#059669;color:white;border:2px solid white;border-radius:9999px;padding:2px 6px;font-size:10px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">🎯 ${r.target.name}</div>`,
          iconSize: [0, 0],
        }),
      }).addTo(map);

      // Polyline
      L.polyline(
        [
          [r.guessLat, r.guessLng],
          [r.target.lat, r.target.lng],
        ],
        {
          color: roundColor,
          weight: 2.5,
          dashArray: '5, 5',
        }
      ).addTo(map);

      allBounds.extend([r.guessLat, r.guessLng]);
      allBounds.extend([r.target.lat, r.target.lng]);
    });

    if (allBounds.isValid()) {
      map.fitBounds(allBounds, { padding: [40, 40] });
    }

    return () => {
      map.remove();
      summaryMapInstanceRef.current = null;
    };
  }, [isGameFinished]);

  return (
    <div className="space-y-5">
      {/* 1. Header & Mode Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold shadow-xs">
              🎯
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span>GeoGuessr Map Quiz</span>
                <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 text-[10px] font-bold">
                  Interactive
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Газрын зураг дээр шууд цэг тавьж (Pin Drop) зай, байршлыг нарийн таах сорилт
              </p>
            </div>
          </div>
        </div>

        {/* Global Action / Stats */}
        <div className="flex items-center gap-2">
          {isPlaying && !isGameFinished && (
            <div className="flex items-center gap-3">
              {/* Score pill */}
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-xs shadow-2xs font-bold text-amber-950">
                <Trophy className="h-4 w-4 text-amber-600" />
                <span>Оноо:</span>
                <span className="font-mono text-sm">{totalScore.toLocaleString()}</span>
              </div>

              {/* Reset Game button */}
              <button
                onClick={startNewGame}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs text-slate-700 font-semibold cursor-pointer shadow-2xs"
                title="Шинээр эхлэх"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Дахин эхлэх</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. LOBBY SCREEN (Before Game Starts) */}
      {!isPlaying && (
        <div className="space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
            <div className="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
              <Compass className="h-72 w-72 text-amber-400" />
            </div>

            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-xs border border-white/10">
                <Flame className="h-3.5 w-3.5 text-amber-400" />
                <span>GeoGuessr Style · Бодит Координатын Тааварт Тоглоом</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Газарзүйн байршлыг метрийн нарийвчлалтай тааж, 25,000 оноо цуглуулаарай!
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Танд өгөгдсөн уул нурууд, үзэсгэлэнт нуур мөрөн, түүхт хотууд болон дэлхийн гайхамшгуудын байршлыг интерактив газрын зураг дээр товшин 📍 зүү зоож таана. Байршилд ойртох тусам дээд 5,000 оноог авна!
              </p>

              {/* Quick Feature Tags */}
              <div className="flex flex-wrap gap-2 pt-2 text-xs">
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-sky-200 border border-white/10">
                  🗺️ Метрийн нарийвчлалтай километр тооцоолол
                </span>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-emerald-200 border border-white/10">
                  🛰️ Хиймэл дагуул & Физик рельеф зураглал
                </span>
                <span className="rounded-lg bg-white/10 px-2.5 py-1 text-amber-200 border border-white/10">
                  📸 Гэрэл зургийн болон түүхэн сэжүүрүүд
                </span>
              </div>
            </div>
          </div>

          {/* Mode Configuration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category 1: Region */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Globe2 className="h-4 w-4 text-sky-600" />
                <span>1. Бүс нутаг сонгох</span>
              </span>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setRegionFilter('mongolia');
                    setSubCategoryFilter('all');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    regionFilter === 'mongolia'
                      ? 'border-amber-500 bg-amber-50/50 shadow-xs font-bold text-slate-950'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🇲🇳</span>
                    <div>
                      <div className="text-xs font-bold">Монгол орны газарзүй</div>
                      <div className="text-[11px] text-slate-500 font-normal">Уулс, нуурууд, хотууд, уурхай</div>
                    </div>
                  </div>
                  {regionFilter === 'mongolia' && <CheckCircle2 className="h-4 w-4 text-amber-600" />}
                </button>

                <button
                  onClick={() => {
                    setRegionFilter('world');
                    setSubCategoryFilter('all');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    regionFilter === 'world'
                      ? 'border-sky-500 bg-sky-50/50 shadow-xs font-bold text-slate-950'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🌍</span>
                    <div>
                      <div className="text-xs font-bold">Дэлхийн газарзүй</div>
                      <div className="text-[11px] text-slate-500 font-normal">Дэлхийн гайхамшиг, нийслэл хотууд</div>
                    </div>
                  </div>
                  {regionFilter === 'world' && <CheckCircle2 className="h-4 w-4 text-sky-600" />}
                </button>
              </div>
            </div>

            {/* Category 2: Topic Subcategory */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>2. Сэдэв & Төрөл</span>
              </span>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  onClick={() => setSubCategoryFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    subCategoryFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>✨ Бүх сэдэв холимог</span>
                  <span className="text-[10px] font-mono">{availableTargets.length} обьект</span>
                </button>

                {regionFilter === 'mongolia' ? (
                  <>
                    <button
                      onClick={() => setSubCategoryFilter('nature_mountain')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        subCategoryFilter === 'nature_mountain'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Mountain className="h-3.5 w-3.5 text-amber-700" /> Уул нурууд & Байгаль
                      </span>
                    </button>

                    <button
                      onClick={() => setSubCategoryFilter('lakes_rivers')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        subCategoryFilter === 'lakes_rivers'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Waves className="h-3.5 w-3.5 text-sky-600" /> Нуур, гол мөрөн
                      </span>
                    </button>

                    <button
                      onClick={() => setSubCategoryFilter('cities_history')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        subCategoryFilter === 'cities_history'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-emerald-600" /> Хотууд & Түүхт газар
                      </span>
                    </button>

                    <button
                      onClick={() => setSubCategoryFilter('mining_industry')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        subCategoryFilter === 'mining_industry'
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Pickaxe className="h-3.5 w-3.5 text-orange-600" /> Уурхай, бүтээн байгуулалт
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSubCategoryFilter('world_wonders')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        subCategoryFilter === 'world_wonders'
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-amber-500" /> Дэлхийн алдарт гайхамшиг
                      </span>
                    </button>

                    <button
                      onClick={() => setSubCategoryFilter('world_nature')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        subCategoryFilter === 'world_nature'
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Mountain className="h-3.5 w-3.5 text-emerald-600" /> Байгалийн содон тогтоц
                      </span>
                    </button>

                    <button
                      onClick={() => setSubCategoryFilter('world_capitals')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        subCategoryFilter === 'world_capitals'
                          ? 'bg-sky-600 text-white font-bold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-indigo-600" /> Нийслэл хотууд
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Category 3: Game Format */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>3. Тоглолтын горим</span>
              </span>

              <div className="space-y-2">
                <button
                  onClick={() => setGameMode('match_5')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    gameMode === 'match_5'
                      ? 'border-emerald-500 bg-emerald-50/50 font-bold text-slate-950'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">🏆 Стандарт 5 Үе (25,000 оноо)</div>
                    <div className="text-[10px] text-slate-500">GeoGuessr албан ёсны форматын тэмцээн</div>
                  </div>
                  {gameMode === 'match_5' && <Check className="h-4 w-4 text-emerald-600" />}
                </button>

                <button
                  onClick={() => setGameMode('timed')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    gameMode === 'timed'
                      ? 'border-amber-500 bg-amber-50/50 font-bold text-slate-950'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">⏱️ Цагтай сорил (30 секунд)</div>
                    <div className="text-[10px] text-slate-500">Хурдан сэтгэх цагийн хязгаартай горим</div>
                  </div>
                  {gameMode === 'timed' && <Check className="h-4 w-4 text-amber-600" />}
                </button>

                <button
                  onClick={() => setGameMode('endless')}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    gameMode === 'endless'
                      ? 'border-sky-500 bg-sky-50/50 font-bold text-slate-950'
                      : 'border-slate-200 text-slate-700 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">♾️ Төгсгөлгүй дасгал</div>
                    <div className="text-[10px] text-slate-500">Хязгааргүй тоглож дадлагажих</div>
                  </div>
                  {gameMode === 'endless' && <Check className="h-4 w-4 text-sky-600" />}
                </button>
              </div>
            </div>
          </div>

          {/* Large Start Play Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={startNewGame}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-8 py-4 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Compass className="h-6 w-6" />
              <span>GeoGuessr Quiz Эхлүүлэх</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. ACTIVE GAMEPLAY ARENA */}
      {isPlaying && !isGameFinished && currentTarget && (
        <div className="space-y-4">
          {/* Top Quest Bar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Target Location Prompt */}
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black text-lg shadow-xs">
                  📍
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Үе {currentRound} / {gameMode === 'match_5' ? totalRounds : '∞'}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      {currentTarget.elevationOrMetric}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 mt-0.5">
                    "{currentTarget.name}" хаана байрладаг вэ?
                  </h2>
                  <p className="text-xs text-slate-600">
                    {currentTarget.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Tools & Clues */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {gameMode === 'timed' && !isRoundEvaluated && (
                  <div className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold font-mono ${
                    timeLeft <= 5 ? 'bg-rose-100 text-rose-700 animate-ping' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{timeLeft} сек</span>
                  </div>
                )}

                {/* Photo Clue Toggle */}
                {currentTarget.photoUrl && (
                  <button
                    onClick={() => setShowPhotoClue(!showPhotoClue)}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                      showPhotoClue
                        ? 'border-sky-500 bg-sky-50 text-sky-700 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5 text-sky-600" />
                    <span>{showPhotoClue ? 'Зураг нуух' : '📸 Зургийн сэжүүр'}</span>
                  </button>
                )}

                {/* Text Clues Toggle */}
                <button
                  onClick={() => setShowTextClues(!showTextClues)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-colors cursor-pointer ${
                    showTextClues
                      ? 'border-amber-500 bg-amber-50 text-amber-800 font-bold'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>{showTextClues ? 'Сэжүүр нуух' : '💡 Сэжүүр харах'}</span>
                </button>
              </div>
            </div>

            {/* Expandable Clues Area */}
            {(showPhotoClue || showTextClues) && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-100 text-xs animate-in fade-in">
                {showPhotoClue && currentTarget.photoUrl && (
                  <div className="sm:col-span-5 relative rounded-xl overflow-hidden border border-slate-200 shadow-inner h-44">
                    <img
                      src={currentTarget.photoUrl}
                      alt={currentTarget.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white">
                      Бодит байгалийн зураг
                    </div>
                  </div>
                )}

                {showTextClues && (
                  <div className={`${showPhotoClue ? 'sm:col-span-7' : 'sm:col-span-12'} space-y-1.5 rounded-xl bg-amber-50/60 p-3 border border-amber-200/70 text-amber-950`}>
                    <span className="font-bold text-xs flex items-center gap-1">
                      💡 Газарзүйн сэжүүрүүд:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1 text-[11px]">
                      {currentTarget.clues.map((clue, idx) => (
                        <li key={idx}>{clue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Map Area */}
          <div className="relative rounded-3xl border border-slate-300 overflow-hidden shadow-lg bg-slate-900 h-[480px] sm:h-[560px]">
            <div ref={mapContainerRef} className="h-full w-full" />

            {/* Top Basemap Switcher */}
            <div className="absolute top-3 left-3 z-400 flex rounded-xl bg-white/95 border border-slate-300 p-1 text-xs font-bold shadow-md backdrop-blur-xs">
              <button
                onClick={() => setBasemapType('satellite')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  basemapType === 'satellite'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                🛰️ Хиймэл дагуул
              </button>
              <button
                onClick={() => setBasemapType('topo')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  basemapType === 'topo'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                🏔️ Физик рельеф
              </button>
              <button
                onClick={() => setBasemapType('clean')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  basemapType === 'clean'
                    ? 'bg-sky-600 text-white font-black'
                    : 'text-slate-700 hover:text-slate-950'
                }`}
              >
                📐 Вектор тойм
              </button>
            </div>

            {/* Floating Guess Guidance / Action Button on Map */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-400 flex flex-col items-center gap-2">
              {!isRoundEvaluated ? (
                <button
                  onClick={handleConfirmGuess}
                  disabled={!playerGuess}
                  className={`flex items-center gap-2 rounded-2xl px-8 py-3.5 font-black text-sm sm:text-base shadow-2xl transition-all transform cursor-pointer ${
                    playerGuess
                      ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 hover:scale-105 animate-pulse'
                      : 'bg-slate-800/90 text-slate-400 border border-white/20 cursor-not-allowed backdrop-blur-md'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                  <span>
                    {playerGuess ? 'ТААХ БАЙРШЛЫГ БАТАТГАХ (GUESS)' : 'Газрын зураг дээр товшиж цэг сонгоно уу'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleNextRound}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3.5 text-sm sm:text-base shadow-2xl transition-all transform hover:scale-105 cursor-pointer"
                >
                  <span>
                    {gameMode === 'match_5' && currentRound >= totalRounds
                      ? 'Үр дүнгийн хуудас харах'
                      : 'Дараагийн үе рүү шилжих'}
                  </span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Round Evaluation Card (Appears after submit) */}
          {isRoundEvaluated && currentRoundResult && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${currentRoundResult.ratingColor}`}>
                    {currentRoundResult.ratingBadge}
                  </span>
                  <div>
                    <span className="text-xs text-slate-500">Зайны алдаа:</span>
                    <span className="text-sm font-black text-slate-900 font-mono ml-1.5">
                      {currentRoundResult.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} км
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Авсан оноо:</span>
                  <span className="text-xl font-black text-emerald-600 font-mono">
                    +{currentRoundResult.score.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 5,000</span>
                </div>
              </div>

              {/* Geographic Fun Fact & Explanation */}
              <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>Газарзүйн мэдээлэл & Сонирхолтой баримт:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {currentRoundResult.target.funFact}
                </p>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1 font-mono">
                  <span>📍 Солбицол: {currentRoundResult.target.lat.toFixed(4)}°N, {currentRoundResult.target.lng.toFixed(4)}°E</span>
                  <span>📏 Хэмжээс: {currentRoundResult.target.elevationOrMetric}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. FINAL RESULTS & SUMMARY SCREEN (After 5 Rounds) */}
      {isGameFinished && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main Score Hero */}
          <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-emerald-500/10 p-6 sm:p-8 text-center space-y-4 shadow-md">
            <div className="inline-flex items-center justify-center p-3 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <Trophy className="h-8 w-8" />
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Нийт тоглолтын үр дүн
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-mono mt-1">
                {totalScore.toLocaleString()} <span className="text-lg sm:text-xl text-slate-500 font-normal">/ {maxPossibleScore.toLocaleString()}</span>
              </h2>
            </div>

            {/* Rank badge */}
            <div className="inline-block">
              <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-black shadow-xs ${finalRank.badge}`}>
                {finalRank.title}
              </span>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                {finalRank.desc}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={startNewGame}
                className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 text-xs shadow-md transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Дахин тоглох</span>
              </button>

              <button
                onClick={handleShareResult}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold px-5 py-2.5 text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="h-4 w-4 text-sky-600" />
                <span>{copiedShare ? 'Хуулагдлаа! ✓' : 'Үр дүнг хуулах'}</span>
              </button>
            </div>
          </div>

          {/* 5-Round All Guess Paths Summary Map */}
          <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-md bg-slate-900 space-y-2">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-white">
              <span className="font-bold flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-400" />
                <span>Бүх үеийн тааварт зүү зоолтын тойм зураг:</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                5 үеийн замнал
              </span>
            </div>
            <div ref={summaryMapRef} className="h-[360px] sm:h-[420px] w-full" />
          </div>

          {/* Rounds Breakdown Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Үе тус бүрийн нарийвчилсан дүн:
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {roundHistory.map((r, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 font-mono font-bold text-slate-700 text-[11px]">
                      #{r.roundNumber}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{r.target.name}</div>
                      <div className="text-[11px] text-slate-500">{r.target.subtitle}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="font-mono text-slate-600 font-medium">
                        {r.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} км алдаа
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {r.timeSpentSec} секундэд
                      </div>
                    </div>

                    <div className="text-right min-w-[70px]">
                      <div className="font-mono font-black text-emerald-600 text-sm">
                        +{r.score.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
