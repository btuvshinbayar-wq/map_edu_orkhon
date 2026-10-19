/**
 * Utilities for extracting real feature names and DBF attributes from arbitrary
 * ESRI Shapefiles (.shp / .dbf) and GeoJSON FeatureCollections.
 */

const PRIORITY_NAME_KEYS = [
  'name_mn',
  'adm1_mn',
  'adm2_mn',
  'adm3_mn',
  'aimag_name',
  'aimag_ner',
  'sum_name',
  'sum_ner',
  'soum_name',
  'soum_ner',
  'bag_name',
  'ner',
  'нэр',
  'аймаг',
  'сум',
  'nl_name_1',
  'nl_name_2',
  'name_1',
  'name_2',
  'name_3',
  'varname_1',
  'varname_2',
  'name',
  'aimag',
  'sum',
  'soum',
  'adm1_en',
  'adm2_en',
  'adm3_en',
  'name_en',
  'name_eng',
  'name_loc',
  'full_name',
  'f_name',
  'official_n',
  'nam',
  'title',
  'label',
  'river_name',
  'lake_name',
  'mt_name',
  'road_name',
  'basin',
  'center',
  'төв',
  'хот',
  'city',
  'region',
];

const IGNORED_GENERIC_KEYS = new Set([
  'id',
  'fid',
  'objectid',
  'objectid_1',
  'gid',
  'shape_leng',
  'shape_le_1',
  'shape_area',
  'st_area_sh',
  'st_length_',
  'area',
  'area_sqkm',
  'perimeter',
  'population',
  'lat',
  'lng',
  'latitude',
  'longitude',
  'centercoords',
  'iso',
  'iso_3',
  'iso_2',
  'id_0',
  'id_1',
  'id_2',
  'cc_1',
  'hasc_1',
  'code',
  'pcode',
  'adm0_pcode',
  'adm1_pcode',
  'adm2_pcode',
  'coords_sys',
]);

function isMeaningfulString(val: any): boolean {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  if (!s) return false;
  // Ignore pure numbers, booleans, or "[object Object]"
  if (/^-?\d+(\.\d+)?$/.test(s)) return false;
  if (s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined' || s === '[object Object]') {
    return false;
  }
  return true;
}

function hasCyrillic(str: string): boolean {
  return /[А-Яа-яЁёӨөҮү]/.test(str);
}

/**
 * Inspects a list of GeoJSON features and detects the best DBF attribute column
 * that represents the object's human-readable name.
 */
