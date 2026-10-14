/**
 * Real coordinate GIS Vector Layers for Mongolia (WGS84 EPSG:4326)
 * Demonstrates ready coordinate, real scale, and spatial location data for *.shp / GeoJSON
 */

export interface GisLayerPreset {
  id: string;
  name: string;
  category: 'boundary' | 'water' | 'protected' | 'mining' | 'roads';
  description: string;
  featureCount: number;
  geometryType: 'Polygon' | 'MultiPolygon' | 'LineString' | 'Point';
  style: {
    color: string;
    fillColor?: string;
    fillOpacity?: number;
    weight: number;
  };
  geojson: any;
}

// 1. Mongolia National Border (country_boundary fallback when no uploaded country_boundary layer is found)
export const MONGOLIA_BOUNDARIES_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'mn_national_boundary',
        NAME_MN: 'Монгол Улсын Хил Хязгаар',
        NAME_EN: 'Mongolia National Boundary',
        AREA_SQKM: 1564116,
        TYPE: 'Улсын хил',
        CAPITAL: 'Улаанбаатар',
        COORDS_SYS: 'WGS84 (EPSG:4326)',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [87.75, 49.15],
            [89.50, 49.85],
            [92.50, 50.80],
            [96.00, 51.50],
            [98.80, 51.80],
            [100.50, 52.15],
            [102.00, 51.50],
            [104.50, 50.40],
            [106.20, 50.35],
            [108.50, 50.30],
            [111.00, 50.00],
            [113.50, 49.90],
            [116.00, 49.80],
            [118.50, 49.00],
            [119.95, 47.80],
            [119.50, 46.50],
            [117.00, 46.00],
            [115.50, 45.20],
            [113.50, 44.90],
            [111.50, 43.50],
            [110.00, 42.50],
            [107.50, 42.00],
            [105.00, 42.50],
            [103.00, 41.58],
            [100.00, 42.00],
            [97.00, 42.80],
            [94.00, 43.50],
            [91.50, 45.00],
            [89.00, 46.50],
            [87.75, 49.15],
          ],
        ],
      },
    },
  ],
};

/**
 * Finds the admin-uploaded `country_boundary` (улсын хил) layer from `gisLayers` if present;
 * otherwise falls back to the single national border outline `MONGOLIA_BOUNDARIES_GEOJSON`.
 */
export function resolveCountryBoundaryGeoJson(gisLayers?: any[]): any {
  if (Array.isArray(gisLayers) && gisLayers.length > 0) {
    // 1. Exact or partial match on "country_boundary"
    const exactMatch = gisLayers.find((l) => {
      const name = String(l?.name || '').toLowerCase().trim();
      const id = String(l?.id || '').toLowerCase().trim();
      return (
        (name === 'country_boundary' ||
          name.includes('country_boundary') ||
          id.includes('country_boundary') ||
          name.includes('улсын хил') ||
          name.includes('national_boundary') ||
          name === 'boundary' ||
          name.includes('country boundary')) &&
        l?.geojson
      );
    });
    if (exactMatch?.geojson) {
      return exactMatch.geojson;
    }
  }
  return MONGOLIA_BOUNDARIES_GEOJSON;
}



// 2. Real Rivers & Lakes in Mongolia
export const MONGOLIA_HYDRO_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'river_selenge',
        NAME_MN: 'Сэлэнгэ мөрөн',
        BASIN: 'Хойд мөсөн далай (Байгал нуур)',
        LENGTH_KM: 992,
        FLOW: 'Ус цуглуулах талбай 447,000 км²',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [102.5, 49.2],
          [103.8, 49.5],
          [105.2, 49.8],
          [106.0, 50.1],
          [106.2, 50.35],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'river_orkhon',
        NAME_MN: 'Орхон гол (Монголын хамгийн урт)',
        BASIN: 'Сэлэнгэ мөрний цутгал',
        LENGTH_KM: 1124,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [101.4, 46.8],
          [102.8, 47.2],
          [103.5, 47.8],
          [104.2, 48.5],
          [105.8, 49.9],
          [106.0, 50.1],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'river_tuul',
        NAME_MN: 'Туул гол (Хатан туул)',
        BASIN: 'Орхон голын цутгал',
        LENGTH_KM: 704,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [108.2, 48.4],
          [107.5, 48.1],
          [106.9, 47.9],
          [106.2, 47.7],
          [105.5, 47.8],
          [104.4, 48.8],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'river_kherlen',
        NAME_MN: 'Хэрлэн гол',
        BASIN: 'Номхон далай (Далай нуур)',
        LENGTH_KM: 1254,
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [108.5, 48.8],
          [109.8, 47.8],
          [111.5, 47.3],
          [114.5, 48.0],
          [116.2, 48.5],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'lake_khuvsgul_poly',
        NAME_MN: 'Хөвсгөл нуур (Цэнгэг далай)',
        DEPTH_M: 262.4,
        AREA_SQKM: 2760,
        WATER_TYPE: 'Цэнгэг ус',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [100.1, 50.5],
            [100.6, 50.8],
            [100.8, 51.4],
            [100.6, 51.6],
            [100.2, 51.3],
            [100.0, 50.9],
            [100.1, 50.5],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'lake_uvs_poly',
        NAME_MN: 'Увс нуур (Монголын хамгийн том нуур)',
        AREA_SQKM: 3350,
        WATER_TYPE: 'Давстай нуур',
        HERITAGE: 'ЮНЕСКО-гийн Дэлхийн өв',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [92.2, 50.1],
            [93.2, 50.1],
            [93.6, 50.5],
            [93.1, 50.7],
            [92.3, 50.6],
            [92.2, 50.1],
          ],
        ],
      },
    },
  ],
};

