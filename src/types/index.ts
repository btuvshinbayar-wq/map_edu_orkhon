export type GradeLevel = '9' | '12' | 'teacher' | 'team';
/** Хэрэглэгчийн (бүртгэлийн) ангилал: зөвхөн 9, 12-р анги, багш. */
export type StudentGradeLevel = '9' | '12' | 'teacher';
/** Уралдааны ангилал: дээрхээс гадна "баг" нь ЗӨВХӨН уралдаанд оролцоно (админ баг бүрдүүлнэ). */
export type CompetitionGradeLevel = '9' | '12' | 'teacher' | 'team';
export type UserRole = 'student' | 'teacher' | 'admin';
export type VerificationStatus = 'approved' | 'pending' | 'rejected';

// Primary Menus for "Газрын зургийг хэн сайн мэдэх вэ."
export type MainMenuTab =
  | 'competition' // 1. Уралдаан (9, 12, Багш, Багийн)
  | 'explore' // 2. Газрын зураг
  | 'puzzles' // 3. Сорил
  | 'olympiad' // 4. Олимпиад
  | 'leaderboard' // 5. Шилдэгүүд
  | 'admin_auth' // 6. Бүртгэл / Админ удирдлага
  | 'map_system'
  | 'curriculum'
  | 'question_bank'
  | 'digital_resources';

// Sub-menus inside Газрын зураг
export type MapSubTab =
  | 'competition' // Уралдаан
  | 'explore' // Газрын зураг
  | 'puzzles' // Сорил
  | 'leaderboard'; // Шилдэгүүд

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  school: string;
  aimag: string;
  soum: string;
  grade: StudentGradeLevel;
  studentCode: string; // РД or Student Code
  password?: string; // Нууц үг
  teamId?: string; // Харьяалагдах багийн ID
  teamName?: string; // For team category
  teamMembers?: string; // For team category (3-5 members)
  role: UserRole;
  status: VerificationStatus;
  mapAndChallengeAccess?: boolean; // Сайтад бүртгүүлж газрын зураг, сорилыг ашиглах эрх (default true for registered users, can be revoked/granted by admin)
  isCompetitionConfirmed?: boolean; // Уралдаанд оролцогчоор сонгож баталгаажуулсан эсэх
  registeredAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
  position?: string; // Албан тушаал (e.g. Газарзүйн багш, Шалгалтын комиссын дарга)
  organization?: string; // Албан газар / Байгууллага
}

export interface CompetitionTeam {
  id: string;
  name: string;
  leaderUserId: string;
  leaderName: string;
  memberUserIds: string[];
  memberNames: string[];
  school?: string;
  aimag?: string;
  grade: CompetitionGradeLevel;
  isCompetitionConfirmed: boolean;
  createdAt: string;
  createdBy?: string;
  notes?: string;
}

export interface DonationRecord {
  id: string;
  userId?: string;
  donorName: string;
  donorPhone?: string;
  donorEmail?: string;
  donorOrg?: string;
  amount: number;
  transactionRef?: string; // Гүйлгээний утга / дугаар
  bankName: string; // Хаан банк
  wishesNote?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  certificateNumber?: string;
  adminNote?: string;
}

export type QuestionCategory = 'mongolia' | 'world';
export type QuestionType =
  | 'map_click_aimag'
  | 'map_click_country'
  | 'map_click_feature'
  | 'interactive_map_pin' // Интерактив газрын зураг дээр цэг тавих (GeoGuessr style pin drop)
  | 'multiple_choice'
  | 'identify_region'
  | 'map_puzzle_placement' // Зураг-таавар (Drag/Click to Place)
  | 'odd_one_out' // “Аль нь буруу вэ?” / “Аль нь илүүдэх вэ?”
  | 'coordinate_cipher' // Код тайлах / Солбицол & масштаб
  | 'silhouette_guess' // Силуэт таавар
  | 'shp_contour_guess' // Жинхэнэ SHP контур таавар (нэр, аттрибют нуусан)
  | 'spatial_logic' // “Хэн хаана байна?” логик puzzle
  | 'route_planning' // Маршрут төлөвлөх
  | 'change_detection' // Өөрчлөлт илрүүлэх (өмнө/одоо)
  | 'geo_detective'; // “Газарзүйн детектив”