export function detectBestNameField(features: any[]): string | null {
  if (!Array.isArray(features) || features.length === 0) return null;

  const sampleFeatures = features.slice(0, Math.min(25, features.length));
  const allKeysSet = new Set<string>();
  sampleFeatures.forEach((f) => {
    if (f && f.properties && typeof f.properties === 'object') {
      Object.keys(f.properties).forEach((k) => { if (!k.startsWith('_')) allKeysSet.add(k); });
    }
  });

  const allKeys = Array.from(allKeysSet);
  if (allKeys.length === 0) return null;

  // 1. Check exact match in PRIORITY_NAME_KEYS (case-insensitive)
  for (const priKey of PRIORITY_NAME_KEYS) {
    const matchedKey = allKeys.find((k) => k.toLowerCase() === priKey);
    if (matchedKey) {
      const hasValidValues = sampleFeatures.some((f) =>
        isMeaningfulString(f?.properties?.[matchedKey])
      );
      if (hasValidValues) return matchedKey;
    }
  }

  // 2. Check partial match for keys containing name/ner/нэр/aimag/sum/adm
  const nameLikePatterns = ['name', 'ner', 'нэр', 'aimag', 'аймаг', 'sum', 'soum', 'сум', 'title', 'label', 'adm1', 'adm2'];
  for (const pattern of nameLikePatterns) {
    const matchedKey = allKeys.find(
      (k) =>
        k.toLowerCase().includes(pattern) &&
        !IGNORED_GENERIC_KEYS.has(k.toLowerCase()) &&
        !k.toLowerCase().includes('pcode') &&
        !k.toLowerCase().includes('code') &&
        !k.toLowerCase().includes('id')
    );
    if (matchedKey) {
      const hasValidValues = sampleFeatures.some((f) =>
        isMeaningfulString(f?.properties?.[matchedKey])
      );
      if (hasValidValues) return matchedKey;
    }
  }

  // 3. Score remaining columns to find the best text column (preferring unique Cyrillic / text values)
  let bestKey: string | null = null;
  let bestScore = -1;

  for (const key of allKeys) {
    const lowerKey = key.toLowerCase();
    if (IGNORED_GENERIC_KEYS.has(lowerKey)) continue;

    const values: string[] = [];
    let cyrillicCount = 0;

    for (const f of sampleFeatures) {
      const v = f?.properties?.[key];
      if (isMeaningfulString(v)) {
        const s = String(v).trim();
        values.push(s);
        if (hasCyrillic(s)) cyrillicCount++;
      }
    }

    if (values.length === 0) continue;

    const uniqueCount = new Set(values).size;
    // Higher score for more unique values across features + Cyrillic bonus
    const uniquenessRatio = uniqueCount / values.length;
    const score = values.length * 2 + uniqueCount * 5 + cyrillicCount * 4 + uniquenessRatio * 10;

    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  return bestKey || allKeys[0] || null;
}

/**
 * Extracts all attribute column names and sample values for UI dropdowns
 */
export function getLayerAttributeColumns(
  features: any[]
): { key: string; sampleValues: string[] }[] {
  if (!Array.isArray(features) || features.length === 0) return [];

  const keysSet = new Set<string>();
  features.slice(0, 20).forEach((f) => {
    if (f?.properties && typeof f.properties === 'object') {
      Object.keys(f.properties).forEach((k) => {
        if (k !== 'centerCoords' && !k.startsWith('_')) keysSet.add(k);
      });
    }
  });

  return Array.from(keysSet).map((key) => {
    const samples: string[] = [];
    for (const f of features) {
      const val = f?.properties?.[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const s = String(val).trim();
        if (!samples.includes(s)) {
          samples.push(s);
        }
      }
      if (samples.length >= 3) break;
    }
    return { key, sampleValues: samples };
  });
}

/**
 * Extracts a human-readable name from a single GeoJSON feature's properties.
 */
export function extractFeatureName(
  properties: any,
  index: number = 0,
  preferredField?: string | null
): string {
  if (!properties || typeof properties !== 'object') {
    return `ID-${index + 1}`;
  }

  // 1. If user or layer detector specified a preferred column
  if (preferredField && properties[preferredField] !== undefined && properties[preferredField] !== null) {
    const val = String(properties[preferredField]).trim();
    if (val) return val;
  }

  // Fast path if NAME_MN or name is already populated as a string
  if (!preferredField) {
    if (typeof properties.NAME_MN === 'string' && properties.NAME_MN.trim()) {
      return properties.NAME_MN.trim();
    }
    if (typeof properties.name === 'string' && properties.name.trim()) {
      return properties.name.trim();
    }
    if (typeof properties.NAME === 'string' && properties.NAME.trim()) {
      return properties.NAME.trim();
    }
  }

  const keys = Object.keys(properties).filter((k) => !k.startsWith('_'));

  // 2. Check PRIORITY_NAME_KEYS (case-insensitive)
  for (const priKey of PRIORITY_NAME_KEYS) {
    const foundKey = keys.find((k) => k.toLowerCase() === priKey);
    if (foundKey && isMeaningfulString(properties[foundKey])) {
      return String(properties[foundKey]).trim();
    }
  }

  // 3. Check partial key match (name, ner, нэр, aimag, sum, soum, adm, title, label)
  const partialPatterns = ['name', 'ner', 'нэр', 'aimag', 'аймаг', 'sum', 'soum', 'сум', 'title', 'label', 'adm'];
  for (const pat of partialPatterns) {
    const foundKey = keys.find(
      (k) =>
        k.toLowerCase().includes(pat) &&
        !IGNORED_GENERIC_KEYS.has(k.toLowerCase()) &&
        !k.toLowerCase().includes('code') &&
        isMeaningfulString(properties[k])
    );
    if (foundKey) {
      return String(properties[foundKey]).trim();
    }
  }

  // 4. Check any Cyrillic string value that isn't a generic type label
  for (const k of keys) {
    if (IGNORED_GENERIC_KEYS.has(k.toLowerCase())) continue;
    const val = properties[k];
    if (isMeaningfulString(val)) {
      const s = String(val).trim();
      if (hasCyrillic(s) && s !== 'Аймаг' && s !== 'Сум' && s !== 'Улсын хил') {
        return s;
      }
    }
  }

  // 5. Check any meaningful string value in properties
  for (const k of keys) {
    if (IGNORED_GENERIC_KEYS.has(k.toLowerCase())) continue;
    const val = properties[k];
    if (isMeaningfulString(val)) {
      return String(val).trim();
    }
  }

  // 6. Fallback to any non-empty property value
  for (const k of keys) {
    const val = properties[k];
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return `${k}: ${String(val).trim()}`;
    }
  }

  return `ID-${index + 1}`;
}