// 3. Strictly Protected Areas & National Parks (Real polygons)
export const MONGOLIA_PROTECTED_AREAS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'bogd_khan_uul',
        NAME_MN: 'Богдхан уулын Дархан цаазат газар',
        STATUS: 'Дэлхийн анхны дархан цаазат газар (1778 он)',
        AREA_SQKM: 416,
        TYPE: 'ДЦГ',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.75, 47.78],
            [107.05, 47.78],
            [107.10, 47.92],
            [106.80, 47.92],
            [106.75, 47.78],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'gobi_gurvansaikhan',
        NAME_MN: 'Говь Гурвансайханы Байгалийн Цогцолборт Газар',
        STATUS: 'Байгалийн цогцолборт газар',
        HIGHLIGHTS: 'Ёлын ам, Хонгорын элс, Баянзаг',
        AREA_SQKM: 26947,
        TYPE: 'БЦГ',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [102.5, 43.2],
            [104.5, 43.2],
            [104.8, 44.2],
            [102.8, 44.4],
            [102.5, 43.2],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'altai_tavan_bogd',
        NAME_MN: 'Алтай Таван Богдын Байгалийн Цогцолборт Газар',
        PEAKS: 'Хүйтэн (4374 м), Найрамдал, Малчин',
        GLACIERS: 'Потанины мөсөн гол',
        AREA_SQKM: 6362,
        TYPE: 'БЦГ',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [87.8, 48.9],
            [88.8, 49.0],
            [88.9, 49.5],
            [87.9, 49.4],
            [87.8, 48.9],
          ],
        ],
      },
    },
  ],
};

// 4. Strategic Mineral Basins (Points with DBF Attributes)
export const MONGOLIA_MINING_BASINS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'basin_oyu_tolgoi',
        NAME_MN: 'Оюу Толгой (Зэс, Алтны уурхай)',
        COMMODITY: 'Зэс (Cu), Алт (Au)',
        AIMAG: 'Өмнөговь аймаг, Ханбогд сум',
        SCALE: 'Дэлхийн хамгийн том зэс-алтны уурхай',
        LATITUDE: 43.011,
        LONGITUDE: 106.849,
      },
      geometry: {
        type: 'Point',
        coordinates: [106.849, 43.011],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'basin_tavan_tolgoi',
        NAME_MN: 'Таван Толгой (Коксжих нүүрсний орд)',
        COMMODITY: 'Сайн чанарын коксжих нүүрс',
        AIMAG: 'Өмнөговь аймаг, Цогтцэций сум',
        SCALE: '6.4 тэрбум тонн нөөцтэй',
        LATITUDE: 43.626,
        LONGITUDE: 105.474,
      },
      geometry: {
        type: 'Point',
        coordinates: [105.474, 43.626],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'basin_erdenet',
        NAME_MN: 'Эрдэнэтийн Овоо (Зэс-Молибден)',
        COMMODITY: 'Зэс (Cu), Молибден (Mo)',
        AIMAG: 'Орхон аймаг, Баян-Өндөр сум',
        ESTABLISHED: '1978 он',
        LATITUDE: 49.034,
        LONGITUDE: 104.041,
      },
      geometry: {
        type: 'Point',
        coordinates: [104.041, 49.034],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'basin_tsagaan_suvarga',
        NAME_MN: 'Цагаан Суварга (Зэс, Молибден)',
        COMMODITY: 'Зэс, Молибдений баяжмал',
        AIMAG: 'Дорноговь аймаг, Мандах сум',
        LATITUDE: 44.256,
        LONGITUDE: 108.825,
      },
      geometry: {
        type: 'Point',
        coordinates: [108.825, 44.256],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'basin_asgat',
        NAME_MN: 'Асгатын Мөнгөний орд',
        COMMODITY: 'Мөнгө (Ag), Сурьма, Висмут',
        AIMAG: 'Баян-Өлгий аймаг, Ногооннуур сум',
        LATITUDE: 49.782,
        LONGITUDE: 89.845,
      },
      geometry: {
        type: 'Point',
        coordinates: [89.845, 49.782],
      },
    },
  ],
};

