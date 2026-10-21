import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Compass,
  CheckCircle2,
  XCircle,
  Sparkles,
  Eye,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { Question } from '../types';
import { calculateHaversineDistanceKm } from '../utils/geo';
import { resolveCountryBoundaryGeoJson } from '../data/sampleGisLayers';
import { useApp } from '../context/AppContext';

interface InteractiveMapPinQuestionProps {
  question: Question;
  hasAnswered: boolean;
  onAnswer: (isCorrect: boolean, distanceKm: number, guessLat: number, guessLng: number) => void;
}

const fmtCoord = (lat: number, lng: number) =>
  `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}`;

/** Тавьсан цэг: яг товшсон цэгийг (голд) заасан хөндлөн тэмдэг + солбицол. Хуучин 26px-ийн хар дугуй цэгийг халхалдаг байсан */
const crosshairIcon = (lat: number, lng: number) =>
  L.divIcon({
    className: 'pin-crosshair-marker',
    iconSize: [44, 44],
    iconAnchor: [22, 22], // тэмдгийн төв нь яг товшсон цэг дээр
    html: `
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <g stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none">
          <circle cx="22" cy="22" r="12"/><path d="M22 3v11M22 30v11M3 22h11M30 22h11"/>
        </g>
        <g stroke="#0284c7" stroke-width="2" stroke-linecap="round" fill="rgba(2,132,199,0.14)">
          <circle cx="22" cy="22" r="12"/><path d="M22 3v11M22 30v11M3 22h11M30 22h11" fill="none"/>
        </g>
        <circle cx="22" cy="22" r="3.2" fill="#dc2626" stroke="#fff" stroke-width="1.6"/>
      </svg>
      <div class="pin-label" data-testid="pin-label">${fmtCoord(lat, lng)}</div>`,
  });