/**
 * Rounds a coordinate number to 4 decimal places (~11m accuracy, ideal for map rendering while cutting payload size).
 */
function roundCoord(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/**
 * Perpendicular distance squared from a point [x, y] to a segment [x1, y1] -> [x2, y2]
 */
function getSqSegDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  let x = x1;
  let y = y1;
  let dx = x2 - x;
  let dy = y2 - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = x2;
      y = y2;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = px - x;
  dy = py - y;
  return dx * dx + dy * dy;
}

/**
 * Iterative Douglas-Peucker simplification to preserve sharp topological corners
 * while drastically cutting redundant collinear vertices.
 */
function simplifyDouglasPeucker(
  points: [number, number][],
  sqTolerance: number
): [number, number][] {
  const len = points.length;
  if (len <= 4) return points;

  const markers = new Uint8Array(len);
  markers[0] = 1;
  markers[len - 1] = 1;

  const stack: number[] = [0, len - 1];
  const result: [number, number][] = [];

  while (stack.length > 0) {
    const last = stack.pop()!;
    const first = stack.pop()!;

    let maxSqDist = 0;
    let index = 0;

    const x1 = points[first][0];
    const y1 = points[first][1];
    const x2 = points[last][0];
    const y2 = points[last][1];

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(points[i][0], points[i][1], x1, y1, x2, y2);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTolerance) {
      markers[index] = 1;
      stack.push(first, index, index, last);
    }
  }

  for (let i = 0; i < len; i++) {
    if (markers[i]) {
      result.push(points[i]);
    }
  }

  return result;
}

/**
 * Fast radial + iterative Douglas-Peucker simplification for a coordinate array [[lng, lat], ...]
 */