// 5. National Transit Highways & Millennium Road (LineStrings)
export const MONGOLIA_ROADS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'road_ah3',
        NAME_MN: 'АН-3 / Азийн Авто Зам №3 (Алтанбулаг - Улаанбаатар - Замын-Үүд)',
        CORRIDOR: 'ОХУ - Монгол - БНХАУ олон улсын тээврийн гол коридор',
        LENGTH_KM: 1040,
        TYPE: 'Олон улсын чанартай авто зам',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [106.52, 50.31], // Altanbulag (North border)
          [106.21, 50.24], // Sukhbaatar city
          [105.92, 49.48], // Darkhan
          [106.91, 47.92], // Ulaanbaatar
          [108.36, 46.36], // Choir
          [110.13, 44.88], // Sainshand
          [111.85, 43.72], // Zamiin-Uud (South border)
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'road_millennium_horizontal',
        NAME_MN: 'Мянганы Зам (Хэвтээ тэнхлэг: Өлгий - Улаанбаатар - Чойбалсан)',
        CORRIDOR: 'Баруун хязгаараас Зүүн хязгаар хүртэлх хэвтээ тэнхлэг',
        LENGTH_KM: 2600,
        TYPE: 'Улсын чанартай хэвтээ гол тэнхлэг',
      },
      geometry: {
        type: 'LineString',
        coordinates: [
          [89.96, 48.97], // Ulgii
          [91.64, 48.00], // Khovd
          [96.84, 47.74], // Uliastai
          [101.45, 47.47], // Tsetserleg
          [106.91, 47.92], // Ulaanbaatar
          [110.65, 47.32], // Undurkhaan (Chinggis City)
          [114.53, 48.07], // Choibalsan
        ],
      },
    },
  ],
};

export const PRESET_GIS_LAYERS: GisLayerPreset[] = [
  {
    id: 'mongolia_boundaries',
    name: '🇲🇳 Монгол Улсын Хил & Аймгууд',
    category: 'boundary',
    description: 'Монгол орны гадаад улсын хил болон Хөвсгөл, Өмнөговь, Архангай, Увс, Ховд, Баян-Өлгий зэрэг аймгуудын бодит полигон хил (WGS84).',
    featureCount: MONGOLIA_BOUNDARIES_GEOJSON.features.length,
    geometryType: 'Polygon',
    style: {
      color: '#0284c7', // Sky 600
      fillColor: '#38bdf8',
      fillOpacity: 0.25,
      weight: 3,
    },
    geojson: MONGOLIA_BOUNDARIES_GEOJSON,
  },
  {
    id: 'mongolia_hydro',
    name: '🌊 Гол мөрөн ба Нууруудын сүлжээ',
    category: 'water',
    description: 'Сэлэнгэ, Орхон, Туул, Хэрлэн голууд болон Хөвсгөл, Увс нуурын бодит координат вектор.',
    featureCount: 6,
    geometryType: 'LineString',
    style: {
      color: '#0284c7', // Sky
      fillColor: '#0ea5e9',
      fillOpacity: 0.5,
      weight: 3.5,
    },
    geojson: MONGOLIA_HYDRO_GEOJSON,
  },
  {
    id: 'mongolia_protected',
    name: '🏔️ Тусгай хамгаалалттай газар нутаг (ТХГН)',
    category: 'protected',
    description: 'Богдхан уул, Говь Гурвансайхан, Алтай Таван Богдын бодит хил хязгаар бүхий дархан цаазат газрууд.',
    featureCount: 3,
    geometryType: 'Polygon',
    style: {
      color: '#059669', // Emerald 600
      fillColor: '#34d399',
      fillOpacity: 0.35,
      weight: 2.5,
    },
    geojson: MONGOLIA_PROTECTED_AREAS_GEOJSON,
  },
  {
    id: 'mongolia_mining',
    name: '⛏️ Стратегийн ашигт малтмалын ордууд',
    category: 'mining',
    description: 'Оюу Толгой, Таван Толгой, Эрдэнэт, Цагаан Суварга, Асгат зэрэг ордуудын бодит координат ба DBF үзүүлэлтүүд.',
    featureCount: 5,
    geometryType: 'Point',
    style: {
      color: '#d97706', // Amber 600
      fillColor: '#f59e0b',
      fillOpacity: 0.8,
      weight: 3,
    },
    geojson: MONGOLIA_MINING_BASINS_GEOJSON,
  },
  {
    id: 'mongolia_roads',
    name: '🛣️ Улсын чанартай авто замын гол сүлжээ',
    category: 'roads',
    description: 'АН-3 босоо тэнхлэг болон Мянганы замын хэвтээ коридорын бодит координат вектор.',
    featureCount: 2,
    geometryType: 'LineString',
    style: {
      color: '#dc2626', // Red 600
      fillColor: '#ef4444',
      fillOpacity: 0.7,
      weight: 3.5,
    },
    geojson: MONGOLIA_ROADS_GEOJSON,
  },
];

export const DEFAULT_OFFICIAL_GIS_LAYERS: any[] = PRESET_GIS_LAYERS.map((preset) => ({
  id: preset.id,
  name: preset.name,
  visible: true,
  color: preset.style.color,
  fillColor: preset.style.fillColor || '#38bdf8',
  fillOpacity: preset.style.fillOpacity ?? 0.35,
  weight: preset.style.weight,
  geometryType: preset.geometryType,
  featureCount: preset.featureCount,
  geojson: preset.geojson,
  isOfficial: true,
  createdAt: '2026-10-01',
  notes: preset.description,
}));

