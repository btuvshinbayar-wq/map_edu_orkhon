import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ZoomIn, ZoomOut, Compass, Navigation2 } from 'lucide-react';
import { AIMAGS_DATA } from '../data/aimags';
import { ActiveGisLayer } from '../types';
import { extractFeatureName, getFilteredLayerGeoJson } from '../utils/gisUtils';
import { makeFeatureColorFn, effectiveColorMode } from '../utils/layerColors';

// Real coordinates (Lat, Lng) for Mongolia Aimags
export const AIMAG_COORDINATES: Record<string, [number, number]> = {
  ulaanbaatar: [47.9188, 106.9176],
  bayan_olgii: [48.9708, 89.9622],
  uvs: [49.9811, 92.0667],
  khovd: [48.0056, 91.6419],
  zavkhan: [47.7417, 96.8444],
  govi_altai: [46.3722, 96.2583],
  khuvsgul: [49.6333, 100.1667],
  arkhangai: [47.4750, 101.4500],
  bayankhongor: [46.1944, 100.7186],
  bulgan: [48.8125, 103.5347],
  orkhon: [49.0278, 104.0444],
  darkhan_uul: [49.4867, 105.9228],
  selenge: [50.2414, 106.2083],
  tuv: [47.7069, 106.9531],
  ovorkhangai: [46.2639, 102.7750],
  dundgovi: [45.7625, 106.2708],
  umnugovi: [43.5708, 104.4250],
  govisumber: [46.3611, 108.3611],
  khentii: [47.3236, 110.6556],
  dornod: [48.0728, 114.5350],
  sukhbaatar: [46.6806, 113.2806],
  dornogovi: [44.8825, 110.1364],
};

// Real coordinates for prominent natural and strategic features
export const REAL_GEO_PINS = [
  // Mountains
  { id: 'peak_khuiten', name: 'Хүйтэн оргил (4374 м)', coords: [49.146, 87.818] as [number, number], category: 'mountain', desc: 'Монгол орны хамгийн өндөр цэг (Алтай Таван Богд)' },
  { id: 'peak_otgontenger', name: 'Отгонтэнгэр хайрхан (4021 м)', coords: [47.632, 97.498] as [number, number], category: 'mountain', desc: 'Хангайн нурууны ноён оргил' },
  { id: 'peak_burkhan_khaldun', name: 'Бурхан Халдун уул (2362 м)', coords: [48.756, 108.718] as [number, number], category: 'mountain', desc: 'Чингис хааны шүтээн уул, Дэлхийн соёлын өв' },
  { id: 'peak_asralt_khairkhan', name: 'Асралт Хайрхан (2799 м)', coords: [48.465, 107.412] as [number, number], category: 'mountain', desc: 'Хэнтийн нурууны хамгийн өндөр оргил' },

  // Lakes
  { id: 'lake_khuvsgul', name: 'Хөвсгөл нуур (Цэнгэг)', coords: [51.100, 100.500] as [number, number], category: 'lake', desc: 'Монголын хамгийн гүн (262.4 м) цэнгэг нуур' },
  { id: 'lake_uvs', name: 'Увс нуур (Давстай)', coords: [50.333, 92.750] as [number, number], category: 'lake', desc: 'Монголын хамгийн том талбайтай нуур (3350 км²)' },
  { id: 'lake_khyargas', name: 'Хяргас нуур', coords: [49.167, 93.333] as [number, number], category: 'lake', desc: 'Их нууруудын хотгорын эрдэст давстай нуур' },
  { id: 'lake_buir', name: 'Буйр нуур', coords: [47.800, 117.700] as [number, number], category: 'lake', desc: 'Зүүн Монголын хамгийн том цэнгэг нуур' },

  // Strategic Basins
  { id: 'basin_oyu_tolgoi', name: 'Оюу Толгой (Зэс, алт)', coords: [43.011, 106.849] as [number, number], category: 'basin', desc: 'Дэлхийн хамгийн том зэс-алтны уурхай' },
  { id: 'basin_tavan_tolgoi', name: 'Таван Толгой (Нүүрс)', coords: [43.626, 105.474] as [number, number], category: 'basin', desc: 'Коксжих нүүрсний аварга орд' },
  { id: 'basin_erdenet', name: 'Эрдэнэтийн Овоо', coords: [49.034, 104.041] as [number, number], category: 'basin', desc: 'Зэс-молибдений баяжуулах үйлдвэр' },

  // World Strategic Straits
  { id: 'strait_malacca', name: 'Малаккийн хоолой', coords: [1.430, 102.890] as [number, number], category: 'strait', desc: 'Номхон ба Энэтхэгийн далайн гол зангилаа' },
  { id: 'strait_gibraltar', name: 'Гибралтарын хоолой', coords: [35.960, -5.600] as [number, number], category: 'strait', desc: 'Европ ба Африкийн зааг хоолой' },
  { id: 'strait_hormuz', name: 'Ормузын хоолой', coords: [26.560, 56.250] as [number, number], category: 'strait', desc: 'Персийн булангийн нефтийн гарц' },
  { id: 'canal_suez', name: 'Суэцийн суваг', coords: [30.585, 32.565] as [number, number], category: 'strait', desc: 'Газар дундын тэнгис ба Улаан тэнгисийг холбох суваг' },
  { id: 'canal_panama', name: 'Панамын суваг', coords: [9.080, -79.680] as [number, number], category: 'strait', desc: 'Атлант ба Номхон далайг холбох суваг' },
  { id: 'peak_everest', name: 'Эверест (8848 м)', coords: [27.988, 86.925] as [number, number], category: 'mountain', desc: 'Дэлхийн ноён оргил' },
];