function simplifyCoordSequence(
  coords: any[],
  tolerance: number,
  isClosedRing: boolean
): any[] {
  if (!Array.isArray(coords) || coords.length <= (isClosedRing ? 10 : 5)) {
    return coords.map((pt) =>
      Array.isArray(pt) && pt.length >= 2
        ? [roundCoord(Number(pt[0])), roundCoord(Number(pt[1]))]
        : pt
    );
  }

  const sqTol = tolerance * tolerance;

  // Step 1: Fast radial distance filter
  const radial: [number, number][] = [];
  let prevX = Number(coords[0][0]);
  let prevY = Number(coords[0][1]);
  radial.push([roundCoord(prevX), roundCoord(prevY)]);

  for (let i = 1; i < coords.length - 1; i++) {
    const x = Number(coords[i][0]);
    const y = Number(coords[i][1]);
    const dx = x - prevX;
    const dy = y - prevY;
    if (dx * dx + dy * dy > sqTol * 0.25) {
      radial.push([roundCoord(x), roundCoord(y)]);
      prevX = x;
      prevY = y;
    }
  }

  const lastPt = coords[coords.length - 1];
  radial.push([roundCoord(Number(lastPt[0])), roundCoord(Number(lastPt[1]))]);

  // Step 2: Douglas-Peucker pass
  const simplified = simplifyDouglasPeucker(radial, sqTol);

  // Ensure closed polygon rings maintain at least 4 vertices
  if (isClosedRing && simplified.length < 4) {
    const step = Math.max(1, Math.floor(coords.length / 4));
    const fallback: [number, number][] = [];
    for (let i = 0; i < coords.length - 1; i += step) {
      fallback.push([roundCoord(Number(coords[i][0])), roundCoord(Number(coords[i][1]))]);
    }
    const first = fallback[0];
    fallback.push([first[0], first[1]]);
    return fallback;
  }

  return simplified;
}

/**
 * Optimizes a GeoJSON geometry by simplifying overly dense vertices and rounding coordinates.
 */
function optimizeGeometry(geom: any, tolerance: number): any {
  if (!geom || !geom.type || !geom.coordinates) return geom;

  switch (geom.type) {
    case 'Point':
      return {
        type: 'Point',
        coordinates: [
          roundCoord(Number(geom.coordinates[0])),
          roundCoord(Number(geom.coordinates[1])),
        ],
      };

    case 'MultiPoint':
      return {
        type: 'MultiPoint',
        coordinates: geom.coordinates.map((pt: any) => [
          roundCoord(Number(pt[0])),
          roundCoord(Number(pt[1])),
        ]),
      };

    case 'LineString':
      return {
        type: 'LineString',
        coordinates: simplifyCoordSequence(geom.coordinates, tolerance, false),
      };

    case 'MultiLineString':
      return {
        type: 'MultiLineString',
        coordinates: geom.coordinates.map((line: any) =>
          simplifyCoordSequence(line, tolerance, false)
        ),
      };

    case 'Polygon':
      return {
        type: 'Polygon',
        coordinates: geom.coordinates.map((ring: any) =>
          simplifyCoordSequence(ring, tolerance, true)
        ),
      };

    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: geom.coordinates.map((poly: any) =>
          poly.map((ring: any) => simplifyCoordSequence(ring, tolerance, true))
        ),
      };

    default:
      return geom;
  }
}

/**
 * Optimizes a parsed Shapefile / GeoJSON FeatureCollection so it renders at 60 FPS
 * without freezing the browser or overflowing memory.
 */
