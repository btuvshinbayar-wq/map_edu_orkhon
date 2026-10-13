import React, { useState, useEffect } from 'react';
import shp from 'shpjs';
import {
  Upload,
  Layers,
  Code2,
  Copy,
  Check,
  Compass,
  Sliders,
  CheckCircle2,
  Sparkles,
  Info,
  Terminal,
  FileCode,
  Download,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Plus,
  RotateCcw,
  BookOpen,
  SplitSquareVertical,
  Columns,
  Maximize2,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { RealLeafletMap, BasemapType } from './RealLeafletMap';
import { ActiveGisLayer } from '../types';
import { useApp } from '../context/AppContext';
import {
  detectBestNameField,
  extractFeatureName,
  getLayerAttributeColumns,
  optimizeGeoJsonForWeb,
  calculateFeatureLengthKm,
  calculateFeatureAreaKm2,
} from '../utils/gisUtils';

export const CustomMapStudio: React.FC = () => {
  const {
    gisLayers: layers,
    setGisLayers: setLayers,
    addGisLayer,
    updateGisLayer,
    deleteGisLayer,
    resetGisLayers,
  } = useApp();

  // View Mode: 'overlay' (All layers stacked) vs 'split_compare' (Side-by-side comparison)
  const [viewMode, setViewMode] = useState<'overlay' | 'split_compare'>('overlay');

  // Basemap tile selection for main / overlay map
  const [activeTileType, setActiveTileType] = useState<BasemapType>('satellite');

  // Split-Screen Compare Basemaps & Layer Selection
  const [splitTileLeft, setSplitTileLeft] = useState<BasemapType>('satellite');
  const [splitTileRight, setSplitTileRight] = useState<BasemapType>('contour');
  const [splitLayerIdLeft, setSplitLayerIdLeft] = useState<string>(layers[0]?.id || '');
  const [splitLayerIdRight, setSplitLayerIdRight] = useState<string>(layers[1]?.id || layers[0]?.id || '');

  // Fit bounds trigger counter
  const [fitBoundsTrigger, setFitBoundsTrigger] = useState(1);

  // Status message & Auto-Save Toast
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>({
    type: 'success',
    text: 'Албан ёсны бодит координаттай вектор давхаргууд амжилттай бэлэн боллоо. Та *.shp.zip эсвэл GeoJSON файлуудаа нэмж хадгалах боломжтой.',
  });
  const [autoSaveToast, setAutoSaveToast] = useState<string | null>(null);

  const triggerAutoSaveNotification = (message: string) => {
    setAutoSaveToast(message);
    setStatusMsg({
      type: 'success',
      text: message,
    });
  };

  useEffect(() => {
    if (!autoSaveToast) return;
    const timer = setTimeout(() => setAutoSaveToast(null), 4000);
    return () => clearTimeout(timer);
  }, [autoSaveToast]);

  // Renaming Layer state
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string>('');

  // Selected layer for styling panel
  const [selectedLayerId, setSelectedLayerId] = useState<string>(layers[0]?.id || '');

  // Object selection filter & pagination in CustomMapStudio
  const [objSearch, setObjSearch] = useState<string>('');
  const [objMinMetric, setObjMinMetric] = useState<string>('');
  const [objMaxMetric, setObjMaxMetric] = useState<string>('');
  const [objLimit, setObjLimit] = useState<number>(60);

  // Educational Guide tab: 'commands' | 'structure' | 'code'
  const [activeGuideTab, setActiveGuideTab] = useState<'commands' | 'structure' | 'code'>('commands');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    const nextVis = !target.visible;
    updateGisLayer(layerId, { visible: nextVis });
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: "${target.name}" давхаргын харагдах төлөв (${nextVis ? 'Ил харагдах' : 'Нуусан'}) санд амжилттай хадгалагдлаа.`
    );
  };

  // Start renaming a layer
  const startRename = (layer: ActiveGisLayer) => {
    setEditingLayerId(layer.id);
    setEditingLayerName(layer.name);
  };

  // Save renamed layer
  const saveRename = () => {
    if (!editingLayerId || !editingLayerName.trim()) return;
    const newName = editingLayerName.trim();
    updateGisLayer(editingLayerId, { name: newName });
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: Давхаргын нэрийг "${newName}" болгон өөрчилж санд амжилттай хадгаллаа.`
    );
    setEditingLayerId(null);
  };

  // Delete a layer
  const handleDeleteLayer = (layerId: string) => {
    const layerToDelete = layers.find((l) => l.id === layerId);
    if (!layerToDelete) return;

    deleteGisLayer(layerId);
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: "${layerToDelete.name}" давхаргыг устгаж өөрчлөлтийг санд амжилттай хадгаллаа.`
    );
    if (selectedLayerId === layerId) {
      const remaining = layers.filter((l) => l.id !== layerId);
      if (remaining.length > 0) setSelectedLayerId(remaining[0].id);
    }
  };

  // Clear / Reset all layers
  const handleResetToDefaults = () => {
    resetGisLayers();
    triggerAutoSaveNotification(
      '✅ Автоматаар хадгалагдлаа: SHP вектор зургийн сан бүрэн цэвэрлэгдэж, өөрчлөлт санд амжилттай хадгалагдлаа.'
    );
    setFitBoundsTrigger((prev) => prev + 1);
  };

  // Upload and add new SHP (.zip) or GeoJSON file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMsg({
      type: 'info',
      text: `"${file.name}" файлыг уншиж, координатыг задлан хөрвүүлж байна...`,
    });

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let geojson: any = null;

      if (ext === 'zip') {
        const arrayBuffer = await file.arrayBuffer();
        const parsed = await shp(arrayBuffer);
        geojson = Array.isArray(parsed) ? parsed[0] : parsed;
      } else if (ext === 'geojson' || ext === 'json') {
        const text = await file.text();
        geojson = JSON.parse(text);
      } else if (ext === 'shp') {
        setStatusMsg({
          type: 'error',
          text: 'Анхаар: Дан *.shp файл нь дангаараа шинж чанар (.dbf) болон координатын тусгал (.prj)-гүй байдаг. Та *.shp, *.dbf, *.shx, *.prj файлуудаа хамтад нь нэг .ZIP архив болгон оруулна уу, эсвэл GeoJSON файл оруулна уу.',
        });
        return;
      } else {
        setStatusMsg({
          type: 'error',
          text: 'Дэмжигдээгүй формат. Та *.zip (shp, dbf, prj агуулсан) эсвэл *.geojson / *.json файл сонгоно уу.',
        });
        return;
      }

      if (!geojson || !geojson.features) {
        throw new Error('Файлаас гео-обьектууд олдсонгүй.');
      }

      // Simplify dense geometries and resolve DBF names so map renders at 60 FPS without lag
      const {
        geojson: optimizedGeojson,
        originalVertexCount,
        optimizedVertexCount,
        detectedNameField,
      } = optimizeGeoJsonForWeb(geojson);
      geojson = optimizedGeojson;

      const featureCount = geojson.features.length;
      const firstGeomType = geojson.features[0]?.geometry?.type || 'Mixed';
      const cleanName = file.name.replace(/\.[^/.]+$/, '');

      // Assign distinct vibrant color for new layer
      const colorPalette = ['#0284c7', '#059669', '#d97706', '#8b5cf6', '#dc2626', '#0891b2', '#ea580c'];
      const pickedColor = colorPalette[layers.length % colorPalette.length];

      const newLayer: ActiveGisLayer = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: cleanName,
        visible: true,
        color: pickedColor,
        fillColor: pickedColor,
        fillOpacity: 0.35,
        weight: 2.5,
        geometryType: firstGeomType as any,
        featureCount,
        geojson,
        nameField: detectedNameField || undefined,
        isOfficial: false,
        createdAt: new Date().toISOString().split('T')[0],
      };

      addGisLayer(newLayer);
      setSelectedLayerId(newLayer.id);
      const vertexInfo =
        originalVertexCount > optimizedVertexCount
          ? ` (Хурдны оновчлол: ${originalVertexCount.toLocaleString()} → ${optimizedVertexCount.toLocaleString()} цэг)`
          : '';
      const colInfo = detectedNameField ? ` · Нэрийн багана: [${detectedNameField}]` : '';
      triggerAutoSaveNotification(
        `✅ Автоматаар хадгалагдлаа! "${cleanName}" (${featureCount} обьект)${colInfo}${vertexInfo} давхарга вектор зургийн санд амжилттай хадгалагдлаа.`
      );
      setFitBoundsTrigger((prev) => prev + 1);

      // Reset file input
      e.target.value = '';
    } catch (err: any) {
      console.error('Vector parsing error:', err);
      setStatusMsg({
        type: 'error',
        text: `Файлыг хөрвүүлэхэд алдаа гарлаа: ${err?.message || 'Формат буруу байна'}. WGS84 тусгалтай эсэхийг шалгана уу.`,
      });
    }
  };

  // Update style of selected layer
  const updateSelectedLayerStyle = (updates: Partial<ActiveGisLayer>) => {
    if (!selectedLayerId) return;
    const target = layers.find((l) => l.id === selectedLayerId);
    updateGisLayer(selectedLayerId, updates);
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: "${target?.name || 'Давхарга'}" загвар/өнгөний өөрчлөлт санд амжилттай хадгалагдлаа.`
    );
  };

  // Update the DBF column used for reading object names in a layer
  const handleLayerNameFieldChange = (layerId: string, newField: string) => {
    const target = layers.find((l) => l.id === layerId);
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
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: "${target.name}" давхаргын обьектийн нэр унших баганыг "${newField}" болгон өөрчилж санд амжилттай хадгаллаа.`
    );
  };

  // Toggle between "Бүх обьектууд" (undefined) and "Тодорхой обьектууд сонгох" (array of indices)
  const handleSetAllFeaturesMode = (layerId: string) => {
    const target = layers.find((l) => l.id === layerId);
    updateGisLayer(layerId, { selectedFeatureIndices: undefined });
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: "${target?.name || 'Давхарга'}"-ийн бүх обьектийг идэвхжүүлж санд амжилттай хадгаллаа.`
    );
  };

  const handleToggleSingleFeature = (layerId: string, featureIdx: number, totalCount: number) => {
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    const currentIndices = Array.isArray(target.selectedFeatureIndices)
      ? target.selectedFeatureIndices
      : Array.from({ length: totalCount }, (_, i) => i);

    const exists = currentIndices.includes(featureIdx);
    const nextIndices = exists
      ? currentIndices.filter((i) => i !== featureIdx)
      : [...currentIndices, featureIdx].sort((a, b) => a - b);

    updateGisLayer(layerId, {
      selectedFeatureIndices:
        nextIndices.length === totalCount ? undefined : nextIndices,
    });
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: "${target.name}" давхаргын обьект сонголт (${nextIndices.length}/${totalCount}) санд амжилттай хадгалагдлаа.`
    );
  };

  const handleClearSelectedFeatures = (layerId: string) => {
    const target = layers.find((l) => l.id === layerId);
    updateGisLayer(layerId, { selectedFeatureIndices: [] });
    triggerAutoSaveNotification(
      `✅ Автоматаар хадгалагдлаа: "${target?.name || 'Давхарга'}"-ийн обьект сонголтыг цэвэрлэж санд хадгаллаа.`
    );
  };

  // Download layer as GeoJSON
  const handleDownloadLayer = (layer: ActiveGisLayer) => {
    const blob = new Blob([JSON.stringify(layer.geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${layer.name.replace(/[^a-zA-Z0-9_\u0400-\u04FF]/g, '_')}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) || layers[0];
  const visibleLayersCount = layers.filter((l) => l.visible).length;

  // For Split Compare mode: get left and right layers
  const splitLayerLeft = layers.find((l) => l.id === splitLayerIdLeft);
  const splitLayerRight = layers.find((l) => l.id === splitLayerIdRight);

  // Code snippets for educational section
  const gdalCommand = `# 1. GDAL / ogr2ogr ашиглан Shapefile (*.shp)-ийг WGS84 GeoJSON болгон хөрвүүлэх:
ogr2ogr -f GeoJSON -t_srs EPSG:4326 mongolia_boundary.geojson input.shp

# 2. Shapefile файлуудыг сайтад оруулахад бэлтгэж нэг ZIP архив болгох:
zip mongolia_layer.zip input.shp input.dbf input.shx input.prj`;

  const pythonCommand = `import geopandas as gpd

# 1. *.shp файлыг унших (бодит координат, атрибутуудын хамт)
gdf = gpd.read_file("input.shp")

# 2. Дэлхийн стандарт WGS84 (EPSG:4326) руу шилжүүлэх
if gdf.crs != "EPSG:4326":
    gdf = gdf.to_crs(epsg=4326)

# 3. Веб системд шууд орох GeoJSON хэлбэрээр экспортлох
gdf.to_file("mongolia_wgs84.geojson", driver="GeoJSON")
print("Амжилттай хөрвүүлэгдлээ! Сайтад шууд чирч оруулна уу.")`;

  const leafletCodeSnippet = `// Leaflet + shpjs ашиглан олон SHP давхаргыг бодит хиймэл дагуул дээр зэрэгцүүлж давхарлах
import L from 'leaflet';
import shp from 'shpjs';

const map = L.map('map').setView([46.86, 103.84], 5);

// 1. Бодит хиймэл дагуулын суурь давхарга (Esri World Imagery)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri'
}).addTo(map);

