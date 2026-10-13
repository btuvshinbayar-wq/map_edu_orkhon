import { ActiveGisLayer, Question, GradeLevel } from '../types';
import {
  getActiveLayerFeatures,
  detectBestNameField,
  extractFeatureName,
  maskFeatureProperties,
  calculateFeatureLengthKm,
  calculateFeatureAreaKm2,
  computeGeometryCenter,
} from './gisUtils';

export type GisAutoTaskType =
  | 'contour_shape' // 1. Хэлбэр дүрсийг таах (Контураар таах)
  | 'name_by_attribute' // 2. Нэр ба үзүүлэлтээр таах
  | 'length' // 3. Урт тодорхойлох (км)
  | 'area' // 4. Талбай тодорхойлох (км²)
  | 'location' // 5. Хаана, аль байршилд орших (бүс нутаг, зүг чиг, солбицол)
  | 'neighbor' // 6. Хөрш обьектийг нэрлэх (хиллэдэг / хамгийн ойр орших)
  | 'assemble' // 7. Эвлүүлэх даалгавар (Орон зайн дараалал: Баруунаас зүүн / Хойноос урагш / Хэмжээгээр эвлүүлэх)
  | 'match' // 8. Холбох даалгавар (Обьектийг шинж чанар, хэмжээ, байршилтай нь зөв харгалзуулан холбох)
  | 'point_placement'; // 9. Цэгэн обьектийг газрын зурагт байрлуулах (Interactive Map Pin)

export interface GisAutoGenerateOptions {
  layers: ActiveGisLayer[];
  selectedLayerIds?: string[]; // If empty/undefined, use all layers
  enabledTypes?: GisAutoTaskType[]; // If empty/undefined, use all 9 types
  gradeLevels?: GradeLevel[];
  pointsPerQuestion?: number;
  maxQuestionsPerLayer?: number;
}

export const GIS_AUTO_TASK_TYPE_LABELS: {
  id: GisAutoTaskType;
  label: string;
  shortDesc: string;
  badgeColor: string;
}[] = [
  {
    id: 'contour_shape',
    label: '1. Хэлбэр дүрсийг таах',
    shortDesc: 'Нэргүй вектор контурын хэлбэр дүрсээр обьектийг таних',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
  },
  {
    id: 'name_by_attribute',
    label: '2. Нэр тодорхойлох',
    shortDesc: 'Газрын зургийн онцлог болон DBF үзүүлэлтээр нэрийг олох',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  {
    id: 'length',
    label: '3. Урт тооцоолох (км)',
    shortDesc: 'Шугаман обьектийн урт эсвэл талбайн периметрийг олох',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'area',
    label: '4. Талбай тооцоолох (км²)',
    shortDesc: 'Полигон обьектийн талбайн хэмжээ болон харьцуулалт',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'location',
    label: '5. Хаана, аль байршилд орших',
    shortDesc: 'Бүс нутаг, зүг чиг, газарзүйн солбицлоор байршлыг тогтоох',
    badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
  },
  {
    id: 'neighbor',
    label: '6. Хөрш обьектийг нэрлэх',
    shortDesc: 'Хамгийн ойр орших буюу хил залгаа хөрш обьектийг олох',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'assemble',
    label: '7. Эвлүүлэх (Орон зайн дараалал)',
    shortDesc: 'Обьектуудыг баруунаас зүүн, хойноос урагш эсвэл хэмжээгээр эвлүүлэх',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'match',
    label: '8. Холбох (Харгалзуулах)',
    shortDesc: 'Газрын зургийн обьектуудыг хэмжээ, байршил, шинж чанартай нь холбох',
    badgeColor: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    id: 'point_placement',
    label: '9. Цэгэн обьектийг газрын зурагт байрлуулах',
    shortDesc: 'Нэргүй газрын зураг дээр обьектийн бодит байршлыг цэг тавьж олох',
    badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300',
  },
];

export function detectQuestionGisTaskType(q: Question): GisAutoTaskType {
  if (q.gisAutoTaskType) {
    return q.gisAutoTaskType as GisAutoTaskType;
  }
  const id = String(q.id || '');
  if (id.startsWith('auto_pin_') || q.type === 'interactive_map_pin' || q.mapPinData) {
    return 'point_placement';
  }
  if (id.startsWith('auto_len_')) return 'length';
  if (id.startsWith('auto_area_')) return 'area';
  if (id.startsWith('auto_loc_')) return 'location';
  if (id.startsWith('auto_neighbor_')) return 'neighbor';
  if (id.startsWith('auto_assemble_')) return 'assemble';
  if (id.startsWith('auto_match_')) return 'match';
  if (id.startsWith('auto_name_')) return 'name_by_attribute';
  if (id.startsWith('auto_shape_') || id.startsWith('custom_shp_') || id.startsWith('custom_batch_')) {
    return 'contour_shape';
  }

  const title = String(q.title || '').toLowerCase();
  if (title.includes('[урт тооцоолох') || title.includes('урт ойролцоогоор хэдэн километр')) return 'length';
  if (title.includes('[талбай тооцоолох') || title.includes('талбайн хэмжээ хэдэн км²')) return 'area';
  if (title.includes('[байршил тодорхойлох') || title.includes('аль бүс нутагт оршдог')) return 'location';
  if (title.includes('[хөрш обьектийг нэрлэх') || title.includes('хил залгаа хөрш')) return 'neighbor';
  if (title.includes('[эвлүүлэх даалгавар') || title.includes('зөв дарааллаар эвлүүлсэн')) return 'assemble';
  if (title.includes('[холбох даалгавар') || title.includes('зөв холбосон хувилбар')) return 'match';
  if (title.includes('[газрын зурагт байрлуулах') || title.includes('цэг тавьж заана уу')) return 'point_placement';
  if (title.includes('[нэр тодорхойлох')) return 'name_by_attribute';

  return 'contour_shape';
}

interface EnrichedFeature {
  feature: any;
  originalIndex: number;
  name: string;
  geomType: string;
  lengthKm: number;
  areaKm2: number;
  center: { lat: number; lng: number } | null;
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number } | null;
}