export function optimizeGeoJsonForWeb(geojson: any): {
  geojson: any;
  originalVertexCount: number;
  optimizedVertexCount: number;
  detectedNameField: string | null;
} {
  if (!geojson || !Array.isArray(geojson.features)) {
    return { geojson, originalVertexCount: 0, optimizedVertexCount: 0, detectedNameField: null };
  }

  // Count approximate total vertices first to choose adaptive tolerance
  let totalVertices = 0;
  const countCoords = (arr: any) => {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'number') {
      totalVertices++;
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      countCoords(arr[i]);
    }
  };

  for (let i = 0; i < geojson.features.length; i++) {
    const g = geojson.features[i]?.geometry;
    if (g?.coordinates) countCoords(g.coordinates);
  }

  // Adaptive tolerance in degrees to keep total vertices under ~12,000 for 60fps rendering:
  const tolerance =
    totalVertices > 250000
      ? 0.0045
      : totalVertices > 100000
      ? 0.0028
      : totalVertices > 40000
      ? 0.0015
      : totalVertices > 12000
      ? 0.0007
      : 0.00015;

  const bestNameCol = detectBestNameField(geojson.features);

  const optimizedFeatures = geojson.features.map((feat: any, idx: number) => {
    const props = feat?.properties || {};
    const resolvedName = extractFeatureName(props, idx, bestNameCol);
    return {
      type: 'Feature',
      properties: {
        ...props,
        NAME_MN: props.NAME_MN || resolvedName,
      },
      geometry: optimizeGeometry(feat?.geometry, tolerance),
    };
  });

  let afterVertices = 0;
  const countAfter = (arr: any) => {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'number') {
      afterVertices++;
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      countAfter(arr[i]);
    }
  };
  for (let i = 0; i < optimizedFeatures.length; i++) {
    const g = optimizedFeatures[i]?.geometry;
    if (g?.coordinates) countAfter(g.coordinates);
  }

  return {
    geojson: {
      type: 'FeatureCollection',
      features: optimizedFeatures,
    },
    originalVertexCount: totalVertices,
    optimizedVertexCount: afterVertices,
    detectedNameField: bestNameCol,
  };
}

/**
 * Asynchronous IndexedDB storage for large GIS layers so we never block the main UI thread
 * with synchronous JSON.stringify + localStorage writes or hit the 5MB localStorage quota.
 */
const IDB_NAME = 'geo_gis_layers_idb_v1';
const IDB_STORE = 'layers_store';
const IDB_KEY = 'saved_gis_layers';

function openGisDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveGisLayersAsync(layers: any[]): Promise<void> {
  try {
    const db = await openGisDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(layers, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save fallback:', err);
  }
}

export async function loadGisLayersAsync(): Promise<any[] | null> {
  try {
    const db = await openGisDb();
    return await new Promise<any[] | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Returns the active features of a GIS layer:
 * If `layer.selectedFeatureIndices` is defined (array), returns only those selected features.
 * Otherwise returns all features in `layer.geojson.features`.
 */
export function getActiveLayerFeatures(
  layer: {
    geojson?: any;
    nameField?: string;
    selectedFeatureIndices?: number[];
  } | null | undefined
): { feature: any; originalIndex: number; name: string }[] {
  if (!layer || !layer.geojson) return [];
  const rawFeatures = Array.isArray(layer.geojson.features)
    ? layer.geojson.features
    : layer.geojson.type === 'Feature'
    ? [layer.geojson]
    : [];

  if (rawFeatures.length === 0) return [];

  const activeField = layer.nameField || detectBestNameField(rawFeatures);
  const selectedSet = Array.isArray(layer.selectedFeatureIndices)
    ? new Set(layer.selectedFeatureIndices)
    : null;

  const result: { feature: any; originalIndex: number; name: string }[] = [];
  for (let i = 0; i < rawFeatures.length; i++) {
    if (selectedSet && !selectedSet.has(i)) continue;
    const f = rawFeatures[i];
    const name = extractFeatureName(f?.properties, i, activeField);
    result.push({
      feature: f,
      originalIndex: i,
      name,
    });
  }

  return result;
}

/**
 * Returns a filtered GeoJSON FeatureCollection containing only the selected features (or all if undefined).
 */
export function getFilteredLayerGeoJson(
  layer: {
    geojson?: any;
    nameField?: string;
    selectedFeatureIndices?: number[];
  } | null | undefined
): any {
  if (!layer || !layer.geojson) return null;
  if (!Array.isArray(layer.selectedFeatureIndices)) {
    return layer.geojson;
  }
  const activeItems = getActiveLayerFeatures(layer);
  return {
    type: 'FeatureCollection',
    features: activeItems.map((item) => item.feature),
  };
}

/**
 * Masks all name/identifying properties in a feature's DBF attributes so the object's name
 * is strictly hidden during Competition (Уралдаан) and Challenge (Сорил) modes.
 */
export function maskFeatureProperties(
  rawProps: Record<string, any> | undefined,
  targetName: string,
  nameField?: string | null
): { maskedProps: Record<string, string>; realProps: Record<string, any> } {
  const raw = rawProps || {};
  const realProps: Record<string, any> = {};
  const maskedProps: Record<string, string> = {};
  const activeFieldUpper = (nameField || '').toUpperCase();
  const targetLower = (targetName || '').trim().toLowerCase();

  Object.entries(raw).forEach(([k, val]) => {
    if (k === 'id' || k === 'centerCoords' || k.startsWith('_')) return; // `_` = дотоод тооцоолол
    const keyUpper = k.toUpperCase();
    const valStr = String(val ?? '').trim();
    realProps[k] = val;

    const isNameKey =
      keyUpper === activeFieldUpper ||
      keyUpper.includes('NAME') ||
      keyUpper.includes('НЭР') ||
      keyUpper.includes('NER') ||
      keyUpper.includes('TITLE') ||
      keyUpper.includes('LABEL') ||
      keyUpper.includes('CENTER') ||
      keyUpper.includes('ТӨВ') ||
      keyUpper.includes('AIMAG') ||
      keyUpper.includes('АЙМАГ') ||
      keyUpper.includes('SUM') ||
      keyUpper.includes('SOUM') ||
      keyUpper.includes('СУМ') ||
      keyUpper.includes('ADM1') ||
      keyUpper.includes('ADM2') ||
      keyUpper.includes('ADM3') ||
      (targetLower.length > 1 && valStr.toLowerCase().includes(targetLower));

    if (isNameKey) {
      maskedProps[k] = '[ ? ? ? НУУЦЛАГДСАН ]';
    } else {
      maskedProps[k] = valStr;
    }
  });

  if (Object.keys(maskedProps).length === 0) {
    maskedProps['ОБЬЕКТИЙН НЭР'] = '[ ? ? ? НУУЦЛАГДСАН ]';
    maskedProps['КООРДИНАТ'] = 'WGS84 бодит контур';
  }

  return { maskedProps, realProps };
}

/**
 * Dynamically generates SHP Contour Guess questions from admin's active GIS layers
 * (respecting `selectedFeatureIndices` — either specific selected objects or all objects),
 * with all object names strictly masked until answered.
 */
export function generateQuestionsFromAdminLayers(layers: any[]): any[] {
  if (!Array.isArray(layers) || layers.length === 0) return [];

  // Prefer visible layers; if none visible, use all layers
  const targetLayers = layers.some((l) => l.visible)
    ? layers.filter((l) => l.visible)
    : layers;

  const generated: any[] = [];

  for (const layer of targetLayers) {
    const activeItems = getActiveLayerFeatures(layer);
    if (activeItems.length === 0) continue;

    // Collect all unique names across the entire layer for realistic distractors
    const allLayerFeatures = Array.isArray(layer.geojson?.features)
      ? layer.geojson.features
      : [];
    const activeField = layer.nameField || detectBestNameField(allLayerFeatures);
    const allUniqueNames: string[] = Array.from(
      new Set(
        allLayerFeatures
          .map((f: any, idx: number) => extractFeatureName(f?.properties, idx, activeField))
          .filter(Boolean)
      )
    );

    const lowerLayerName = (layer.name || '').toLowerCase();
    const categoryLabel =
      lowerLayerName.includes('сум') || lowerLayerName.includes('sum') || lowerLayerName.includes('soum')
        ? 'сум'
        : lowerLayerName.includes('аймаг') || lowerLayerName.includes('boundary') || lowerLayerName.includes('хил')
        ? 'аймаг'
        : lowerLayerName.includes('гол') || lowerLayerName.includes('нуур') || lowerLayerName.includes('ус')
        ? 'гол / нуур'
        : lowerLayerName.includes('хамгаалалт') || lowerLayerName.includes('тхгн')
        ? 'тусгай хамгаалалттай газар'
        : lowerLayerName.includes('орд') || lowerLayerName.includes('уурхай')
        ? 'стратегийн орд'
        : 'газарзүйн обьект';

    // Cap per layer to 60 items so memory & shuffling stay instant
    const itemsToProcess = activeItems.slice(0, 60);

    for (const item of itemsToProcess) {
      const fName = item.name;
      const feat = item.feature;
      const idx = item.originalIndex;

      // Strip identifying properties from the isolated GeoJSON passed to map
      const { maskedProps, realProps } = maskFeatureProperties(
        feat?.properties,
        fName,
        activeField
      );

      const cleanIsolatedGeo = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {}, // Strip raw properties on geometry so nothing leaks on hover/tooltip
            geometry: feat?.geometry,
          },
        ],
      };

      const siblingPool = allUniqueNames.filter((n) => n !== fName);
      const shuffledSiblings = [...siblingPool]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const fallbackDistractors = [
        'Архангай',
        'Хөвсгөл',
        'Өмнөговь',
        'Баянхонгор',
        'Завхан',
        'Дорнод',
      ].filter((d) => d !== fName);

      while (shuffledSiblings.length < 3) {
        const fb = fallbackDistractors.find(
          (d) => !shuffledSiblings.includes(d) && d !== fName
        );
        if (fb) shuffledSiblings.push(fb);
        else shuffledSiblings.push(`Хувилбар ${shuffledSiblings.length + 1}`);
      }

      const allOpts = [fName, ...shuffledSiblings].sort(() => Math.random() - 0.5);

      generated.push({
        id: `layer_q_${layer.id}_${idx}`,
        category: 'mongolia',
        gradeLevels: ['9', '12', 'teacher', 'team'],
        type: 'shp_contour_guess',
        title: `🔍 [${layer.name}] Зурагт өгөгдсөн контур дүрс аль ${categoryLabel} вэ?`,
        subtitle: `Обьектийн нэр нууцлагдсан. Хэлбэр дүрс болон масштабыг ажиглан зөв нэрийг сонгоно уу.`,
        targetName: fName,
        targetId: `${layer.id}_feat_${idx}`,
        explanation: `Зөв хариулт: ${fName} (${layer.name} давхарга).`,
        difficulty: 'medium',
        points: 15,
        shpContourData: {
          featureId: `${layer.id}_f_${idx}`,
          layerName: layer.name,
          geometryType: feat?.geometry?.type || 'Polygon',
          geojson: cleanIsolatedGeo,
          categoryLabel,
          maskedProperties: maskedProps,
          realProperties: realProps,
          targetName: fName,
          options: allOpts,
          hints: [
            `Давхарга: ${layer.name}`,
            `Обьектийн нэр нууцлагдсан — зөвхөн хэлбэр ба масштабаар таана уу`,
          ],
        },
        options: allOpts.map((opt, optIdx) => ({
          id: String(optIdx + 1),
          text: opt,
          isCorrect: opt.trim() === fName.trim(),
        })),
      });
    }
  }

  return generated;
}

