/**
 * GeoGuessr Map Quiz Dataset
 * High-accuracy coordinates (WGS84 EPSG:4326), descriptions, photo clues,
 * and category classifications for Mongolia and World Map Quiz.
 */

export interface GeoGuessrTarget {
  id: string;
  name: string;
  subtitle: string;
  regionCategory: 'mongolia' | 'world';
  subCategory:
    | 'nature_mountain'
    | 'lakes_rivers'
    | 'cities_history'
    | 'mining_industry'
    | 'world_wonders'
    | 'world_nature'
    | 'world_capitals'
    | 'photo_clue';
  lat: number;
  lng: number;
  zoomLevel?: number;
  photoUrl?: string;
  clues: string[];
  funFact: string;
  elevationOrMetric?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const GEOGUESSR_TARGETS: GeoGuessrTarget[] = [
  // ==========================================
  // 1. MONGOLIA - NATURE & MOUNTAINS (Монголын уулс ба байгаль)
  // ==========================================
  {
    id: 'mn_khuiten_peak',
    name: 'Алтай Таван Богд (Хүйтэн оргил)',
    subtitle: 'Монгол орны хамгийн өндөр цэг (4374 м)',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 49.1469,
    lng: 87.8181,
    zoomLevel: 10,
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Монгол, ОХУ, БНХАУ-ын хилийн уулзварт оршдог.',
      'Баян-Өлгий аймгийн нутагт, мөнх цаст 5 оргилтой.',
      'Монголын хамгийн том Потанины мөсөн гол энд байдаг.',
    ],
    funFact: 'Хүйтэн оргил нь далайн түвшнээс дээш 4374 метр өндөр бөгөөд 1956 онд Монголын уулчид анх мөрөө гаргасан түүхтэй.',
    elevationOrMetric: '4374 м (Ноён оргил)',
    difficulty: 'easy',
  },
  {
    id: 'mn_otgontenger',
    name: 'Отгонтэнгэр уул',
    subtitle: 'Хангайн нурууны ноён оргил (4021 м), Очирваань хайрхан',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 47.6319,
    lng: 97.5528,
    zoomLevel: 10,
    photoUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Завхан аймгийн Отгон сумын нутагт байрладаг.',
      'Хангайн нурууны цорын ганц мөнх цастай ноён оргил.',
      'Монголчууд эртнээс Төрийн их тахилгат хайрхан болгон тахиж ирсэн.',
    ],
    funFact: 'Отгонтэнгэр хайрханы энгэрт Бадархундага хэмээх үзэсгэлэнт нуур бий бөгөөд нутгийн ард олон "Залуу тэнгэр" хэмээн хүндэтгэдэг.',
    elevationOrMetric: '4021 м',
    difficulty: 'easy',
  },
  {
    id: 'mn_burkhan_khaldun',
    name: 'Бурхан Халдун уул',
    subtitle: 'Их Эзэн Чингис хааны тахилгат уул, ЮНЕСКО-ийн өв',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 48.7842,
    lng: 108.9719,
    zoomLevel: 10,
    photoUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Хэнтий аймгийн Өмнөдэлгэр сумын нутагт оршдог.',
      'Онон, Хэрлэн, Туул гурван их мөрний эх авдаг газар.',
      'Хан Хэнтийн тусгай хамгаалалттай газрын цөм хэсэг.',
    ],
    funFact: 'Чингис хаан "Бурхан Халдуныг өглөө бүр мялааж, өдөр бүр залбирсугай, ургийн урагт минь мэдтүгэй" хэмээн захисан түүхтэй.',
    elevationOrMetric: '2361 м',
    difficulty: 'medium',
  },
  {
    id: 'mn_khorgo_volcano',
    name: 'Хорго галт уул & Тэрхийн цагаан нуур',
    subtitle: 'Дөрөвдөгч галавын сөнөсөн галт уул, Архангай',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 48.1925,
    lng: 99.8458,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Архангай аймгийн Тариат сумын нутагт оршдог.',
      'Одоогоос 8000 орчим жилийн өмнө оргилж байсан сөнөсөн галт уул.',
      'Хүрмэн хайлш нь голын урсгалыг боож Тэрхийн цагаан нуурыг үүсгэсэн.',
    ],
    funFact: 'Хоргын тогооны гүн нь 100 орчим метр, амсрын диаметр нь 200 метр бөгөөд дотор нь хуш, шинэсэн ой ургасан байдаг.',
    elevationOrMetric: '2210 м',
    difficulty: 'easy',
  },
  {
    id: 'mn_tsagaan_suvarga',
    name: 'Цагаан суварга',
    subtitle: 'Байгалийн өвөрмөц тогтоц бүхий шавар хадан цав, Дундговь',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 44.6644,
    lng: 105.7486,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Дундговь аймгийн Өлзийт сумын нутагт оршдог.',
      'Эртний тэнгисийн ёроолын хурдас салхи, усанд идэгдэж үүссэн.',
      'Өндөр нь 60 орчим метр, урт нь 400 гаруй метр үргэлжилдэг.',
    ],
    funFact: 'Нарны тусгалаас хамааран олон янзын өнгөөр хувиран солонгорч харагддаг байгалийн үзэсгэлэнт цогцолбор юм.',
    elevationOrMetric: 'Өндөр 60 м, урт 400 м',
    difficulty: 'medium',
  },
  {
    id: 'mn_khongor_sand_dunes',
    name: 'Хонгорын элс (Дуут манхан)',
    subtitle: 'Монголын хамгийн том элсэн манхануудын нэг, Өмнөговь',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 43.7431,
    lng: 102.3486,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өмнөговь аймгийн Сэврэй, Баяндалай сумын нутагт оршдог.',
      '180 гаруй км урт үргэлжилсэн их элсэн манхан.',
      'Салхины хүчээр элс нурахад онгоцны дуу шиг нүргээнт дуу гардаг тул Дуут манхан гэдэг.',
    ],
    funFact: 'Элсэн манханы хажуугаар Хонгорын гол урсаж ногоон зүлэг, баянбүрд хослон оршдог нь гайхалтай үзэгдэл юм.',
    elevationOrMetric: '180 км урт, 300 м өндөр',
    difficulty: 'medium',
  },
  {
    id: 'mn_yol_valley',
    name: 'Ёлын ам',
    subtitle: 'Говь Гурван Сайханы мөнх мөст гүн хавцал',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 43.4831,
    lng: 104.0722,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өмнөговь аймгийн Ханхонгор сумын нутаг, Гурвансайханы нуруунд бий.',
      'Зуны халуунд ч мөс нь хайлдаггүй мөнх мөст хавцал.',
      'Дархан цаазат Ёл шувуу олноор үүрлэдэг.',
    ],
    funFact: 'Хавцлын хана нар тусдаггүй нарийн хавцал тул өвлийн зузаан мөс намар хүртэл хадгалагддаг.',
    elevationOrMetric: 'Далайн түвшнээс дээш 2200 м',
    difficulty: 'medium',
  },
  {
    id: 'mn_ulaan_tsutgalan',
    name: 'Улаан цутгалан (Орхоны хүрхрээ)',
    subtitle: 'Орхон голын 24 метр өндөр үзэсгэлэнт хүрхрээ',
    regionCategory: 'mongolia',
    subCategory: 'nature_mountain',
    lat: 46.7869,
    lng: 101.9619,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өвөрхангай аймгийн Бат-Өлзий сумын нутагт оршдог.',
      'Орхоны хөндийн Дэлхийн өвийн дурсгалт бүсэд хамаарна.',
      'Галт уулын хүрмэн хайлшийг Улаан гол зүсэж Орхон гол руу цутгадаг.',
    ],
    funFact: 'Улаан цутгалан хүрхрээ нь 24 метр өндрөөс 10 метр өргөн усан хөшиг татуулан буудаг Монголын хамгийн алдартай хүрхрээ юм.',
    elevationOrMetric: '24 метр өндөр',
    difficulty: 'easy',
  },

  // ==========================================
  // 2. MONGOLIA - LAKES & WATERS (Монголын нуур, мөрөн)
  // ==========================================
  {
    id: 'mn_lake_khuvsgul',
    name: 'Хөвсгөл нуур (Далай ээж)',
    subtitle: 'Монгол орны хамгийн гүн (262.4 м) цэнгэг нуур',
    regionCategory: 'mongolia',
    subCategory: 'lakes_rivers',
    lat: 51.1000,
    lng: 100.5000,
    zoomLevel: 9,
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Хөвсгөл аймгийн нутагт, Саяны уулсын өмнөд хэсэгт оршдог.',
      'Дэлхийн цэнгэг усны нөөцийн 1 орчим хувь, Монголын 70 гаруй хувийг агуулдаг.',
      'Эх авч урсдаг цорын ганц гол нь Эгийн гол юм.',
    ],
    funFact: 'Хөвсгөл нуур нь 2-5 сая жилийн настай дэлхийн хамгийн эртний 17 нуурын нэгд зүй ёсоор багтдаг.',
    elevationOrMetric: 'Талбай 2760 км², Гүн 262.4 м',
    difficulty: 'easy',
  },
  {
    id: 'mn_lake_uvs',
    name: 'Увс нуур',
    subtitle: 'Монгол орны хамгийн том талбайтай нуур (3350 км²)',
    regionCategory: 'mongolia',
    subCategory: 'lakes_rivers',
    lat: 50.3333,
    lng: 92.7500,
    zoomLevel: 9,
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Увс аймгийн төв Улаангомоос зүүн хойш оршдог.',
      'Төв Азийн гадагш урсгалгүй Их нууруудын хотгорын хамгийн хойд талын нуур.',
      'Давсжилт ихтэй, ЮНЕСКО-ийн Дэлхийн байгалийн өв газар.',
    ],
    funFact: 'Увс нуурын сав газар нь өвөл -58°C хүйтэрч, зун +40°C хүрдэг дэлхийн температурын хамгийн их хэлбэлзэлтэй цэгүүдийн нэг юм.',
    elevationOrMetric: 'Талбай 3350 км²',
    difficulty: 'easy',
  },
  {
    id: 'mn_lake_buir',
    name: 'Буйр нуур',
    subtitle: 'Зүүн Монголын хамгийн том цэнгэг уст нуур',
    regionCategory: 'mongolia',
    subCategory: 'lakes_rivers',
    lat: 47.8000,
    lng: 117.7500,
    zoomLevel: 9,
    photoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Дорнод аймгийн Халхгол сумын нутагт оршдог.',
      'Монгол улсын зүүн хилийн зааг дээр оршдог.',
      'Халх гол цутгаж, Оршуун гол эх авч урсан Далай нуурт цутгадаг.',
    ],
    funFact: 'Буйр нуур нь загас, усны шувуудаар нэн баялаг бөгөөd Монголын зүүн хязгаарын сувд хэмээн нэрлэгддэг.',
    elevationOrMetric: 'Талбай 615 км²',
    difficulty: 'medium',
  },
  {
    id: 'mn_selenge_river_confluence',
    name: 'Сэлэнгэ ба Орхон голын бэлчир',
    subtitle: 'Монголын хамгийн их устай хоёр мөрний нийлэх цэг',
    regionCategory: 'mongolia',
    subCategory: 'lakes_rivers',
    lat: 50.2414,
    lng: 106.2083,
    zoomLevel: 10,
    photoUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Сэлэнгэ аймгийн Сүхбаатар хотын орчимд нийлдэг.',
      'Байгал нуурт цутгах хамгийн их усны урсгалыг бүрдүүлдэг.',
      'Монгол-Оросын хилийн бүсэд ойрхон оршдог.',
    ],
    funFact: 'Сэлэнгэ мөрөн нь Байгал нуурт цутгадаг 300 гаруй гол горхины нийт усны 50 гаруй хувийг дангаараа хангадаг.',
    elevationOrMetric: 'Нийт уртын хэмжээ 1024 км',
    difficulty: 'medium',
  },

  // ==========================================
  // 3. MONGOLIA - CITIES, HISTORY & MINING (Хот, түүх, үйлдвэр)
  // ==========================================
  {
    id: 'mn_ulaanbaatar_center',
    name: 'Улаанбаатар хот (Сүхбаатарын талбай)',
    subtitle: 'Монгол Улсын нийслэл, төрийн төв талбай',
    regionCategory: 'mongolia',
    subCategory: 'cities_history',
    lat: 47.9188,
    lng: 106.9176,
    zoomLevel: 14,
    photoUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Богд хан, Чингэлтэй, Сонгинохайрхан, Баянзүрх дөрвөн уулын дунд оршдог.',
      'Туул голын хөндийд байрладаг Монгол улсын улс төр, эдийн засгийн төв.',
      'Төрийн ордон, Чингис хааны хөшөө сүндэрлэдэг.',
    ],
    funFact: 'Анх 1639 онд Ширээт цагаан нуурт Өргөө нэртэй байгуулагдаж, 1924 онд Улаанбаатар хэмээн нэрийдсэн түүхтэй.',
    elevationOrMetric: 'Далайн түвшнээс дээш 1350 м',
    difficulty: 'easy',
  },
  {
    id: 'mn_kharkhorin_erdenezuu',
    name: 'Хархорум & Эрдэнэ зуу хийд',
    subtitle: 'Их Монгол Улсын эртний нийслэл (1220 он)',
    regionCategory: 'mongolia',
    subCategory: 'cities_history',
    lat: 47.1994,
    lng: 102.8428,
    zoomLevel: 12,
    photoUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өвөрхангай аймгийн Хархорин сумын нутаг, Орхон голын хөндийд оршдог.',
      'Чингис хааны зарлигаар 1220 онд үндэс суурийг тавьсан.',
      '1586 онд Абатай сайн хааны байгуулсан 108 суваргат Эрдэнэ зуу хийд энд бий.',
    ],
    funFact: 'Хархорум нь тухайн үедээ дэлхийн дипломат харилцаа, худалдаа, олон шашин соёлын хамгийн том төв байв.',
    elevationOrMetric: 'ЮНЕСКО Дэлхийн өв',
    difficulty: 'easy',
  },
  {
    id: 'mn_erdenet_mining',
    name: 'Эрдэнэт үйлдвэр (Эрдэнэт хот)',
    subtitle: 'Азийн хамгийн том зэс, молибдений баяжуулах үйлдвэр',
    regionCategory: 'mongolia',
    subCategory: 'mining_industry',
    lat: 49.0278,
    lng: 104.0444,
    zoomLevel: 12,
    photoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Орхон аймгийн Баян-Өндөр сумын нутагт оршдог.',
      'Эрдэнэтийн-Овооны зэс, молибдений ордыг түшиглэн 1978 онд ашиглалтад орсон.',
      'Монгол улсын хоёр дахь том аж үйлдвэрийн төв хот.',
    ],
    funFact: 'Эрдэнэт үйлдвэр нь жилд 37 сая тонн хүдэр боловсруулж, 580 мянган тонн зэсийн баяжмал үйлдвэрлэдэг аварга цогцолбор юм.',
    elevationOrMetric: 'Орхон аймаг',
    difficulty: 'easy',
  },
  {
    id: 'mn_oyutolgoi',
    name: 'Оюу толгой орд',
    subtitle: 'Дэлхийн хэмжээний зэс, алтны мега уурхай, Өмнөговь',
    regionCategory: 'mongolia',
    subCategory: 'mining_industry',
    lat: 43.0078,
    lng: 106.8483,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өмнөговь аймгийн Ханбогд сумын нутагт, говьд байрладаг.',
      'Дэлхийн хамгийн гүн (1300 м) далд уурхайн системийн нэг.',
      'Монгол улсын эдийн засгийн хамгийн том хөрөнгө оруулалтын төсөл.',
    ],
    funFact: 'Оюу толгой нь дэлхийн 4 дэх том зэсийн уурхай болохоор бүрэн хүчин чадлаараа ажиллаж байна.',
    elevationOrMetric: 'Өмнөговь, Ханбогд сум',
    difficulty: 'medium',
  },
  {
    id: 'mn_tavan_tolgoi',
    name: 'Таван толгой орд',
    subtitle: 'Дэлхийн хамгийн том коксжих нүүрсний ордуудын нэг',
    regionCategory: 'mongolia',
    subCategory: 'mining_industry',
    lat: 43.6261,
    lng: 105.4744,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өмнөговь аймгийн Цогтцэций сумын нутагт оршдог.',
      '6.4 тэрбум тонн сайн чанарын коксжих ба эрчим хүчний нүүрсний нөөцтэй.',
      'Төмөр замаар Гашуунсухайт боомттой холбогдсон.',
    ],
    funFact: 'Таван толгойн нүүрсний орд нь сайн чанарын ган хайлуулах коксжих чадвараараа дэлхийд дээгүүрт тооцогддог.',
    elevationOrMetric: 'Өмнөговь, Цогтцэций сум',
    difficulty: 'medium',
  },
  {
    id: 'mn_tsonjin_boldog',
    name: 'Чингис хааны морьт хөшөө (Цонжин болдог)',
    subtitle: 'Дэлхийн хамгийн өндөр (40 м) морьт хөшөөт цогцолбор',
    regionCategory: 'mongolia',
    subCategory: 'cities_history',
    lat: 47.8122,
    lng: 107.5369,
    zoomLevel: 12,
    photoUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Төв аймгийн Эрдэнэ сумын нутаг, Цонжин болдог хэмээх түүхт газарт оршдог.',
      'Тэмүжин эндээс алтан ташуур олсон домогтой газар.',
      'Хөшөөний дотор музей, морины толгой дээр харах тавцантай.',
    ],
    funFact: 'Энэхүү хөшөөг 250 тонн зэвэрдэггүй гангаар бүрсэн бөгөөд 40 метр өндөр сүндэрлэдэг.',
    elevationOrMetric: '40 метр өндөр',
    difficulty: 'easy',
  },

  // ==========================================
  // 4. WORLD - LANDMARKS & WONDERS (Дэлхийн гайхамшиг, дурсгалууд)
  // ==========================================
  {
    id: 'wd_eiffel_tower',
    name: 'Эйфелийн цамхаг (Eiffel Tower)',
    subtitle: 'Франц, Парис хотын бэлгэдэл болсон цамхаг',
    regionCategory: 'world',
    subCategory: 'world_wonders',
    lat: 48.8584,
    lng: 2.2945,
    zoomLevel: 14,
    photoUrl: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Францын нийслэл Парис хотод Сена мөрний эрэг дээр оршдог.',
      '1889 оны Дэлхийн үзэсгэлэнд зориулан Густав Эйфелийн удирдлагаар барьсан.',
      'Өндөр нь 330 метр бөгөөд дэлхийн хамгийн олон жуулчин зочилдог дурсгал.',
    ],
    funFact: 'Эйфелийн цамхаг дулааны тэлэлтээс болоод зун цагт өвлийнхөөсөө 15 см орчим өндөр болдог байна.',
    elevationOrMetric: '330 метр өндөр',
    difficulty: 'easy',
  },
  {
    id: 'wd_pyramids_giza',
    name: 'Гизагийн Их Пирамидууд',
    subtitle: 'Египет, Эртний дэлхийн 7 гайхамшгаас үлдсэн цорын ганц дурсгал',
    regionCategory: 'world',
    subCategory: 'world_wonders',
    lat: 29.9792,
    lng: 31.1342,
    zoomLevel: 13,
    photoUrl: 'https://images.unsplash.com/photo-1503177112294-72c7b508f757?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Египетийн Каир хотын захад, Нил мөрний баруун эрэгт байрладаг.',
      'МЭӨ 2560 онд Фараон Хуфу (Хеопс)-ийн бунханд зориулан баригдсан.',
      '2.3 сая ширхэг аварга том шохойн чулуун блокоор босгосон.',
    ],
    funFact: 'Хеопсын пирамид нь 3800 жилийн турш хүн төрөлхтний босгосон дэлхийн хамгийн өндөр байгууламжид тооцогдож байв.',
    elevationOrMetric: 'Өндөр 138.5 м',
    difficulty: 'easy',
  },
  {
    id: 'wd_taj_mahal',
    name: 'Таж Махал (Taj Mahal)',
    subtitle: 'Энэтхэг, Агра хот дахь цагаан гантиг чулуун бунхан',
    regionCategory: 'world',
    subCategory: 'world_wonders',
    lat: 27.1751,
    lng: 78.0421,
    zoomLevel: 14,
    photoUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Энэтхэгийн Уттар Прадеш муж, Агра хотод Ямуна мөрний эрэгт оршдог.',
      'Их Могол улсын хаан Шах Жахан хайрт хатан Мумтаз Махалдаа зориулан бүтээсэн.',
      'Цагаан гантиг чулуу, үнэт эрдэнийн шигтгээтэй Ислам-Энэтхэгийн уран барилга.',
    ],
    funFact: 'Таж Махалыг бүтээхэд 20,000 гаруй уран гартнууд 22 жилийн турш хөдөлмөрлөсөн гэдэг.',
    elevationOrMetric: 'ЮНЕСКО Дэлхийн өв',
    difficulty: 'easy',
  },
  {
    id: 'wd_colosseum_rome',
    name: 'Колизей (Colosseum)',
    subtitle: 'Итали, Эртний Ромын эзэнт гүрний аварга гладиаторын амфитеатр',
    regionCategory: 'world',
    subCategory: 'world_wonders',
    lat: 41.8902,
    lng: 12.4922,
    zoomLevel: 14,
    photoUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Италийн нийслэл Ром хотын төвд байрладаг.',
      'МЭ 70-80 онд Флавийн удмын хаадын үед баригдсан.',
      '50,000-80,000 үзэгчийн суудалтай эртний дэлхийн хамгийн том театр.',
    ],
    funFact: 'Колизейн талбайд зөвхөн гладиаторын тулаан төдийгүй усаар дүүргэж жинхэнэ далайн тулааныг хүртэл зохион байгуулдаг байжээ.',
    elevationOrMetric: 'Ром, Итали',
    difficulty: 'easy',
  },
  {
    id: 'wd_great_wall_china',
    name: 'Цагаан хэрэм (Great Wall of China)',
    subtitle: 'БНХАУ, Мянга мянган бээрийн урт хамгаалалтын хэрэм',
    regionCategory: 'world',
    subCategory: 'world_wonders',
    lat: 40.4319,
    lng: 116.5704,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
    clues: [
      'БНХАУ-ын хойд хилээр 21,000 гаруй км сунан үргэлжилдэг.',
      'Эртний нүүдэлчдээс хамгаалах зорилгоор Цинь, Мин гүрний үед голчлон барьсан.',
      'Дэлхийн хүний гараар бүтээгдсэн хамгийн урт байгууламж.',
    ],
    funFact: 'Цагаан хэрмийг барихад ашигласан зуурмагт наалдамхай цагаан будааны зуурмаг хольж бэхжүүлсэн нь маш бат бөх болгожээ.',
    elevationOrMetric: 'Урт 21,196 км',
    difficulty: 'easy',
  },
  {
    id: 'wd_machu_picchu',
    name: 'Мачу Пикчу (Machu Picchu)',
    subtitle: 'Перу, Анд нурууны орой дахь Инкүүдийн нууцлаг хот',
    regionCategory: 'world',
    subCategory: 'world_wonders',
    lat: -13.1631,
    lng: -72.5450,
    zoomLevel: 12,
    photoUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өмнөд Америкийн Перу улсын нутаг, Андын нуруунд 2430 метрийн өндөрт оршдог.',
      '15-р зууны Инкийн эзэнт гүрний үед баригдсан "Үүлэн дундах хот".',
      '1911 онд Америкийн судлаач Хирам Бингем дэлхий нийтэд нээн таниулсан.',
    ],
    funFact: 'Инкийн чулуун өрлөгүүд хоорондоо зуурмаггүй боловч хутганы ир ч багтахгүй нягт таардгаараа инженерийн гайхамшиг юм.',
    elevationOrMetric: '2430 метр өндөрт',
    difficulty: 'medium',
  },
  {
    id: 'wd_statue_of_liberty',
    name: 'Чөлөөний хөшөө (Statue of Liberty)',
    subtitle: 'АНУ, Нью-Йорк хотын боомт дахь эрх чөлөөний бэлгэдэл',
    regionCategory: 'world',
    subCategory: 'world_wonders',
    lat: 40.6892,
    lng: -74.0445,
    zoomLevel: 14,
    photoUrl: 'https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&w=800&q=80',
    clues: [
      'АНУ-ын Нью-Йорк хотын Либерти арал дээр байрладаг.',
      '1886 онд Францын ард түмнээс АНУ-ын тусгаар тогтнолын 100 жилийн ойд бэлэглэсэн.',
      'Баруун гартаа бамбар, зүүн гартаа тусгаар тогтнолын тунхаг бичиг барьсан.',
    ],
    funFact: 'Хөшөөний зэс гадаргуу нь агаарын исэлдэлтээс болоод цаг хугацааны явцад ногоон өнгөтэй (патина) болсон байна.',
    elevationOrMetric: 'Нийт өндөр 93 метр',
    difficulty: 'easy',
  },

  // ==========================================
  // 5. WORLD - NATURE WONDERS (Дэлхийн байгалийн гайхамшиг)
  // ==========================================
  {
    id: 'wd_mount_everest',
    name: 'Эверест оргил (Жомолунгма)',
    subtitle: 'Дэлхийн бөмбөрцгийн хамгийн өндөр цэг (8848.86 м)',
    regionCategory: 'world',
    subCategory: 'world_nature',
    lat: 27.9881,
    lng: 86.9250,
    zoomLevel: 10,
    photoUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Балба ба БНХАУ (Төвөд)-ын хилийн зааг дахь Гималайн нуруунд оршдог.',
      '1953 онд Эдмунд Хиллари, Тенцинг Норгей нар анх оргилд нь гарсан.',
      'Төвөдөөр "Ертөнцийн эх дагина" хэмээдэг.',
    ],
    funFact: 'Энэтхэгийн тектоник хавтан Евразийн хавтан доогуур шахагдсаар байгаа тул Эверест оргил жилд 4 мм орчим өндөрсөж байдаг.',
    elevationOrMetric: '8848.86 м',
    difficulty: 'easy',
  },
  {
    id: 'wd_grand_canyon',
    name: 'Их Хавцал (Grand Canyon)',
    subtitle: 'АНУ, Колорадо мөрний бүтээсэн дэлхийн хамгийн алдартай хавцал',
    regionCategory: 'world',
    subCategory: 'world_nature',
    lat: 36.0544,
    lng: -112.1401,
    zoomLevel: 10,
    photoUrl: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=800&q=80',
    clues: [
      'АНУ-ын Аризона муж дахь Колорадогийн өндөрлөгт оршдог.',
      '446 км урт үргэлжилсэн, гүн нь 1800 метр хүрдэг аварга хавцал.',
      'Дэлхийн 2 тэрбум жилийн геологийн түүхийг илчилсэн давхаргуудтай.',
    ],
    funFact: 'Хавцлын оройгоос ёроол хүртэл уур амьсгал нь эрс ялгаатай бөгөөд оройдоо цастай байхад ёроолдоо халуун цөлийн уур амьсгалтай байдаг.',
    elevationOrMetric: 'Урт 446 км, Гүн 1857 м',
    difficulty: 'easy',
  },
  {
    id: 'wd_niagara_falls',
    name: 'Ниагара хүрхрээ (Niagara Falls)',
    subtitle: 'Канад ба АНУ-ын хил дээрх аварга хүрхрээний цогцолбор',
    regionCategory: 'world',
    subCategory: 'world_nature',
    lat: 43.0962,
    lng: -79.0377,
    zoomLevel: 12,
    photoUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    clues: [
      'АНУ-ын Нью-Йорк муж ба Канадын Онтарио мужийн хилд оршдог.',
      'Эри нуураас Онтарио нуур руу цутгах Ниагара гол дээр байрладаг.',
      'Тах хүрхрээ, Америк хүрхрээ, Сүйт бүсгүйн хөшиг гэсэн 3 хэсгээс бүрддэг.',
    ],
    funFact: 'Секунд тутамд 3,160 тонн ус хүрхрээгээр буудаг бөгөөд Хойд Америкийн хамгийн их уст хүрхрээ юм.',
    elevationOrMetric: '51 метр өндөр',
    difficulty: 'easy',
  },
  {
    id: 'wd_victoria_falls',
    name: 'Виктория хүрхрээ (Mosi-oa-Tunya)',
    subtitle: 'Африк, Замбези мөрний "Нүргээнт утаа" хэмээх хүрхрээ',
    regionCategory: 'world',
    subCategory: 'world_nature',
    lat: -17.9243,
    lng: 25.8572,
    zoomLevel: 12,
    photoUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Замби ба Зимбабве улсын хилийн зааг дээр Замбези мөрөн дээр оршдог.',
      'Өргөн нь 1708 метр бөгөөд дэлхийн хамгийн өргөн усан хөшигтэй хүрхрээ.',
      'Усны манан нь 400 метрийн өндөрт цацагдаж 50 км холоос харагддаг.',
    ],
    funFact: 'Нутгийн уугуул иргэд уг хүрхрээг "Моси-оа-Туня" буюу "Нүргэлэх утаа" хэмээн нэрлэдэг байна.',
    elevationOrMetric: 'Өргөн 1708 м, Өндөр 108 м',
    difficulty: 'medium',
  },
  {
    id: 'wd_mount_fuji',
    name: 'Фужи галт уул (Mount Fuji)',
    subtitle: 'Япон улсын хамгийн өндөр оргил (3776 м), ариун хайрхан',
    regionCategory: 'world',
    subCategory: 'world_nature',
    lat: 35.3606,
    lng: 138.7274,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Японы Хоншю арлын төв хэсэгт, Токиогоос баруун урагш оршдог.',
      'Төгс конус хэлбэрийн цаст сөнөсөн страто-галт уул.',
      'Японы соёл, уран зураг, яруу найргийн мөнхийн бэлгэдэл.',
    ],
    funFact: 'Фужи галт уулын тогоо нь 500 метрийн өргөн, 250 метрийн гүнтэй бөгөөд хамгийн сүүлд 1707 онд оргилсон байна.',
    elevationOrMetric: '3776 м',
    difficulty: 'easy',
  },
  {
    id: 'wd_suez_canal',
    name: 'Суэцийн суваг (Suez Canal)',
    subtitle: 'Египет, Газар дундын ба Улаан тэнгисийг холбогч стратегийн суваг',
    regionCategory: 'world',
    subCategory: 'world_nature',
    lat: 30.7050,
    lng: 32.3442,
    zoomLevel: 10,
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Египетийн газар нутагт Ази ба Африкийн тивүүдийн уулзварт оршдог.',
      'Европ ба Азийн хоорондох далайн замыг 7000 орчим км-ээр товчилсон.',
      '1869 онд нээгдсэн дэлхийн хамгийн чухал худалдааны усан зам.',
    ],
    funFact: 'Суэцийн сувгаар дэлхийн нийт далайн худалдааны 12 орчим хувь нь дамжин өнгөрдөг байна.',
    elevationOrMetric: 'Урт 193.3 км',
    difficulty: 'medium',
  },

  // ==========================================
  // 6. WORLD - CAPITALS & CITIES (Дэлхийн нийслэл хотууд)
  // ==========================================
  {
    id: 'wd_tokyo_capital',
    name: 'Токио хот (Tokyo)',
    subtitle: 'Япон улсын нийслэл, дэлхийн хамгийн их хүн амтай хотын бөөгнөрөл',
    regionCategory: 'world',
    subCategory: 'world_capitals',
    lat: 35.6762,
    lng: 139.6503,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Хоншю арлын зүүн эрэгт Токиогийн буланд оршдог.',
      'Их Токио бүс нутагт 37 сая гаруй хүн ам оршин суудаг.',
      'Шинжүкү, Шибүяа, Эзэн хааны ордон байрладаг технологийн мегаполис.',
    ],
    funFact: 'Токио нь 1868 он хүртэл "Эдо" хэмээгддэг байсан бөгөөд Эзэн хааны ордон Киото хотоос энд шилжин суурьшжээ.',
    elevationOrMetric: 'Япон улсын нийслэл',
    difficulty: 'easy',
  },
  {
    id: 'wd_london_capital',
    name: 'Лондон хот (London)',
    subtitle: 'Их Британи улсын нийслэл, Тэмз мөрний эргийн түүхт хот',
    regionCategory: 'world',
    subCategory: 'world_capitals',
    lat: 51.5074,
    lng: -0.1278,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Их Британийн Англи улсын нутаг, Тэмз мөрний хөндийд оршдог.',
      'Гринвичийн гол меридиан (0 градусын уртраг) энэ хотоор дайран өнгөрдөг.',
      'Биг Бен цамхаг, Букингемийн ордон, Тауэр гүүр энд бий.',
    ],
    funFact: 'Лондон нь Ромын эзэнт гүрний үед "Лондиниум" нэртэйгээр 2000 гаруй жилийн өмнө анх байгуулагдсан байна.',
    elevationOrMetric: 'Их Британийн нийслэл',
    difficulty: 'easy',
  },
  {
    id: 'wd_canberra_capital',
    name: 'Канберра хот (Canberra)',
    subtitle: 'Австрали улсын нийслэл хот',
    regionCategory: 'world',
    subCategory: 'world_capitals',
    lat: -35.2809,
    lng: 149.1300,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Австрали тивийн зүүн өмнөд хэсэгт оршдог төлөвлөлттэй хот.',
      'Сидней ба Мельбурн хотуудын дунд нийслэл болгохоор тусгайлан байгуулсан.',
      'Бөрли Гриффин хиймэл нуурын эргэн тойронд геометрийн төлөвлөлттэй сүндэрлэсэн.',
    ],
    funFact: 'Олон хүмүүс Австралийн нийслэлийг Сидней эсвэл Мельбурн гэж андуурдаг боловч албан ёсны нийслэл нь Канберра юм.',
    elevationOrMetric: 'Австралийн нийслэл',
    difficulty: 'medium',
  },
  {
    id: 'wd_cairo_capital',
    name: 'Каир хот (Cairo)',
    subtitle: 'Египет улсын нийслэл, Арабын ертөнцийн хамгийн том хот',
    regionCategory: 'world',
    subCategory: 'world_capitals',
    lat: 30.0444,
    lng: 31.2357,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Хойд Африкийн Египет улс, Нил мөрний дельт дээр байрладаг.',
      'Мянган минаретын хот хэмээн алдаршсан түүхт нийслэл.',
      'Ойролцоо нь алдарт Гизагийн пирамидууд оршдог.',
    ],
    funFact: 'Каир нь Африк тив болон Арабын ертөнцийн хамгийн их хүн амтай (20 гаруй сая) мегаполис юм.',
    elevationOrMetric: 'Египетийн нийслэл',
    difficulty: 'easy',
  },
  {
    id: 'wd_buenos_aires_capital',
    name: 'Буэнос-Айрес (Buenos Aires)',
    subtitle: 'Аргентин улсын нийслэл, Өмнөд Америкийн Парис',
    regionCategory: 'world',
    subCategory: 'world_capitals',
    lat: -34.6037,
    lng: -58.3816,
    zoomLevel: 11,
    photoUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=800&q=80',
    clues: [
      'Өмнөд Америкийн зүүн эрэгт Рио де ла Плата голын аманд оршдог.',
      'Танго бүжгийн эх өлгий нутаг.',
      'Европ маягийн гоёмсог уран барилга, өргөн чөлөөнүүдээрээ алдартай.',
    ],
    funFact: 'Буэнос-Айрес хотын "7-р сарын 9-ний өргөн чөлөө" нь 140 метр өргөн бөгөөд дэлхийн хамгийн өргөн өргөн чөлөөний нэг юм.',
    elevationOrMetric: 'Аргентин улсын нийслэл',
    difficulty: 'medium',
  },
];