function computeBbox(geom: any): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
  if (!geom || !geom.coordinates) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const visit = (coords: any) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
      }
      return;
    }
    for (let i = 0; i < coords.length; i++) {
      visit(coords[i]);
    }
  };

  visit(geom.coordinates);
  if (!Number.isFinite(minLat) || !Number.isFinite(minLng)) return null;
  return { minLat, maxLat, minLng, maxLng };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371.0088;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bboxEdgeDistanceKm(
  a: EnrichedFeature,
  b: EnrichedFeature
): number {
  if (!a.center || !b.center) return Infinity;
  if (a.bbox && b.bbox) {
    // Check if bounding boxes touch or overlap
    const latOverlap = Math.max(0, Math.min(a.bbox.maxLat, b.bbox.maxLat) - Math.max(a.bbox.minLat, b.bbox.minLat));
    const lngOverlap = Math.max(0, Math.min(a.bbox.maxLng, b.bbox.maxLng) - Math.max(a.bbox.minLng, b.bbox.minLng));
    if (latOverlap > 0 && lngOverlap > 0) {
      return haversineKm(a.center.lat, a.center.lng, b.center.lat, b.center.lng) * 0.35;
    }
  }
  return haversineKm(a.center.lat, a.center.lng, b.center.lat, b.center.lng);
}

function getMongoliaRegionLabel(lat: number, lng: number): string {
  // Classify into geographic region of Mongolia or World based on coordinates
  if (lat >= 41 && lat <= 53 && lng >= 87 && lng <= 120) {
    if (lng < 96.5) return 'Баруун бүс (Алтайн уулархаг ба Их нууруудын хотгор орчим)';
    if (lng >= 96.5 && lng < 103.5) {
      return lat >= 47.5
        ? 'Хангай-Хөвсгөлийн уулархаг бүс (Хойд хэсэг)'
        : 'Хангайн нуруу ба Говийн баруун өмнөд бүс';
    }
    if (lng >= 103.5 && lng < 110.5) {
      if (lat >= 48.0) return 'Төвийн бүсийн хойд хэсэг (Хэнтий-Сэлэнгийн сав газар)';
      if (lat >= 45.5) return 'Төвийн бүс (Тал хээр ба Хангай-Хэнтийн завсрын бүс)';
      return 'Өмнөд буюу Говийн бүс нутаг';
    }
    return 'Зүүн бүс (Дорнодын тал хээр ба Хянганы салбар уулс орчим)';
  }
  const ns = lat >= 0 ? 'Хойд хагас бөмбөрцөг' : 'Өмнөд хагас бөмбөрцөг';
  const ew = lng >= 0 ? 'Зүүн уртраг' : 'Баруун уртраг';
  return `${ns}, ${ew}`;
}

function getAllGeographicRegions(): string[] {
  return [
    'Баруун бүс (Алтайн уулархаг ба Их нууруудын хотгор орчим)',
    'Хангай-Хөвсгөлийн уулархаг бүс (Хойд хэсэг)',
    'Хангайн нуруу ба Говийн баруун өмнөд бүс',
    'Төвийн бүсийн хойд хэсэг (Хэнтий-Сэлэнгийн сав газар)',
    'Төвийн бүс (Тал хээр ба Хангай-Хэнтийн завсрын бүс)',
    'Өмнөд буюу Говийн бүс нутаг',
    'Зүүн бүс (Дорнодын тал хээр ба Хянганы салбар уулс орчим)',
  ];
}

function detectLayerCategoryLabel(layerName: string): string {
  const lower = (layerName || '').toLowerCase();
  if (lower.includes('сум') || lower.includes('sum') || lower.includes('soum')) return 'сум';
  if (lower.includes('аймаг') || lower.includes('boundary') || lower.includes('хил')) return 'аймаг';
  if (lower.includes('гол') || lower.includes('мөрөн') || lower.includes('river')) return 'гол мөрөн';
  if (lower.includes('нуур') || lower.includes('lake') || lower.includes('ус')) return 'нуур / усны обьект';
  if (lower.includes('хамгаалалт') || lower.includes('тхгн') || lower.includes('парк')) return 'тусгай хамгаалалттай газар';
  if (lower.includes('орд') || lower.includes('уурхай')) return 'стратегийн орд / уурхай';
  if (lower.includes('уул') || lower.includes('оргил') || lower.includes('нуруу')) return 'уул / оргил';
  return 'газарзүйн обьект';
}