export interface CustomMapOverlayConfig {
  url: string;
  bounds: [[number, number], [number, number]];
  opacity: number;
}

export type BasemapType = 'satellite' | 'contour' | 'clean_nolabels';

interface RealLeafletMapProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onLocationSelect?: (info: { name: string; lat: number; lng: number }) => void;
  selectedAimagId?: string | null;
  targetId?: string | null;
  interactive?: boolean;
  vectorLayers?: ActiveGisLayer[];
  vectorGeoJson?: any | null;
  vectorStyle?: {
    color?: string;
    fillColor?: string;
    fillOpacity?: number;
    weight?: number;
  };
  onFeatureSelect?: (
    properties: any,
    latlng?: [number, number],
    layerInfo?: { id: string; name: string; geometryType?: string }
  ) => void;
  tileType?: BasemapType;
  onTileTypeChange?: (type: BasemapType) => void;
  showTileSwitcher?: boolean;
  showPins?: boolean;
  hideLabels?: boolean; // When true (Уралдаан / Сорил), object names are hidden; when false (Газрын зураг), object names are shown
  mapHeightClass?: string;
  fitBoundsTrigger?: number;
  focusTarget?: {
    feature?: any;
    latlng?: [number, number];
    layerGeoJson?: any;
    trigger: number;
  } | null;
  mapId?: string;
  syncView?: {
    center: [number, number];
    zoom: number;
    sourceId: string;
  } | null;
  onViewChange?: (center: [number, number], zoom: number, sourceId: string) => void;
}

