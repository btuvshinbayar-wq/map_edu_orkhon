export interface MapTargetItem {
  id: string;
  name: string;
  nameEn?: string;
  subtitle?: string;
  center?: string;
  region?: string;
  hint: string;
  category: string;
  // SVG path or coordinates
  svgPath?: string;
  centerCoords?: { x: number; y: number };
  latlng?: [number, number];
  geojsonFeature?: any;
  facts?: string[];
}

export interface MapGameTopic {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: 'mongolia' | 'world' | 'custom';
  description: string;
  totalItems: number;
  viewBox: string;
  aspectRatio: string;
  items: MapTargetItem[];
}

// 1. Mongolia 21 Aimags
import { AIMAGS_DATA } from './aimags';

export const MONGOLIA_AIMAGS_TOPIC: MapGameTopic = {
  id: 'mn_aimags',
  title: 'Монгол Улс: 21 Аймаг',
  subtitle: 'Бүх 21 аймгийг газрын зураг дээр зааж олох сонгодог тоглоом',
  icon: '🇲🇳',
  category: 'mongolia',
  description: 'ilike2learn стилийн хамгийн алдартай тоглоом. Заасан аймгийг газрын зураг дээрээс хамгийн хурдан бөгөөд алдаагүй олж дараарай.',
  totalItems: AIMAGS_DATA.length,
  viewBox: '0 0 1000 550',
  aspectRatio: '16/9',
  items: AIMAGS_DATA.map((a) => ({
    id: a.id,
    name: `${a.name} аймаг`,
    nameEn: a.id,
    subtitle: `Төв: ${a.center}`,
    center: a.center,
    region: a.region,
    hint: `Энэ аймаг нь Монгол орны ${a.region} бүсэд оршдог бөгөөд төв нь ${a.center} хот юм.`,
    category: 'mongolia',
    svgPath: a.path,
    centerCoords: a.centerCoords,
    facts: a.facts,
  })),
};

// 2. Mongolia Aimag Centers & Major Cities
export const MONGOLIA_CENTERS_TOPIC: MapGameTopic = {
  id: 'mn_centers',
  title: 'Монгол: Аймгийн төвүүд & Хот суурин',
  subtitle: 'Аймгийн төв хотуудын нэрийг хараад харгалзах аймгийг олох',
  icon: '🏛️',
  category: 'mongolia',
  description: 'Өгөгдсөн төв хотыг (жишээ нь Мөрөн, Цэцэрлэг, Чойбалсан гэх мэт) аль аймагт хамаардгийг газрын зураг дээр дарж үзүүлнэ.',
  totalItems: AIMAGS_DATA.length,
  viewBox: '0 0 1000 550',
  aspectRatio: '16/9',
  items: AIMAGS_DATA.map((a) => ({
    id: a.id,
    name: `${a.center} хот (${a.name} аймаг)`,
    nameEn: a.center,
    subtitle: `${a.name} аймгийн төв`,
    center: a.center,
    region: a.region,
    hint: `${a.center} нь ${a.region} бүсийн ${a.name} аймгийн засаг захиргааны төв юм.`,
    category: 'mongolia',
    svgPath: a.path,
    centerCoords: a.centerCoords,
    facts: [
      `${a.name} аймгийн засаг захиргаа, эдийн засгийн төв нь ${a.center} хот юм.`,
      `Газар нутгийн хэмжээ: ${a.areaSqKm.toLocaleString()} км²`,
      `Хүн ам: ${a.population.toLocaleString()} орчим`,
    ],
  })),
};

