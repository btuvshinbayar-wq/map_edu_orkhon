import { GeoFeatureTarget } from '../types';

export interface RiverData {
  id: string;
  name: string;
  lengthKm: number;
  drainsTo: string;
  path: string; // SVG path
  description: string;
}

export interface MountainRangeData {
  id: string;
  name: string;
  peakName: string;
  peakElevationMeters: number;
  path: string; // SVG area or line
  peakCoords: { x: number; y: number };
  description: string;
}

export interface LakeData {
  id: string;
  name: string;
  areaSqKm: number;
  waterType: 'Цэнгэг' | 'Давстай';
  coords: { x: number; y: number; r: number };
  description: string;
}

export const MONGOLIA_RIVERS: RiverData[] = [
  {
    id: 'river_selenge',
    name: 'Сэлэнгэ мөрөн',
    lengthKm: 1024, // In Mongolia and Russia
    drainsTo: 'Байгал нуур (Хойд мөсөн далайн ай сав)',
    path: 'M 380 120 Q 450 110, 480 130 T 540 85 T 560 40',
    description: 'Монгол орны хамгийн их усны урсацтай мөрөн бөгөөд Байгал нуурын усыг тэтгэгч гол судас юм.',
  },
  {
    id: 'river_orkhon',
    name: 'Орхон гол',
    lengthKm: 1124,
    drainsTo: 'Сэлэнгэ мөрөн',
    path: 'M 410 270 Q 430 240, 470 200 T 510 140 T 540 85',
    description: 'Монгол улсын нутаг дэвсгэр дээрх хамгийн урт гол (1124 км). Эртний төрт улсуудын өлгий нутаг.',
  },
  {
    id: 'river_tuul',
    name: 'Туул гол',
    lengthKm: 704,
    drainsTo: 'Орхон гол',
    path: 'M 620 180 Q 580 185, 550 205 T 510 215 T 480 170',
    description: 'Хатан Туул хэмээн хүндэтгэдэг, Нийслэл Улаанбаатар хотын дундуур урсдаг түүхт гол.',
  },
  {
    id: 'river_kherlen',
    name: 'Хэрлэн гол',
    lengthKm: 1090,
    drainsTo: 'Далай нуур (Номхон далайн ай сав)',
    path: 'M 620 190 Q 640 240, 680 230 T 780 210 T 890 190',
    description: 'Хэнтийн нуруунаас эх авч Номхон далайн ай сав руу цутгадаг хамгийн урт гол.',
  },
  {
    id: 'river_zavkhan',
    name: 'Завхан гол',
    lengthKm: 808,
    drainsTo: 'Айраг, Хяргас нуур (Төв Азийн гадагш урсгалгүй ай сав)',
    path: 'M 280 210 Q 230 260, 200 240 T 180 170 T 190 140',
    description: 'Хангайн нуруунаас эх авч Их нууруудын хотгор дахь Хяргас нуурт цутгадаг.',
  },
  {
    id: 'river_onon',
    name: 'Онон гол',
    lengthKm: 808,
    drainsTo: 'Шилка гол (Амар мөрний систем)',
    path: 'M 650 160 Q 690 130, 720 120 T 780 110',
    description: 'Их Эзэн Чингис хааны төрж өссөн түүхт гол бөгөөд Амар мөрний эх юм.',
  },
];

export const MONGOLIA_LAKES: LakeData[] = [
  {
    id: 'lake_khuvsgul',
    name: 'Хөвсгөл нуур',
    areaSqKm: 2760,
    waterType: 'Цэнгэг',
    coords: { x: 382, y: 78, r: 16 },
    description: 'Монгол орны хамгийн гүн (262.4 м), цэнгэг уст нуур. Дэлхийн цэнгэг усны 1 хувь орчим энд хадгалагддаг.',
  },
  {
    id: 'lake_uvs',
    name: 'Увс нуур',
    areaSqKm: 3350,
    waterType: 'Давстай',
    coords: { x: 175, y: 92, r: 20 },
    description: 'Монгол улсын хамгийн том талбайтай нуур. Увс нуурын сав газар нь Дэлхийн байгалийн өвд бүртгэгдсэн.',
  },
  {
    id: 'lake_khyargas',
    name: 'Хяргас нуур',
    areaSqKm: 1407,
    waterType: 'Давстай',
    coords: { x: 205, y: 145, r: 14 },
    description: 'Улаан номонд орсон Алтайн сугас загас болон Хэцүү хадны үзэсгэлэнт тогтоцтой давстай том нуур.',
  },
  {
    id: 'lake_khar_us',
    name: 'Хар-Ус нуур',
    areaSqKm: 1578,
    waterType: 'Цэнгэг',
    coords: { x: 135, y: 225, r: 14 },
    description: 'Ховд аймагт орших, зэгс шугуй, ховор шувуудаар баян байгалийн цогцолбор газар.',
  },
  {
    id: 'lake_buir',
    name: 'Буйр нуур',
    areaSqKm: 615,
    waterType: 'Цэнгэг',
    coords: { x: 890, y: 185, r: 11 },
    description: 'Зүүн Монголын хамгийн том цэнгэг уст нуур бөгөөд олон төрлийн агнуурын загастай.',
  },
  {
    id: 'lake_terkhiin_tsagaan',
    name: 'Тэрхийн цагаан нуур',
    areaSqKm: 61,
    waterType: 'Цэнгэг',
    coords: { x: 365, y: 215, r: 8 },
    description: 'Хорго галт уулын халуун хайлмал лав Чулуут голын гольдролыг боосноор үүссэн үзэсгэлэнт цэнгэг нуур.',
  },
];