export interface GeoFeatureTarget {
  id: string;
  name: string;
  category: 'lake' | 'river' | 'mountain' | 'strait' | 'landmark' | 'basin';
  x: number; // percentage 0-100 on map canvas
  y: number;
  radius?: number;
  description?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MapPuzzlePiece {
  id: string;
  label: string;
  hint: string;
  correctTargetId: string;
}

export interface MapPuzzleTargetZone {
  id: string;
  name: string;
  x: number; // 0-100%
  y: number;
}

export interface OddOneOutItem {
  id: string;
  text: string;
  isAnomaly: boolean;
  reason: string;
}

export interface DetectiveClue {
  step: number;
  title: string;
  clueText: string;
}

export interface DetectiveDestination {
  id: string;
  name: string;
  isCorrect: boolean;
  feedback: string;
}

export interface RouteOption {
  id: string;
  title: string;
  distanceKm: number;
  elevationDifficulty: 'хялбар' | 'дунд' | 'хүнд';
  terrainNote: string;
  isOptimal: boolean;
  reason: string;
}

export interface Question {
  id: string;
  category: QuestionCategory;
  gradeLevels: GradeLevel[]; // ['9'], ['12'], or ['9', '12']
  type: QuestionType;
  title: string;
  subtitle?: string;
  targetId?: string; // e.g. aimag id 'khuvsgul', country id 'br', feature id 'lake_khuvsgul'
  targetName: string;
  targetFeature?: GeoFeatureTarget;
  options?: QuestionOption[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  gisAutoTaskType?: string;

  // Specific data for new interactive puzzle types
  puzzleData?: {
    pieces: MapPuzzlePiece[];
    targets: MapPuzzleTargetZone[];
  };
  oddOneOutData?: {
    items: OddOneOutItem[];
  };
  cipherData?: {
    coordinates: string;
    scale?: string;
    encodedClue: string;
    decodedAnswer: string;
    targetName: string;
  };
  silhouetteData?: {
    svgPath: string;
    viewBox?: string;
    name: string;
    options: string[];
  };
  shpContourData?: {
    featureId: string;
    layerName?: string;
    geometryType: 'Polygon' | 'MultiPolygon' | 'LineString' | 'Point';
    geojson: any; // Real GeoJSON feature with coordinates
    maskedProperties: Record<string, string>; // e.g. { "НЭР": "[НУУЦЛАГДСАН]", "ТӨРӨЛ": "[НУУЦЛАГДСАН]" }
    realProperties: Record<string, any>; // Real DBF attributes revealed after answering
    targetName: string;
    options: string[];
    hints?: string[];
    categoryLabel?: string; // e.g. "Аймаг", "Нуур", "Гол мөрөн", "ТХГН", "Стратегийн орд"
  };
  mapPinData?: {
    targetLat: number;
    targetLng: number;
    targetName: string;
    category: 'mongolia' | 'world';
    subCategory?: string;
    allowedDistanceKm?: number; // Distance error tolerance (km) to consider correct (e.g. 50km for MN, 150km for World)
    photoUrl?: string;
    clues?: string[];
    funFact?: string;
    elevationOrMetric?: string;
  };
  spatialLogicData?: {
    clues: string[];
    targets: { id: string; name: string; x: number; y: number; isAnswer: boolean }[];
  };
  routeData?: {
    startPoint: string;
    endPoint: string;
    routeOptions: RouteOption[];
  };
  changeDetectionData?: {
    title: string;
    beforeState: string;
    afterState: string;
    changeCause: string;
  };
  detectiveData?: {
    caseTitle: string;
    storyline: string;
    clues: DetectiveClue[];
    destinations: DetectiveDestination[];
  };
}

export interface AnswerRecord {
  questionId: string;
  category: QuestionCategory;
  userSelectionId?: string;
  isCorrect: boolean;
  timeTakenMs: number;
  pointsEarned: number;
}

export interface CompetitionAttempt {
  id: string;
  userId: string;
  studentName: string;
  school: string;
  aimag: string;
  grade: GradeLevel;
  studentCode: string;
  teamName?: string;
  teamMembers?: string;
  startedAt: string;
  completedAt: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  mongoliaScore: number;
  mongoliaMaxScore: number;
  mongoliaCount: number;
  worldScore: number;
  worldMaxScore: number;
  worldCount: number;
  answers: AnswerRecord[];
  certificateNumber: string;
  rank?: number;
  isArchived?: boolean;
  archivedAt?: string;
}

export interface AimagData {
  id: string;
  name: string;
  center: string;
  region: 'Баруун' | 'Хангай' | 'Төв' | 'Зүүн' | 'Нийслэл';
  areaSqKm: number;
  population: number;
  path: string; // SVG path
  centerCoords: { x: number; y: number };
  facts: string[];
  keyRiversLakes: string[];
  highestPoint: string;
}

export interface CountryData {
  id: string;
  name: string;
  nameEn: string;
  capital: string;
  continent: 'Ази' | 'Европ' | 'Африк' | 'Хойд Америк' | 'Өмнөд Америк' | 'Далайн орон' | 'Антарктид';
  path: string;
  centerCoords: { x: number; y: number };
  facts: string[];
}

export interface ActiveGisLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  fillColor: string;
  fillOpacity: number;
  weight: number;
  geometryType: 'Polygon' | 'MultiPolygon' | 'LineString' | 'Point' | 'Mixed';
  featureCount: number;
  geojson: any;
  nameField?: string;
  selectedFeatureIndices?: number[]; // Optional: if set, only show/use these feature indices; if undefined, use all features
  isOfficial?: boolean;
  createdAt: string;
  notes?: string;
}

export interface LayerUsageStat {
  layerId: string;
  layerName: string;
  geometryType: string;
  mapViews: number;
  quizAttempts: number;
  correctCount: number;
  wrongCount: number;
  lastActiveAt: string;
}

export interface TaskPerformanceStat {
  taskId: string;
  objectName: string;
  layerName: string;
  geometryType: string;
  attempts: number;
  correct: number;
  wrong: number;
  lastAttemptedAt: string;
}

export interface CertificatePartner {
  id: string;
  name: string;
  role: 'organizer' | 'sponsor'; // 'organizer' = Хамтран зохион байгуулагч, 'sponsor' = Ивээн тэтгэгч байгууллага
  logoUrl?: string; // Base64 data URL or external image URL
}

export interface CertificateConfig {
  topSubtitle: string; // e.g. "Газарзүйн интерактив цахим шалгалт 2026"
  mainTitle: string; // e.g. "БАТЛАМЖ"
  competitionName: string; // e.g. '"Газрын зургийг хэн сайн мэдэх вэ." интерактив уралдаан'
  recipientPrefix: string; // e.g. "Энэхүү батламжийг"
  bodyText: string; // e.g. "Монгол орны болон тив, дэлхийн газрын зургийн мэдлэг, орон зайн сэтгэлгээг шалгах интерактив уралдаанд амжилттай оролцож, өндөр ур чадвар үзүүлсэн тул батламжлав."
  stampLines: string; // e.g. "Шалгасан | ✓ БАТЛАВ | 2026"
  organizationSubtitle?: string;
  partners: CertificatePartner[];
}

export interface CompetitionScheduleConfig {
  mode: 'open' | 'closed' | 'scheduled';
  startTime: string; // ISO or datetime-local string e.g. "2026-10-10T10:00"
  endTime: string; // ISO or datetime-local string e.g. "2026-10-10T18:00"
  durationMinutesPerQuestion: number; // default 30 seconds or custom
  announcementNote?: string;
}

export interface QuestionIssueReport {
  id: string;
  questionId: string;
  questionTitle: string;
  layerName?: string;
  currentTargetName: string;
  currentOptions?: string[];
  reporterUserId: string;
  reporterName: string;
  reporterSchool?: string;
  reporterGrade?: string;
  reporterContact?: string;
  issueType: 'wrong_answer' | 'wrong_name' | 'wrong_shape' | 'typo_or_options' | 'other';
  suggestedCorrectAnswer: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  adminNote?: string;
}
