import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Compass,
  Table,
  Lock,
  Unlock,
  Sun,
  Moon,
  Maximize2,
  Globe2,
  Map as MapIcon,
} from 'lucide-react';
import { resolveCountryBoundaryGeoJson } from '../data/sampleGisLayers';
import { useApp } from '../context/AppContext';

interface ShpContourViewerProps {
  geojson: any;
  geometryType: 'Polygon' | 'MultiPolygon' | 'LineString' | 'Point' | string;
  maskedProperties: Record<string, string>;
  realProperties: Record<string, any>;
  targetName: string;
  hasAnswered: boolean;
  isCorrect?: boolean;
  categoryLabel?: string;
  hints?: string[];
}

export type LabelFreeBasemapMode =
  | 'nolabel_satellite' // 🛰️ Нэргүй хиймэл дагуул (Esri World Imagery - 0 text labels)
  | 'nolabel_outline' // 🧭 Contour map (Энгийн цагаан дэвсгэр + хилийн хүрээ)
  | 'nolabel_dark' // 🌑 Нэргүй бараан суурь
  | 'pure_grid'; // 📐 Цэвэр торлол (Суурь зураггүй)

const BASEMAP_TILES: Record<
  Exclude<LabelFreeBasemapMode, 'pure_grid'>,
  { url: string; maxZoom: number }
> = {
  nolabel_satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
  },
  nolabel_outline: {
    url: '', // Plain white background (no external tile server or API key needed)
    maxZoom: 18,
  },
  nolabel_dark: {
    url: '', // Plain dark background (no external tile server or API key needed)
    maxZoom: 18,
  },
};