// 3. World Continents & Oceans
export const WORLD_CONTINENTS_TOPIC: MapGameTopic = {
  id: 'world_continents',
  title: 'Дэлхийн 7 Түүд ба 5 Далай',
  subtitle: 'Дэлхийн бөмбөрцгийн тив болон далайнуудыг газрын зураг дээр заах',
  icon: '🌍',
  category: 'world',
  description: 'Дэлхийн физик газарзүйн үндэс болсон Ази, Европ, Африк, Америк тивүүд болон Номхон, Атлантын далайнуудыг таньж олох сорил.',
  totalItems: 12,
  viewBox: '0 0 1000 500',
  aspectRatio: '2/1',
  items: [
    {
      id: 'cont_asia',
      name: 'Ази тив',
      nameEn: 'Asia',
      subtitle: 'Хамгийн том, хамгийн олон хүнтэй тив',
      hint: 'Дэлхийн хамгийн том тив бөгөөд Монгол, Хятад, Энэтхэг зэрэг улсууд энд оршдог.',
      category: 'world',
      centerCoords: { x: 680, y: 190 },
      svgPath: 'M 540 80 L 680 70 L 820 100 L 890 180 L 830 280 L 760 300 L 700 360 L 630 330 L 590 270 L 520 220 L 540 140 Z',
      facts: ['Дэлхийн хамгийн өндөр цэг болох Эверест (8848.86 м) оршдог.', 'Нийт 44 сая км² талбайтай хамгийн том тив.'],
    },
    {
      id: 'cont_europe',
      name: 'Европ тив',
      nameEn: 'Europe',
      subtitle: 'Өрнөдийн соёл иргэншлийн төв',
      hint: 'Ази тивийн баруун талд, Атлантын далайн зүүн талд орших тив.',
      category: 'world',
      centerCoords: { x: 500, y: 140 },
      svgPath: 'M 440 90 L 520 90 L 550 140 L 530 210 L 460 210 L 430 180 L 410 130 Z',
      facts: ['Уралын нуруугаар Ази тивээс зааглагддаг.', 'Франц, Герман, Их Британи, Итали зэрэг 50 орчим улстай.'],
    },
    {
      id: 'cont_africa',
      name: 'Африк тив',
      nameEn: 'Africa',
      subtitle: 'Хүн төрөлхтний өлгий, халуун тив',
      hint: 'Газар дундын тэнгисийн өмнөд талд, Экваторын шугам голлодог тив.',
      category: 'world',
      centerCoords: { x: 520, y: 280 },
      svgPath: 'M 460 215 L 560 215 L 610 280 L 580 380 L 530 450 L 480 390 L 430 290 L 450 240 Z',
      facts: ['Дэлхийн хамгийн урт Нил мөрөн болон хамгийн том Сахарын элсэн цөл энд байдаг.', '54 тусгаар улстай.'],
    },
    {
      id: 'cont_north_america',
      name: 'Хойд Америк тив',
      nameEn: 'North America',
      subtitle: 'Канад, АНУ, Мексик зэрэг улсууд',
      hint: 'Өрнөд хагаст, Номхон ба Атлантын далайн дунд хойд зүгт оршдог.',
      category: 'world',
      centerCoords: { x: 230, y: 150 },
      svgPath: 'M 90 60 L 280 50 L 330 120 L 290 220 L 230 280 L 190 260 L 150 180 L 80 140 Z',
      facts: ['Их нуурууд (Дээд, Мичиган, Гурон г.м) оршдог.', 'Дэлхийн хамгийн том арал болох Гренланд энд хамаардаг.'],
    },
    {
      id: 'cont_south_america',
      name: 'Өмнөд Америк тив',
      nameEn: 'South America',
      subtitle: 'Амазон мөрөн ба Андын нурууны тив',
      hint: 'Хойд Америкийн өмнөд талд залгаа орших тив.',
      category: 'world',
      centerCoords: { x: 310, y: 350 },
      svgPath: 'M 250 280 L 320 280 L 380 330 L 360 410 L 310 490 L 280 470 L 260 380 Z',
      facts: ['Дэлхийн хамгийн их устай Амазон мөрөн энд урсдаг.', 'Бразил, Аргентин зэрэг улсууд оршдог.'],
    },
    {
      id: 'cont_australia',
      name: 'Австрали & Далайн орнууд',
      nameEn: 'Australia & Oceania',
      subtitle: 'Хамгийн жижиг тив, арал-тив',
      hint: 'Өмнөд хагаст, Энэтхэгийн болон Номхон далайн уулзварт орших тив.',
      category: 'world',
      centerCoords: { x: 820, y: 380 },
      svgPath: 'M 760 340 L 870 340 L 890 410 L 860 450 L 780 440 L 740 390 Z',
      facts: ['Дэлхийн хамгийн жижиг тив бөгөөд нэг улс бүхэлд нь эзэлдэг.', 'Их шүрэн хаалттай.'],
    },
    {
      id: 'cont_antarctica',
      name: 'Антарктид тив',
      nameEn: 'Antarctica',
      subtitle: 'Өмнөд туйлын мөсөн тив',
      hint: 'Дэлхийн хамгийн өмнөд захад орших байнгын оршин суугчгүй мөсөн тив.',
      category: 'world',
      centerCoords: { x: 500, y: 480 },
      svgPath: 'M 100 480 L 900 480 L 880 500 L 120 500 Z',
      facts: ['Дэлхийн хамгийн хүйтэн цэг (-89.2°C) энд тэмдэглэгдсэн.', 'Дэлхийн цэнгэг усны 70% энд мөс хэлбэрээр байдаг.'],
    },
    {
      id: 'ocean_pacific',
      name: 'Номхон далай',
      nameEn: 'Pacific Ocean',
      subtitle: 'Дэлхийн хамгийн том далай',
      hint: 'Ази/Австрали болон Америк тивийн хоорондох асар том далай.',
      category: 'world',
      centerCoords: { x: 100, y: 300 },
      svgPath: 'M 10 180 L 110 180 L 110 400 L 10 400 Z',
      facts: ['Дэлхийн хамгийн гүн цэг Марианы хотгор (11,034 м) энд оршдог.', 'Дэлхийн гадаргын 1/3-ийг эзэлдэг.'],
    },
    {
      id: 'ocean_atlantic',
      name: 'Атлантын далай',
      nameEn: 'Atlantic Ocean',
      subtitle: 'Европ/Африк ба Америкийн хоорондох далай',
      hint: 'Америк тивүүд ба Европ/Африк тивийн хооронд S хэлбэртэй орших далай.',
      category: 'world',
      centerCoords: { x: 400, y: 260 },
      svgPath: 'M 350 150 L 420 150 L 440 380 L 370 380 Z',
      facts: ['Хэмжээгээрээ хоёр дахь том далай.', 'Бермудын гурвалжин энд байрладаг.'],
    },
    {
      id: 'ocean_indian',
      name: 'Энэтхэгийн далай',
      nameEn: 'Indian Ocean',
      subtitle: 'Ази, Африк, Австралийн дундах далай',
      hint: 'Энэтхэгийн хойгийн өмнө талд орших дулаан далай.',
      category: 'world',
      centerCoords: { x: 670, y: 380 },
      svgPath: 'M 620 320 L 730 320 L 730 450 L 620 450 Z',
      facts: ['Дэлхийн хамгийн дулаан уст далайд тооцогддог.', 'Олон улсын газрын тосны гол тээврийн зам дамжин өнгөрдөг.'],
    },
    {
      id: 'ocean_arctic',
      name: 'Хойд мөсөн далай',
      nameEn: 'Arctic Ocean',
      subtitle: 'Хойд туйлын далай',
      hint: 'Дэлхийн хамгийн хойд талд, Хойд туйлыг тойрон орших далай.',
      category: 'world',
      centerCoords: { x: 500, y: 30 },
      svgPath: 'M 200 10 L 800 10 L 800 60 L 200 60 Z',
      facts: ['Дэлхийн хамгийн жижиг бөгөөд хамгийн гүехэн далай.', 'Ихэнх хэсэг нь жилийн турш мөсөөр хучигдсан байдаг.'],
    },
    {
      id: 'ocean_southern',
      name: 'Өмнөд далай',
      nameEn: 'Southern Ocean',
      subtitle: 'Антарктид тивийг тойрон орших далай',
      hint: 'Антарктид тивийг хүрээлэн орших өмнөд өргөргийн 60 хэмээс урагших ус.',
      category: 'world',
      centerCoords: { x: 500, y: 440 },
      svgPath: 'M 250 430 L 750 430 L 750 470 L 250 470 Z',
      facts: ['Антарктидыг тойрсон хүйтэн далайн урсгалтай.', 'Халим, оцон шувуу зэрэг өвөрмөц амьтдын амьдрах орчин.'],
    },
  ],
};