export const InteractiveMapPinQuestion: React.FC<InteractiveMapPinQuestionProps> = ({
  question,
  hasAnswered,
  onAnswer,
}) => {
  const { gisLayers } = useApp();
  const countryBoundaryGeoJson = React.useMemo(
    () => resolveCountryBoundaryGeoJson(gisLayers),
    [gisLayers]
  );
  const pinData = question.mapPinData;

  const targetLat = pinData?.targetLat ?? (question.category === 'mongolia' ? 47.9188 : 48.8584);
  const targetLng = pinData?.targetLng ?? (question.category === 'mongolia' ? 106.9176 : 2.2945);
  const targetName = pinData?.targetName || question.targetName || 'Байршил';
  const allowedDistanceKm = pinData?.allowedDistanceKm || (question.category === 'mongolia' ? 55 : 160);

  const [playerGuess, setPlayerGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [hover, setHover] = useState<{ lat: number; lng: number } | null>(null);
  // click handler нь газрын зургийг үүсгэх үед нэг л удаа холбогддог тул хамгийн сүүлийн төлвийг ref-ээр уншина
  const hasAnsweredRef = useRef(hasAnswered);
  hasAnsweredRef.current = hasAnswered;
  const lastMoveRef = useRef(0);
  const [evaluatedDistanceKm, setEvaluatedDistanceKm] = useState<number | null>(null);
  const [isWithinAllowed, setIsWithinAllowed] = useState<boolean | null>(null);

  const [showPhotoClue, setShowPhotoClue] = useState<boolean>(false);
  const [showTextClues, setShowTextClues] = useState<boolean>(false);
  const [basemapType, setBasemapType] = useState<'satellite' | 'clean' | 'dark'>('satellite');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const guessMarkerRef = useRef<L.Marker | null>(null);
  const targetMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const countryBoundaryLayerRef = useRef<L.GeoJSON | null>(null);

  // All basemaps are 100% label-free; Contour map ('clean') uses a plain white background with no external tiles
  const basemapUrls = {
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      maxZoom: 18,
    },
    clean: {
      url: '',
      maxZoom: 18,
    },
    dark: {
      url: '',
      maxZoom: 18,
    },
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Шинэ даалгавар: өмнөх даалгаврын цэг, зай, тэмдэглэгээг ЦЭВЭРЛЭНЭ.
    // (Өмнө нь өмнөх газрын зургийн устсан marker-ийг дахин хэрэглэдэг байсан тул 2-р даалгавраас цэг харагдахгүй,
    //  мөн өмнөх даалгаврын таамаг шинэ даалгаварт тооцогддог байсан)
    guessMarkerRef.current = null;
    targetMarkerRef.current = null;
    polylineRef.current = null;
    setPlayerGuess(null);
    setEvaluatedDistanceKm(null);
    setIsWithinAllowed(null);
    setHover(null);

    const initialCenter: [number, number] =
      question.category === 'mongolia' ? [46.86, 103.84] : [30.0, 20.0];
    const initialZoom = question.category === 'mongolia' ? 5 : 2;

    const canvasRenderer = L.canvas({ padding: 0.5 });
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
      preferCanvas: true,
      renderer: canvasRenderer,
    });

    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    if (basemapUrls[basemapType].url) {
      const tiles = L.tileLayer(basemapUrls[basemapType].url, {
        maxZoom: basemapUrls[basemapType].maxZoom,
      }).addTo(map);
      tileLayerRef.current = tiles;
    } else {
      tileLayerRef.current = null;
    }

    // Render country_boundary (Улсын хилийн шугам) layer for spatial orientation
    if (countryBoundaryGeoJson) {
      const bLayer = L.geoJSON(countryBoundaryGeoJson as any, {
        interactive: false,
        style: () => ({
          color: basemapType === 'clean' ? '#0f172a' : '#fbbf24',
          weight: 2.2,
          opacity: 0.9,
          fillColor: 'transparent',
          fillOpacity: 0,
        }),
      }).addTo(map);
      countryBoundaryLayerRef.current = bLayer;
    }

    mapInstanceRef.current = map;

    // Курсор: цэг тавих горимд хөндлөн дүрстэй (crosshair)
    if (!hasAnsweredRef.current) map.getContainer().classList.add('pin-crosshair');

    // Хулгана хөдлөх бүрт курсорын яг солбицолыг харуулна (60 мс тутамд)
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (hasAnsweredRef.current) return;
      const now = Date.now();
      if (now - lastMoveRef.current < 60) return;
      lastMoveRef.current = now;
      setHover({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    map.on('mouseout', () => setHover(null));

    // Газрын зураг дээр товшиж цэг тавина (дахин товшвол цэг шилжинэ)
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (hasAnsweredRef.current) return;

      const { lat, lng } = e.latlng;
      setPlayerGuess({ lat, lng });

      if (guessMarkerRef.current) {
        guessMarkerRef.current.setLatLng([lat, lng]);
        guessMarkerRef.current.setIcon(crosshairIcon(lat, lng));
      } else {
        guessMarkerRef.current = L.marker([lat, lng], { icon: crosshairIcon(lat, lng), interactive: false, keyboard: false }).addTo(map);
      }
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      guessMarkerRef.current = null;
      targetMarkerRef.current = null;
      polylineRef.current = null;
    };
  }, [question.id]);

  // Update Basemap Tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (basemapUrls[basemapType].url) {
      const newTiles = L.tileLayer(basemapUrls[basemapType].url, {
        maxZoom: basemapUrls[basemapType].maxZoom,
      }).addTo(map);
      newTiles.bringToBack();
      tileLayerRef.current = newTiles;
    }

    // Refresh country_boundary layer style on basemap or layer change
    if (countryBoundaryLayerRef.current) {
      map.removeLayer(countryBoundaryLayerRef.current);
      countryBoundaryLayerRef.current = null;
    }
    if (countryBoundaryGeoJson) {
      const bLayer = L.geoJSON(countryBoundaryGeoJson as any, {
        interactive: false,
        style: () => ({
          color: basemapType === 'clean' ? '#0f172a' : '#fbbf24',
          weight: 2.2,
          opacity: 0.9,
          fillColor: 'transparent',
          fillOpacity: 0,
        }),
      }).addTo(map);
      countryBoundaryLayerRef.current = bLayer;
    }
  }, [basemapType, countryBoundaryGeoJson]);

  // Handle Confirm Submission
  const handleConfirmPin = () => {
    if (hasAnswered || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const guess = playerGuess || {
      lat: map.getCenter().lat,
      lng: map.getCenter().lng,
    };

    const distKm = calculateHaversineDistanceKm(guess.lat, guess.lng, targetLat, targetLng);
    const isCorrect = distKm <= allowedDistanceKm;

    setEvaluatedDistanceKm(distKm);
    setIsWithinAllowed(isCorrect);

    map.getContainer().classList.remove('pin-crosshair');
    setHover(null);

    // Render True Location Pin 🎯
    const targetIcon = L.divIcon({
      className: 'competition-target-pin',
      html: `
        <div style="
          background: ${isCorrect ? '#059669' : '#dc2626'};
          color: white;
          border: 3px solid white;
          border-radius: 9999px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          gap: 3px;
          transform: translate(-50%, -160%);
        ">
          <span>${isCorrect ? '✅' : '🎯'}</span>
          <span>${targetName}</span>
        </div>
      `,
      iconSize: [0, 0],
    });

    // Бодит байршлыг яг заасан цэг (нэрийн шошго нь түүний дээр байрлана, цэгийг халхлахгүй)
    L.circleMarker([targetLat, targetLng], { radius: 6, color: '#fff', weight: 3, fillColor: isCorrect ? '#059669' : '#dc2626', fillOpacity: 1, interactive: false }).addTo(map);
    const targetMarker = L.marker([targetLat, targetLng], { icon: targetIcon, interactive: false }).addTo(map);
    targetMarkerRef.current = targetMarker;

    // Draw connection line
    const polyline = L.polyline(
      [
        [guess.lat, guess.lng],
        [targetLat, targetLng],
      ],
      {
        color: isCorrect ? '#10b981' : '#f43f5e',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 6',
      }
    ).addTo(map);

    polylineRef.current = polyline;

    // Fit bounds to show both
    const bounds = L.latLngBounds([[guess.lat, guess.lng], [targetLat, targetLng]]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });

    onAnswer(isCorrect, distKm, guess.lat, guess.lng);
  };

  return (
    <div className="space-y-3">
      {/* Top Clues & Basemap bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-white rounded-xl border border-slate-200 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-slate-950 font-bold text-[10px]">
            📍
          </span>
          <span className="font-bold text-slate-900">
            Интерактив Газрын Зурагт Цэг Тавих Сорилт
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            (Зөвшөөрөгдөх алдаа: &lt; {allowedDistanceKm} км)
          </span>
        </div>

        {/* Action Clue buttons */}
        <div className="flex items-center gap-1.5">
          {pinData?.photoUrl && (
            <button
              type="button"
              onClick={() => setShowPhotoClue(!showPhotoClue)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition-colors cursor-pointer ${
                showPhotoClue
                  ? 'border-sky-500 bg-sky-50 text-sky-800'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Eye className="h-3 w-3 text-sky-600" />
              <span>{showPhotoClue ? 'Зураг нуух' : '📸 Зургийн сэжүүр'}</span>
            </button>
          )}

          {pinData?.clues && pinData.clues.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTextClues(!showTextClues)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] border transition-colors cursor-pointer ${
                showTextClues
                  ? 'border-amber-500 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <HelpCircle className="h-3 w-3 text-amber-600" />
              <span>{showTextClues ? 'Сэжүүр нуух' : '💡 Сэжүүр'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Clues Preview Drawer */}
      {(showPhotoClue || showTextClues) && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          {showPhotoClue && pinData?.photoUrl && (
            <div className="sm:col-span-5 relative rounded-lg overflow-hidden border border-slate-200 h-36">
              <img
                src={pinData.photoUrl}
                alt={targetName}
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white">
                Бодит гэрэл зураг
              </div>
            </div>
          )}

          {showTextClues && pinData?.clues && (
            <div className={`${showPhotoClue ? 'sm:col-span-7' : 'sm:col-span-12'} space-y-1 text-slate-800`}>
              <span className="font-bold text-amber-900 text-[11px]">💡 Газарзүйн сэжүүрүүд:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1 text-[11px]">
                {pinData.clues.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Main Interactive Map Container */}
      <div className="relative isolate rounded-2xl border border-slate-300 overflow-hidden shadow-md bg-slate-900 h-[340px] sm:h-[400px]">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Top Label-Free Basemap Switcher */}
        <div className="absolute top-2.5 left-12 z-400 flex rounded-lg bg-white/95 border border-slate-300 p-0.5 text-[10px] font-bold shadow-md backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setBasemapType('satellite')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
              basemapType === 'satellite'
                ? 'bg-emerald-600 text-white font-black'
                : 'text-slate-700 hover:text-slate-950'
            }`}
            title="Нэргүй хиймэл дагуулын суурь зураг"
          >
            🛰️ Нэргүй дагуул
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('clean')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
              basemapType === 'clean'
                ? 'bg-sky-600 text-white font-black'
                : 'text-slate-700 hover:text-slate-950'
            }`}
            title="Ямар ч нэршилгүй Contour map"
          >
            🧭 Contour map
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('dark')}
            className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
              basemapType === 'dark'
                ? 'bg-slate-800 text-white font-black'
                : 'text-slate-700 hover:text-slate-950'
            }`}
            title="Нэргүй бараан суурь зураг"
          >
            🌑 Бараан
          </button>
        </div>

        {/* Курсорын яг байршил: ямар цэг дээр тавихыг мэдэгдэнэ */}
        {!hasAnswered && hover && (
          <div className="pointer-events-none absolute bottom-10 left-2.5 z-400 rounded-md border border-white/20 bg-slate-900/85 px-2 py-1 font-mono text-[10px] text-white shadow-sm" data-testid="cursor-coords">
            ✛ {fmtCoord(hover.lat, hover.lng)}
          </div>
        )}

        {/* Compass / North Arrow on top right */}
        <div className="absolute top-2.5 right-2.5 z-400 flex items-center gap-1 rounded-lg bg-slate-900/80 border border-white/20 px-2.5 py-1 text-[10px] font-mono text-white shadow-sm backdrop-blur-xs">
          <Compass className="h-3.5 w-3.5 text-amber-400" />
          <span>Хойд зүг (N)</span>
        </div>

        {/* Floating Guess Submit Button on bottom of map */}
        {!hasAnswered && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-400">
            <button
              type="button"
              onClick={handleConfirmPin}
              disabled={!playerGuess}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black shadow-xl transition-all cursor-pointer ${
                playerGuess
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 transform hover:scale-105 animate-pulse'
                  : 'bg-slate-800/90 text-slate-400 border border-white/20 cursor-not-allowed'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>
                {playerGuess ? 'Байршлыг баталгаажуулах (Таах)' : 'Газрын зураг дээр товшиж цэг тавина уу (томруулж нарийвчилж болно)'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Answer Feedback Strip (After submission) */}
      {hasAnswered && evaluatedDistanceKm !== null && (
        <div
          className={`rounded-xl p-3 border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in ${
            isWithinAllowed
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {isWithinAllowed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <div>
              <span className="font-bold text-sm">
                {isWithinAllowed ? 'Маш сайн таалаа! (ЗӨВ)' : 'Алдааны зай хол байна! (БУРУУ)'}
              </span>
              <span className="block text-[11px] opacity-80">
                Таны сонгосон цэг бодит байршлаас{' '}
                <b className="font-mono">{evaluatedDistanceKm.toFixed(1)} км</b> зайд байна.
              </span>
            </div>
          </div>

          {pinData?.funFact && (
            <div className="text-[11px] opacity-90 sm:text-right max-w-sm">
              💡 {pinData.funFact}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