export const ShpContourViewer: React.FC<ShpContourViewerProps> = ({
  geojson,
  geometryType,
  maskedProperties,
  realProperties,
  targetName,
  hasAnswered,
  isCorrect,
  categoryLabel = 'Вектор обьект',
  hints = [],
}) => {
  const { gisLayers } = useApp();
  const countryBoundaryGeoJson = React.useMemo(
    () => resolveCountryBoundaryGeoJson(gisLayers),
    [gisLayers]
  );
  const isPointGeometry =
    geometryType === 'Point' ||
    geometryType === 'MultiPoint' ||
    geojson?.features?.[0]?.geometry?.type === 'Point' ||
    geojson?.features?.[0]?.geometry?.type === 'MultiPoint';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const contextOutlineRef = useRef<L.GeoJSON | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const revealMarkerRef = useRef<L.Marker | null>(null);

  // Default to label-free outline or satellite for Point/Line so spatial orientation is clear without any text labels!
  const [basemapMode, setBasemapMode] = useState<LabelFreeBasemapMode>(
    isPointGeometry ? 'nolabel_satellite' : 'nolabel_outline'
  );
  const [showMongoliaOutline, setShowMongoliaOutline] = useState<boolean>(true);

  // Update default mode if geometryType changes to Point
  useEffect(() => {
    if (isPointGeometry && basemapMode === 'pure_grid') {
      setBasemapMode('nolabel_satellite');
    }
  }, [isPointGeometry]);

  // Initialize Leaflet map with HTML5 Canvas renderer
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const canvasRenderer = L.canvas({ padding: 0.5 });
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: false,
      center: [46.86, 103.84],
      zoom: 5,
      preferCanvas: true,
      renderer: canvasRenderer,
    });

    // Metric scale line (km / m) calculated from real WGS84 coordinates
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Manage Label-Free Basemap Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    if (basemapMode !== 'pure_grid') {
      const cfg = BASEMAP_TILES[basemapMode];
      if (cfg.url) {
        const tile = L.tileLayer(cfg.url, {
          maxZoom: cfg.maxZoom,
        }).addTo(map);
        tile.bringToBack();
        tileLayerRef.current = tile;
      }
    }
  }, [basemapMode]);

  // Manage Country Boundary Reference Outline (country_boundary layer — NO labels/popups)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (contextOutlineRef.current) {
      map.removeLayer(contextOutlineRef.current);
      contextOutlineRef.current = null;
    }

    if (showMongoliaOutline && countryBoundaryGeoJson) {
      const isDark = basemapMode === 'nolabel_satellite' || basemapMode === 'nolabel_dark';
      const outlineLayer = L.geoJSON(countryBoundaryGeoJson as any, {
        interactive: false, // Never intercept clicks or show any popup/label
        style: () => ({
          color: isDark ? '#fbbf24' : '#334155',
          weight: isPointGeometry ? 2.2 : 1.8,
          opacity: isDark ? 0.85 : 0.75,
          fillColor: 'transparent',
          fillOpacity: 0,
        }),
      }).addTo(map);
      contextOutlineRef.current = outlineLayer;
    }
  }, [showMongoliaOutline, basemapMode, countryBoundaryGeoJson, isPointGeometry]);

  // Function to re-fit bounds to the isolated object (with broader context for Point objects)
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    const layer = geoLayerRef.current;
    if (!map || !layer) return;
    const b = layer.getBounds();
    if (b && b.isValid()) {
      if (isPointGeometry) {
        // For a single point, zoom 6 shows where in Mongolia/region the point sits!
        map.setView(b.getCenter(), 6);
      } else {
        map.fitBounds(b, { padding: [36, 36], maxZoom: 9 });
      }
    }
  };

  // Fit Mongolia full country view for spatial orientation
  const handleFitMongoliaContext = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([46.86, 103.84], 5);
  };

  // Render isolated contour / point geometry
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geojson) return;

    if (geoLayerRef.current) {
      map.removeLayer(geoLayerRef.current);
      geoLayerRef.current = null;
    }
    if (revealMarkerRef.current) {
      map.removeLayer(revealMarkerRef.current);
      revealMarkerRef.current = null;
    }

    try {
      const isDark = basemapMode === 'nolabel_satellite' || basemapMode === 'nolabel_dark';

      const strokeColor = !hasAnswered
        ? isDark
          ? '#38bdf8'
          : '#0284c7'
        : isCorrect
        ? '#10b981'
        : '#f43f5e';

      const fillColor = !hasAnswered
        ? '#0ea5e9'
        : isCorrect
        ? '#10b981'
        : '#f43f5e';

      const geoLayer = L.geoJSON(geojson, {
        style: () => ({
          color: strokeColor,
          weight: 3.5,
          opacity: 1,
          fillColor,
          fillOpacity: geometryType === 'LineString' ? 0 : 0.32,
        }),
        pointToLayer: (_feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 11,
            fillColor: !hasAnswered ? '#f59e0b' : strokeColor,
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.95,
          });
        },
      }).addTo(map);

      geoLayerRef.current = geoLayer;

      const b = geoLayer.getBounds();
      if (b && b.isValid()) {
        if (isPointGeometry) {
          // Give regional/national spatial context (zoom 6) so the user can see where the point is located!
          map.setView(b.getCenter(), 6);
        } else {
          map.fitBounds(b, { padding: [36, 36], maxZoom: 9 });
        }

        // If answered, reveal real name pin at center of contour/point
        if (hasAnswered) {
          const center = b.getCenter();
          const revealIcon = L.divIcon({
            className: 'reveal-feature-pin',
            html: `
              <div style="
                background: ${isCorrect ? '#059669' : '#dc2626'};
                color: #ffffff;
                border: 2px solid #ffffff;
                border-radius: 9999px;
                padding: 4px 12px;
                font-size: 12px;
                font-weight: 800;
                white-space: nowrap;
                box-shadow: 0 4px 14px rgba(0,0,0,0.45);
                display: flex;
                align-items: center;
                gap: 5px;
                transform: translate(-50%, -130%);
              ">
                <span>${isCorrect ? '✅' : '📍'}</span>
                <span>${targetName}</span>
              </div>
            `,
            iconSize: [0, 0],
          });

          const marker = L.marker(center, { icon: revealIcon }).addTo(map);
          revealMarkerRef.current = marker;
        }
      }
    } catch (e) {
      console.error('Error rendering contour geometry:', e);
    }
  }, [geojson, hasAnswered, isCorrect, targetName, geometryType, basemapMode, isPointGeometry]);

  // Recalculate size if window/dialog updates
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [hasAnswered]);

  return (
    <div className="space-y-3">
      {/* Top Banner: Label-Free Basemap Switcher & Masked Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-600 text-white font-bold text-[10px]">
            SHP
          </span>
          <span className="font-bold text-sky-950">
            Нэргүй суурь зураг ({categoryLabel}):
          </span>

          {/* Label-Free Basemap Switcher Buttons */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-sky-200 p-0.5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setBasemapMode('nolabel_satellite')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                basemapMode === 'nolabel_satellite'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Ямар ч бичиг, нэршилгүй цэвэр хиймэл дагуулын зураг"
            >
              🛰️ Нэргүй хиймэл дагуул
            </button>
            <button
              type="button"
              onClick={() => setBasemapMode('nolabel_outline')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                basemapMode === 'nolabel_outline'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Ямар ч хот, сум, аймгийн нэр бичигдээгүй цэвэр Contour map"
            >
              🧭 Contour map
            </button>
            <button
              type="button"
              onClick={() => setBasemapMode('nolabel_dark')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                basemapMode === 'nolabel_dark'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Нэргүй бараан суурь зураг"
            >
              🌑 Бараан
            </button>
            <button
              type="button"
              onClick={() => setBasemapMode('pure_grid')}
              className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                basemapMode === 'pure_grid'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Суурь зураггүй цэвэр торлол"
            >
              📐 Торлол
            </button>
          </div>
        </div>

        {/* Masked status tag */}
        <div className="flex items-center gap-1.5">
          {!hasAnswered ? (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
              <Lock className="h-3 w-3" />
              Нэр нууцлагдсан
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                isCorrect
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                  : 'bg-rose-100 border border-rose-300 text-rose-900'
              }`}
            >
              <Unlock className="h-3 w-3" />
              {isCorrect ? 'Зөв таалаа!' : 'Жинхэнэ нэр:'} {targetName}
            </span>
          )}
        </div>
      </div>

      {/* Main Map Canvas Container (With Plain White Contour Map, Satellite, or Grid) */}
      <div
        className={`relative isolate rounded-2xl border overflow-hidden shadow-inner transition-colors ${
          basemapMode === 'nolabel_dark' || basemapMode === 'nolabel_satellite'
            ? 'border-slate-700 bg-[#0f172a]'
            : 'border-slate-300 bg-white'
        }`}
        style={
          basemapMode === 'pure_grid'
            ? {
                backgroundColor: '#ffffff',
                backgroundImage:
                  'radial-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(to right, rgba(203,213,225,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(203,213,225,0.35) 1px, transparent 1px)',
                backgroundSize: '20px 20px, 40px 40px, 40px 40px',
              }
            : basemapMode === 'nolabel_outline'
            ? { backgroundColor: '#ffffff' }
            : undefined
        }
      >
        <div
          ref={mapContainerRef}
          className="h-[290px] sm:h-[350px] w-full"
          style={{ background: 'transparent' }}
        />

        {/* Top-left controls: Mongolia Reference Outline Toggle & Fit Bounds */}
        <div className="absolute top-2.5 left-12 z-400 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowMongoliaOutline((prev) => !prev)}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold shadow-sm cursor-pointer transition-colors ${
              showMongoliaOutline
                ? 'bg-amber-500 border-amber-400 text-slate-950'
                : 'bg-white/95 border-slate-300 text-slate-700 hover:text-slate-950'
            }`}
            title="Орон зайн баримжаа авах нэргүй хилийн контур шугамыг харуулах/нуух"
          >
            <MapIcon className="h-3 w-3" />
            <span>Улсын хил (country_boundary) {showMongoliaOutline ? '✓' : ''}</span>
          </button>

          <button
            type="button"
            onClick={handleFitBounds}
            className="flex items-center gap-1 rounded-lg bg-white/95 border border-slate-300 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:text-slate-950 shadow-sm cursor-pointer"
            title="Обьектийг голлуулах"
          >
            <Maximize2 className="h-3 w-3 text-sky-600" />
            <span>Обьект руу татах</span>
          </button>

          <button
            type="button"
            onClick={handleFitMongoliaContext}
            className="flex items-center gap-1 rounded-lg bg-white/95 border border-slate-300 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:text-slate-950 shadow-sm cursor-pointer"
            title="Монгол орны хэмжээнд байршлын баримжаа харах"
          >
            <Globe2 className="h-3 w-3 text-emerald-600" />
            <span>Бүхэлд нь харах</span>
          </button>
        </div>

        {/* Compass / North Arrow on top right */}
        <div className="absolute top-2.5 right-2.5 z-400 flex items-center gap-1 rounded-lg bg-slate-900/80 border border-white/15 px-2.5 py-1 text-[10px] font-mono text-white shadow-sm backdrop-blur-xs">
          <Compass className="h-3.5 w-3.5 text-amber-400" />
          <span>Хойд зүг (N)</span>
        </div>

        {/* Bottom scale & hint overlay */}
        <div className="absolute bottom-2 right-2 z-400 bg-slate-900/80 border border-white/15 px-2.5 py-1 rounded-md text-[10px] font-mono text-white backdrop-blur-xs">
          <span>Ямар ч нэр бичигдээгүй суурь зураг · WGS84</span>
        </div>
      </div>

      {/* Masked / Revealed Attributes Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Table className="h-3.5 w-3.5 text-amber-600" />
            <span>
              {!hasAnswered
                ? '🔒 Нууцалсан Шинж Чанарын Хүснэгт (DBF)'
                : '✅ Илэрсэн Бодит Аттрибют Мэдээлэл (DBF)'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Геометр: {geometryType}
          </span>
        </div>

        {/* Table Rows */}
        <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100 text-xs">
          {!hasAnswered ? (
            /* Masked Properties Display */
            <>
              <div className="flex justify-between py-1 px-1.5 bg-amber-50/50 rounded">
                <span className="font-semibold text-amber-900">Обьектийн нэр:</span>
                <span className="font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.2 rounded text-[11px]">
                  [ ? ? ? НУУЦЛАГДСАН ]
                </span>
              </div>
              {Object.entries(maskedProperties).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 px-1.5 hover:bg-slate-50">
                  <span className="text-slate-600 font-medium">{k}:</span>
                  <span className="font-mono text-slate-500 italic text-[11px]">{v}</span>
                </div>
              ))}
              {hints.length > 0 && (
                <div className="py-1 px-1.5 text-[11px] text-slate-600 bg-slate-50 rounded mt-1">
                  <b>💡 Сэжүүр:</b> {hints.join(' · ')}
                </div>
              )}
            </>
          ) : (
            /* Revealed Real Properties Display */
            <>
              <div className="flex justify-between py-1 px-1.5 bg-emerald-50 rounded">
                <span className="font-bold text-emerald-950">Жинхэнэ нэр:</span>
                <span className="font-mono font-black text-emerald-800 text-xs">
                  {targetName}
                </span>
              </div>
              {Object.entries(realProperties).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 px-1.5 hover:bg-slate-50">
                  <span className="font-semibold text-slate-700">{k}:</span>
                  <span className="font-mono text-slate-900 font-bold text-[11px] break-all">
                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