// 4. Asia Countries Map Quiz
export const ASIA_COUNTRIES_TOPIC: MapGameTopic = {
  id: 'asia_countries',
  title: 'Ази тивийн томоохон улсууд',
  subtitle: 'Монгол, Орос, Хятад, Япон, Солонгос, Энэтхэг, Казахстан зэрэг улсууд',
  icon: '🌏',
  category: 'world',
  description: 'Монгол Улсын хөрш орнууд болон Ази тивийн гол улс гүрнүүдийн байршлыг газрын зураг дээрээс олох сорил.',
  totalItems: 14,
  viewBox: '0 0 1000 600',
  aspectRatio: '16/10',
  items: [
    {
      id: 'c_mongolia',
      name: 'Монгол Улс',
      nameEn: 'Mongolia',
      subtitle: 'Нийслэл: Улаанбаатар',
      hint: 'ОХУ ба БНХАУ-ын дунд орших далайд гарцгүй төв Азийн улс.',
      category: 'world',
      centerCoords: { x: 560, y: 220 },
      svgPath: 'M 480 180 L 640 180 L 660 250 L 500 250 Z',
      facts: ['1.56 сая км² нутаг дэвсгэртэй.', 'Дэлхийн хамгийн сийрэг хүн амтай тусгаар улс.'],
    },
    {
      id: 'c_russia',
      name: 'Оросын Холбооны Улс',
      nameEn: 'Russia',
      subtitle: 'Нийслэл: Москва',
      hint: 'Монголын хойд хөрш, дэлхийн хамгийн уудам нутагтай улс.',
      category: 'world',
      centerCoords: { x: 540, y: 110 },
      svgPath: 'M 200 40 L 880 40 L 860 160 L 460 160 L 220 150 Z',
      facts: ['17 сая гаруй км² талбайтай дэлхийн хамгийн том орон.', '11 цагийн бүс дамжин оршдог.'],
    },
    {
      id: 'c_china',
      name: 'Бүгд Найрамдах Хятад Ард Улс',
      nameEn: 'China',
      subtitle: 'Нийслэл: Бээжин',
      hint: 'Монголын өмнөд хөрш, дэлхийн эдийн засаг, хүн амын том гүрэн.',
      category: 'world',
      centerCoords: { x: 580, y: 310 },
      svgPath: 'M 440 260 L 670 260 L 710 380 L 520 400 L 420 330 Z',
      facts: ['1.4 тэрбум гаруй хүн амтай.', 'Цагаан хэрэм, Шар мөрөн, Хөх мөрөн зэрэг алдартай газарзүйн тогтоцтой.'],
    },
    {
      id: 'c_kazakhstan',
      name: 'Бүгд Найрамдах Казахстан Улс',
      nameEn: 'Kazakhstan',
      subtitle: 'Нийслэл: Астана',
      hint: 'Төв Азийн хамгийн том, дэлхийн хамгийн том далайд гарцгүй улс.',
      category: 'world',
      centerCoords: { x: 380, y: 220 },
      svgPath: 'M 300 170 L 460 170 L 450 260 L 320 260 Z',
      facts: ['2.72 сая км² нутагтай дэлхийн 9 дэх том улс.', 'Байконур сансрын буудал энд байдаг.'],
    },
    {
      id: 'c_japan',
      name: 'Япон Улс',
      nameEn: 'Japan',
      subtitle: 'Нийслэл: Токио',
      hint: 'Азийн зүүн эрэгт, Номхон далайд орших арал улс (Мандах нарны орон).',
      category: 'world',
      centerCoords: { x: 800, y: 270 },
      svgPath: 'M 770 230 L 820 230 L 820 310 L 760 300 Z',
      facts: ['Хоншю, Хоккайдо, Кюшю, Шикоку 4 гол аралтай.', 'Фүжи галт уул (3776 м) сүндэрлэдэг.'],
    },
    {
      id: 'c_korea',
      name: 'Бүгд Найрамдах Солонгос Улс',
      nameEn: 'South Korea',
      subtitle: 'Нийслэл: Сөүл',
      hint: 'Солонгосын хойгийн өмнөд хэсэгт орших өндөр технологийн улс.',
      category: 'world',
      centerCoords: { x: 720, y: 270 },
      svgPath: 'M 695 255 L 735 255 L 730 295 L 695 295 Z',
      facts: ['Хан гол, Чежү арал зэрэг байгалийн үзэсгэлэнт газартай.', 'Дэлхийд хагас дамжуулагч, авто үйлдвэрлэлээрээ тэргүүлдэг.'],
    },
    {
      id: 'c_india',
      name: 'Бүгд Найрамдах Энэтхэг Улс',
      nameEn: 'India',
      subtitle: 'Нийслэл: Шинэ Дели',
      hint: 'Энэтхэгийн хойгт, Гималайн нурууны өмнө орших хүн ам хамгийн олонтой улс.',
      category: 'world',
      centerCoords: { x: 440, y: 410 },
      svgPath: 'M 370 330 L 490 330 L 480 490 L 420 500 Z',
      facts: ['1.43 тэрбум хүн амтай дэлхийн хамгийн их хүнтэй улс.', 'Ганга мөрөн энд урсдаг.'],
    },
    {
      id: 'c_turkey',
      name: 'Бүгд Найрамдах Турк Улс',
      nameEn: 'Turkey',
      subtitle: 'Нийслэл: Анкара',
      hint: 'Европ ба Ази тив хоёрыг холбон орших Босфорын хоолойн улс.',
      category: 'world',
      centerCoords: { x: 190, y: 270 },
      svgPath: 'M 140 250 L 250 250 L 240 300 L 140 295 Z',
      facts: ['Истанбул хот нь хоёр тив дамнасан цорын ганц метрополис хот.', 'Анатолийн хойгт байрладаг.'],
    },
  ],
};

export const ALL_MAP_TOPICS: MapGameTopic[] = [
  MONGOLIA_AIMAGS_TOPIC,
  MONGOLIA_CENTERS_TOPIC,
  WORLD_CONTINENTS_TOPIC,
  ASIA_COUNTRIES_TOPIC,
];