/**
 * Haversine distance in kilometers between two [lng, lat] points.
 */
function haversineDistanceCoordKm(pt1: any, pt2: any): number {
  if (!Array.isArray(pt1) || !Array.isArray(pt2) || pt1.length < 2 || pt2.length < 2) return 0;
  const lng1 = Number(pt1[0]);
  const lat1 = Number(pt1[1]);
  const lng2 = Number(pt2[0]);
  const lat2 = Number(pt2[1]);
  if (Number.isNaN(lng1) || Number.isNaN(lat1) || Number.isNaN(lng2) || Number.isNaN(lat2)) {
    return 0;
  }

  const R = 6371.0088; // Mean Earth radius in km
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

function lineCoordsLengthKm(coords: any[]): number {
  if (!Array.isArray(coords) || coords.length < 2) return 0;
  let sum = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    sum += haversineDistanceCoordKm(coords[i], coords[i + 1]);
  }
  return sum;
}

/**
 * Calculates the length in kilometers (km) for a LineString / MultiLineString feature
 * (or perimeter for Polygon). Also checks explicit numeric DBF columns like LENGTH_KM if valid.
 */
export function calculateFeatureLengthKm(feature: any): number {
  if (!feature) return 0;
  const props = feature.properties || {};

  // Check explicit km length property first if present
  for (const key of ['LENGTH_KM', 'LEN_KM', 'URT_KM', 'length_km']) {
    const val = Number(props[key]);
    if (!Number.isNaN(val) && val > 0) {
      return Math.round(val * 100) / 100;
    }
  }

  const geom = feature.geometry;
  if (!geom || !geom.coordinates) return 0;

  let totalKm = 0;
  if (geom.type === 'LineString') {
    totalKm = lineCoordsLengthKm(geom.coordinates);
  } else if (geom.type === 'MultiLineString') {
    for (const line of geom.coordinates) {
      totalKm += lineCoordsLengthKm(line);
    }
  } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates[0])) {
    totalKm = lineCoordsLengthKm(geom.coordinates[0]);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      if (Array.isArray(poly) && Array.isArray(poly[0])) {
        totalKm += lineCoordsLengthKm(poly[0]);
      }
    }
  }

  return Math.round(totalKm * 100) / 100;
}