export const MONGOLIA_MOUNTAINS: MountainRangeData[] = [
  {
    id: 'range_altai',
    name: 'Монгол Алтайн нуруу',
    peakName: 'Алтай Таван Богд (Хүйтэн оргил)',
    peakElevationMeters: 4374,
    path: 'M 40 100 Q 100 220, 180 320 T 260 440',
    peakCoords: { x: 35, y: 110 },
    description: 'Монголын хамгийн өндөр сүрлэг нуруу бөгөөд мөнх цас, мөсөн голуудаараа алдартай.',
  },
  {
    id: 'range_khangai',
    name: 'Хангайн нуруу',
    peakName: 'Отгонтэнгэр хайрхан',
    peakElevationMeters: 4021,
    path: 'M 280 200 Q 380 210, 460 260',
    peakCoords: { x: 300, y: 210 },
    description: 'Төв Монголын уулархаг бүс, олон тооны гол мөрөн эх авдаг цэнгэг усны гол эх үүсвэр.',
  },
  {
    id: 'range_khentii',
    name: 'Хэнтийн нуруу',
    peakName: 'Асралт Хайрхан',
    peakElevationMeters: 2799,
    path: 'M 570 140 Q 620 170, 680 140',
    peakCoords: { x: 580, y: 175 },
    description: 'Шилмүүст тайга, унаган онгон байгальтай, Бурхан Халдун уул сүндэрлэдэг түүхт бүс.',
  },
  {
    id: 'range_gobi_altai',
    name: 'Говь Алтайн нуруу',
    peakName: 'Их Богд уул',
    peakElevationMeters: 3957,
    path: 'M 270 380 Q 360 400, 470 480',
    peakCoords: { x: 360, y: 395 },
    description: 'Говийн уудам талд сүндэрлэх Алтайн төгсгөлийн уулс, цөлийн ховор ан амьтдын өлгий.',
  },
];

// Mineral & Strategic Economic Basins (Critical for Grade 12 curriculum)
export const STRATEGIC_BASINS: GeoFeatureTarget[] = [
  {
    id: 'basin_oyu_tolgoi',
    name: 'Оюу Толгой',
    category: 'basin',
    x: 520,
    y: 495,
    description: 'Дэлхийн хамгийн том зэс-алтны ил ба далд уурхайн нэг. Өмнөговь аймаг.',
  },
  {
    id: 'basin_tavan_tolgoi',
    name: 'Таван Толгой',
    category: 'basin',
    x: 470,
    y: 460,
    description: 'Дэлхийд дээгүүрт тооцогдох өндөр чанарын коксжих нүүрсний асар том орд. Өмнөговь аймаг.',
  },
  {
    id: 'basin_erdenet',
    name: 'Эрдэнэтийн Овоо',
    category: 'basin',
    x: 495,
    y: 165,
    description: 'Монголын аж үйлдвэрийн тулгуур болсон зэс-молибдений баяжуулах үйлдвэр бүхий орд. Орхон аймаг.',
  },
  {
    id: 'basin_baganuur',
    name: 'Багануур',
    category: 'basin',
    x: 615,
    y: 220,
    description: 'Төвийн бүсийн эрчим хүчний хэрэгцээг хангагч нүүрсний ил уурхай.',
  },
  {
    id: 'basin_tsagaan_suvarga',
    name: 'Цагаан Суварга',
    category: 'basin',
    x: 580,
    y: 410,
    description: 'Дорноговь аймагт орших зэс, молибдений томоохон орд.',
  },
  {
    id: 'basin_tamtsag',
    name: 'Тамсагийн сав газар',
    category: 'basin',
    x: 870,
    y: 240,
    description: 'Дорнод аймагт орших газрын тос олборлолтын гол бүс нутаг.',
  },
];

// Historical & Cultural Landmarks
export const MONGOLIA_LANDMARKS: GeoFeatureTarget[] = [
  {
    id: 'landmark_kharkhorin',
    name: 'Хархорум (Эрдэнэ зуу)',
    category: 'landmark',
    x: 435,
    y: 260,
    description: 'Их Монгол Улсын 13-р зууны нийслэл хот, Монголын ууган буддын хийд Эрдэнэ зуу.',
  },
  {
    id: 'landmark_burkhan_khaldun',
    name: 'Бурхан Халдун уул',
    category: 'landmark',
    x: 625,
    y: 165,
    description: 'Чингис хааны шүтээн уул, ЮНЕСКО-гийн Дэлхийн соёлын өв.',
  },
  {
    id: 'landmark_ulaan_tsutgalan',
    name: 'Улаан цутгалан (Орхоны хүрхрээ)',
    category: 'landmark',
    x: 420,
    y: 285,
    description: 'Галт уулын чулуулаг дээр үүссэн 24 метр өндрөөс буух үзэсгэлэнт хүрхрээ.',
  },
  {
    id: 'landmark_khongor_sand',
    name: 'Хонгорын элс',
    category: 'landmark',
    x: 410,
    y: 450,
    description: 'Говь Гурвансайханы байгалийн цогцолбор газарт 180 км үргэлжлэх Дуут манхан элсэн манханууд.',
  },
];