function pickDistractors(target: string, pool: string[], count = 3): string[] {
  const unique = Array.from(new Set(pool.filter((x) => x && x.trim() !== target.trim())));
  const shuffled = [...unique].sort(() => Math.random() - 0.5).slice(0, count);
  const fallbacks = ['Хөвсгөл', 'Архангай', 'Өмнөговь', 'Завхан', 'Дорнод', 'Баянхонгор'];
  let fIdx = 0;
  while (shuffled.length < count) {
    const candidate = fallbacks[fIdx++] || `Хувилбар ${shuffled.length + 1}`;
    if (candidate !== target && !shuffled.includes(candidate)) {
      shuffled.push(candidate);
    }
  }
  return shuffled;
}

function buildOptions(correctText: string, distractors: string[]) {
  const all = [correctText, ...distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
  return all.map((text, idx) => ({
    id: String(idx + 1),
    text,
    isCorrect: text.trim() === correctText.trim(),
  }));
}

function makeCleanFeatureCollection(features: any[]) {
  return {
    type: 'FeatureCollection',
    features: features.map((f) => ({
      type: 'Feature',
      properties: {},
      geometry: f?.geometry,
    })),
  };
}

/**
 * Generates comprehensive exam questions strictly from the uploaded GIS layers (`gisLayers`)
 * covering all 9 requested geographical task types:
 * урт, талбай, нэр, хаана аль байршилд орших, хөрш обьектийг нэрлэх,
 * хэлбэр дүрсийг таах, эвлүүлэх, холбох, цэгэн обьектийг газрын зурагт байрлуулах.
 */
export function generateComprehensiveGisQuestions(
  options: GisAutoGenerateOptions
): Question[] {
  const {
    layers,
    selectedLayerIds,
    enabledTypes,
    gradeLevels = ['9', '12', 'teacher', 'team'],
    pointsPerQuestion = 15,
    maxQuestionsPerLayer = 60,
  } = options;

  if (!Array.isArray(layers) || layers.length === 0) return [];

  const targetLayers =
    selectedLayerIds && selectedLayerIds.length > 0
      ? layers.filter((l) => selectedLayerIds.includes(l.id))
      : layers;

  const activeTypes: Set<GisAutoTaskType> = new Set(
    enabledTypes && enabledTypes.length > 0
      ? enabledTypes
      : [
          'contour_shape',
          'name_by_attribute',
          'length',
          'area',
          'location',
          'neighbor',
          'assemble',
          'match',
          'point_placement',
        ]
  );

  const generatedQuestions: Question[] = [];
  const timestamp = Date.now();

  for (const layer of targetLayers) {
    const activeRaw = getActiveLayerFeatures(layer);
    if (activeRaw.length === 0) continue;

    const allLayerFeatures = Array.isArray(layer.geojson?.features)
      ? layer.geojson.features
      : [];
    const activeNameField = layer.nameField || detectBestNameField(allLayerFeatures);
    const categoryLabel = detectLayerCategoryLabel(layer.name);

    // Enrich features with calculated length, area, center, and bounding box
    const enriched: EnrichedFeature[] = activeRaw
      .map((item) => {
        const geomType = item.feature?.geometry?.type || layer.geometryType || 'Polygon';
        const lengthKm = calculateFeatureLengthKm(item.feature);
        const areaKm2 = calculateFeatureAreaKm2(item.feature);
        const center = computeGeometryCenter(item.feature?.geometry);
        const bbox = computeBbox(item.feature?.geometry);
        return {
          feature: item.feature,
          originalIndex: item.originalIndex,
          name: item.name,
          geomType,
          lengthKm,
          areaKm2,
          center,
          bbox,
        };
      })
      .filter((e) => Boolean(e.name) && !e.name.startsWith('ID-'));

    if (enriched.length === 0) continue;

    const allNames = Array.from(new Set(enriched.map((e) => e.name)));
    const layerQuestions: Question[] = [];

    // Sample features so we don't explode memory if a shapefile has 500+ features
    const sampledFeatures = enriched.slice(0, Math.min(enriched.length, 30));

    for (let i = 0; i < sampledFeatures.length; i++) {
      const item = sampledFeatures[i];
      const { maskedProps, realProps } = maskFeatureProperties(
        item.feature?.properties,
        item.name,
        activeNameField
      );
      const isolatedGeo = makeCleanFeatureCollection([item.feature]);
      const isLine = item.geomType === 'LineString' || item.geomType === 'MultiLineString';
      const isPoly = item.geomType === 'Polygon' || item.geomType === 'MultiPolygon';
      const isPoint = item.geomType === 'Point' || item.geomType === 'MultiPoint';

      // -----------------------------------------------------------------------
      // 1. ХЭЛБЭР ДҮРСИЙГ ТААХ (contour_shape)
      // -----------------------------------------------------------------------
      if (activeTypes.has('contour_shape') && (isPoly || isLine)) {
        const distractors = pickDistractors(item.name, allNames, 3);
        const opts = buildOptions(item.name, distractors);
        layerQuestions.push({
          id: `auto_shape_${layer.id}_${item.originalIndex}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'shp_contour_guess',
          title: `🧩 [Хэлбэр дүрсийг таах · ${layer.name}] Зурагт өгөгдсөн вектор контур дүрс аль ${categoryLabel} вэ?`,
          subtitle: `Газрын зураг дээрх обьектийн хэлбэр дүрс болон масштабын шугамыг ажиглан зөв нэрийг сонгоно уу.`,
          targetName: item.name,
          targetId: `${layer.id}_shape_${item.originalIndex}`,
          explanation: `Зөв хариулт: ${item.name} (${layer.name} давхарга). ${
            item.areaKm2 > 0
              ? `Талбай: ${item.areaKm2.toLocaleString()} км².`
              : item.lengthKm > 0
              ? `Урт: ${item.lengthKm.toLocaleString()} км.`
              : ''
          }`,
          difficulty: 'medium',
          points: pointsPerQuestion,
          gisAutoTaskType: 'contour_shape',
          shpContourData: {
            featureId: `${layer.id}_f_${item.originalIndex}`,
            layerName: layer.name,
            geometryType: (item.geomType as any) || 'Polygon',
            geojson: isolatedGeo,
            categoryLabel,
            maskedProperties: maskedProps,
            realProperties: realProps,
            targetName: item.name,
            options: opts.map((o) => o.text),
            hints: [
              `Давхарга: ${layer.name}`,
              `Даалгаврын төрөл: Хэлбэр дүрсийг таах`,
            ],
          },
          options: opts,
        });
      }

      // -----------------------------------------------------------------------
      // 2. НЭР ТОДОРХОЙЛОХ (name_by_attribute)
      // -----------------------------------------------------------------------
      if (activeTypes.has('name_by_attribute')) {
        const distractors = pickDistractors(item.name, allNames, 3);
        const opts = buildOptions(item.name, distractors);

        // Extract non-name attributes to mention in the question prompt
        const attrSummaryParts: string[] = [];
        Object.entries(maskedProps).forEach(([k, v]) => {
          if (v && !v.includes('НУУЦЛАГДСАН') && attrSummaryParts.length < 2) {
            attrSummaryParts.push(`${k}: ${v}`);
          }
        });
        if (item.areaKm2 > 0) attrSummaryParts.push(`Талбай: ~${Math.round(item.areaKm2).toLocaleString()} км²`);
        else if (item.lengthKm > 0) attrSummaryParts.push(`Урт: ~${Math.round(item.lengthKm).toLocaleString()} км`);
        if (item.center) {
          attrSummaryParts.push(`Төв солбицол: ${item.center.lat.toFixed(2)}°N, ${item.center.lng.toFixed(2)}°E`);
        }

        const clueStr =
          attrSummaryParts.length > 0
            ? ` (${attrSummaryParts.join(' · ')})`
            : '';

        layerQuestions.push({
          id: `auto_name_${layer.id}_${item.originalIndex}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'shp_contour_guess',
          title: `🏷️ [Нэр тодорхойлох · ${layer.name}] Зурагт тодруулсан обьектийн${clueStr} жинхэнэ нэр аль нь вэ?`,
          subtitle: `Оруулсан газрын зургийн контур болон атрибутын өгөгдөлд үндэслэн обьектийн нэрийг олно уу.`,
          targetName: item.name,
          targetId: `${layer.id}_name_${item.originalIndex}`,
          explanation: `Зөв хариулт: ${item.name} (${layer.name}). ${attrSummaryParts.join(', ')}.`,
          difficulty: 'easy',
          points: pointsPerQuestion,
          gisAutoTaskType: 'name_by_attribute',
          shpContourData: {
            featureId: `${layer.id}_name_${item.originalIndex}`,
            layerName: layer.name,
            geometryType: (item.geomType as any) || 'Polygon',
            geojson: isolatedGeo,
            categoryLabel,
            maskedProperties: maskedProps,
            realProperties: realProps,
            targetName: item.name,
            options: opts.map((o) => o.text),
            hints: [`Давхарга: ${layer.name}`, ...attrSummaryParts],
          },
          options: opts,
        });
      }

      // -----------------------------------------------------------------------
      // 3. УРТ ТОДОРХОЙЛОХ (length)
      // -----------------------------------------------------------------------
      if (activeTypes.has('length') && item.lengthKm > 0) {
        const trueLen = Math.round(item.lengthKm);
        const correctLabel = `${trueLen.toLocaleString()} км`;

        // Generate realistic numeric distractors or sibling lengths
        const siblingLengths = enriched
          .filter((e) => e.name !== item.name && e.lengthKm > 0 && Math.abs(e.lengthKm - item.lengthKm) > Math.max(15, item.lengthKm * 0.18))
          .map((e) => `${Math.round(e.lengthKm).toLocaleString()} км`);

        const syntheticMultipliers = [0.45, 1.55, 2.25, 0.28];
        for (const mult of syntheticMultipliers) {
          const val = Math.max(5, Math.round(trueLen * mult));
          const str = `${val.toLocaleString()} км`;
          if (str !== correctLabel && !siblingLengths.includes(str)) {
            siblingLengths.push(str);
          }
        }

        const opts = buildOptions(correctLabel, siblingLengths.slice(0, 3));
        const lenTypeWord = isLine ? 'урт' : 'хилийн шугамын нийт урт (периметр)';

        layerQuestions.push({
          id: `auto_len_${layer.id}_${item.originalIndex}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'shp_contour_guess',
          title: `📏 [Урт тооцоолох · ${layer.name}] "${item.name}" обьектийн ${lenTypeWord} ойролцоогоор хэдэн километр (км) вэ?`,
          subtitle: `Зүүн доод булангийн масштабын шугам (км) болон вектор геометрийг ажиглан зөв уртыг сонгоно уу.`,
          targetName: correctLabel,
          targetId: `${layer.id}_len_${item.originalIndex}`,
          explanation: `"${item.name}" (${layer.name}) обьектийн WGS84 солбицлоор тооцоолсон бодит ${lenTypeWord} нь ${item.lengthKm.toLocaleString()} км байна.`,
          difficulty: 'medium',
          points: pointsPerQuestion,
          gisAutoTaskType: 'length',
          shpContourData: {
            featureId: `${layer.id}_len_${item.originalIndex}`,
            layerName: layer.name,
            geometryType: (item.geomType as any) || 'LineString',
            geojson: isolatedGeo,
            categoryLabel,
            maskedProperties: maskedProps,
            realProperties: realProps,
            targetName: correctLabel,
            options: opts.map((o) => o.text),
            hints: [
              `Обьект: ${item.name}`,
              `Зүүн доод булангийн масштабын шугамтай харьцуулан уртыг баримжаална уу`,
            ],
          },
          options: opts,
        });
      }

      // -----------------------------------------------------------------------
      // 4. ТАЛБАЙ ТОДОРХОЙЛОХ (area)
      // -----------------------------------------------------------------------
      if (activeTypes.has('area') && isPoly && item.areaKm2 > 0) {
        const trueArea = Math.round(item.areaKm2);
        const correctLabel = `${trueArea.toLocaleString()} км²`;

        const siblingAreas = enriched
          .filter((e) => e.name !== item.name && e.areaKm2 > 0 && Math.abs(e.areaKm2 - item.areaKm2) > Math.max(50, item.areaKm2 * 0.2))
          .map((e) => `${Math.round(e.areaKm2).toLocaleString()} км²`);

        const mults = [0.4, 1.65, 2.4, 0.25];
        for (const m of mults) {
          const val = Math.max(10, Math.round(trueArea * m));
          const str = `${val.toLocaleString()} км²`;
          if (str !== correctLabel && !siblingAreas.includes(str)) {
            siblingAreas.push(str);
          }
        }

        const opts = buildOptions(correctLabel, siblingAreas.slice(0, 3));

        layerQuestions.push({
          id: `auto_area_${layer.id}_${item.originalIndex}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'shp_contour_guess',
          title: `📐 [Талбай тооцоолох · ${layer.name}] "${item.name}" обьектийн нутаг дэвсгэрийн талбайн хэмжээ хэдэн км² вэ?`,
          subtitle: `Газрын зургийн масштаб болон контурын хэмжээг ажиглан талбайн хэмжээг тодорхойлно уу.`,
          targetName: correctLabel,
          targetId: `${layer.id}_area_${item.originalIndex}`,
          explanation: `"${item.name}" (${layer.name}) обьектийн талбайн хэмжээ ${item.areaKm2.toLocaleString()} км² байна.`,
          difficulty: 'medium',
          points: pointsPerQuestion,
          gisAutoTaskType: 'area',
          shpContourData: {
            featureId: `${layer.id}_area_${item.originalIndex}`,
            layerName: layer.name,
            geometryType: (item.geomType as any) || 'Polygon',
            geojson: isolatedGeo,
            categoryLabel,
            maskedProperties: {
              ...maskedProps,
              SHAPE_AREA: '[ ? ? ? НУУЦЛАГДСАН ]',
              AREA_SQKM: '[ ? ? ? НУУЦЛАГДСАН ]',
              AREA_KM2: '[ ? ? ? НУУЦЛАГДСАН ]',
            },
            realProperties: realProps,
            targetName: correctLabel,
            options: opts.map((o) => o.text),
            hints: [
              `Обьект: ${item.name}`,
              `Талбайн хэмжээг масштабын шугамтай харьцуулна уу`,
            ],
          },
          options: opts,
        });
      }

      // -----------------------------------------------------------------------
      // 5. ХААНА, АЛЬ БАЙРШИЛД ОРШИХ (location)
      // -----------------------------------------------------------------------
      if (activeTypes.has('location') && item.center) {
        const correctRegion = getMongoliaRegionLabel(item.center.lat, item.center.lng);
        const allRegions = getAllGeographicRegions().filter((r) => r !== correctRegion);
        const distractors = allRegions.sort(() => Math.random() - 0.5).slice(0, 3);
        const opts = buildOptions(correctRegion, distractors);

        layerQuestions.push({
          id: `auto_loc_${layer.id}_${item.originalIndex}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'shp_contour_guess',
          title: `🧭 [Байршил тодорхойлох · ${layer.name}] "${item.name}" нь газарзүйн хувьд хаана, аль бүс нутагт оршдог вэ?`,
          subtitle: `Төв солбицол (${item.center.lat.toFixed(2)}°N, ${item.center.lng.toFixed(2)}°E) болон Монгол орны хүрээ зураг дахь байршлыг ажиглана уу.`,
          targetName: correctRegion,
          targetId: `${layer.id}_loc_${item.originalIndex}`,
          explanation: `"${item.name}" нь ${item.center.lat.toFixed(2)}° хойд өргөрөг, ${item.center.lng.toFixed(2)}° зүүн уртрагт буюу «${correctRegion}»-д байрладаг.`,
          difficulty: 'easy',
          points: pointsPerQuestion,
          gisAutoTaskType: 'location',
          shpContourData: {
            featureId: `${layer.id}_loc_${item.originalIndex}`,
            layerName: layer.name,
            geometryType: (item.geomType as any) || 'Polygon',
            geojson: isolatedGeo,
            categoryLabel,
            maskedProperties: maskedProps,
            realProperties: realProps,
            targetName: correctRegion,
            options: opts.map((o) => o.text),
            hints: [
              `Обьект: ${item.name}`,
              `Солбицол: ${item.center.lat.toFixed(2)}°N, ${item.center.lng.toFixed(2)}°E`,
            ],
          },
          options: opts,
        });
      }

      // -----------------------------------------------------------------------
      // 6. ХӨРШ ОБЬЕКТИЙГ НЭРЛЭХ (neighbor)
      // -----------------------------------------------------------------------
      if (activeTypes.has('neighbor') && item.center && enriched.length >= 5) {
        const othersByDist = enriched
          .filter((other) => other.name !== item.name && other.center)
          .map((other) => ({
            other,
            distKm: bboxEdgeDistanceKm(item, other),
            centerDistKm: haversineKm(
              item.center!.lat,
              item.center!.lng,
              other.center!.lat,
              other.center!.lng
            ),
          }))
          .sort((a, b) => a.distKm - b.distKm);

        if (othersByDist.length >= 4) {
          const nearestNeighbor = othersByDist[0].other;
          const farDistractors = othersByDist
            .slice(Math.max(1, othersByDist.length - 4))
            .map((d) => d.other.name)
            .slice(0, 3);

          const opts = buildOptions(nearestNeighbor.name, farDistractors);

          // Combine target feature and neighbor feature on the contour map or show target feature
          const pairGeo = makeCleanFeatureCollection([item.feature]);

          layerQuestions.push({
            id: `auto_neighbor_${layer.id}_${item.originalIndex}_${timestamp}`,
            category: 'mongolia',
            gradeLevels,
            type: 'shp_contour_guess',
            title: `🤝 [Хөрш обьектийг нэрлэх · ${layer.name}] "${item.name}" обьекттой хамгийн ойр орших буюу хил залгаа хөрш ${categoryLabel}-ийг сонгоно уу?`,
            subtitle: `Оруулсан "${layer.name}" газрын зураг дээр "${item.name}"-тэй хамгийн ойр орших хөрш обьектийг олно уу.`,
            targetName: nearestNeighbor.name,
            targetId: `${layer.id}_nb_${item.originalIndex}`,
            explanation: `"${item.name}" обьекттой хамгийн ойр орших хөрш нь "${nearestNeighbor.name}" (төв хоорондын зай ~${Math.round(othersByDist[0].centerDistKm)} км) юм.`,
            difficulty: 'hard',
            points: pointsPerQuestion,
            gisAutoTaskType: 'neighbor',
            shpContourData: {
              featureId: `${layer.id}_nb_${item.originalIndex}`,
              layerName: layer.name,
              geometryType: (item.geomType as any) || 'Polygon',
              geojson: pairGeo,
              categoryLabel,
              maskedProperties: maskedProps,
              realProperties: realProps,
              targetName: nearestNeighbor.name,
              options: opts.map((o) => o.text),
              hints: [
                `Эх обьект: ${item.name}`,
                `Даалгаврын төрөл: Хөрш обьектийг нэрлэх`,
              ],
            },
            options: opts,
          });
        }
      }

      // -----------------------------------------------------------------------
      // 9. ЦЭГЭН ОБЬЕКТИЙГ ГАЗРЫН ЗУРАГТ БАЙРЛУУЛАХ (point_placement)
      // -----------------------------------------------------------------------
      if (activeTypes.has('point_placement') && item.center) {
        const toleranceKm = isPoint ? 65 : 75;
        const metricClue =
          item.areaKm2 > 0
            ? `Талбай: ${item.areaKm2.toLocaleString()} км²`
            : item.lengthKm > 0
            ? `Урт: ${item.lengthKm.toLocaleString()} км`
            : `Давхарга: ${layer.name}`;

        layerQuestions.push({
          id: `auto_pin_${layer.id}_${item.originalIndex}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'interactive_map_pin',
          title: `📍 [Газрын зурагт байрлуулах · ${layer.name}] "${item.name}" (${categoryLabel})-ийн байршлыг газрын зураг дээр цэг тавьж заана уу!`,
          subtitle: `Нэргүй суурь зураг дээр "${item.name}" орших байршилд хулганаар товшин 📍 цэг байрлуулж баталгаажуулна уу.`,
          targetName: item.name,
          targetId: `${layer.id}_pin_${item.originalIndex}`,
          explanation: `"${item.name}" (${layer.name}) нь ${item.center.lat.toFixed(2)}°N, ${item.center.lng.toFixed(2)}°E солбицолд (${getMongoliaRegionLabel(item.center.lat, item.center.lng)}) оршдог.`,
          difficulty: 'hard',
          points: pointsPerQuestion,
          gisAutoTaskType: 'point_placement',
          mapPinData: {
            targetLat: item.center.lat,
            targetLng: item.center.lng,
            targetName: item.name,
            category: 'mongolia',
            subCategory: layer.name,
            allowedDistanceKm: toleranceKm,
            clues: [
              `Давхарга: ${layer.name}`,
              `Бүс нутаг: ${getMongoliaRegionLabel(item.center.lat, item.center.lng)}`,
              metricClue,
            ],
            funFact: `${item.name} — Бодит солбицол: ${item.center.lat.toFixed(2)}°N, ${item.center.lng.toFixed(2)}°E`,
          },
          shpContourData: {
            featureId: `${layer.id}_pin_${item.originalIndex}`,
            layerName: layer.name,
            geometryType: 'Point',
            geojson: isolatedGeo,
            categoryLabel,
            maskedProperties: maskedProps,
            realProperties: realProps,
            targetName: item.name,
            options: [],
          },
        });
      }
    }

    // -------------------------------------------------------------------------
    // 7. ЭВЛҮҮЛЭХ ДААЛГАВАР (assemble: Орон зайн болон хэмжээний дарааллаар эвлүүлэх)
    // -------------------------------------------------------------------------
    if (activeTypes.has('assemble') && enriched.length >= 4) {
      const withCenters = enriched.filter((e) => e.center !== null);
      // Create multi-object spatial assembly tasks (West-to-East, North-to-South, Largest-to-Smallest)
      const groupCount = Math.min(6, Math.floor(withCenters.length / 2));
      for (let g = 0; g < groupCount; g++) {
        const slice = [...withCenters]
          .sort(() => Math.random() - 0.5)
          .slice(0, 4);
        if (slice.length < 4) continue;

        const mode = g % 3; // 0 = West to East, 1 = North to South, 2 = Area/Length descending
        let sortedSlice: EnrichedFeature[] = [];
        let modeTitle = '';
        let modeDesc = '';

        if (mode === 0) {
          sortedSlice = [...slice].sort((a, b) => a.center!.lng - b.center!.lng);
          modeTitle = 'баруунаас зүүн тийш (уртрагийн дагуу)';
          modeDesc = 'Баруун захын уртрагаас зүүн захын уртраг руу';
        } else if (mode === 1) {
          sortedSlice = [...slice].sort((a, b) => b.center!.lat - a.center!.lat);
          modeTitle = 'хойноос урагш (өргөргийн дагуу)';
          modeDesc = 'Хойд өргөргөөс өмнөд өргөрөг рүү';
        } else {
          const hasArea = slice.every((s) => s.areaKm2 > 0);
          if (hasArea) {
            sortedSlice = [...slice].sort((a, b) => b.areaKm2 - a.areaKm2);
            modeTitle = 'талбайн хэмжээгээр ихээс бага руу';
            modeDesc = 'Хамгийн том талбайтайгаас хамгийн бага талбайтай руу';
          } else {
            sortedSlice = [...slice].sort((a, b) => b.lengthKm - a.lengthKm);
            modeTitle = 'уртаар нь ихээс бага руу';
            modeDesc = 'Хамгийн урт обьектоос богино руу';
          }
        }

        const correctOrderStr = sortedSlice.map((s) => s.name).join(' ➔ ');
        const perm1 = [sortedSlice[1], sortedSlice[0], sortedSlice[2], sortedSlice[3]]
          .map((s) => s.name)
          .join(' ➔ ');
        const perm2 = [sortedSlice[3], sortedSlice[2], sortedSlice[1], sortedSlice[0]]
          .map((s) => s.name)
          .join(' ➔ ');
        const perm3 = [sortedSlice[0], sortedSlice[2], sortedSlice[3], sortedSlice[1]]
          .map((s) => s.name)
          .join(' ➔ ');

        const opts = buildOptions(correctOrderStr, [perm1, perm2, perm3]);
        const multiGeo = makeCleanFeatureCollection(slice.map((s) => s.feature));

        layerQuestions.push({
          id: `auto_assemble_${layer.id}_${g}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'shp_contour_guess',
          title: `🧱 [Эвлүүлэх даалгавар · ${layer.name}] Дараах 4 обьектийг газарзүйн байршил ба хэмжээгээр нь «${modeTitle}» зөв дарааллаар эвлүүлсэн хувилбарыг сонгоно уу?`,
          subtitle: `Зураг дээрх 4 обьектийн орон зайн байршлыг ажиглан (${modeDesc}) зөв эвлүүлнэ үү.`,
          targetName: correctOrderStr,
          targetId: `${layer.id}_asm_${g}`,
          explanation: `Зөв эвлүүлсэн дараалал (${modeTitle}): ${correctOrderStr}.`,
          difficulty: 'hard',
          points: pointsPerQuestion,
          gisAutoTaskType: 'assemble',
          shpContourData: {
            featureId: `${layer.id}_asm_${g}`,
            layerName: layer.name,
            geometryType: (slice[0].geomType as any) || 'Polygon',
            geojson: multiGeo,
            categoryLabel,
            maskedProperties: {
              'ӨГӨГДСӨН 4 ОБЬЕКТ': slice.map((s) => s.name).join(', '),
              'ЭВЛҮҮЛЭХ НӨХЦӨЛ': modeDesc,
            },
            realProperties: {
              'ЗӨВ ДАРААЛАЛ': correctOrderStr,
            },
            targetName: correctOrderStr,
            options: opts.map((o) => o.text),
            hints: [
              `Өгөгдсөн обьектууд: ${slice.map((s) => s.name).join(', ')}`,
              `Эвлүүлэх чиглэл: ${modeTitle}`,
            ],
          },
          options: opts,
        });
      }
    }

    // -------------------------------------------------------------------------
    // 8. ХОЛБОХ ДААЛГАВАР (match: Обьектийг хэмжээ, байршил, шинж чанартай нь зөв холбох)
    // -------------------------------------------------------------------------
    if (activeTypes.has('match') && enriched.length >= 4) {
      const pairCount = Math.min(6, Math.floor(enriched.length / 2));
      for (let m = 0; m < pairCount; m++) {
        const group = [...enriched]
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        if (group.length < 3) continue;

        const describeFeature = (e: EnrichedFeature): string => {
          if (e.areaKm2 > 0) return `${Math.round(e.areaKm2).toLocaleString()} км² талбайтай`;
          if (e.lengthKm > 0) return `${Math.round(e.lengthKm).toLocaleString()} км урттай`;
          if (e.center) {
            return `${e.center.lat.toFixed(1)}°N, ${e.center.lng.toFixed(1)}°E солбицолтой`;
          }
          return `${layer.name} давхаргын обьект`;
        };

        const d0 = describeFeature(group[0]);
        const d1 = describeFeature(group[1]);
        const d2 = describeFeature(group[2]);

        const correctMatch = `1) ${group[0].name} — ${d0} · 2) ${group[1].name} — ${d1} · 3) ${group[2].name} — ${d2}`;
        const wrongMatch1 = `1) ${group[0].name} — ${d1} · 2) ${group[1].name} — ${d2} · 3) ${group[2].name} — ${d0}`;
        const wrongMatch2 = `1) ${group[0].name} — ${d2} · 2) ${group[1].name} — ${d0} · 3) ${group[2].name} — ${d1}`;
        const wrongMatch3 = `1) ${group[0].name} — ${d0} · 2) ${group[1].name} — ${d2} · 3) ${group[2].name} — ${d1}`;

        const opts = buildOptions(correctMatch, [wrongMatch1, wrongMatch2, wrongMatch3]);
        const multiGeo = makeCleanFeatureCollection(group.map((g) => g.feature));

        layerQuestions.push({
          id: `auto_match_${layer.id}_${m}_${timestamp}`,
          category: 'mongolia',
          gradeLevels,
          type: 'shp_contour_guess',
          title: `🔗 [Холбох даалгавар · ${layer.name}] Зураг дээрх 3 обьектийг (${group.map((g) => g.name).join(', ')}) харгалзах газарзүйн үзүүлэлттэй нь зөв холбосон хувилбарыг сонгоно уу?`,
          subtitle: `Обьект тус бүрийн хэмжээ болон орон зайн байршлыг харьцуулан зөв харгалзуулсан мөрийг олно уу.`,
          targetName: correctMatch,
          targetId: `${layer.id}_match_${m}`,
          explanation: `Зөв холболт: ${correctMatch}`,
          difficulty: 'hard',
          points: pointsPerQuestion,
          gisAutoTaskType: 'match',
          shpContourData: {
            featureId: `${layer.id}_match_${m}`,
            layerName: layer.name,
            geometryType: (group[0].geomType as any) || 'Polygon',
            geojson: multiGeo,
            categoryLabel,
            maskedProperties: {
              'ОБЬЕКТ 1': group[0].name,
              'ОБЬЕКТ 2': group[1].name,
              'ОБЬЕКТ 3': group[2].name,
            },
            realProperties: {
              [group[0].name]: d0,
              [group[1].name]: d1,
              [group[2].name]: d2,
            },
            targetName: correctMatch,
            options: opts.map((o) => o.text),
            hints: [
              `Холбох обьектууд: 1) ${group[0].name}, 2) ${group[1].name}, 3) ${group[2].name}`,
              `Харгалзах утгууд: ${[d0, d1, d2].sort(() => Math.random() - 0.5).join(' | ')}`,
            ],
          },
          options: opts,
        });
      }
    }

    // Shuffle and cap per layer
    const shuffledLayerQuestions = layerQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, maxQuestionsPerLayer);

    generatedQuestions.push(...shuffledLayerQuestions);
  }

  return generatedQuestions;
}
