import React, { useState, useMemo } from 'react';
import {
  Layers,
  Compass,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  Table,
  Copy,
  Check,
  SplitSquareVertical,
  Columns,
  Maximize2,
  Tag,
  Hash,
  Database,
  Globe2,
  Lock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { RealLeafletMap, BasemapType } from './RealLeafletMap';
import { useApp } from '../context/AppContext';
import { ActiveGisLayer } from '../types';
import { sound } from '../utils/audio';
import {
  detectBestNameField,
  extractFeatureName,
  getLayerAttributeColumns,
  getActiveLayerFeatures,
  getFilteredLayerGeoJson,
  computeGeometryCenter,
} from '../utils/gisUtils';

interface ExploreModeProps {
  onOpenAuth?: () => void;
}

export const ExploreMode: React.FC<ExploreModeProps> = ({ onOpenAuth }) => {
  const { gisLayers, setGisLayers, updateGisLayer, recordLayerView, currentUser } = useApp();
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const showAutoSaveToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Mode: 'vector' ("Вектор зураг") vs 'real_satellite' ("Бодит хиймэл дагуул")
  const [mapType, setMapType] = useState<'vector' | 'real_satellite'>('vector');

  // Stacking & Compare view: 'overlay' (давхарлаж харах) vs 'split_compare' (зэрэгцүүлж харьцуулах)
  const [viewMode, setViewMode] = useState<'overlay' | 'split_compare'>('overlay');

  // Basemap selection: 'satellite' | 'contour'
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>('satellite');

  // Split-Screen settings
  const [splitTileLeft, setSplitTileLeft] = useState<BasemapType>('satellite');
  const [splitTileRight, setSplitTileRight] = useState<BasemapType>('contour');
  const [splitLayerIdLeft, setSplitLayerIdLeft] = useState<string>(gisLayers[0]?.id || '');
  const [splitLayerIdRight, setSplitLayerIdRight] = useState<string>(
    gisLayers[1]?.id || gisLayers[0]?.id || ''
  );
  const [syncSplitMaps, setSyncSplitMaps] = useState<boolean>(true);
  const [syncedViewState, setSyncedViewState] = useState<{
    center: [number, number];
    zoom: number;
    sourceId: string;
  } | null>(null);

  // Smooth zoom & pan focus target for RealLeafletMap
  const [focusTarget, setFocusTarget] = useState<{
    feature?: any;
    latlng?: [number, number];
    layerGeoJson?: any;
    trigger: number;
  } | null>(null);

  // Selected layer for Attribute Inspector
  const [selectedLayerId, setSelectedLayerId] = useState<string>(gisLayers[0]?.id || '');

  // Selected feature attributes in inspector
  const [selectedFeature, setSelectedFeature] = useState<{
    name: string;
    layerName: string;
    layerId: string;
    geometryType?: string;
    properties: Record<string, any>;
    latlng?: [number, number];
    feature?: any;
  } | null>(null);

  // Search feature inside selected layer
  const [featureSearch, setFeatureSearch] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(80);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Find active layer object
  const activeLayer = useMemo(() => {
    return gisLayers.find((l) => l.id === selectedLayerId) || gisLayers[0] || null;
  }, [gisLayers, selectedLayerId]);

  // Extract active features from the active layer (respecting selectedFeatureIndices if set)
  const layerFeaturesList = useMemo(() => {
    if (!activeLayer || !activeLayer.geojson) return [];
    const activeItems = getActiveLayerFeatures(activeLayer);
    return activeItems.map((item) => {
      const p = item.feature?.properties || {};
      const subtitle = p.TYPE || p.CATEGORY || p.CENTER || p.DESC || '';
      return {
        index: item.originalIndex,
        feature: item.feature,
        name: String(item.name),
        subtitle: String(subtitle),
        properties: p,
        geometryType: item.feature?.geometry?.type || activeLayer.geometryType,
      };
    });
  }, [activeLayer]);

  const handleToggleFeatureSelection = (featureIdx: number) => {
    if (!activeLayer) return;
    const totalCount = activeLayer.geojson?.features?.length || 0;
    const currentIndices = Array.isArray(activeLayer.selectedFeatureIndices)
      ? activeLayer.selectedFeatureIndices
      : Array.from({ length: totalCount }, (_, i) => i);
    const exists = currentIndices.includes(featureIdx);
    const nextIndices = exists
      ? currentIndices.filter((i) => i !== featureIdx)
      : [...currentIndices, featureIdx].sort((a, b) => a - b);
    updateGisLayer(activeLayer.id, {
      selectedFeatureIndices:
        nextIndices.length === totalCount ? undefined : nextIndices,
    });
    showAutoSaveToast(`✅ "${activeLayer.name}" давхаргын обьект сонголт автоматаар хадгалагдлаа.`);
    sound.playClick();
  };

  const handleSetAllFeatures = () => {
    if (!activeLayer) return;
    updateGisLayer(activeLayer.id, { selectedFeatureIndices: undefined });
    showAutoSaveToast(`✅ "${activeLayer.name}" давхаргын бүх обьект автоматаар хадгалагдлаа.`);
    sound.playClick();
  };

  const activeLayerColumns = useMemo(() => {
    if (!activeLayer?.geojson?.features) return [];
    return getLayerAttributeColumns(activeLayer.geojson.features);
  }, [activeLayer]);

  const handleLayerNameFieldChange = (layerId: string, newField: string) => {
    const target = gisLayers.find((l) => l.id === layerId);
    if (!target) return;
    const updatedFeatures = Array.isArray(target.geojson?.features)
      ? target.geojson.features.map((feat: any, idx: number) => {
          const props = feat?.properties || {};
          const resolved = extractFeatureName(props, idx, newField);
          return {
            ...feat,
            properties: {
              ...props,
              NAME_MN: resolved,
            },
          };
        })
      : [];
    updateGisLayer(layerId, {
      nameField: newField,
      geojson: target.geojson
        ? {
            ...target.geojson,
            features: updatedFeatures,
          }
        : target.geojson,
    });
    showAutoSaveToast(
      `✅ "${target.name}" давхаргын нэр унших багана (${newField}) автоматаар санд хадгалагдлаа.`
    );
    sound.playClick();
  };

  // Filtered features list
  const filteredFeatures = useMemo(() => {
    if (!featureSearch.trim()) return layerFeaturesList;
    const term = featureSearch.toLowerCase();
    return layerFeaturesList.filter(
      (item: any) =>
        item.name.toLowerCase().includes(term) ||
        item.subtitle.toLowerCase().includes(term) ||
        Object.values(item.properties).some((v) =>
          String(v).toLowerCase().includes(term)
        )
    );
  }, [layerFeaturesList, featureSearch]);

  // Toggle visibility of a layer
  const toggleLayerVisibility = (layerId: string) => {
    const target = gisLayers.find((l) => l.id === layerId);
    if (!target) return;
    if (!target.visible) {
      recordLayerView(target.id, target.name, target.geometryType);
    }
    updateGisLayer(layerId, { visible: !target.visible });
    showAutoSaveToast(
      `✅ "${target.name}" давхаргын харагдац автоматаар санд хадгалагдлаа.`
    );
    sound.playClick();
  };

  // Toggle all layers visible / hidden
  const setAllLayersVisibility = (visible: boolean) => {
    gisLayers.forEach((l) => {
      if (l.visible !== visible) {
        updateGisLayer(l.id, { visible });
      }
    });
    showAutoSaveToast(
      `✅ Бүх давхаргын харагдац (${visible ? 'Ил харагдах' : 'Нуусан'}) автоматаар санд хадгалагдлаа.`
    );
    sound.playClick();
  };

  // Handle map feature click
  const handleFeatureSelect = (
    properties: any,
    latlng?: [number, number],
    layerInfo?: { id: string; name: string; geometryType?: string }
  ) => {
    const featureName = extractFeatureName(properties, 0);
    const resolvedLayerName = layerInfo?.name || activeLayer?.name || 'Вектор давхарга';
    const resolvedLayerId = layerInfo?.id || activeLayer?.id || '';
    const resolvedGeom = layerInfo?.geometryType || activeLayer?.geometryType;

    recordLayerView(resolvedLayerId, resolvedLayerName, resolvedGeom);

    setSelectedFeature({
      name: String(featureName),
      layerName: resolvedLayerName,
      layerId: resolvedLayerId,
      geometryType: resolvedGeom,
      properties: properties || {},
      latlng,
    });

    if (layerInfo?.id && layerInfo.id !== selectedLayerId) {
      setSelectedLayerId(layerInfo.id);
    }

    sound.playSuccess();
  };

  // Handle selecting feature from sidebar list or attribute table with smooth zoom & pan
  const handleListFeatureClick = (item: any) => {
    const center = item.feature?.geometry
      ? computeGeometryCenter(item.feature.geometry)
      : null;
    const latlng: [number, number] | undefined = center
      ? [center.lat, center.lng]
      : undefined;

    // Ensure the active layer is visible so the user sees the feature when the map flies to it
    if (activeLayer && !activeLayer.visible) {
      setGisLayers((prev) =>
        prev.map((l) => (l.id === activeLayer.id ? { ...l, visible: true } : l))
      );
    }

    setSelectedFeature({
      name: item.name,
      layerName: activeLayer?.name || 'Вектор давхарга',
      layerId: activeLayer?.id || '',
      geometryType: item.geometryType,
      properties: item.properties,
      latlng,
      feature: item.feature,
    });

    setFocusTarget({
      feature: item.feature,
      latlng,
      trigger: Date.now(),
    });

    sound.playClick();
  };

  // Smoothly fly to a specific layer's geographic extent
  const handleFlyToLayer = (layer: ActiveGisLayer) => {
    if (!layer.visible) {
      setGisLayers((prev) =>
        prev.map((l) => (l.id === layer.id ? { ...l, visible: true } : l))
      );
    }
    const filteredGeoJson = getFilteredLayerGeoJson(layer);
    if (filteredGeoJson) {
      setFocusTarget({
        layerGeoJson: filteredGeoJson,
        trigger: Date.now(),
      });
    }
    sound.playClick();
  };

  // Re-focus map on currently selected feature
  const handleFlyToSelectedFeature = () => {
    if (!selectedFeature) return;
    setFocusTarget({
      feature: selectedFeature.feature,
      latlng: selectedFeature.latlng,
      trigger: Date.now(),
    });
    sound.playClick();
  };

  const handleSplitViewChange = (
    center: [number, number],
    zoom: number,
    sourceId: string
  ) => {
    if (!syncSplitMaps) return;
    setSyncedViewState({ center, zoom, sourceId });
  };

  // Copy helper
  const handleCopyAttributes = (data: any, key: string) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const visibleCount = gisLayers.filter((l) => l.visible).length;

  // Access guard: Must be registered/logged in and have mapAndChallengeAccess enabled
  const hasMapAccess =
    currentUser &&
    (currentUser.role === 'admin' || currentUser.mapAndChallengeAccess !== false);

  if (!currentUser || !hasMapAccess) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-xs max-w-2xl mx-auto text-center space-y-5 my-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">
            {!currentUser
              ? 'Газрын зураг ашиглахын тулд сайтад бүртгүүлнэ үү'
              : 'Газрын зураг, сорил ашиглах эрх хаалттай байна'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {!currentUser
              ? 'Сайтад бүртгүүлснээр бодит координаттай интерактив газрын зураг, вектор давхаргууд болон сорилыг чөлөөтэй ашиглах эрх шууд нээгдэнэ.'
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

  return (
    <div className="space-y-5">
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-emerald-400 bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-2xl">
          <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Compass className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Газрын Зураг
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Бодит координаттай вектор (.shp / GeoJSON) сан, сансрын хиймэл дагуул болон Contour map
          </p>
        </div>

        {/* Primary Map Format Buttons: "Вектор зураг" vs "Бодит хиймэл дагуул" */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-semibold gap-1">
            <button
              onClick={() => {
                setMapType('vector');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                mapType === 'vector'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Вектор зураг</span>
              <span className="rounded bg-black/10 px-1.5 py-0.2 text-[10px] font-mono">
                {gisLayers.length}
              </span>
            </button>

            <button
              onClick={() => {
                setMapType('real_satellite');
                sound.playClick();
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                mapType === 'real_satellite'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🛰️</span>
              <span>Бодит хиймэл дагуул</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Basemaps & Stacking Modes */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Basemap Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Globe2 className="h-3 w-3" /> Суурь зураг:
          </span>
          <button
            onClick={() => {
              setActiveBasemap('satellite');
              sound.playClick();
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
              activeBasemap === 'satellite'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🛰️</span>
            <span>Хиймэл дагуулын зураг</span>
          </button>

          <button
            onClick={() => {
              setActiveBasemap('contour');
              sound.playClick();
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer border ${
              activeBasemap === 'contour' || activeBasemap === 'clean_nolabels'
                ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🧭</span>
            <span>Contour map</span>
          </button>
        </div>

        {/* View Mode: Overlay vs Split-Screen Compare */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-auto border border-slate-200">
          <button
            onClick={() => {
              setViewMode('overlay');
              sound.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'overlay'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="h-3.5 w-3.5" />
            <span>Давхарлаж харах</span>
          </button>

          <button
            onClick={() => {
              setViewMode('split_compare');
              sound.playClick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === 'split_compare'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Зэрэгцүүлж харьцуулах</span>
          </button>

          {viewMode === 'split_compare' && (
            <button
              onClick={() => {
                setSyncSplitMaps((prev) => !prev);
                sound.playClick();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ml-1 border ${
                syncSplitMaps
                  ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
              title="Хоёр дэлгэцийн томруулалт ба шилжилтийг зэрэг ижилсүүлэх"
            >
              <span>🔗</span>
              <span>Харагдац ижилсүүлэх</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace: Left Column = Map + Attribute Information Below Map; Right Column = Map Repository List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Zone (lg:col-span-8): Interactive Map & Attribute Information Directly Below the Map */}
        <div className="lg:col-span-8 space-y-4">
          {viewMode === 'split_compare' ? (
            /* Split-Screen Compare Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Screen */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs">
                  <span className="font-bold text-slate-800">Зүүн дэлгэц:</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={splitLayerIdLeft}
                      onChange={(e) => setSplitLayerIdLeft(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
                    >
                      {gisLayers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={splitTileLeft}
                      onChange={(e) => setSplitTileLeft(e.target.value as BasemapType)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                    >
                      <option value="satellite">🛰️ Хиймэл дагуул</option>
                      <option value="contour">🧭 Contour map</option>
                    </select>
                  </div>
                </div>
                <RealLeafletMap
                  mapId="split_left"
                  tileType={splitTileLeft}
                  vectorLayers={gisLayers.filter((l) => l.id === splitLayerIdLeft)}
                  mapHeightClass="h-[440px]"
                  onFeatureSelect={handleFeatureSelect}
                  showPins={false}
                  focusTarget={focusTarget}
                  syncView={syncSplitMaps ? syncedViewState : null}
                  onViewChange={handleSplitViewChange}
                />
              </div>

              {/* Right Screen */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-xs">
                  <span className="font-bold text-slate-800">Баруун дэлгэц:</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={splitLayerIdRight}
                      onChange={(e) => setSplitLayerIdRight(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800"
                    >
                      {gisLayers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={splitTileRight}
                      onChange={(e) => setSplitTileRight(e.target.value as BasemapType)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                    >
                      <option value="satellite">🛰️ Хиймэл дагуул</option>
                      <option value="contour">🧭 Contour map</option>
                    </select>
                  </div>
                </div>
                <RealLeafletMap
                  mapId="split_right"
                  tileType={splitTileRight}
                  vectorLayers={gisLayers.filter((l) => l.id === splitLayerIdRight)}
                  mapHeightClass="h-[440px]"
                  onFeatureSelect={handleFeatureSelect}
                  showPins={false}
                  focusTarget={focusTarget}
                  syncView={syncSplitMaps ? syncedViewState : null}
                  onViewChange={handleSplitViewChange}
                />
              </div>
            </div>
          ) : (
            /* Overlay Mode (All visible layers stacked on real GIS map) */
            <div className="space-y-2">
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs bg-white">
                <RealLeafletMap
                  mapId="explore_main"
                  tileType={activeBasemap}
                  onTileTypeChange={setActiveBasemap}
                  vectorLayers={gisLayers.filter((l) => l.visible)}
                  onFeatureSelect={handleFeatureSelect}
                  showPins={mapType === 'real_satellite'}
                  mapHeightClass="h-[520px] sm:h-[600px]"
                  focusTarget={focusTarget}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 flex-wrap gap-2">
                <span>
                  💡 <b>Зөвлөмж:</b> Газрын зураг дээрх дурын вектор обьект дээр дарж доорх аттрибют мэдээллийг харна уу.
                </span>
                <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  WGS84 EPSG:4326 бодит координат
                </span>
              </div>
            </div>
          )}

          {/* BELOW THE MAP: Attribute Information Panel (Газрын зургийн доод талд харуулах аттрибют мэдээлэл) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Table className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    📊 Аттрибют мэдээлэл (.DBF шинж чанарын хүснэгт)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Идэвхтэй давхарга: <b className="text-slate-800">{activeLayer?.name || 'Вектор давхарга'}</b> ({activeLayer?.geometryType || 'Вектор'})
                  </p>
                </div>
              </div>

              {/* DBF Name Field Selector */}
              {activeLayer && activeLayerColumns.length > 0 && (
                <div className="flex items-center gap-2 bg-sky-50/80 border border-sky-200 rounded-xl px-3 py-1.5 text-xs">
                  <Database className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                  <span className="font-bold text-sky-950 whitespace-nowrap">
                    Нэр унших багана (.dbf):
                  </span>
                  <select
                    value={
                      activeLayer.nameField ||
                      detectBestNameField(activeLayer.geojson?.features || []) ||
                      activeLayerColumns[0]?.key ||
                      ''
                    }
                    onChange={(e) =>
                      handleLayerNameFieldChange(activeLayer.id, e.target.value)
                    }
                    className="rounded-lg border border-sky-200 bg-white px-2 py-1 text-xs text-slate-800 font-semibold focus:border-sky-500 focus:outline-none"
                  >
                    {activeLayerColumns.map((col) => (
                      <option key={col.key} value={col.key}>
                        {col.key} ({col.sampleValues.join(', ') || 'хоосон'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedFeature ? (
              <div className="space-y-3">
                {/* Selected Feature Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-black text-slate-900">
                        📍 {selectedFeature.name}
                      </span>
                      <span className="rounded bg-white border border-amber-300 px-2 py-0.5 text-[11px] font-mono text-amber-900 font-semibold">
                        {selectedFeature.geometryType || 'Обьект'}
                      </span>
                      <span className="text-xs text-slate-600">
                        Давхарга: <b>{selectedFeature.layerName}</b>
                      </span>
                      {selectedFeature.latlng && (
                        <span className="font-mono text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          ({selectedFeature.latlng[0].toFixed(4)}°, {selectedFeature.latlng[1].toFixed(4)}°)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(selectedFeature.feature || selectedFeature.latlng) && (
                      <button
                        onClick={handleFlyToSelectedFeature}
                        className="flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                        title="Зураг дээр энэ обьект руу зөөлөн шилжиж томруулах"
                      >
                        <span>🎯</span>
                        <span>Зураг дээр төвлөрүүлэх</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleCopyAttributes(selectedFeature.properties, 'feature_props')}
                      className="flex items-center gap-1 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      {copiedKey === 'feature_props' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedKey === 'feature_props' ? 'Хууллаа' : 'JSON хуулах'}</span>
                    </button>
                    <button
                      onClick={() => setSelectedFeature(null)}
                      className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      title="Хаах"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Selected Feature Key-Value Grid */}
                {Object.entries(selectedFeature.properties).length === 0 ? (
                  <div className="p-4 text-slate-400 italic text-center text-xs">
                    Аттрибют мэдээлэл байхгүй байна.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[260px] overflow-y-auto p-1">
                    {Object.entries(selectedFeature.properties).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 hover:bg-white transition-colors"
                      >
                        <span className="font-mono font-bold text-sky-800 text-[10px] uppercase tracking-wider truncate">
                          {k}
                        </span>
                        <span className="font-mono text-slate-900 font-semibold text-xs mt-1 break-all">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* When no single feature is clicked yet, show an interactive DBF Attribute Table of the active layer */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Газрын зураг дээрх обьект дээр эсвэл доорх хүснэгтийн мөр дээр дарж дэлгэрэнгүй аттрибют мэдээллийг харна уу:
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Нийт {filteredFeatures.length} обьект
                  </span>
                </div>

                {filteredFeatures.length > 0 ? (
                  <div className="overflow-x-auto max-h-[240px] overflow-y-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3 font-bold">#</th>
                          <th className="py-2 px-3 font-bold">Обьектийн нэр</th>
                          <th className="py-2 px-3 font-bold">Геометр</th>
                          {activeLayerColumns.slice(0, 4).map((col) => (
                            <th key={col.key} className="py-2 px-3 font-mono font-bold text-sky-900">
                              {col.key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredFeatures.slice(0, 30).map((item: any, idx: number) => (
                          <tr
                            key={item.index}
                            onClick={() => handleListFeatureClick(item)}
                            className="hover:bg-amber-50/70 cursor-pointer transition-colors"
                          >
                            <td className="py-1.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-1.5 px-3 font-bold text-slate-900">{item.name}</td>
                            <td className="py-1.5 px-3 font-mono text-[11px] text-slate-500">
                              {item.geometryType}
                            </td>
                            {activeLayerColumns.slice(0, 4).map((col) => (
                              <td
                                key={col.key}
                                className="py-1.5 px-3 font-mono text-slate-700 truncate max-w-[160px]"
                              >
                                {item.properties?.[col.key] !== undefined
                                  ? String(item.properties[col.key])
                                  : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                    Сонгосон давхаргад обьект олдсонгүй.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Zone (lg:col-span-4): Map Repository Vertical List (Газрын зургийн сан баруун хажуу талд жагсаалтаар) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Map Layer Catalog Vertical List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Database className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    Газрын зургийн сан ({gisLayers.length} давхарга)
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Идэвхтэй харагдаж буй: <b className="text-slate-800">{visibleCount}</b>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  onClick={() => setAllLayersVisibility(true)}
                  className="text-sky-600 hover:text-sky-800 font-semibold cursor-pointer"
                >
                  Бүгдийг нээх
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setAllLayersVisibility(false)}
                  className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  Нуух
                </button>
              </div>
            </div>

            {/* Vertical list of layers in the repository */}
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {gisLayers.map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/70 shadow-2xs'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Visibility Toggle Button */}
                      <button
                        onClick={() => toggleLayerVisibility(layer.id)}
                        title={layer.visible ? 'Давхаргыг нуух' : 'Давхаргыг харуулах'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                          layer.visible
                            ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                            : 'bg-slate-200/70 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {layer.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Color Dot */}
                      <span
                        className="h-3 w-3 rounded-full shrink-0 border border-black/20"
                        style={{ backgroundColor: layer.color }}
                      />

                      {/* Layer Name / Select to inspect & smoothly fly to layer */}
                      <button
                        onClick={() => {
                          setSelectedLayerId(layer.id);
                          setSelectedFeature(null);
                          handleFlyToLayer(layer);
                        }}
                        className={`text-xs cursor-pointer text-left truncate flex-1 ${
                          isSelected
                            ? 'text-slate-900 font-bold'
                            : 'text-slate-700 font-semibold'
                        }`}
                      >
                        {layer.name}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Smooth Fly-to-Layer Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLayerId(layer.id);
                          handleFlyToLayer(layer);
                        }}
                        title="Энэ давхарга руу зөөлөн шилжиж томруулах"
                        className="rounded-md bg-white hover:bg-amber-100 border border-slate-200 hover:border-amber-300 px-1.5 py-0.5 text-[10px] transition-colors cursor-pointer"
                      >
                        🎯
                      </button>

                      {/* Count badge */}
                      <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-700">
                        {layer.featureCount}
                      </span>

                      {/* Geometry type badge */}
                      <span
                        className="text-xs"
                        title={layer.geometryType}
                      >
                        {layer.geometryType === 'Polygon' || layer.geometryType === 'MultiPolygon'
                          ? '◻️'
                          : layer.geometryType === 'LineString'
                          ? '〰️'
                          : '📍'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Layer Features Browser (Searchable vertical list of objects in selected layer) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-sky-600" />
                <span className="text-xs font-bold text-slate-800">
                  Давхаргын обьектууд ({filteredFeatures.length})
                </span>
              </div>
              {Array.isArray(activeLayer?.selectedFeatureIndices) && (
                <button
                  type="button"
                  onClick={handleSetAllFeatures}
                  className="rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-950 transition-colors cursor-pointer"
                >
                  Бүгдийг харуулах
                </button>
              )}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Обьектын нэр, шинж чанараар хайх..."
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Feature list */}
            <div className="max-h-[260px] overflow-y-auto space-y-1.5 text-xs pr-1">
              {filteredFeatures.length === 0 ? (
                <p className="text-center text-slate-400 italic py-3 text-[11px]">
                  Хайлтад тохирох обьект олдсонгүй.
                </p>
              ) : (
                <>
                  {filteredFeatures.slice(0, visibleLimit).map((item: any) => {
                    const isFeatureSelected = selectedFeature?.name === item.name;
                    return (
                      <button
                        key={item.index}
                        onClick={() => handleListFeatureClick(item)}
                        className={`w-full text-left p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isFeatureSelected
                            ? 'border-amber-400 bg-amber-50/80 font-bold text-slate-900 shadow-2xs'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="truncate">
                          <p className="font-semibold text-xs truncate">{item.name}</p>
                          {item.subtitle && (
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <span className="rounded bg-white border border-slate-200 px-1.5 py-0.2 text-[9px] font-mono text-slate-500 shrink-0">
                          {item.geometryType}
                        </span>
                      </button>
                    );
                  })}
                  {filteredFeatures.length > visibleLimit && (
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 100)}
                      className="w-full py-2 text-center text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Цааш харах (+{filteredFeatures.length - visibleLimit} обьект)
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