export const RealLeafletMap: React.FC<RealLeafletMapProps> = ({
  initialCenter = [46.8625, 103.8467], // Center of Mongolia
  initialZoom = 5,
  onLocationSelect,
  selectedAimagId,
  targetId,
  vectorLayers,
  vectorGeoJson,
  vectorStyle,
  onFeatureSelect,
  tileType,
  onTileTypeChange,
  showTileSwitcher = true,
  showPins = false,
  hideLabels = false,
  mapHeightClass = 'h-[520px] sm:h-[620px]',
  fitBoundsTrigger = 0,
  focusTarget = null,
  mapId = 'main',
  syncView = null,
  onViewChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const vectorLayersGroupRef = useRef<L.LayerGroup | null>(null);
  const highlightLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const isSyncingRef = useRef(false);
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;

  const [internalTileType, setInternalTileType] = useState<BasemapType>('satellite');
  const activeTileType = tileType !== undefined ? tileType : internalTileType;

  const handleTileSwitch = (newType: BasemapType) => {
    setInternalTileType(newType);
    if (onTileTypeChange) {
      onTileTypeChange(newType);
    }
  };

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedEntityInfo, setSelectedEntityInfo] = useState<{
    name: string;
    layerName?: string;
    desc?: string;
    category?: string;
    attributes?: Record<string, any>;
  } | null>(null);

  // 2 Official Basemaps: Satellite & Contour map (Plain White Background — Zero External Tile API Keys)
  const TILE_LAYERS: Record<BasemapType, { name: string; url: string; attribution: string; maxZoom: number }> = {
    // 1. High-resolution Real Satellite Imagery by Esri ArcGIS (100% label-free imagery)
    satellite: {
      name: 'Хиймэл дагуул (Нэргүй бодит зураг)',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; World Imagery',
      maxZoom: 18,
    },
    // 2. Contour map (Plain white background — no external raster tiles or API keys)
    contour: {
      name: 'Contour map',
      url: '',
      attribution: 'Contour Map · WGS84',
      maxZoom: 18,
    },
    clean_nolabels: {
      name: 'Contour map',
      url: '',
      attribution: 'Contour Map · WGS84',
      maxZoom: 18,
    },
  };

  const effectiveTileType: BasemapType =
    activeTileType === 'clean_nolabels' || activeTileType === 'contour'
      ? 'contour'
      : 'satellite';

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Create Leaflet map instance with HTML5 Canvas renderer (preferCanvas: true)
    // and smooth fractional zoom + inertia panning transitions
    const canvasRenderer = L.canvas({ padding: 0.5 });
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      renderer: canvasRenderer,
      zoomAnimation: true,
      zoomAnimationThreshold: 8,
      fadeAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 2400,
      inertiaMaxSpeed: 1800,
      easeLinearity: 0.2,
      zoomSnap: 0.25,
      zoomDelta: 0.75,
      wheelPxPerZoomLevel: 90,
      wheelDebounceTime: 35,
    });

    // Add metric scale line (km / m)
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Add initial tile layer only if satellite (Contour map uses plain white background)
    const initialTile = TILE_LAYERS[effectiveTileType];
    if (initialTile.url) {
      const tiles = L.tileLayer(initialTile.url, {
        attribution: initialTile.attribution,
        maxZoom: initialTile.maxZoom,
      }).addTo(map);
      tileLayerRef.current = tiles;
    } else {
      tileLayerRef.current = null;
    }

    // Add layer group for vector layers and highlight overlay
    const vectorGroup = L.layerGroup().addTo(map);
    vectorLayersGroupRef.current = vectorGroup;

    const highlightGroup = L.layerGroup().addTo(map);
    highlightLayerGroupRef.current = highlightGroup;

    // Emit view changes for synchronized split-screen exploration
    map.on('moveend', () => {
      if (isSyncingRef.current) return;
      if (onViewChangeRef.current) {
        const c = map.getCenter();
        onViewChangeRef.current([c.lat, c.lng], map.getZoom(), mapId);
      }
    });

    // Throttled mouse move to show coordinates without triggering excessive React re-renders
    let lastMoveTime = 0;
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < 80) return;
      lastMoveTime = now;
      setCurrentCoords({
        lat: Number(e.latlng.lat.toFixed(4)),
        lng: Number(e.latlng.lng.toFixed(4)),
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle tile switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }

    const newConfig = TILE_LAYERS[effectiveTileType];
    if (newConfig.url) {
      const newTile = L.tileLayer(newConfig.url, {
        attribution: newConfig.attribution,
        maxZoom: newConfig.maxZoom,
      }).addTo(map);
      newTile.bringToBack();
      tileLayerRef.current = newTile;
    }
  }, [effectiveTileType]);

  // Render Multiple Active GIS Vector Layers concurrently
  useEffect(() => {
    if (!mapInstanceRef.current || !vectorLayersGroupRef.current) return;
    const map = mapInstanceRef.current;
    const group = vectorLayersGroupRef.current;

    group.clearLayers();

    // Collect layers to render: either vectorLayers list or fallback single vectorGeoJson
    const layersToRender: {
      id: string;
      name: string;
      visible: boolean;
      geojson: any;
      nameField?: string;
      color: string;
      fillColor: string;
      fillOpacity: number;
      weight: number;
      colorByField?: string;
      colorMap?: Record<string, string>;
      colorFn: (feature: any) => string;
    }[] = [];

    if (vectorLayers && vectorLayers.length > 0) {
      vectorLayers.forEach((layer) => {
        if (layer.visible && layer.geojson) {
          const filteredGeoJson = getFilteredLayerGeoJson(layer);
          if (filteredGeoJson && Array.isArray(filteredGeoJson.features) && filteredGeoJson.features.length > 0) {
            layersToRender.push({
              id: layer.id,
              name: layer.name,
              visible: layer.visible,
              geojson: filteredGeoJson,
              nameField: layer.nameField,
              color: layer.color,
              fillColor: layer.fillColor,
              fillOpacity: layer.fillOpacity,
              weight: layer.weight,
              colorByField: layer.colorByField,
              colorMap: layer.colorMap,
              // Обьект бүрийн дүүргэлтийн өнгө (полигонд анхдагчаар хөрш бүр өөр өнгө)
              colorFn: makeFeatureColorFn(layer),
            });
          }
        }
      });
    } else if (vectorGeoJson) {
      layersToRender.push({
        id: 'single_vector',
        name: 'Вектор давхарга',
        visible: true,
        geojson: vectorGeoJson,
        color: vectorStyle?.color || '#0284c7',
        fillColor: vectorStyle?.fillColor || '#38bdf8',
        fillOpacity: vectorStyle?.fillOpacity ?? 0.35,
        weight: vectorStyle?.weight ?? 2.5,
        colorFn: () => vectorStyle?.fillColor || '#38bdf8', // дан ганц түр давхарга: нэг өнгө
      });
    }

    if (layersToRender.length === 0) return;

    const combinedBounds = L.latLngBounds([]);

    layersToRender.forEach((layer) => {
      try {
        const geoLayer = L.geoJSON(layer.geojson, {
          style: (feature) => ({
            color: layer.color,
            weight: layer.weight,
            opacity: 0.9,
            fillColor: layer.colorFn(feature),
            fillOpacity: layer.fillOpacity,
            smoothFactor: 1.5,
          }),
          pointToLayer: (_feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 7,
              fillColor: layer.color || '#d97706',
              color: '#ffffff',
              weight: 1.5,
              opacity: 1,
              fillOpacity: 0.85,
            });
          },
          onEachFeature: (feature, l) => {
            const props = feature.properties || {};
            const resolvedFeatureName = extractFeatureName(props, 0, layer.nameField);

            if (!hideLabels) {
              // On Map view (Газрын зураг): show object name on hover tooltip and in popup
              l.bindTooltip(`📍 ${resolvedFeatureName}`, {
                sticky: true,
                direction: 'top',
                opacity: 0.95,
              });

              l.bindPopup(() => {
                const entries = Object.entries(props).slice(0, 25);
                const rows = entries
                  .map(
                    ([k, v]) =>
                      `<tr><td style="font-weight:600;padding:2px 8px 2px 0;color:#0284c7;font-size:11px;">${k}:</td><td style="color:#0f172a;font-size:11px;">${v}</td></tr>`
                  )
                  .join('');

                return `
                  <div style="font-family: inherit; font-size: 11px; max-height: 220px; overflow-y: auto; min-width: 190px;">
                    <div style="display:inline-block;background:#0284c7;color:#ffffff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;margin-bottom:4px;">
                      ${layer.name}
                    </div>
                    <div style="font-weight: bold; font-size: 13px; color: #0f172a; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px;">
                      📍 ${resolvedFeatureName}
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">${rows}</table>
                  </div>
                `;
              });
            }

            l.on('click', (e: any) => {
              const displayTitle = hideLabels ? '[ ? ? ? НУУЦЛАГДСАН ]' : resolvedFeatureName;
              if (!hideLabels) {
                setSelectedEntityInfo({
                  name: displayTitle,
                  layerName: layer.name,
                  desc: props.description || props.TYPE || props.BASIN || 'Бодит координаттай вектор элемент',
                  category: 'vector',
                  attributes: props,
                });
                // Smoothly pan toward clicked feature during exploration
                if (e.latlng && mapInstanceRef.current) {
                  mapInstanceRef.current.panTo(e.latlng, {
                    animate: true,
                    duration: 0.55,
                    easeLinearity: 0.25,
                  });
                }
              }
              if (onFeatureSelect) {
                onFeatureSelect(props, [e.latlng.lat, e.latlng.lng], {
                  id: layer.id,
                  name: layer.name,
                  geometryType: feature.geometry?.type,
                });
              }
            });
          },
        });

        group.addLayer(geoLayer);

        const b = geoLayer.getBounds();
        if (b && b.isValid()) {
          combinedBounds.extend(b);
        }
      } catch (err) {
        console.error(`Error rendering layer "${layer.name}":`, err);
      }
    });

    // Smoothly fly to bounds if triggered
    if (combinedBounds.isValid() && fitBoundsTrigger > 0) {
      map.flyToBounds(combinedBounds, {
        padding: [35, 35],
        duration: 1.05,
        easeLinearity: 0.25,
      });
    }
  }, [
    JSON.stringify(
      vectorLayers?.map((l) => ({
        id: l.id,
        visible: l.visible,
        nameField: l.nameField,
        selectedCount: l.selectedFeatureIndices ? l.selectedFeatureIndices.length : 'all',
        color: l.color,
        fillColor: l.fillColor,
        fillOpacity: l.fillOpacity,
        weight: l.weight,
        featureCount: l.featureCount,
        colorByField: l.colorByField,
        colorMap: l.colorMap,
        colorMode: l.colorMode,
        colorSeed: l.colorSeed,
        overrides: l.featureColorOverrides,
        geometryType: l.geometryType,
      }))
    ),
    vectorGeoJson,
    JSON.stringify(vectorStyle),
    fitBoundsTrigger,
    hideLabels,
  ]);

  // Smoothly fly to focused feature, coordinates, or layer bounds when triggered from ExploreMode
  useEffect(() => {
    if (!mapInstanceRef.current || !focusTarget || !focusTarget.trigger) return;
    const map = mapInstanceRef.current;
    const highlightGroup = highlightLayerGroupRef.current;
    if (highlightGroup) {
      highlightGroup.clearLayers();
    }

    try {
      if (focusTarget.feature) {
        const tempLayer = L.geoJSON(focusTarget.feature, {
          style: () => ({
            color: '#f59e0b',
            weight: 4,
            opacity: 1,
            fillColor: '#fbbf24',
            fillOpacity: 0.45,
          }),
          pointToLayer: (_f, latlng) =>
            L.circleMarker(latlng, {
              radius: 12,
              fillColor: '#f59e0b',
              color: '#ffffff',
              weight: 3,
              opacity: 1,
              fillOpacity: 0.95,
            }),
        });

        if (highlightGroup) {
          highlightGroup.addLayer(tempLayer);
        }

        const geomType = focusTarget.feature?.geometry?.type;
        if (geomType === 'Point' && Array.isArray(focusTarget.feature.geometry.coordinates)) {
          const [lng, lat] = focusTarget.feature.geometry.coordinates;
          map.flyTo([lat, lng], Math.max(map.getZoom(), 8.5), {
            animate: true,
            duration: 1.0,
            easeLinearity: 0.22,
          });
        } else {
          const b = tempLayer.getBounds();
          if (b && b.isValid()) {
            map.flyToBounds(b, {
              padding: [65, 65],
              maxZoom: 10,
              animate: true,
              duration: 1.1,
              easeLinearity: 0.22,
            });
          }
        }
      } else if (focusTarget.layerGeoJson) {
        const tempLayer = L.geoJSON(focusTarget.layerGeoJson);
        const b = tempLayer.getBounds();
        if (b && b.isValid()) {
          map.flyToBounds(b, {
            padding: [45, 45],
            maxZoom: 10,
            animate: true,
            duration: 1.1,
            easeLinearity: 0.22,
          });
        }
      } else if (focusTarget.latlng) {
        map.flyTo(focusTarget.latlng, Math.max(map.getZoom(), 8.5), {
          animate: true,
          duration: 0.95,
          easeLinearity: 0.22,
        });
      }
    } catch (err) {
      console.error('Error flying to target:', err);
    }
  }, [focusTarget?.trigger]);

  // Synchronize viewport when in Split-Screen Compare mode with sync enabled
  useEffect(() => {
    if (!mapInstanceRef.current || !syncView || syncView.sourceId === mapId) return;
    const map = mapInstanceRef.current;
    const currentCenter = map.getCenter();
    const dist =
      Math.abs(currentCenter.lat - syncView.center[0]) +
      Math.abs(currentCenter.lng - syncView.center[1]);
    const zoomDiff = Math.abs(map.getZoom() - syncView.zoom);
    if (dist < 0.0005 && zoomDiff < 0.05) return;

    isSyncingRef.current = true;
    map.flyTo(syncView.center, syncView.zoom, {
      animate: true,
      duration: 0.35,
      easeLinearity: 0.3,
    });
    const timer = window.setTimeout(() => {
      isSyncingRef.current = false;
    }, 400);
    return () => window.clearTimeout(timer);
  }, [syncView?.center?.[0], syncView?.center?.[1], syncView?.zoom, syncView?.sourceId, mapId]);

  // Smooth Zoom helpers
  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(map.getCenter(), Math.min(map.getMaxZoom(), map.getZoom() + 1), {
      animate: true,
      duration: 0.4,
      easeLinearity: 0.25,
    });
  };

  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo(map.getCenter(), Math.max(map.getMinZoom(), map.getZoom() - 1), {
      animate: true,
      duration: 0.4,
      easeLinearity: 0.25,
    });
  };

  // Reset to Mongolia
  const handleResetMongolia = () => {
    mapInstanceRef.current?.flyTo([46.8625, 103.8467], 5, {
      animate: true,
      duration: 1.15,
      easeLinearity: 0.22,
    });
  };

  // Reset to World view
  const handleResetWorld = () => {
    mapInstanceRef.current?.flyTo([25.0, 15.0], 2, {
      animate: true,
      duration: 1.35,
      easeLinearity: 0.22,
    });
  };

  // Fit bounds to all active vector layers with smooth flyToBounds transition
  const handleFitAllLayers = () => {
    if (!mapInstanceRef.current || !vectorLayersGroupRef.current) return;
    const group = vectorLayersGroupRef.current;
    const combinedBounds = L.latLngBounds([]);

    group.eachLayer((layer: any) => {
      if (layer.getBounds) {
        const b = layer.getBounds();
        if (b && b.isValid()) combinedBounds.extend(b);
      }
    });

    if (combinedBounds.isValid()) {
      mapInstanceRef.current.flyToBounds(combinedBounds, {
        padding: [40, 40],
        animate: true,
        duration: 1.1,
        easeLinearity: 0.22,
      });
    } else {
      handleResetMongolia();
    }
  };

  // Format DMS
  const formatDMS = (deg: number, isLat: boolean) => {
    const absolute = Math.abs(deg);
    const d = Math.floor(absolute);
    const m = Math.floor((absolute - d) * 60);
    const s = Math.round(((absolute - d) * 60 - m) * 60);
    const direction = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    return `${d}° ${m}' ${s}" ${direction}`;
  };

  return (
    <div
      className={`relative w-full ${mapHeightClass} overflow-hidden rounded-xl border border-slate-300 ${
        effectiveTileType === 'contour' ? 'bg-white' : 'bg-slate-100'
      } shadow-md`}
    >
      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0"
        style={{ backgroundColor: effectiveTileType === 'contour' ? '#ffffff' : '#0f172a' }}
      />

      {/* Өнгөөр ангилсан давхаргын тайлбар (legend) */}
      {(vectorLayers || [])
        .filter((l) => l.visible && effectiveColorMode(l) === 'column' && l.colorByField && l.colorMap && Object.keys(l.colorMap).length > 0)
        .slice(0, 2)
        .map((l, li) => (
          <div
            key={l.id}
            className="absolute bottom-4 z-20 max-h-48 w-44 overflow-y-auto rounded-xl border border-slate-200 bg-white/95 p-2 text-[10px] shadow-lg backdrop-blur-md"
            style={{ left: `${16 + li * 184}px` }}
          >
            <div className="mb-1 font-black text-slate-800 truncate">
              {l.name}: {l.colorByField}
            </div>
            {Object.entries(l.colorMap!).slice(0, 40).map(([value, color]) => (
              <div key={value} className="flex items-center gap-1.5 py-px text-slate-700">
                <span className="inline-block h-3 w-3 shrink-0 rounded-sm border border-slate-300" style={{ backgroundColor: color }} />
                <span className="truncate">{value}</span>
              </div>
            ))}
          </div>
        ))}

      {/* Top Left: Official Basemap Tile Switcher (Satellite & Contour map) */}
      {showTileSwitcher && (
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white/95 p-1.5 shadow-lg backdrop-blur-md text-xs font-semibold">
          <button
            onClick={() => handleTileSwitch('satellite')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
              effectiveTileType === 'satellite'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Ямар ч бичиг, нэршилгүй хиймэл дагуулын суурь зураг"
          >
            <span>🛰️</span>
            <span>Хиймэл дагуул</span>
          </button>

          <button
            onClick={() => handleTileSwitch('contour')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors cursor-pointer ${
              effectiveTileType === 'contour'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Ямар ч хот, гол, аймгийн нэр бичигдээгүй цэвэр Contour map"
          >
            <span>🧭</span>
            <span>Contour map</span>
          </button>
        </div>
      )}

      {/* Top Right: View Controls (Zoom, Fit All Layers, Reset to Mongolia) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="flex h-9 w-9 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-100 cursor-pointer"
            title="Ойртуулах (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="flex h-9 w-9 items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Холдуулах (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handleFitAllLayers}
          className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/95 px-3 py-2 text-xs font-bold text-amber-900 shadow-md backdrop-blur-md hover:bg-amber-100 transition-colors cursor-pointer"
          title="Бүх идэвхтэй давхаргыг бүтнээр харуулах"
        >
          <span>🎯</span>
          <span>Давхаргад тааруулах</span>
        </button>

        <button
          onClick={handleResetMongolia}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-md hover:bg-slate-50 transition-colors cursor-pointer"
          title="Монгол орныг голлуулах"
        >
          <Navigation2 className="h-3.5 w-3.5 text-amber-600 rotate-45" />
          <span>Монгол</span>
        </button>

        <button
          onClick={handleResetWorld}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-md hover:bg-slate-50 transition-colors cursor-pointer"
          title="Дэлхийн харагдац"
        >
          <Compass className="h-3.5 w-3.5 text-sky-600" />
          <span>Дэлхий</span>
        </button>
      </div>

      {/* Bottom Left: Live GPS Coordinates Inspector (Decimal & DMS) */}
      {currentCoords && (
        <div className="absolute bottom-4 left-4 z-20 rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 font-mono text-[11px] text-slate-700 shadow-lg backdrop-blur-md space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">Координат (WGS84):</span>
            <span className="text-amber-700 font-bold">{currentCoords.lat.toFixed(4)}°N</span>
            <span className="text-slate-300">|</span>
            <span className="text-sky-700 font-bold">{currentCoords.lng.toFixed(4)}°E</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {formatDMS(currentCoords.lat, true)} · {formatDMS(currentCoords.lng, false)}
          </div>
        </div>
      )}

      {/* Bottom Right: Selected Feature / Entity Card */}
      {selectedEntityInfo && (
        <div className="absolute bottom-4 right-4 z-20 max-w-sm rounded-xl border border-sky-300 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-100 pb-1.5">
            <div>
              {selectedEntityInfo.layerName && (
                <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded mr-1.5 border border-sky-200">
                  {selectedEntityInfo.layerName}
                </span>
              )}
              <span className="text-slate-900 text-sm">{selectedEntityInfo.name}</span>
            </div>
            <button
              onClick={() => setSelectedEntityInfo(null)}
              className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
          {selectedEntityInfo.desc && (
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {selectedEntityInfo.desc}
            </p>
          )}
          {selectedEntityInfo.attributes && (
            <div className="pt-1 border-t border-slate-100 max-h-36 overflow-y-auto">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Атрибут хүснэгт (DBF):
              </span>
              <div className="space-y-0.5">
                {Object.entries(selectedEntityInfo.attributes).slice(0, 8).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[11px] gap-2">
                    <span className="text-slate-500 font-mono truncate">{k}:</span>
                    <span className="font-medium text-slate-800 text-right">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