/**
 * Calculates Great Circle distance between two points using the Haversine formula
 * @returns distance in kilometers
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GeoGuessr Scoring Formula
 * Standard GeoGuessr exponential decay formula (Max 5,000 points per round)
 * @param distanceKm Distance error in kilometers
 * @param maxThresholdKm Max distance threshold (e.g. 1500km for Mongolia, 12000km for World)
 */
export function calculateGeoGuessrScore(
  distanceKm: number,
  category: 'mongolia' | 'world'
): { score: number; ratingBadge: string; ratingColor: string } {
  // Mongolia map scale vs World map scale
  const maxThresholdKm = category === 'mongolia' ? 1400 : 12000;
  const perfectThresholdKm = category === 'mongolia' ? 15 : 40;

  if (distanceKm <= perfectThresholdKm) {
    return {
      score: 5000,
      ratingBadge: '🎯 БҮРЭН ОНОО (5,000 pts)',
      ratingColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    };
  }

  // Exponential decay
  const exponent = (distanceKm - perfectThresholdKm) / (maxThresholdKm * 0.35);
  const rawScore = 5000 * Math.exp(-exponent);
  const score = Math.max(0, Math.min(4999, Math.round(rawScore)));

  if (score >= 4500) {
    return {
      score,
      ratingBadge: '🔥 МАШ ОЙРХОН!',
      ratingColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    };
  } else if (score >= 3500) {
    return {
      score,
      ratingBadge: '👏 САЙН ТААЛАА!',
      ratingColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    };
  } else if (score >= 2000) {
    return {
      score,
      ratingBadge: '👌 БОЛОМЖИЙН',
      ratingColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    };
  } else {
    return {
      score,
      ratingBadge: '💨 ХОЛ БАЙНА',
      ratingColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    };
  }
}