/**
 * Spherical excess ring area in km² for a closed coordinate ring [[lng, lat], ...]
 */
function sphericalRingAreaKm2(coords: any[]): number {
  if (!Array.isArray(coords) || coords.length < 3) return 0;
  const R = 6371.0088; // Earth mean radius in km
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    if (!Array.isArray(p1) || !Array.isArray(p2)) continue;
    const lng1 = (Number(p1[0]) * Math.PI) / 180;
    const lat1 = (Number(p1[1]) * Math.PI) / 180;
    const lng2 = (Number(p2[0]) * Math.PI) / 180;
    const lat2 = (Number(p2[1]) * Math.PI) / 180;
    if (Number.isNaN(lng1) || Number.isNaN(lat1) || Number.isNaN(lng2) || Number.isNaN(lat2)) {
      continue;
    }
    total += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((total * R * R) / 2.0);
}

function polygonRingsAreaKm2(rings: any[]): number {
  if (!Array.isArray(rings) || rings.length === 0) return 0;
  let area = sphericalRingAreaKm2(rings[0]);
  for (let i = 1; i < rings.length; i++) {
    area -= sphericalRingAreaKm2(rings[i]);
  }
  return Math.max(0, area);
}

/**
 * Calculates the area in square kilometers (km²) for a Polygon / MultiPolygon feature.
 * Checks explicit AREA_SQKM / AREA_KM2 DBF attributes first, otherwise computes geodesic area from WGS84 rings.
 */
export function calculateFeatureAreaKm2(feature: any): number {
  if (!feature) return 0;
  const props = feature.properties || {};

  for (const key of ['AREA_SQKM', 'AREA_KM2', 'area_sqkm', 'area_km2', 'TALBAI_KM2']) {
    const val = Number(props[key]);
    if (!Number.isNaN(val) && val > 0) {
      return Math.round(val * 100) / 100;
    }
  }

  const geom = feature.geometry;
  if (!geom || !geom.coordinates) return 0;

  let totalKm2 = 0;
  if (geom.type === 'Polygon') {
    totalKm2 = polygonRingsAreaKm2(geom.coordinates);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      totalKm2 += polygonRingsAreaKm2(poly);
    }
  }

  return Math.round(totalKm2 * 100) / 100;
}

/**
 * Computes the bounding box center { lat, lng } for any GeoJSON geometry.
 */
export function computeGeometryCenter(
  geom: any
): { lat: number; lng: number } | null {
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
  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
}