// 2. SHP архивыг ачаалах ба давхарга бүрийг өөрийн өнгөөр дүрслэх
fetch('/layers/mongolia_layers.zip')
  .then(res => res.arrayBuffer())
  .then(buffer => shp(buffer))
  .then(geojson => {
    L.geoJSON(geojson, {
      style: {
        color: '#0284c7',
        weight: 2.5,
        fillColor: '#38bdf8',
        fillOpacity: 0.35
      },
      onEachFeature: (feature, layer) => {
        layer.bindPopup('<b>' + (feature.properties.NAME_MN || 'Обьект') + '</b>');
      }
    }).addTo(map);
  });`;

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Layers className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Албан Ёсны GIS & *.SHP Вектор Давхаргын Студи
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Бодит координаттай Shapefile (*.shp.zip), GeoJSON өгөгдлийг оруулах, хадгалах, нэр солих, давхаргуудыг нэмэх хасах, зэрэгцүүлж давхарлаж харах систем
          </p>
        </div>

        {/* View Mode Switcher: Давхарлаж харах vs Зэрэгцүүлж харах */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 p-1 text-xs font-semibold self-start lg:self-auto">
          <button
            onClick={() => setViewMode('overlay')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition-all cursor-pointer ${
              viewMode === 'overlay'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>1. Давхарлаж харах (Нэгдсэн зураг)</span>
          </button>
          <button
            onClick={() => setViewMode('split_compare')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 transition-all cursor-pointer ${
              viewMode === 'split_compare'
                ? 'bg-sky-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="h-4 w-4" />
            <span>2. Зэрэгцүүлж харах (2 зураг харьцуулах)</span>
          </button>
        </div>
      </div>

      {/* Floating Auto-Save Toast Notification */}
      {autoSaveToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-400 bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-white shrink-0" />
          <span>{autoSaveToast}</span>
          <button
            type="button"
            onClick={() => setAutoSaveToast(null)}
            className="ml-2 text-emerald-100 hover:text-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Status Notification Banner */}
      {statusMsg && (
        <div
          className={`flex items-start gap-2.5 rounded-xl p-3 text-xs border shadow-2xs ${
            statusMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
              : statusMsg.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-950'
              : 'border-sky-200 bg-sky-50 text-sky-950'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : statusMsg.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{statusMsg.text}</div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-700 ml-2 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 2-Zone Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Map Area (Single Map in Overlay Mode OR Dual Maps in Split Compare Mode) */}
        <div className="lg:col-span-8 space-y-4">
          {viewMode === 'overlay' ? (
            /* Mode 1: Multi-layer Overlay on Single Map */
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-xs border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Давхарлаж харах горим:
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold text-[11px]">
                    {visibleLayersCount} / {layers.length} давхарга идэвхтэй
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Зохиомол зураггүй · Зөвхөн бодит албан ёсны давхаргууд</span>
                </div>
              </div>

              <RealLeafletMap
                vectorLayers={layers}
                tileType={activeTileType}
                onTileTypeChange={setActiveTileType}
                showTileSwitcher={true}
                fitBoundsTrigger={fitBoundsTrigger}
                mapHeightClass="h-[520px] sm:h-[620px]"
              />
            </div>
          ) : (
            /* Mode 2: Side-by-Side Split Compare View */
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1 text-xs border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Columns className="h-4 w-4 text-sky-600" />
                  Зэрэгцүүлж харах горим (2 газрын зургийг зэрэгцүүлэн харьцуулах)
                </span>
                <span className="text-[11px] text-slate-500">
                  Зүүн ба баруун талын суурь зураг, давхаргыг бие даан сонгоно
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Left Compare Pane */}
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800">Зүүн тал:</span>
                    <select
                      value={splitLayerIdLeft}
                      onChange={(e) => setSplitLayerIdLeft(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    >
                      {layers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <RealLeafletMap
                    vectorLayers={splitLayerLeft ? [{ ...splitLayerLeft, visible: true }] : []}
                    tileType={splitTileLeft}
                    onTileTypeChange={setSplitTileLeft}
                    showTileSwitcher={true}
                    mapHeightClass="h-[440px]"
                  />
                </div>

                {/* Right Compare Pane */}
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-800">Баруун тал:</span>
                    <select
                      value={splitLayerIdRight}
                      onChange={(e) => setSplitLayerIdRight(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                    >
                      {layers.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <RealLeafletMap
                    vectorLayers={splitLayerRight ? [{ ...splitLayerRight, visible: true }] : []}
                    tileType={splitTileRight}
                    onTileTypeChange={setSplitTileRight}
                    showTileSwitcher={true}
                    mapHeightClass="h-[440px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Notice Card */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-base mt-0.5">💡</span>
            <div className="leading-relaxed">
              <strong>Хадгалалт & Бодит Координат:</strong> Таны оруулсан *.shp.zip болон GeoJSON файлууд хөтчийн санах ойд (localStorage) автоматаар хадгалагддаг тул хуудсыг дахин ачаалсан ч арилахгүй. Давхарга бүр бодит WGS84 координат ба метрийн масштабтай (км / м).
              <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 text-sky-900 font-medium">
                🎯 <strong>Уралдаанд ашиглах:</strong> Эдгээр вектор давхаргуудаас 1 обьектийг (жишээ нь: Хөвсгөл аймаг) таслан салгаж, нэрийг нь нуусан контур даалгавар бэлтгэхийг хүсвэл дээд <strong>"Вектор/SHP-аас Даалгавар Бэлтгэгч"</strong> цэсийг сонгоно уу.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Layer Management Panel (Add, Rename, Delete, Visibility, Style) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Upload & Add Layer Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-amber-600" />
                Шинэ *.SHP.ZIP эсвэл GeoJSON нэмэх
              </span>
            </div>

            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-4 hover:bg-amber-100/60 transition-colors cursor-pointer text-center">
              <Upload className="h-6 w-6 text-amber-600" />
              <span className="text-xs font-bold text-slate-900">
                *.shp.zip эсвэл GeoJSON файл сонгох
              </span>
              <span className="text-[10px] text-slate-500">
                shp, dbf, shx, prj бүхий ZIP архив эсвэл .geojson
              </span>
              <input
                type="file"
                accept=".zip,.geojson,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 2. Active Layers List (Rename, Show/Hide, Delete) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-bold text-slate-900">Давхаргуудын жагсаалт</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-700">
                  {layers.length}
                </span>
              </div>

              <button
                onClick={handleResetToDefaults}
                className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer font-bold"
                title="Бүх давхаргыг цэвэрлэж хоослох"
              >
                <Trash2 className="h-3 w-3" />
                <span>Санг хоослох</span>
              </button>
            </div>

            {/* List of layers */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {layers.map((layer) => {
                const isSelected = selectedLayerId === layer.id;
                const isEditing = editingLayerId === layer.id;

                return (
                  <div
                    key={layer.id}
                    className={`rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      {/* Left: Visibility toggle & Name */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          onClick={() => toggleLayerVisibility(layer.id)}
                          className={`p-1 rounded-md transition-colors cursor-pointer ${
                            layer.visible
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                          }`}
                          title={layer.visible ? 'Давхаргыг нуух' : 'Давхаргыг харуулах'}
                        >
                          {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        </button>

                        {/* Name or Rename input */}
                        {isEditing ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              value={editingLayerName}
                              onChange={(e) => setEditingLayerName(e.target.value)}
                              className="w-full rounded border border-amber-400 bg-white px-1.5 py-0.5 text-xs text-slate-900 focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename();
                                if (e.key === 'Escape') setEditingLayerId(null);
                              }}
                            />
                            <button
                              onClick={saveRename}
                              className="rounded bg-amber-500 p-1 text-slate-950 hover:bg-amber-400 cursor-pointer"
                              title="Хадгалах"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setSelectedLayerId(layer.id)}
                            className="cursor-pointer min-w-0 flex-1"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: layer.color }}
                              />
                              <span
                                className={`text-xs font-bold truncate block ${
                                  layer.visible ? 'text-slate-900' : 'text-slate-400 line-through'
                                }`}
                              >
                                {layer.name}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span>{layer.featureCount} обьект</span>
                              <span>·</span>
                              <span>{layer.geometryType}</span>
                              {layer.isOfficial && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-800 font-semibold">Албан ёсны</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Actions (Rename, Download, Delete) */}
                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startRename(layer)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="Нэр солих"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDownloadLayer(layer)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            title="GeoJSON татах"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteLayer(layer.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Давхаргыг хасах / устгах"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Selected Layer Styling & DBF Name Column Panel */}
          {selectedLayer && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                  <Sliders className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Тохируулга: {selectedLayer.name}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedLayer.geometryType}
                </span>
              </div>

              {/* DBF Object Name Column Selector */}
              {(() => {
                const feats = selectedLayer.geojson?.features || [];
                const cols = getLayerAttributeColumns(feats);
                const currentNameField =
                  selectedLayer.nameField || detectBestNameField(feats) || cols[0]?.key || '';
                if (cols.length === 0) return null;
                return (
                  <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 space-y-1.5">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-sky-950">
                      <Database className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <span>Обьектийн нэр унших багана (.dbf талбар):</span>
                    </label>
                    <select
                      value={currentNameField}
                      onChange={(e) =>
                        handleLayerNameFieldChange(selectedLayer.id, e.target.value)
                      }
                      className="w-full rounded-lg border border-sky-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 font-semibold focus:border-sky-600 focus:outline-none shadow-2xs"
                    >
                      {cols.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.key} — (Жишээ: {col.sampleValues.join(', ') || 'хоосон'})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-sky-800 leading-tight">
                      Газрын зураг болон уралдааны даалгавар дээр энэ баганын утгаар обьектийн нэрийг харуулна.
                    </p>
                  </div>
                );
              })()}

              {/* Object Selection Mode: Бүх обьектууд vs Тодорхой обьектуудыг сонгож харуулах */}
              {(() => {
                const feats: any[] = selectedLayer.geojson?.features || [];
                if (feats.length === 0) return null;
                const activeField =
                  selectedLayer.nameField || detectBestNameField(feats) || '';
                const isAllSelected = !Array.isArray(selectedLayer.selectedFeatureIndices);
                const selectedSet = new Set(
                  Array.isArray(selectedLayer.selectedFeatureIndices)
                    ? selectedLayer.selectedFeatureIndices
                    : feats.map((_, i) => i)
                );

                const indexedList = feats.map((f, idx) => {
                  const gType = f?.geometry?.type || selectedLayer.geometryType || 'Polygon';
                  return {
                    idx,
                    name: extractFeatureName(f?.properties, idx, activeField),
                    geomType: gType,
                    lengthKm: calculateFeatureLengthKm(f),
                    areaKm2: calculateFeatureAreaKm2(f),
                  };
                });

                const hasPolylines = indexedList.some(
                  (item) => item.geomType === 'LineString' || item.geomType === 'MultiLineString'
                );
                const hasPolygons = indexedList.some(
                  (item) => item.geomType === 'Polygon' || item.geomType === 'MultiPolygon'
                );
                const metricMode: 'length' | 'area' | 'none' = hasPolylines
                  ? 'length'
                  : hasPolygons
                  ? 'area'
                  : 'none';

                const minNum = objMinMetric.trim() !== '' ? Number(objMinMetric) : null;
                const maxNum = objMaxMetric.trim() !== '' ? Number(objMaxMetric) : null;

                const filteredList = indexedList.filter((item) => {
                  if (
                    objSearch.trim() &&
                    !item.name.toLowerCase().includes(objSearch.toLowerCase())
                  ) {
                    return false;
                  }
                  if (metricMode === 'length') {
                    if (minNum !== null && !Number.isNaN(minNum) && item.lengthKm < minNum)
                      return false;
                    if (maxNum !== null && !Number.isNaN(maxNum) && item.lengthKm > maxNum)
                      return false;
                  } else if (metricMode === 'area') {
                    if (minNum !== null && !Number.isNaN(minNum) && item.areaKm2 < minNum)
                      return false;
                    if (maxNum !== null && !Number.isNaN(maxNum) && item.areaKm2 > maxNum)
                      return false;
                  }
                  return true;
                });

                return (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-950">
                        🎯 Харуулах обьектууд (Уралдаан, Газрын зураг, Сорил):
                      </span>
                      <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold text-amber-950 font-mono">
                        {isAllSelected
                          ? `Бүгд (${feats.length})`
                          : `${selectedSet.size} / ${feats.length}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleSetAllFeaturesMode(selectedLayer.id)}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                          isAllSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        ✓ Бүх обьект ({feats.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClearSelectedFeatures(selectedLayer.id)}
                        className={`py-1.5 px-2.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                          !isAllSelected && selectedSet.size === 0
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Цэвэрлэх (Тодорхойг сонгох)
                      </button>
                    </div>

                    {/* Polyline Length (km) or Polygon Area (km²) Range Filter */}
                    {metricMode !== 'none' && (
                      <div className="rounded-lg border border-amber-300/80 bg-white/90 p-2 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                          <span>
                            {metricMode === 'length'
                              ? '📏 Уртаар нь шүүх (км):'
                              : '📐 Талбайгаар нь шүүх (км²):'}
                          </span>
                          <span className="font-mono">
                            Шүүгдсэн: {filteredList.length} обьект
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="number"
                            step="any"
                            value={objMinMetric}
                            onChange={(e) => {
                              setObjMinMetric(e.target.value);
                              setObjLimit(60);
                            }}
                            placeholder={`Доод (${metricMode === 'length' ? 'км' : 'км²'})`}
                            className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-mono text-slate-800 focus:outline-none"
                          />
                          <input
                            type="number"
                            step="any"
                            value={objMaxMetric}
                            onChange={(e) => {
                              setObjMaxMetric(e.target.value);
                              setObjLimit(60);
                            }}
                            placeholder={`Дээд (${metricMode === 'length' ? 'км' : 'км²'})`}
                            className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-mono text-slate-800 focus:outline-none"
                          />
                        </div>
                        {(objMinMetric.trim() !== '' || objMaxMetric.trim() !== '') && (
                          <button
                            type="button"
                            onClick={() => {
                              updateGisLayer(selectedLayer.id, {
                                selectedFeatureIndices:
                                  filteredList.length === feats.length
                                    ? undefined
                                    : filteredList.map((it) => it.idx),
                              });
                              triggerAutoSaveNotification(
                                `✅ Автоматаар хадгалагдлаа: "${selectedLayer.name}" давхаргын шүүгдсэн ${filteredList.length} обьект санд амжилттай хадгалагдлаа.`
                              );
                            }}
                            className="w-full rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1 text-[10px] cursor-pointer transition-colors"
                          >
                            ✓ Шүүгдсэн {filteredList.length} обьектийг идэвхжүүлэх
                          </button>
                        )}
                      </div>
                    )}

                    {/* Search inside features */}
                    <input
                      type="text"
                      value={objSearch}
                      onChange={(e) => {
                        setObjSearch(e.target.value);
                        setObjLimit(60);
                      }}
                      placeholder="Сонгох обьектийн нэрээр хайх..."
                      className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none"
                    />

                    {/* Checkboxes list */}
                    <div className="max-h-44 overflow-y-auto space-y-1 rounded-lg border border-amber-200/80 bg-white p-1.5 text-xs">
                      {filteredList.slice(0, objLimit).map((item) => {
                        const checked = selectedSet.has(item.idx);
                        const metricBadge =
                          item.geomType === 'LineString' || item.geomType === 'MultiLineString'
                            ? `${item.lengthKm.toLocaleString()} км`
                            : item.geomType === 'Polygon' || item.geomType === 'MultiPolygon'
                            ? `${item.areaKm2.toLocaleString()} км²`
                            : `#${item.idx + 1}`;
                        return (
                          <label
                            key={item.idx}
                            className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 cursor-pointer transition-colors ${
                              checked
                                ? 'bg-amber-50/90 text-slate-900 font-semibold'
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  handleToggleSingleFeature(
                                    selectedLayer.id,
                                    item.idx,
                                    feats.length
                                  )
                                }
                                className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5"
                              />
                              <span className="truncate">{item.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {metricBadge}
                            </span>
                          </label>
                        );
                      })}
                      {filteredList.length > objLimit && (
                        <button
                          type="button"
                          onClick={() => setObjLimit((prev) => prev + 100)}
                          className="w-full py-1.5 text-center text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md cursor-pointer"
                        >
                          Цааш харах (+{filteredList.length - objLimit})
                        </button>
                      )}
                    </div>

                    <p className="text-[10px] text-amber-900 leading-tight">
                      • <b>Газрын зураг</b> хэсэгт сонгосон обьектуудын нэр ил харагдана.<br />
                      • <b>Уралдаан</b> болон <b>Сорил</b> хэсэгт обьектуудын нэр нууцлагдаж таалгана.
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Хүрээний өнгө:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.color}
                      onChange={(e) => updateSelectedLayerStyle({ color: e.target.value })}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-300 p-0.5"
                    />
                    <span className="font-mono text-[11px] text-slate-600">{selectedLayer.color}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Дүүргэлтийн өнгө:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedLayer.fillColor}
                      onChange={(e) => updateSelectedLayerStyle({ fillColor: e.target.value })}
                      className="h-8 w-12 rounded cursor-pointer border border-slate-300 p-0.5"
                    />
                    <span className="font-mono text-[11px] text-slate-600">{selectedLayer.fillColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Тунгалагшилт (Opacity):</span>
                  <span className="font-bold">{Math.round(selectedLayer.fillOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedLayer.fillOpacity}
                  onChange={(e) => updateSelectedLayerStyle({ fillOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>Шугамын өргөн (Weight):</span>
                  <span className="font-bold">{selectedLayer.weight} px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={selectedLayer.weight}
                  onChange={(e) => updateSelectedLayerStyle({ weight: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Educational Guide & Command Reference */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-600" />
              <span>*.SHP Файлуудыг Оруулах & Хөрвүүлэх Командууд</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ESRI Shapefile-ийн бүтэц, GDAL ogr2ogr, Python GeoPandas, QGIS болон вэб код дээр ашиглах заавар
            </p>
          </div>

          {/* Guide Sub-tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold gap-1">
            <button
              onClick={() => setActiveGuideTab('commands')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'commands'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Тушаал / Командууд</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('structure')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'structure'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>SHP Бүтэц</span>
            </button>
            <button
              onClick={() => setActiveGuideTab('code')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                activeGuideTab === 'code'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Вэб код (Leaflet)</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Terminal & Conversion Commands */}
        {activeGuideTab === 'commands' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* GDAL Command */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-amber-600" />
                    1. GDAL ogr2ogr команд (WGS84 EPSG:4326)
                  </span>
                  <button
                    onClick={() => copyToClipboard(gdalCommand, 'gdal')}
                    className="flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'gdal' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'gdal' ? 'Хуулагдлаа' : 'Хуулах'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Terminal / Command Prompt дээр ажиллаж, ямар ч координат системтэй (UTM, Gauss-Kruger) shapefile-ийг дэлхийн стандарт WGS84 болгон хөрвүүлнэ:
                </p>
                <pre className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  {gdalCommand}
                </pre>
              </div>

              {/* Python GeoPandas Command */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Code2 className="h-4 w-4 text-sky-600" />
                    2. Python GeoPandas хөрвүүлэгч скрипт
                  </span>
                  <button
                    onClick={() => copyToClipboard(pythonCommand, 'python')}
                    className="flex items-center gap-1 text-[11px] text-sky-800 hover:text-sky-950 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'python' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedKey === 'python' ? 'Хуулагдлаа' : 'Хуулах'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Python орчинд shapefile уншиж, координатын тусгалыг шалгаж, GeoJSON болгон хадгалах:
                </p>
                <pre className="rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-sky-400 overflow-x-auto">
                  {pythonCommand}
                </pre>
              </div>
            </div>

            {/* QGIS Desktop Steps */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2 text-xs">
              <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                3. QGIS (Үнэгүй нээлттэй GIS программ) дээр 3 товшилтоор хадгалах алхам:
              </span>
              <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
                <li>QGIS програмаа нээгээд *.shp файлаа чирч оруулна.</li>
                <li>Зүүн талын <strong>Layers</strong> цонхонд байгаа давхарга дээр хулганы баруун товч дарж <strong>Export → Save Features As...</strong> сонгоно.</li>
                <li><strong>Format:</strong> GeoJSON (эсвэл ESRI Shapefile) сонгоно.</li>
                <li><strong>CRS (Координат систем):</strong> <code>EPSG:4326 - WGS 84</code> сонгоод <strong>OK</strong> дарна. Бэлэн болсон файл эсвэл .zip архиваа энэ студид чирч оруулна.</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 2: SHP File Structure */}
        {activeGuideTab === 'structure' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              ESRI Shapefile нь зөвхөн нэг файл биш, харин хамтдаа нэг цогц болдог дор хаяж 3-4 салшгүй файлын багц юм:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <div className="font-mono font-bold text-amber-800 text-sm">.shp</div>
                <div className="font-semibold text-slate-900">Геометр өгөгдөл</div>
                <p className="text-[11px] text-slate-500">
                  Цэг, шугам, олон өнцөгт (полигон)-ийн координатыг агуулсан үндсэн файл.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <div className="font-mono font-bold text-sky-800 text-sm">.dbf</div>
                <div className="font-semibold text-slate-900">Шинж чанарын хүснэгт</div>
                <p className="text-[11px] text-slate-500">
                  dBase хүснэгт: аймгийн нэр, талбайн хэмжээ, хүн ам, төрөл гэх мэт үзүүлэлтүүд.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <div className="font-mono font-bold text-emerald-800 text-sm">.prj</div>
                <div className="font-semibold text-slate-900">Координат & Тусгал</div>
                <p className="text-[11px] text-slate-500">
                  Projection: WGS84, UTM48N зэрэг ямар координатын системтэй болохыг тодорхойлогч текст.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                <div className="font-mono font-bold text-indigo-800 text-sm">.shx</div>
                <div className="font-semibold text-slate-900">Индекс файл</div>
                <p className="text-[11px] text-slate-500">
                  Геометрийн өгөгдлийг маш хурдан хайж зурах зориулалттай индекс заагч.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Чухал санамж:</strong> Эдгээр 4 файлыг (.shp, .dbf, .shx, .prj) хамтад нь <strong>.ZIP</strong> архив болгон оруулбал сайт дээр шууд бүрэн дүүрэн ажиллана.
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Web Code (Leaflet + shpjs) */}
        {activeGuideTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode className="h-4 w-4 text-amber-600" />
                Вэб хуудсанд (React, Leaflet, shpjs) олон давхарга давхарлах код:
              </span>
              <button
                onClick={() => copyToClipboard(leafletCodeSnippet, 'leaflet')}
                className="flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 font-semibold cursor-pointer"
              >
                {copiedKey === 'leaflet' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === 'leaflet' ? 'Хуулагдлаа' : 'Код хуулах'}</span>
              </button>
            </div>
            <pre className="rounded-xl bg-slate-900 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto leading-relaxed">
              {leafletCodeSnippet}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
