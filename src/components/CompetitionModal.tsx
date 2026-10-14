import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  MapPin,
  Globe2,
  X,
  FileCheck,
  Trophy,
  Users,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question, CompetitionAttempt, AnswerRecord, GradeLevel, AimagData, CountryData } from '../types';
import { MongoliaMap } from './MongoliaMap';
import { WorldMap } from './WorldMap';
import { sound } from '../utils/audio';
import { Certificate } from './Certificate';
import { ShpContourViewer } from './ShpContourViewer';
import { InteractiveMapPinQuestion } from './InteractiveMapPinQuestion';

interface CompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  overrideGrade?: GradeLevel;
  onOpenAuth?: () => void;
}

export const CompetitionModal: React.FC<CompetitionModalProps> = ({
  isOpen,
  onClose,
  overrideGrade,
  onOpenAuth,
}) => {
  const {
    currentUser,
    saveAttempt,
    customQuestions,
    recordTaskAttempt,
    isCompetitionCurrentlyOpen,
    competitionSchedule,
  } = useApp();

  // Ангилал: хэрэглэгч зөвхөн өөрийн ангилалд (9, 12, багш) оролцоно.
  // "Баг" ангилал зөвхөн админ баг бүрдүүлсэн (teamId-тэй) хэрэглэгчид нээгдэнэ.
  const allowedGrades: GradeLevel[] = !currentUser
    ? []
    : currentUser.role === 'admin'
    ? ['9', '12', 'teacher', 'team']
    : ([currentUser.grade, ...(currentUser.teamId ? ['team'] : [])] as GradeLevel[]);
  const pickGrade = (g?: GradeLevel): GradeLevel =>
    g && allowedGrades.includes(g) ? g : allowedGrades[0] || '9';

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(pickGrade(overrideGrade));
  const [teamNameInput, setTeamNameInput] = useState<string>(currentUser?.teamName || 'Шонхор баг');
  const [teamMembersInput, setTeamMembersInput] = useState<string>(currentUser?.teamMembers || '3 гишүүн');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);
  const [feedbackItem, setFeedbackItem] = useState<{ id: string; correct: boolean } | null>(null);

  // Time & Scoring
  const [timeLeft, setTimeLeft] = useState(30); // 30s per question
  const [answersRecord, setAnswersRecord] = useState<AnswerRecord[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalAttempt, setFinalAttempt] = useState<CompetitionAttempt | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  // Sync overrideGrade when prop changes
  useEffect(() => {
    if (overrideGrade) {
      setSelectedGrade(pickGrade(overrideGrade));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideGrade, currentUser?.id, currentUser?.teamId]);

  // Start / restart quiz from Admin's customQuestions (matching grade, or full pool fallback)
  const startQuiz = (gradeToUse: GradeLevel = selectedGrade) => {
    const matchingCustom = customQuestions.filter(
      (q) => !q.gradeLevels || q.gradeLevels.includes(gradeToUse)
    );
    // Зөвхөн тухайн ангилалд зориулсан даалгавар. Өөр ангиллын даалгаврыг орлуулж өгөхгүй.
    const pool = matchingCustom;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(10, shuffled.length));

    setQuestions(selectedQuestions);
    setCurrentIndex(0);
    setHasAnswered(false);
    setSelectedOptionId(null);
    setFeedbackItem(null);
    setAnswersRecord([]);
    setIsCompleted(false);
    setFinalAttempt(null);
    setTimeLeft(30);
  };

  useEffect(() => {
    if (isOpen) {
      startQuiz(selectedGrade);
    }
  }, [isOpen, selectedGrade, customQuestions.length]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || hasAnswered || isCompleted || questions.length === 0) return;

    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft, hasAnswered, isCompleted, questions.length]);

  if (!isOpen) return null;

  const isConfirmedContestant =
    currentUser &&
    (currentUser.role === 'admin' ||
      (currentUser.status === 'approved' && currentUser.isCompetitionConfirmed !== false));

  if (!currentUser || !isConfirmedContestant) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Trophy className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {!currentUser
              ? 'Уралдаанд оролцохын тулд бүртгүүлнэ үү'
              : 'Уралдаанд оролцох эрх баталгаажаагүй байна'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {!currentUser
              ? 'Албан ёсны уралдаанд зөвхөн сайтад бүртгүүлсэн хэрэглэгчдээс Админ сонгож баталгаажуулсан оролцогчид оролцох эрхтэй.'
              : `Таны бүртгэл (${currentUser.fullName}) одоогоор "${
                  currentUser.status === 'rejected' ? 'Цуцлагдсан' : 'Хүлээгдэж буй'
                }" төлөвтэй байна. Та Газрын зураг болон Сорилыг ашиглах боломжтой бөгөөд Админ таныг уралдаанд оролцогчоор сонгож баталгаажуулсны дараа уралдаанд оролцох эрх нээгдэнэ.`}
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            {!currentUser && onOpenAuth && (
              <button
                onClick={onOpenAuth}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-xs cursor-pointer"
              >
                Бүртгүүлэх / Нэвтрэх
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 cursor-pointer"
            >
              Хаах
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isCompetitionCurrentlyOpen && currentUser.role !== 'admin' && !isCompleted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 shadow-2xl text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <Clock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Уралдааны цаг хаалттай байна
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {competitionSchedule.mode === 'closed'
              ? 'Админ уралдааныг хаасан байна. Уралдаан нээгдэх үед дахин оролдоно уу.'
              : `Уралдаан зөвхөн товлосон цагт (${competitionSchedule.startTime.replace('T', ' ')} — ${competitionSchedule.endTime.replace('T', ' ')}) нээлттэй байна.`}
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            Хаах
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0 && !isCompleted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
        <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            Уралдааны даалгаврын сан хоосон байна
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Шалгалтын асуултын сан цэвэрлэгдсэн байна. Админ удирдлагын самбарын «Шалгалтын асуултын сан» эсвэл «Даалгавар Бэлтгэгч» хэсгээс даалгаврыг гараас оруулсны дараа уралдаан эхэлнэ.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            Ойлголоо
          </button>
        </div>
      </div>
    );
  }

  const currentQ: Question | undefined = questions[currentIndex];
  if (!currentQ && !isCompleted) return null;

  const handleTimeout = () => {
    sound.playError();
    setHasAnswered(true);
    setIsCurrentCorrect(false);
    setFeedbackItem({ id: 'timeout', correct: false });

    const record: AnswerRecord = {
      questionId: currentQ?.id || `q_${currentIndex}`,
      category: currentQ?.category || 'mongolia',
      userSelectionId: 'TIMEOUT',
      isCorrect: false,
      timeTakenMs: 30000,
      pointsEarned: 0,
    };
    setAnswersRecord((prev) => [...prev, record]);
  };

  // Answer on map click for Aimag
  const handleAimagClick = (aimag: AimagData) => {
    if (hasAnswered || isCompleted) return;

    const isCorrect = currentQ?.targetId === aimag.id;
    setHasAnswered(true);
    setIsCurrentCorrect(isCorrect);
    setFeedbackItem({ id: aimag.id, correct: isCorrect });

    if (isCorrect) {
      sound.playSuccess();
    } else {
      sound.playError();
    }

    const record: AnswerRecord = {
      questionId: currentQ.id,
      category: currentQ.category,
      userSelectionId: aimag.id,
      isCorrect,
      timeTakenMs: (30 - timeLeft) * 1000,
      pointsEarned: isCorrect ? currentQ.points || 10 : 0,
    };
    setAnswersRecord((prev) => [...prev, record]);
  };

  // Answer on map click for Country
  const handleCountryClick = (country: CountryData) => {
    if (hasAnswered || isCompleted) return;

    const isCorrect = currentQ?.targetId === country.id;
    setHasAnswered(true);
    setIsCurrentCorrect(isCorrect);
    setFeedbackItem({ id: country.id, correct: isCorrect });

    if (isCorrect) {
      sound.playSuccess();
    } else {
      sound.playError();
    }

    const record: AnswerRecord = {
      questionId: currentQ.id,
      category: currentQ.category,
      userSelectionId: country.id,
      isCorrect,
      timeTakenMs: (30 - timeLeft) * 1000,
      pointsEarned: isCorrect ? currentQ.points || 10 : 0,
    };
    setAnswersRecord((prev) => [...prev, record]);
  };

  // Answer for options
  const handleOptionSelect = (optionId: string, isCorrect: boolean) => {
    if (hasAnswered || isCompleted) return;

    setSelectedOptionId(optionId);
    setHasAnswered(true);
    setIsCurrentCorrect(isCorrect);
    setFeedbackItem({ id: optionId, correct: isCorrect });

    if (currentQ) {
      recordTaskAttempt({
        objectName: currentQ.targetName,
        layerName: currentQ.shpContourData?.layerName || 'Уралдааны давхарга',
        geometryType: currentQ.shpContourData?.geometryType || 'Polygon',
        isCorrect,
      });
    }

    if (isCorrect) {
      sound.playSuccess();
    } else {
      sound.playError();
    }

    const record: AnswerRecord = {
      questionId: currentQ.id,
      category: currentQ.category,
      userSelectionId: optionId,
      isCorrect,
      timeTakenMs: (30 - timeLeft) * 1000,
      pointsEarned: isCorrect ? currentQ.points || 10 : 0,
    };
    setAnswersRecord((prev) => [...prev, record]);
  };

  // Answer on interactive map pin drop (GeoGuessr style)
  const handleInteractivePinAnswer = (
    isCorrect: boolean,
    distanceKm: number,
    guessLat: number,
    guessLng: number
  ) => {
    if (hasAnswered || isCompleted) return;

    setHasAnswered(true);
    setIsCurrentCorrect(isCorrect);
    setFeedbackItem({ id: `pin_${distanceKm.toFixed(0)}km`, correct: isCorrect });

    if (currentQ) {
      recordTaskAttempt({
        objectName: currentQ.targetName,
        layerName: currentQ.shpContourData?.layerName || 'Цэгэн давхарга',
        geometryType: currentQ.shpContourData?.geometryType || 'Point',
        isCorrect,
      });
    }

    if (isCorrect) {
      sound.playSuccess();
    } else {
      sound.playError();
    }

    const record: AnswerRecord = {
      questionId: currentQ.id,
      category: currentQ.category,
      userSelectionId: `lat:${guessLat.toFixed(2)},lng:${guessLng.toFixed(2)} (${distanceKm.toFixed(1)}km)`,
      isCorrect,
      timeTakenMs: (30 - timeLeft) * 1000,
      pointsEarned: isCorrect ? currentQ.points || 15 : 0,
    };
    setAnswersRecord((prev) => [...prev, record]);
  };

  // Advance to next question or complete
  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setHasAnswered(false);
      setSelectedOptionId(null);
      setFeedbackItem(null);
      setTimeLeft(30);
    } else {
      handleFinishQuiz();
    }
  };

  // Complete and save
  const handleFinishQuiz = () => {
    setIsCompleted(true);

    const totalScore = answersRecord.reduce((acc, curr) => acc + curr.pointsEarned, 0);
    const maxScore = questions.reduce((acc, curr) => acc + (curr.points || 10), 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const mnAnswers = answersRecord.filter((a) => a.category === 'mongolia');
    const mnScore = mnAnswers.reduce((acc, curr) => acc + curr.pointsEarned, 0);
    const mnMax = questions.filter((q) => q.category === 'mongolia').reduce((acc, q) => acc + (q.points || 10), 0);

    const wdAnswers = answersRecord.filter((a) => a.category === 'world');
    const wdScore = wdAnswers.reduce((acc, curr) => acc + curr.pointsEarned, 0);
    const wdMax = questions.filter((q) => q.category === 'world').reduce((acc, q) => acc + (q.points || 10), 0);

    if (percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    const attempt = saveAttempt({
      userId: currentUser?.id || 'guest',
      studentName:
        selectedGrade === 'team'
          ? (currentUser?.teamName || teamNameInput || 'Шонхор баг')
          : (currentUser?.fullName || 'Зочин оролцогч'),
      studentCode: currentUser?.studentCode || 'GUEST-2026',
      school: currentUser?.school || 'Сургууль тодорхойгүй',
      aimag: currentUser?.aimag || 'Улаанбаатар',
      grade: selectedGrade,
      teamName: selectedGrade === 'team' ? (currentUser?.teamName || teamNameInput || 'Шонхор баг') : undefined,
      teamMembers: selectedGrade === 'team' ? (currentUser?.teamMembers || teamMembersInput || '3 гишүүн') : undefined,
      startedAt: new Date(Date.now() - 300000).toISOString(),
      completedAt: new Date().toISOString(),
      totalScore,
      maxScore,
      percentage,
      mongoliaScore: mnScore,
      mongoliaMaxScore: mnMax,
      mongoliaCount: mnAnswers.length,
      worldScore: wdScore,
      worldMaxScore: wdMax,
      worldCount: wdAnswers.length,
      answers: answersRecord,
    });

    setFinalAttempt(attempt);
  };

  const getCategoryTitle = (g: GradeLevel) => {
    switch (g) {
      case '9':
        return '9-р ангийн ангилал';
      case '12':
        return '12-р ангийн ангилал';
      case 'teacher':
        return 'Багшийн ангилал';
      case 'team':
        return 'Багийн ангилал';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl text-slate-800 max-h-[96vh] flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Газрын зургийг хэн сайн мэдэх вэ?
                </h3>
                <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {getCategoryTitle(selectedGrade)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Оролцогч:{' '}
                <span className="font-semibold text-slate-800">
                  {selectedGrade === 'team'
                    ? (currentUser?.teamName || teamNameInput || 'Багийн оролцоо')
                    : (currentUser?.fullName || 'Зочин')}
                </span>{' '}
                ({currentUser?.school || 'Нийслэлийн 1-р сургууль'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* 4 Category Switcher Pills */}
            {!isCompleted && allowedGrades.length > 1 && (
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                {allowedGrades.map((grade) => (
                  <button
                    key={grade}
                    onClick={() => {
                      setSelectedGrade(grade);
                      startQuiz(grade);
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-[11px] ${
                      selectedGrade === grade
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {grade === '9' ? '9-р' : grade === '12' ? '12-р' : grade === 'teacher' ? 'Багш' : 'Баг'}
                  </button>
                ))}
              </div>
            )}

            {/* Timer Pill */}
            {!isCompleted && (
              <div
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 font-mono text-xs font-bold ${
                  timeLeft <= 10
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span>{timeLeft} сек</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Team Name banner if team category */}
        {!isCompleted && selectedGrade === 'team' && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-950">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-700" />
              <span className="font-bold">Багийн нэр:</span>
              <input
                type="text"
                value={teamNameInput}
                onChange={(e) => setTeamNameInput(e.target.value)}
                readOnly={currentUser?.role !== 'admin'}
                placeholder="Багийн нэр бичих..."
                className="rounded-md border border-emerald-300 bg-white px-2 py-0.5 font-semibold text-emerald-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Гишүүд:</span>
              <input
                type="text"
                value={teamMembersInput}
                onChange={(e) => setTeamMembersInput(e.target.value)}
                readOnly={currentUser?.role !== 'admin'}
                placeholder="3-5 сурагчийн нэр..."
                className="rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        {!isCompleted ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            {/* Question Progress bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold text-slate-700">
                Асуулт {currentIndex + 1} / {questions.length}
              </span>
              <span className="flex items-center gap-1.5 text-sky-700 font-medium">
                {currentQ.category === 'mongolia' ? (
                  <>
                    <MapPin className="h-3.5 w-3.5" /> Монголын газарзүй
                  </>
                ) : (
                  <>
                    <Globe2 className="h-3.5 w-3.5" /> Дэлхийн газарзүй
                  </>
                )}
              </span>
            </div>

            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question Header Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 mb-3">
              <h4 className="text-base sm:text-lg font-bold text-slate-900 text-wrap-balance">
                {currentQ.title}
              </h4>
              {currentQ.subtitle && (
                <p className="mt-1 text-xs text-amber-800 font-medium">
                  👉 {currentQ.subtitle}
                </p>
              )}
            </div>

            {/* Interactive Layout: Map Area + Options */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[360px]">
              {/* Left / Center: Interactive Stage */}
              <div className="lg:col-span-8 flex flex-col justify-center">
                {currentQ.type === 'interactive_map_pin' || currentQ.mapPinData ? (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 shadow-xs">
                    <InteractiveMapPinQuestion
                      question={currentQ}
                      hasAnswered={hasAnswered}
                      onAnswer={(isCorrect, distanceKm, guessLat, guessLng) =>
                        handleInteractivePinAnswer(isCorrect, distanceKm, guessLat, guessLng)
                      }
                    />
                  </div>
                ) : currentQ.type === 'shp_contour_guess' || currentQ.shpContourData ? (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-2 shadow-xs">
                    {currentQ.shpContourData && (
                      <ShpContourViewer
                        geojson={currentQ.shpContourData.geojson}
                        geometryType={currentQ.shpContourData.geometryType}
                        maskedProperties={currentQ.shpContourData.maskedProperties}
                        realProperties={currentQ.shpContourData.realProperties}
                        targetName={currentQ.shpContourData.targetName}
                        hasAnswered={hasAnswered}
                        isCorrect={isCurrentCorrect}
                        categoryLabel={currentQ.shpContourData.categoryLabel}
                        hints={currentQ.shpContourData.hints}
                      />
                    )}
                  </div>
                ) : currentQ.category === 'mongolia' ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1">
                    <MongoliaMap
                      onAimagClick={handleAimagClick}
                      highlightCorrectId={hasAnswered && currentQ.targetId ? currentQ.targetId : null}
                      highlightWrongId={
                        hasAnswered && !isCurrentCorrect && feedbackItem?.id ? feedbackItem.id : null
                      }
                      interactive={!hasAnswered}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1">
                    <WorldMap
                      onCountryClick={handleCountryClick}
                      highlightCorrectId={hasAnswered && currentQ.targetId ? currentQ.targetId : null}
                      highlightWrongId={
                        hasAnswered && !isCurrentCorrect && feedbackItem?.id ? feedbackItem.id : null
                      }
                      interactive={!hasAnswered}
                    />
                  </div>
                )}
              </div>

              {/* Right: Choices & Feedback */}
              <div className="lg:col-span-4 flex flex-col gap-3">
                {/* Options List */}
                {currentQ.options && currentQ.options.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Сонголтууд:</p>
                    {currentQ.options.map((option) => {
                      const isSelected = selectedOptionId === option.id;
                      const showCorrect = hasAnswered && option.isCorrect;
                      const showWrong = hasAnswered && isSelected && !option.isCorrect;

                      return (
                        <button
                          key={option.id}
                          disabled={hasAnswered}
                          onClick={() => handleOptionSelect(option.id, option.isCorrect)}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            showCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs'
                              : showWrong
                              ? 'border-rose-500 bg-rose-50 text-rose-950 shadow-xs'
                              : isSelected
                              ? 'border-amber-500 bg-amber-50 text-slate-900'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option.text}</span>
                            {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                            {showWrong && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQ.shpContourData?.options ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Хариултын хувилбарууд (Бодит контурыг таана уу):</p>
                    {currentQ.shpContourData.options.map((optName) => {
                      const isTarget = optName === currentQ.shpContourData?.targetName;
                      const isSelected = selectedOptionId === optName;
                      const showCorrect = hasAnswered && isTarget;
                      const showWrong = hasAnswered && isSelected && !isTarget;

                      return (
                        <button
                          key={optName}
                          disabled={hasAnswered}
                          onClick={() => handleOptionSelect(optName, isTarget)}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            showCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-xs'
                              : showWrong
                              ? 'border-rose-500 bg-rose-50 text-rose-950 shadow-xs'
                              : isSelected
                              ? 'border-amber-500 bg-amber-50 text-slate-900'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{optName}</span>
                            {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                            {showWrong && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQ.silhouetteData?.options ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Хариултын хувилбарууд:</p>
                    {currentQ.silhouetteData.options.map((optName) => {
                      const isTarget = optName === currentQ.silhouetteData?.name;
                      const isSelected = selectedOptionId === optName;
                      const showCorrect = hasAnswered && isTarget;
                      const showWrong = hasAnswered && isSelected && !isTarget;

                      return (
                        <button
                          key={optName}
                          disabled={hasAnswered}
                          onClick={() => handleOptionSelect(optName, isTarget)}
                          className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            showCorrect
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                              : showWrong
                              ? 'border-rose-500 bg-rose-50 text-rose-950'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{optName}</span>
                            {showCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                            {showWrong && <XCircle className="h-4 w-4 text-rose-600 shrink-0" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQ.type === 'interactive_map_pin' || currentQ.mapPinData ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-950 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      <span>Газрын Зурагт Цэг Тавих Даалгавар</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      Интерактив зураг дээр хулганаар товшин <b>📍 цэг тавьж</b>, доод талын <b>"Байршлыг баталгаажуулах"</b> товчийг дарж таана уу.
                    </p>
                    <div className="rounded-lg bg-white border border-amber-200 p-2 text-[10px] text-slate-600 space-y-1">
                      <div>📏 Зөвшөөрөгдөх алдааны зай: <b>&lt; {currentQ.mapPinData?.allowedDistanceKm || 55} км</b></div>
                      <div>🎯 Бодит байршилд ойртох тусам амжилттай тооцогдоно.</div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 text-center">
                    <p className="font-semibold text-slate-800 mb-1">📍 Газрын зураг дээр шууд дарна уу</p>
                    <p className="text-[11px] text-slate-500">
                      Асуултад харгалзах газар нутаг, аймаг эсвэл улсын нутаг дэвсгэр дээр дарж хариулна.
                    </p>
                  </div>
                )}

                {/* Explanation Card after answered */}
                {hasAnswered && (
                  <div
                    className={`rounded-xl border p-3.5 text-xs transition-all space-y-2 ${
                      isCurrentCorrect
                        ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                        : 'border-rose-200 bg-rose-50/70 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {isCurrentCorrect ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Зөв хариуллаа! (+{currentQ.points || 10} оноо)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-rose-600" />
                          <span>Хариулт буруу: Зөв хариу нь "{currentQ.targetName}"</span>
                        </>
                      )}
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-700">
                      {currentQ.explanation}
                    </p>

                    <button
                      onClick={handleNext}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>
                        {currentIndex + 1 < questions.length ? 'Дараагийн асуулт' : 'Уралдааныг дуусгах'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Trophy className="h-8 w-8" />
            </div>

            <div className="space-y-1">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                {getCategoryTitle(selectedGrade)}
              </span>
              <h3 className="font-display text-2xl font-black text-slate-900 pt-2">
                Уралдаан амжилттай дууслаа!
              </h3>
              <p className="text-xs text-slate-500">
                Оролцогч: <strong>{finalAttempt?.studentName}</strong> ({finalAttempt?.school})
              </p>
            </div>

            {finalAttempt && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg text-center">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-xs">
                  <p className="text-xs text-slate-500">Нийт авсан оноо</p>
                  <p className="text-2xl font-black text-amber-700 mt-1">
                    {finalAttempt.totalScore} / {finalAttempt.maxScore}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 mt-1">
                    {finalAttempt.percentage}% Амжилт
                  </p>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4 shadow-xs">
                  <p className="text-xs text-slate-500">Монголын газарзүй</p>
                  <p className="text-2xl font-black text-sky-700 mt-1">
                    {finalAttempt.mongoliaScore} / {finalAttempt.mongoliaMaxScore}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {finalAttempt.mongoliaCount} даалгавар
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-xs">
                  <p className="text-xs text-slate-500">Дэлхийн газарзүй</p>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {finalAttempt.worldScore} / {finalAttempt.worldMaxScore}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {finalAttempt.worldCount} даалгавар
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setShowCertificate(true)}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
              >
                <FileCheck className="h-4 w-4" />
                <span>Цахим Батламж харах / Хэвлэх</span>
              </button>

              <button
                onClick={() => startQuiz(selectedGrade)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Дахин оролцох</span>
              </button>

              <button
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                Хаах
              </button>
            </div>
          </div>
        )}

        {/* Certificate Modal */}
        {showCertificate && finalAttempt && (
          <Certificate
            attempt={finalAttempt}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </div>
    </div>
  );
};
