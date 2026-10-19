import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Search,
  Filter,
  Eye,
  FileCheck,
  Users,
  Award,
  BookOpen,
  Layers,
  Compass,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Pencil,
  Save,
  Building2,
  Briefcase,
  Plus,
  Trash2,
  Upload,
  RotateCcw,
  Lock,
  LogOut,
  KeyRound,
  AlertCircle,
  Unlock,
  Archive,
  ArchiveRestore,
  CheckSquare,
  Calendar,
  Heart,
  Check,
  CreditCard,
  Printer,
  Database,
  Cloud,
  RefreshCw,
  Copy,
  ExternalLink,
  Flag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CompetitionTaskPicker } from './CompetitionTaskPicker';
import { QuestionBankEditor } from './QuestionBankEditor';
import { LiveCompetitionMonitor } from './LiveCompetitionMonitor';
import { IntegrityBadge } from './IntegrityBadge';
import { CompetitionRulesEditor } from './CompetitionRulesEditor';
import { DonorCertificateStudio, DonationCertificateViewer } from './DonorCertificateStudio';
import {
  User,
  GradeLevel,
  CompetitionGradeLevel,
  CertificatePartner,
  Question,
  QuestionCategory,
  CompetitionTeam,
  DonationRecord,
} from '../types';
import { Certificate } from './Certificate';
import { CustomMapStudio } from './CustomMapStudio';
import { GisContourQuestionGenerator } from './GisContourQuestionGenerator';
import { UserProfileModal } from './UserProfileModal';
import {
  GIS_AUTO_TASK_TYPE_LABELS,
  GisAutoTaskType,
} from '../utils/gisAutoQuestionGenerator';

interface AdminDashboardProps {
  onOpenAuth?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenAuth }) => {
  const {
    users,
    approveStudent,
    rejectStudent,
    approveAllPending,
    toggleUserMapAccess,
    batchSetUserMapAccess,
    deleteUser,
    batchDeleteUsers,
    batchSetCompetitionConfirmed,
    attempts,
    archiveAttempt,
    batchArchiveAttempts,
    deleteAttempt,
    batchDeleteAttempts,
    currentUser,
    loginUser,
    logout,
    updateAdminProfile,
    gisLayers,
    resetGisLayers,
    customQuestions,
    addCustomQuestion,
    deleteCustomQuestion,
    batchDeleteCustomQuestions,
    clearAllCustomQuestions,
    autoGenerateQuestionsFromGisLayers,
    layerUsageStats,
    taskPerformanceStats,
    certificateConfig,
    updateCertificateConfig,
    resetCertificateConfig,
    competitionSchedule,
    updateCompetitionSchedule,
    isCompetitionCurrentlyOpen,
    teams,
    createTeam,
    updateTeam,
    deleteTeam,
    donations,
    reviewDonation,
    deleteDonation,
    questionReports,
    resolveQuestionReport,
    deleteQuestionReport,
  } = useApp();

  // Certificate Template Studio state inside AdminDashboard
  const [showCertTemplateEditor, setShowCertTemplateEditor] = useState(false);
  const [partnerNameInput, setPartnerNameInput] = useState('');
  const [partnerRoleInput, setPartnerRoleInput] = useState<'organizer' | 'sponsor'>('organizer');
  const [partnerLogoInput, setPartnerLogoInput] = useState('');
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  const handlePartnerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPartnerLogoInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerNameInput.trim()) return;
    if (editingPartnerId) {
      updateCertificateConfig({
        partners: certificateConfig.partners.map((p) =>
          p.id === editingPartnerId
            ? {
                ...p,
                name: partnerNameInput.trim(),
                role: partnerRoleInput,
                logoUrl: partnerLogoInput.trim() || undefined,
              }
            : p
        ),
      });
      setEditingPartnerId(null);
    } else {
      const created: CertificatePartner = {
        id: `partner_${Date.now()}`,
        name: partnerNameInput.trim(),
        role: partnerRoleInput,
        logoUrl: partnerLogoInput.trim() || undefined,
      };
      updateCertificateConfig({
        partners: [...certificateConfig.partners, created],
      });
    }
    setPartnerNameInput('');
    setPartnerLogoInput('');
    setAdminProfileToast('Батламжийн байгууллага / лого амжилттай хадгалагдлаа.');
    setTimeout(() => setAdminProfileToast(null), 3500);
  };

  const handleDeleteCertPartner = (id: string) => {
    updateCertificateConfig({
      partners: certificateConfig.partners.filter((p) => p.id !== id),
    });
    if (editingPartnerId === id) {
      setEditingPartnerId(null);
      setPartnerNameInput('');
      setPartnerLogoInput('');
    }
  };

  // Find current admin user record
  const adminUser = users.find((u) => u.role === 'admin') || currentUser;

  // Admin Profile Edit state
  const [isEditingAdminProfile, setIsEditingAdminProfile] = useState(false);
  const [adminFullName, setAdminFullName] = useState(
    adminUser?.fullName || 'Б. Түвшинбаяр'
  );
  const [adminOrganization, setAdminOrganization] = useState(
    adminUser?.organization || adminUser?.school || 'Нийслэлийн 1-р сургууль'
  );
  const [adminPosition, setAdminPosition] = useState(
    adminUser?.position || adminUser?.notes || 'Газарзүйн багш, Шалгалтын комиссын дарга'
  );
  const [adminEmail, setAdminEmail] = useState(
    adminUser?.email || ''
  );
  const [adminPhone, setAdminPhone] = useState(adminUser?.phone || '');
  const [adminProfileToast, setAdminProfileToast] = useState<string | null>(null);

  const handleOpenAdminEdit = () => {
    setAdminFullName(adminUser?.fullName || 'Б. Түвшинбаяр');
    setAdminOrganization(
      adminUser?.organization || adminUser?.school || 'Нийслэлийн 1-р сургууль'
    );
    setAdminPosition(
      adminUser?.position || adminUser?.notes || 'Газарзүйн багш, Шалгалтын комиссын дарга'
    );
    setAdminEmail(adminUser?.email || '');
    setAdminPhone(adminUser?.phone || '');
    setIsEditingAdminProfile(true);
  };

  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminProfile({
      fullName: adminFullName,
      organization: adminOrganization,
      position: adminPosition,
      email: adminEmail,
      phone: adminPhone,
    });
    setIsEditingAdminProfile(false);
    setAdminProfileToast('Админы мэдээлэл (Овог нэр, Албан газар, Албан тушаал) амжилттай хадгалагдлаа.');
    setTimeout(() => setAdminProfileToast(null), 4000);
  };

  const [activeTab, setActiveTab] = useState<
    'verifications' | 'teams' | 'donations' | 'attempts' | 'questions' | 'gis_layers' | 'analytics' | 'competition_tasks' | 'edit_questions' | 'live'
  >('verifications');

  const [analyticsLayerFilter, setAnalyticsLayerFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'granted' | 'revoked'>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | GradeLevel>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  const [editingTargetUser, setEditingTargetUser] = useState<User | null>(null);
  const [viewingCertificateAttemptId, setViewingCertificateAttemptId] = useState<string | null>(null);

  // Teams tab state
  const [teamNameInput, setTeamNameInput] = useState('');
  const [teamGradeInput, setTeamGradeInput] = useState<CompetitionGradeLevel>('team');
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  // Donations tab state
  const [donationSearch, setDonationSearch] = useState('');
  const [donationStatusFilter, setDonationStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewingDonationForCert, setViewingDonationForCert] = useState<DonationRecord | null>(null);

  // Attempts tab filters & selection
  const [attemptArchiveFilter, setAttemptArchiveFilter] = useState<'active' | 'archived' | 'all'>('active');
  const [attemptSearch, setAttemptSearch] = useState('');
  const [selectedAttemptIds, setSelectedAttemptIds] = useState<string[]>([]);

  // Question bank tab filters, manual entry form & bulk selection
  const [qSearch, setQSearch] = useState('');
  const [qCatFilter, setQCatFilter] = useState<'all' | 'mongolia' | 'world'>('all');
  const [qPage, setQPage] = useState(1);
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([]);
  const [showManualQuestionForm, setShowManualQuestionForm] = useState(false);
  const [manualQTitle, setManualQTitle] = useState('');
  const [manualQSubtitle, setManualQSubtitle] = useState('');
  const [manualQCategory, setManualQCategory] = useState<QuestionCategory>('mongolia');
  const [manualQGrades, setManualQGrades] = useState<GradeLevel[]>(['9', '12', 'teacher', 'team']);
  const [manualQPoints, setManualQPoints] = useState<number>(15);
  const [manualQOptions, setManualQOptions] = useState<string[]>(['', '', '', '']);
  const [manualQCorrectIdx, setManualQCorrectIdx] = useState<number>(0);
  const [manualQExplanation, setManualQExplanation] = useState('');
  const [selectedAutoLayerIds, setSelectedAutoLayerIds] = useState<string[]>([]);
  const [selectedAutoTaskTypes, setSelectedAutoTaskTypes] = useState<GisAutoTaskType[]>(
    GIS_AUTO_TASK_TYPE_LABELS.map((t) => t.id)
  );
  const [autoMaxPerLayer, setAutoMaxPerLayer] = useState<number>(50);
  const [reportFilterStatus, setReportFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [editingReportFix, setEditingReportFix] = useState<Record<string, string>>({});
  const itemsPerPage = 12;

  const showToastMessage = (msg: string) => {
    setAdminProfileToast(msg);
    setTimeout(() => setAdminProfileToast(null), 3500);
  };

  // Filter users with robust null safety
  const filteredUsers = users.filter((u) => {
    if (u.role === 'admin') return false; // don't list admin himself
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (accessFilter === 'granted' && u.mapAndChallengeAccess === false) return false;
    if (accessFilter === 'revoked' && u.mapAndChallengeAccess !== false) return false;
    if (gradeFilter !== 'all' && u.grade !== gradeFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return (
        (u.fullName || '').toLowerCase().includes(term) ||
        (u.school || '').toLowerCase().includes(term) ||
        (u.studentCode || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        (u.phone || '').includes(term) ||
        (u.teamName || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Filter attempts
  const filteredAttempts = attempts.filter((att) => {
    if (attemptArchiveFilter === 'active' && att.isArchived) return false;
    if (attemptArchiveFilter === 'archived' && !att.isArchived) return false;
    if (attemptSearch.trim()) {
      const term = attemptSearch.toLowerCase();
      return (
        att.studentName.toLowerCase().includes(term) ||
        att.school.toLowerCase().includes(term) ||
        att.studentCode.toLowerCase().includes(term) ||
        att.certificateNumber.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // Filter questions (strictly from manually added / created customQuestions)
  const allAvailableQuestions = customQuestions;
  const filteredQuestions = allAvailableQuestions.filter((q) => {
    if (qCatFilter !== 'all' && q.category !== qCatFilter) return false;
    if (qSearch.trim()) {
      const term = qSearch.toLowerCase();
      return (
        q.title.toLowerCase().includes(term) ||
        q.targetName.toLowerCase().includes(term) ||
        (q.shpContourData?.layerName || '').toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / itemsPerPage));
  const paginatedQuestions = filteredQuestions.slice(
    (qPage - 1) * itemsPerPage,
    qPage * itemsPerPage
  );

  // Stats
  const nonAdminUsers = users.filter((u) => u.role !== 'admin');
  const pendingUsers = nonAdminUsers.filter((u) => u.status === 'pending');
  const approvedUsers = nonAdminUsers.filter((u) => u.status === 'approved');
  const activeAttemptsCount = attempts.filter((a) => !a.isArchived).length;
  const archivedAttemptsCount = attempts.filter((a) => a.isArchived).length;

  const handleApprove = (userId: string) => {
    approveStudent(userId);
    showToastMessage('Оролцогчийг уралдаанд баталгаажууллаа.');
  };

  const handleReject = (userId: string) => {
    rejectStudent(userId);
    showToastMessage('Оролцогчийн уралдааны эрхийг цуцаллаа.');
  };

  const handleManualQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = manualQTitle.trim();
    const trimmedOptions = manualQOptions.map((o) => o.trim());
    const validCorrectOption = trimmedOptions[manualQCorrectIdx];

    if (!cleanTitle) {
      showToastMessage('Асуултын гарчгийг оруулна уу.');
      return;
    }
    if (trimmedOptions.some((o) => !o)) {
      showToastMessage('Хариултын 4 хувилбарыг бүрэн бөглөнө үү.');
      return;
    }

    const newQ: Question = {
      id: `manual_q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: manualQCategory,
      gradeLevels: manualQGrades.length > 0 ? manualQGrades : ['9', '12', 'teacher', 'team'],
      type: 'multiple_choice',
      title: cleanTitle,
      subtitle: manualQSubtitle.trim() || undefined,
      targetName: validCorrectOption,
      explanation:
        manualQExplanation.trim() || `Зөв хариулт: ${validCorrectOption}`,
      difficulty: 'medium',
      points: manualQPoints || 15,
      options: trimmedOptions.map((optText, idx) => ({
        id: String(idx + 1),
        text: optText,
        isCorrect: idx === manualQCorrectIdx,
      })),
    };

    addCustomQuestion(newQ);
    setManualQTitle('');
    setManualQSubtitle('');
    setManualQOptions(['', '', '', '']);
    setManualQCorrectIdx(0);
    setManualQExplanation('');
    showToastMessage('Шинэ даалгавар санд амжилттай нэмэгдлээ!');
  };

  const viewingAttempt = attempts.find((a) => a.id === viewingCertificateAttemptId);

  // STRICT ACCESS CONTROL: Regular users or guests never see any Admin login window or AdminDashboard data!
  if (!currentUser || currentUser.role !== 'admin') {
    const myPersonalAttempts = currentUser
      ? attempts.filter((a) => a.userId === currentUser.id || a.studentCode === currentUser.studentCode)
      : [];

    return (
      <div className="max-w-2xl mx-auto space-y-6 my-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          {!currentUser ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Хэрэглэгчийн бүртгэл & Системд нэвтрэх
                  </h2>
                  <p className="text-xs text-slate-500">
                    Сайтад бүртгүүлэх эсвэл өөрийн хаягаар нэвтрэх
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">
                  Сайтын интерактив газрын зураг, сорил болон уралдааны систем:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Шинэ хэрэглэгч бол «Хэрэглэгчийн бүртгэл» хэсгээр бүртгүүлнэ.</li>
                  <li>Бүртгэлтэй хэрэглэгч бол имэйл эсвэл утасны дугаараараа нэвтэрнэ.</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth && onOpenAuth()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-xs font-bold text-slate-950 shadow-sm transition-colors cursor-pointer"
              >
                <UserCheck className="h-4 w-4" />
                <span>Хэрэглэгчийн бүртгэл / Нэвтрэх цонх нээх</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <UserCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Хэрэглэгчийн бүртгэлийн мэдээлэл
                    </h2>
                    <p className="text-xs text-slate-500">
                      Таны хувийн бүртгэл ба шалгалтын түүх
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Гарах</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
                  <span className="text-slate-400 block text-[11px]">Овог, нэр:</span>
                  <strong className="text-slate-900 font-bold">{currentUser.fullName}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
                  <span className="text-slate-400 block text-[11px]">Утас / Имэйл:</span>
                  <strong className="font-mono text-slate-900 font-bold">
                    {currentUser.phone || currentUser.email}
                  </strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
                  <span className="text-slate-400 block text-[11px]">Сургууль / Байгууллага:</span>
                  <strong className="text-slate-900 font-bold">{currentUser.school}</strong>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/70">
                  <span className="text-slate-400 block text-[11px]">Уралдааны төлөв:</span>
                  <strong
                    className={`font-bold ${
                      currentUser.status === 'approved'
                        ? 'text-emerald-600'
                        : currentUser.status === 'pending'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {currentUser.status === 'approved'
                      ? 'Баталгаажсан ✓'
                      : currentUser.status === 'pending'
                      ? 'Хүлээгдэж буй'
                      : 'Цуцлагдсан'}
                  </strong>
                </div>
              </div>

              {myPersonalAttempts.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-800">
                    Таны уралдааны оролдлогууд ({myPersonalAttempts.length}):
                  </p>
                  {myPersonalAttempts.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">
                          Оноо: {att.totalScore}/{att.maxScore} ({att.percentage}%)
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          Батламж №: {att.certificateNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewingCertificateAttemptId(att.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-100 hover:bg-amber-200 px-3 py-1.5 text-[11px] font-bold text-amber-900 transition-colors cursor-pointer"
                      >
                        <FileCheck className="h-3.5 w-3.5" />
                        <span>Батламж харах</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Certificate Viewer Modal for Personal Attempt if opened */}
        {viewingAttempt && (
          <Certificate
            attempt={viewingAttempt}
            onClose={() => setViewingCertificateAttemptId(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {adminProfileToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-md">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{adminProfileToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Багш / Админ Удирдах Самбар
              </h1>
            </div>
            <div className="mt-2 flex items-center gap-2.5 flex-wrap text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-900">
                <span>Админ (Овог, нэр):</span>
                <strong className="font-bold">
                  {adminUser?.fullName || 'Б. Түвшинбаяр'}
                </strong>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-slate-800">
                <Briefcase className="h-3.5 w-3.5 text-sky-600" />
                <span>Албан тушаал:</span>
                <strong className="font-bold">
                  {adminUser?.position || adminUser?.notes || 'Газарзүйн багш, Шалгалтын комиссын дарга'}
                </strong>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1 text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Албан газар:</span>
                <strong className="font-bold">
                  {adminUser?.organization || adminUser?.school || 'Нийслэлийн 1-р сургууль'}
                </strong>
              </span>
            </div>
          </div>

          {/* Right Actions: Edit Admin Profile, Bulk Approve & Admin Logout */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() =>
                isEditingAdminProfile
                  ? setIsEditingAdminProfile(false)
                  : handleOpenAdminEdit()
              }
              className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-amber-700" />
              <span>
                {isEditingAdminProfile ? 'Засварлахыг хаах' : 'Админы мэдээлэл засах'}
              </span>
            </button>

            {pendingUsers.length > 0 && (
              <button
                onClick={approveAllPending}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs whitespace-nowrap cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                Хүлээгдэж буй оролцогчдыг баталгаажуулах ({pendingUsers.length})
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-bold text-rose-700 transition-colors shadow-2xs cursor-pointer"
              title="Админ эрхээс гарах"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Админ эрхээс гарах</span>
            </button>
          </div>
        </div>

        {/* Collapsible Admin Profile Editor Form */}
        {isEditingAdminProfile && (
          <form
            onSubmit={handleSaveAdminProfile}
            className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3.5 pt-3 border-t"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-700" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Админы хувийн мэдээлэл, албан газар ба албан тушаал засварлах
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Энд оруулсан мэдээлэл удирдах самбар болон оролцогчдын Батламж (Сертификат) дээр шууд бичигдэнэ.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Овог, нэр: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  placeholder="Жишээ нь: Б. Түвшинбаяр"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Албан газар / Сургууль, байгууллага: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminOrganization}
                  onChange={(e) => setAdminOrganization(e.target.value)}
                  placeholder="Жишээ нь: Нийслэлийн 1-р сургууль"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Албан тушаал: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminPosition}
                  onChange={(e) => setAdminPosition(e.target.value)}
                  placeholder="Жишээ нь: Газарзүйн багш, Шалгалтын комиссын дарга"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-amber-500 focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Холбоо барих утас:
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="99112233"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Цахим шуудан (Email):
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="teacher@school.edu.mn"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingAdminProfile(false)}
                className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
              >
                Болих
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Мэдээллийг хадгалах</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Нийт оролцогчид</span>
            <Users className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{users.filter((u) => u.role !== 'admin').length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            9-р: {users.filter((u) => u.grade === '9').length} · 12-р: {users.filter((u) => u.grade === '12').length} · Багш: {users.filter((u) => u.grade === 'teacher').length} · Баг: {teams.length}
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs">
            <span>Баталгаажуулалт хүлээгдэж буй</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-900">{pendingUsers.length}</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Шалгаж зөвшөөрөх шаардлагатай
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span>Баталгаажсан оролцогчид</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-900">{approvedUsers.length}</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">
            Уралдаанд оролцох эрхтэй
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Оролцсон шалгалтууд</span>
            <Award className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{attempts.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Батламж олгогдсон тоо
          </p>
        </div>
      </div>

      {/* Competition Schedule & Open/Close Control Panel */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50/70 via-white to-sky-50/50 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-2xs shrink-0">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">
                  Уралдааныг цагаар тохируулж нээх / хаах удирдлага
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                    isCompetitionCurrentlyOpen
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {isCompetitionCurrentlyOpen ? (
                    <>
                      <Unlock className="h-3 w-3" />
                      <span>Уралдаан одоо НЭЭЛТТЭЙ</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>Уралдаан одоо ХААЛТТАЙ</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Зөвхөн уралдаанд оролцохоор батлагдсан ({approvedUsers.length}) оролцогчид уралдаан нээлттэй үед «Уралдаан» цэс рүү нэвтэрч шалгалт өгнө.
              </p>
            </div>
          </div>

          {/* 3 Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                updateCompetitionSchedule({ mode: 'open' });
                showToastMessage('Уралдааныг шууд НЭЭЛТТЭЙ төлөвт шилжүүллээ.');
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border ${
                competitionSchedule.mode === 'open'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
              }`}
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>Шууд нээх</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updateCompetitionSchedule({ mode: 'scheduled' });
                showToastMessage('Уралдааныг цагийн хуваариар автоматаар нээгдэж, хаагдах горимд шилжүүллээ.');
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border ${
                competitionSchedule.mode === 'scheduled'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Цагаар тохируулах</span>
            </button>

            <button
              type="button"
              onClick={() => {
                updateCompetitionSchedule({ mode: 'closed' });
                showToastMessage('Уралдааныг ХААЛТТАЙ төлөвт шилжүүллээ.');
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border ${
                competitionSchedule.mode === 'closed'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Шууд хаах</span>
            </button>
          </div>
        </div>

        {/* Date/Time Pickers & Announcement Note */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Уралдаан эхлэх (Нээгдэх огноо, цаг):
            </label>
            <input
              type="datetime-local"
              value={competitionSchedule.startTime}
              onChange={(e) => {
                updateCompetitionSchedule({
                  startTime: e.target.value,
                  mode: 'scheduled',
                });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-amber-500 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Уралдаан дуусах (Хаагдах огноо, цаг):
            </label>
            <input
              type="datetime-local"
              value={competitionSchedule.endTime}
              onChange={(e) => {
                updateCompetitionSchedule({
                  endTime: e.target.value,
                  mode: 'scheduled',
                });
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-semibold text-slate-900 focus:border-amber-500 focus:outline-none shadow-2xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Оролцогчдод харагдах зарлал / санамж:
            </label>
            <input
              type="text"
              value={competitionSchedule.announcementNote || ''}
              onChange={(e) =>
                updateCompetitionSchedule({ announcementNote: e.target.value })
              }
              placeholder="Жишээ нь: Уралдаан 10:00–14:00 цагийн хооронд явагдана."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none shadow-2xs"
            />
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 space-y-2">
            <div className="font-bold text-amber-900">⚡ Уралдааны дүрэм: асуултын тоо, хугацаа, оноо</div>
            <CompetitionRulesEditor />
            <label className="block">
              <span className="mb-1 block font-semibold text-slate-700">🖥 Цонх сольж болох дээд тоо (хэтэрвэл уралдаан автоматаар дуусна)</span>
              <input
                type="number"
                min={0}
                max={20}
                value={competitionSchedule.maxWindowLeaves ?? 0}
                onChange={(e) => updateCompetitionSchedule({ maxWindowLeaves: Math.min(20, Math.max(0, Math.round(Number(e.target.value) || 0))) })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:w-60"
              />
              <span className="mt-1 block text-[11px] text-slate-600">
                0 = дуусгахгүй, зөвхөн бүртгэнэ (анхдагч). Жишээ нь 3 гэвэл 4 дэх шилжилтээр уралдаан дуусна. Уралдаан бүтэн дэлгэцээр эхэлж, цонх
                солих бүр админы «📡 Шууд хяналт» болон оролдлогын бүртгэлд харагдана. Мэдэгдэл, санамсаргүй товшилтоос үүссэн 0.7 секундээс богино
                фокус алдалтыг тооцохгүй.
              </span>
            </label>
            <p className="text-[11px] leading-relaxed text-slate-700">
              Оноо = суурь оноо × (1 + урамшуулал × үлдсэн хугацаа / нийт хугацаа). Тэр даруй зөв хариулбал суурь оноо +{' '}
              {competitionSchedule.speedBonusPercent ?? 50}%, цаг дуусах мөчид зөв хариулбал зөвхөн суурь оноо, буруу хариулт 0. Оноо тэнцвэл{' '}
              <strong>нийт хугацаа бага</strong> нь дээгүүр байрлана. 0% болговол хурдны урамшуулал унтарна.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors ${
            activeTab === 'verifications'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Хэрэглэгчийн бүртгэл ба баталгаажуулалт
          {pendingUsers.length > 0 && (
            <span className="rounded-full bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 text-[10px]">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'teams'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4 text-emerald-600" />
          <span>👥 Багийн зохион байгуулалт</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
            {teams.length} баг
          </span>
        </button>

        <button
          onClick={() => setActiveTab('donations')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'donations'
              ? 'border-rose-600 text-rose-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Heart className="h-4 w-4 text-rose-600" />
          <span>💖 Хандив & Батламж</span>
          {donations.filter((d) => d.status === 'pending').length > 0 ? (
            <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 text-[10px] font-bold animate-pulse">
              {donations.filter((d) => d.status === 'pending').length} хүлээгдэж буй
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 text-[10px]">
              {donations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('attempts')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'attempts'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="h-4 w-4" />
          Уралдааны үр дүн ба Архив ({activeAttemptsCount} идэвхтэй / {archivedAttemptsCount} архив)
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'questions'
              ? 'border-sky-600 text-sky-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="h-4 w-4 text-sky-600" />
          <span>🎯 Шалгалтын асуултын сан & Вектор/SHP Даалгавар Бэлтгэгч</span>
          <span className="rounded-full bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.2 text-[10px] font-bold">
            {customQuestions.length} даалгавар
          </span>
          {questionReports.filter((r) => r.status === 'pending').length > 0 && (
            <span className="rounded-full bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 text-[10px] font-bold animate-pulse">
              ⚠️ {questionReports.filter((r) => r.status === 'pending').length} алдааны мэдээлэл
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('competition_tasks')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'competition_tasks'
              ? 'border-amber-600 text-amber-700 font-bold bg-amber-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>🏆 Уралдааны даалгавар</span>
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'live'
              ? 'border-rose-600 text-rose-700 font-bold bg-rose-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>📡 Шууд хяналт</span>
        </button>
        <button
          onClick={() => setActiveTab('edit_questions')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'edit_questions'
              ? 'border-amber-600 text-amber-700 font-bold bg-amber-50/60'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>✏️ Даалгавар засах</span>
        </button>

        <button
          onClick={() => setActiveTab('gis_layers')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'gis_layers'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="h-4 w-4 text-emerald-600" />
          <span>📁 Вектор & SHP сан</span>
          <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 text-[10px] font-bold">
            {gisLayers.length} давхарга
          </span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition-colors cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          <span>📊 Газрын зураг & Сорилын гүйцэтгэл</span>
        </button>


      </div>

      {/* TAB 1: Student Verification, Map/Challenge Access & Contestant Selection */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold">Хэрэглэгчийн эрх ба уралдааны баталгаажуулалт:</span>{' '}
              Сайтад бүртгүүлсэн хэрэглэгчдэд <b>Газрын зураг, сорил ашиглах эрх</b> нээх/хаах, бүртгэл устгах мөн зөвхөн <b>Уралдаанд оролцогчдыг</b> сонгож баталгаажуулах эсвэл цуцлах боломжтой.
            </div>
            <span className="font-mono text-[11px] font-bold bg-white border border-sky-200 px-2.5 py-1 rounded-lg shrink-0">
              Нийт бүртгэлтэй: {nonAdminUsers.length}
            </span>
          </div>

          {/* Filters & Search bar */}
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Нэр, сургууль, имэйл эсвэл утсаар хайх..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Шүүлт:
              </span>

              {/* Competition Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none shadow-xs cursor-pointer"
              >
                <option value="all">Уралдааны бүх төлөв</option>
                <option value="pending">Хүлээгдэж буй ({pendingUsers.length})</option>
                <option value="approved">Уралдаанд баталгаажсан ({approvedUsers.length})</option>
                <option value="rejected">Уралдаанаас цуцлагдсан</option>
              </select>

              {/* Map & Challenge Access Filter */}
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none shadow-xs cursor-pointer"
              >
                <option value="all">Газрын зураг/Сорил: Бүгд</option>
                <option value="granted">Эрх нээлттэй</option>
                <option value="revoked">Эрх хаалттай</option>
              </select>

              {/* Grade / Category Filter */}
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-amber-500 focus:outline-none shadow-xs cursor-pointer"
              >
                <option value="all">Бүх ангилал</option>
                <option value="9">9-р анги</option>
                <option value="12">12-р анги</option>
                <option value="teacher">Багш</option>
                <option value="team">Баг (Багийн)</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Action Bar for Registered Users */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    filteredUsers.length > 0 &&
                    filteredUsers.every((u) => selectedUserIds.includes(u.id))
                  }
                  onChange={() => {
                    const allIds = filteredUsers.map((u) => u.id);
                    const allSelected =
                      allIds.length > 0 && allIds.every((id) => selectedUserIds.includes(id));
                    if (allSelected) {
                      setSelectedUserIds((prev) => prev.filter((id) => !allIds.includes(id)));
                    } else {
                      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...allIds])));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Жагсаалтаас бүгдийг сонгох ({filteredUsers.length})</span>
              </label>
              {selectedUserIds.length > 0 && (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  Сонгосон: {selectedUserIds.length} хэрэглэгч
                </span>
              )}
            </div>

            {selectedUserIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    batchSetCompetitionConfirmed(selectedUserIds, true);
                    showToastMessage(
                      `Сонгосон ${selectedUserIds.length} хэрэглэгчийг уралдаанд оролцогчоор баталгаажууллаа.`
                    );
                    setSelectedUserIds([]);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Уралдаанд батлах ({selectedUserIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    batchSetCompetitionConfirmed(selectedUserIds, false);
                    showToastMessage(
                      `Сонгосон ${selectedUserIds.length} хэрэглэгчийн уралдааны эрхийг цуцаллаа.`
                    );
                    setSelectedUserIds([]);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Уралдаанаас цуцлах</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    batchSetUserMapAccess(selectedUserIds, true);
                    showToastMessage(
                      `Сонгосон ${selectedUserIds.length} хэрэглэгчийн Газрын зураг, сорил ашиглах эрхийг нээлээ.`
                    );
                    setSelectedUserIds([]);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Зураг/Сорил эрх нээх</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    batchSetUserMapAccess(selectedUserIds, false);
                    showToastMessage(
                      `Сонгосон ${selectedUserIds.length} хэрэглэгчийн Газрын зураг, сорил ашиглах эрхийг хаалаа.`
                    );
                    setSelectedUserIds([]);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 text-[11px] font-bold cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Зураг/Сорил эрх хаах</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const count = selectedUserIds.length;
                    batchDeleteUsers(selectedUserIds);
                    setSelectedUserIds([]);
                    showToastMessage(`Сонгосон ${count} хэрэглэгчийг бүртгэлээс устгалаа.`);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Устгах ({selectedUserIds.length})</span>
                </button>
              </div>
            )}
          </div>

          {/* Student Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredUsers.length > 0 &&
                        filteredUsers.every((u) => selectedUserIds.includes(u.id))
                      }
                      onChange={() => {
                        const allIds = filteredUsers.map((u) => u.id);
                        const allSelected =
                          allIds.length > 0 && allIds.every((id) => selectedUserIds.includes(id));
                        if (allSelected) {
                          setSelectedUserIds((prev) => prev.filter((id) => !allIds.includes(id)));
                        } else {
                          setSelectedUserIds((prev) => Array.from(new Set([...prev, ...allIds])));
                        }
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 font-semibold">Хэрэглэгчийн нэр</th>
                  <th className="px-3 py-3 font-semibold">Ангилал</th>
                  <th className="px-3 py-3 font-semibold">Сургууль / Байршил</th>
                  <th className="px-3 py-3 font-semibold">Утас / Имэйл</th>
                  <th className="px-3 py-3 font-semibold">Газрын зураг & Сорил эрх</th>
                  <th className="px-3 py-3 font-semibold">Уралдаанд оролцох төлөв</th>
                  <th className="px-3 py-3 font-semibold text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Хайлтад тохирох хэрэглэгч олдсонгүй.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isPending = user.status === 'pending';
                    const isApproved = user.status === 'approved';
                    const hasMapAccess = user.mapAndChallengeAccess !== false;
                    const isChecked = selectedUserIds.includes(user.id);

                    return (
                      <tr
                        key={user.id}
                        className={`transition-colors ${
                          isChecked ? 'bg-amber-50/50' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedUserIds((prev) =>
                                prev.includes(user.id)
                                  ? prev.filter((id) => id !== user.id)
                                  : [...prev, user.id]
                              )
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          <div>{user.fullName}</div>
                          {(() => {
                            const userTeam = teams.find(
                              (t) =>
                                t.id === user.teamId ||
                                t.leaderUserId === user.id ||
                                (t.memberUserIds && t.memberUserIds.includes(user.id)) ||
                                (user.teamName && t.name.toLowerCase() === user.teamName.toLowerCase())
                            );
                            if (userTeam) {
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md mt-0.5">
                                  👥 {userTeam.name}
                                  {userTeam.leaderUserId === user.id && ' (Ахлагч)'}
                                </span>
                              );
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab('teams');
                                  setTeamLeaderId(user.id);
                                  setTeamNameInput(`${user.school || user.fullName}-ийн баг`);
                                }}
                                className="text-[10px] text-slate-400 hover:text-emerald-700 hover:underline block mt-0.5 cursor-pointer"
                              >
                                + Баг болгож зохион байгуулах
                              </button>
                            );
                          })()}
                          <span className="text-[10px] text-slate-400 font-mono block">{user.phone}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              user.grade === '9'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : user.grade === '12'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : user.grade === 'teacher'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {user.grade === '9'
                              ? '9-р анги'
                              : user.grade === '12'
                              ? '12-р анги'
                              : user.grade === 'teacher'
                              ? 'Багш'
                              : 'Баг'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">
                          <div>{user.school}</div>
                          <div className="text-[10px] text-slate-400">{user.aimag}</div>
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-700">
                          <div>{user.phone}</div>
                          <div className="text-[10px] text-slate-400">{user.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              toggleUserMapAccess(user.id, !hasMapAccess);
                              showToastMessage(
                                `${user.fullName}: Газрын зураг, сорил ашиглах эрхийг ${
                                  !hasMapAccess ? 'нээлээ' : 'хаалаа'
                                }.`
                              );
                            }}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold border transition-colors cursor-pointer ${
                              hasMapAccess
                                ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Газрын зураг болон Сорил ашиглах эрхийг нээх / хаах"
                          >
                            {hasMapAccess ? (
                              <>
                                <Unlock className="h-3 w-3 text-sky-600" />
                                <span>Эрх нээлттэй</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 text-rose-600" />
                                <span>Эрх хаалттай</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Уралдаанд баталгаажсан
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Хүлээгдэж буй
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              Цуцлагдсан
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Confirm for Competition button */}
                            {user.status !== 'approved' && (
                              <button
                                onClick={() => handleApprove(user.id)}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[11px] font-semibold transition-colors shadow-xs cursor-pointer"
                                title="Уралдаанд оролцогчоор сонгож баталгаажуулах"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Уралдаанд батлах</span>
                              </button>
                            )}

                            {/* Cancel Competition Participation button */}
                            {user.status !== 'rejected' && (
                              <button
                                onClick={() => handleReject(user.id)}
                                className="flex items-center gap-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 px-2 py-1 text-[11px] transition-colors border border-amber-200 cursor-pointer"
                                title="Уралдаанд оролцох эрхийг цуцлах"
                              >
                                <UserX className="h-3 w-3" />
                                <span>Цуцлах</span>
                              </button>
                            )}

                            {/* Edit User Profile / School button */}
                            <button
                              onClick={() => setEditingTargetUser(user)}
                              className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 p-1.5 text-amber-800 transition-colors cursor-pointer"
                              title="Хэрэглэгчийн сургууль болон хувийн мэдээлэл засах"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* View Detail button */}
                            <button
                              onClick={() => setSelectedUserDetail(user)}
                              className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                              title="Дэлгэрэнгүй харах"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Delete User button */}
                            <button
                              onClick={() => {
                                deleteUser(user.id);
                                setSelectedUserIds((prev) => prev.filter((id) => id !== user.id));
                                showToastMessage(`"${user.fullName}" хэрэглэгчийг устгалаа.`);
                              }}
                              className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 p-1.5 text-rose-700 transition-colors cursor-pointer"
                              title="Хэрэглэгчийн бүртгэлийг устгах"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Team Organization (Organized by Admin from registered users) */}
      {activeTab === 'teams' && (
        <div className="space-y-5">
          {/* Info Banner */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold flex items-center gap-1.5 text-emerald-900 text-sm">
                <Users className="h-4 w-4 text-emerald-700" />
                Багийн оролцогчдыг зохион байгуулах
              </span>
              <p className="mt-1 text-slate-600">
                Хэрэглэгчийн бүртгэл дотроос сурагч, багш нарыг сонгон баг болгож үүсгэх, багийн ахлагч болон гишүүдийг томилох, багийн ангилалд уралдаанд оролцох эрхийг баталгаажуулна.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-xs font-bold bg-white border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-800 shadow-2xs">
                Нийт баг: {teams.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Create / Edit Team Form */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span>{editingTeamId ? 'Багийн мэдээлэл засах' : 'Шинэ баг үүсгэх'}</span>
                </h3>
                {editingTeamId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamId(null);
                      setTeamNameInput('');
                      setTeamLeaderId('');
                      setTeamMemberIds([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                  >
                    Цэвэрлэх
                  </button>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!teamNameInput.trim()) {
                    showToastMessage('Багийн нэрийг оруулна уу.');
                    return;
                  }
                  if (!teamLeaderId) {
                    showToastMessage('Багийн ахлагчийг сонгоно уу.');
                    return;
                  }

                  const leaderUser = users.find((u) => u.id === teamLeaderId);
                  const memberUsers = users.filter((u) => teamMemberIds.includes(u.id));

                  if (editingTeamId) {
                    updateTeam(editingTeamId, {
                      name: teamNameInput.trim(),
                      grade: teamGradeInput,
                      leaderUserId: teamLeaderId,
                      leaderName: leaderUser?.fullName || 'Ахлагч',
                      memberUserIds: teamMemberIds,
                      memberNames: memberUsers.map((m) => m.fullName),
                      school: leaderUser?.school,
                      aimag: leaderUser?.aimag,
                    });
                    showToastMessage(`"${teamNameInput.trim()}" багийн мэдээллийг шинэчлэлээ.`);
                    setEditingTeamId(null);
                  } else {
                    createTeam({
                      name: teamNameInput.trim(),
                      grade: teamGradeInput,
                      leaderUserId: teamLeaderId,
                      leaderName: leaderUser?.fullName || 'Ахлагч',
                      memberUserIds: teamMemberIds,
                      memberNames: memberUsers.map((m) => m.fullName),
                      school: leaderUser?.school,
                      aimag: leaderUser?.aimag,
                      isCompetitionConfirmed: true,
                    });
                    showToastMessage(`"${teamNameInput.trim()}" шинэ баг амжилттай үүслээ!`);
                  }

                  setTeamNameInput('');
                  setTeamLeaderId('');
                  setTeamMemberIds([]);
                }}
                className="space-y-3.5 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Багийн нэр *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Жишээ: Хангайн Шонхрууд, Алтайн Цоглог"
                    value={teamNameInput}
                    onChange={(e) => setTeamNameInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-semibold focus:border-amber-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Уралдааны ангилал *
                  </label>
                  <select
                    value={teamGradeInput}
                    onChange={(e) => setTeamGradeInput(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-amber-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="team">Багийн нэгдсэн ангилал (Холимог)</option>
                    <option value="9">9-р ангийн баг</option>
                    <option value="12">12-р ангийн баг</option>
                    <option value="teacher">Багш нарын баг</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Багийн ахлагч сонгох * ({nonAdminUsers.length} хэрэглэгчээс)
                  </label>
                  <select
                    required
                    value={teamLeaderId}
                    onChange={(e) => {
                      const newLeaderId = e.target.value;
                      setTeamLeaderId(newLeaderId);
                      setTeamMemberIds((prev) => prev.filter((id) => id !== newLeaderId));
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 font-medium focus:border-amber-500 focus:outline-none shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Ахлагчийг сонгоно уу --</option>
                    {nonAdminUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.school || u.aimag || 'Сургууль тодорхойгүй'} · {u.grade === 'teacher' ? 'Багш' : `${u.grade}-р анги`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Багийн гишүүд сонгох ({teamMemberIds.length} гишүүн)
                    </label>
                    <span className="text-[11px] text-slate-400">2-5 гишүүн</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1">
                    {nonAdminUsers
                      .filter((u) => u.id !== teamLeaderId)
                      .map((u) => {
                        const isSelected = teamMemberIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center justify-between rounded-lg p-2 text-xs transition-colors cursor-pointer select-none ${
                              isSelected
                                ? 'bg-emerald-100 text-emerald-950 font-bold border border-emerald-300'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setTeamMemberIds((prev) => prev.filter((id) => id !== u.id));
                                  } else {
                                    setTeamMemberIds((prev) => [...prev, u.id]);
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{u.fullName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {u.grade === 'teacher' ? 'Багш' : `${u.grade}-р анги`}
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{editingTeamId ? 'Өөрчлөлтийг хадгалах' : 'Баг үүсгэх'}</span>
                </button>
              </form>
            </div>

            {/* List of Teams */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Багийн нэр, ахлагчаар хайх..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold shrink-0">
                  Нийт: {teams.length} баг
                </span>
              </div>

              {teams.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-400 space-y-2">
                  <Users className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    Одоогоор зохион байгуулсан баг байхгүй байна.
                  </p>
                  <p className="text-xs text-slate-400">
                    Зүүн талын маягтаар бүртгэлтэй хэрэглэгчдээс сонгон шинэ баг үүсгэнэ үү.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {teams
                    .filter((t) => {
                      if (!teamSearch.trim()) return true;
                      const q = teamSearch.toLowerCase();
                      return (
                        t.name.toLowerCase().includes(q) ||
                        t.leaderName.toLowerCase().includes(q) ||
                        (t.school || '').toLowerCase().includes(q)
                      );
                    })
                    .map((team) => {
                      return (
                        <div
                          key={team.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 hover:border-emerald-300 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-slate-900 text-sm">
                                    {team.name}
                                  </h4>
                                  <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                                    {team.grade === '9'
                                      ? '9-р анги'
                                      : team.grade === '12'
                                      ? '12-р анги'
                                      : team.grade === 'teacher'
                                      ? 'Багш'
                                      : 'Багийн'}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  {team.school || team.aimag || 'Байршил тодорхойгүй'}
                                </span>
                              </div>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                  team.isCompetitionConfirmed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {team.isCompetitionConfirmed ? '✓ Уралдаанд батлагдсан' : 'Хүлээгдэж буй'}
                              </span>
                            </div>

                            <div className="pt-2 space-y-1.5 text-xs text-slate-700">
                              <div>
                                <span className="text-slate-400 text-[11px]">Багийн ахлагч:</span>{' '}
                                <strong className="text-slate-900 font-bold">{team.leaderName}</strong>
                              </div>

                              <div>
                                <span className="text-slate-400 text-[11px]">
                                  Гишүүд ({team.memberNames?.length || 0}):
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {team.memberNames && team.memberNames.length > 0 ? (
                                    team.memberNames.map((mName, i) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-800 font-medium"
                                      >
                                        {mName}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-slate-400 italic">
                                      Гишүүд сонгоогүй (зөвхөн ахлагч)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                updateTeam(team.id, {
                                  isCompetitionConfirmed: !team.isCompetitionConfirmed,
                                });
                                showToastMessage(
                                  `"${team.name}" багийн уралдаанд оролцох эрхийг ${
                                    !team.isCompetitionConfirmed ? 'баталгаажууллаа' : 'цуцаллаа'
                                  }.`
                                );
                              }}
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold border cursor-pointer ${
                                team.isCompetitionConfirmed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                {team.isCompetitionConfirmed ? 'Эрх цуцлах' : 'Уралдаанд батлах'}
                              </span>
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTeamId(team.id);
                                  setTeamNameInput(team.name);
                                  setTeamGradeInput(team.grade);
                                  setTeamLeaderId(team.leaderUserId);
                                  setTeamMemberIds(team.memberUserIds || []);
                                }}
                                className="rounded-lg bg-slate-100 hover:bg-slate-200 p-1.5 text-slate-700 transition-colors cursor-pointer"
                                title="Засах"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteTeam(team.id);
                                  showToastMessage(`"${team.name}" багийг устгалаа.`);
                                }}
                                className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 transition-colors cursor-pointer"
                                title="Устгах"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Donations & Appreciation Certificates */}
      {activeTab === 'donations' && (
        <div className="space-y-4">
          {/* Хандивлагчид өгөх батламжийн загвар: хандив баталгаажуулахаас өмнө ч харж, засна */}
          <DonorCertificateStudio />

          {/* Top Banner & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">
                Нийт дэмжлэг, хандив
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-950 mt-1 font-mono">
                {donations
                  .filter((d) => d.status === 'approved')
                  .reduce((acc, d) => acc + (d.amount || 0), 0)
                  .toLocaleString()}{' '}
                ₮
              </div>
              <span className="text-[11px] text-rose-600 mt-0.5 block">
                Баталгаажсан нийт дүн
              </span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wide">
                Шалгаж буй хүсэлт
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1 font-mono">
                {donations.filter((d) => d.status === 'pending').length} хүсэлт
              </div>
              <span className="text-[11px] text-amber-600 mt-0.5 block">
                Админ баталгаажуулалт хүлээгдэж буй
              </span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">
                Олгосон талархлын батламж
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 font-mono">
                {donations.filter((d) => d.status === 'approved').length} батламж
              </div>
              <span className="text-[11px] text-emerald-600 mt-0.5 block">
                Албан ёсоор баталгаажсан
              </span>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Хандивлагчийн нэр, байгууллага, гүйлгээний утгаар хайх..."
                value={donationSearch}
                onChange={(e) => setDonationSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={donationStatusFilter}
                onChange={(e) => setDonationStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 focus:border-amber-500 focus:outline-none shadow-xs cursor-pointer"
              >
                <option value="all">Бүх төлөв ({donations.length})</option>
                <option value="pending">
                  Хүлээгдэж буй ({donations.filter((d) => d.status === 'pending').length})
                </option>
                <option value="approved">
                  Баталгаажсан ({donations.filter((d) => d.status === 'approved').length})
                </option>
                <option value="rejected">
                  Цуцлагдсан ({donations.filter((d) => d.status === 'rejected').length})
                </option>
              </select>
            </div>
          </div>

          {/* Donations Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-3 font-semibold">Огноо</th>
                  <th className="px-3 py-3 font-semibold">Хандивлагч / Байгууллага</th>
                  <th className="px-3 py-3 font-semibold">Холбоо барих</th>
                  <th className="px-3 py-3 font-semibold">Хандивын дүн</th>
                  <th className="px-3 py-3 font-semibold">Гүйлгээний утга / Тэмдэглэл</th>
                  <th className="px-3 py-3 font-semibold">Төлөв</th>
                  <th className="px-3 py-3 font-semibold">Батламж №</th>
                  <th className="px-3 py-3 font-semibold text-right">Админ үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations
                  .filter((d) => {
                    if (donationStatusFilter !== 'all' && d.status !== donationStatusFilter)
                      return false;
                    if (donationSearch.trim()) {
                      const q = donationSearch.toLowerCase();
                      return (
                        d.donorName.toLowerCase().includes(q) ||
                        (d.donorOrg || '').toLowerCase().includes(q) ||
                        (d.donorPhone || '').includes(q) ||
                        (d.transactionRef || '').toLowerCase().includes(q) ||
                        (d.certificateNumber || '').toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((donation) => {
                    const isPending = donation.status === 'pending';
                    const isApproved = donation.status === 'approved';

                    return (
                      <tr key={donation.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(donation.submittedAt).toLocaleDateString('mn-MN')}
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          <div className="font-bold">{donation.donorName}</div>
                          {donation.donorOrg && (
                            <span className="text-[11px] text-slate-400 block">
                              {donation.donorOrg}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-700 whitespace-nowrap">
                          <div>{donation.donorPhone || '-'}</div>
                          {donation.donorEmail && (
                            <span className="text-[10px] text-slate-400 block">
                              {donation.donorEmail}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-bold text-rose-700 font-mono whitespace-nowrap text-sm">
                          {(donation.amount || 0).toLocaleString()} ₮
                        </td>
                        <td className="px-3 py-3 text-slate-700 max-w-xs">
                          {donation.transactionRef && (
                            <div className="font-mono text-[11px] font-semibold text-slate-900">
                              Утга: {donation.transactionRef}
                            </div>
                          )}
                          {donation.wishesNote && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 italic">
                              "{donation.wishesNote}"
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Баталгаажсан ✓
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold">
                              <Clock className="h-3 w-3 text-amber-600" />
                              Хүлээгдэж буй
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-semibold">
                              <XCircle className="h-3 w-3 text-rose-600" />
                              Цуцлагдсан
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-[11px] text-slate-700 whitespace-nowrap font-bold">
                          {donation.certificateNumber || '-'}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => {
                                  reviewDonation(donation.id, 'approved', 'Гүйлгээ шалгаж баталгаажуулав.');
                                  showToastMessage(
                                    `"${donation.donorName}"-ийн хандивыг баталгаажуулж, талархлын батламж олголоо.`
                                  );
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs cursor-pointer"
                                title="Баталгаажуулах & Талархлын батламж олгох"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Баталгаажуулах</span>
                              </button>
                            )}

                            {isApproved && (
                              <button
                                type="button"
                                onClick={() => setViewingDonationForCert(donation)}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                                title="Талархлын батламж харах"
                              >
                                <Award className="h-3 w-3" />
                                <span>Батламж харах</span>
                              </button>
                            )}

                            {donation.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => {
                                  reviewDonation(donation.id, 'rejected');
                                  showToastMessage(`"${donation.donorName}"-ийн хандивыг цуцаллаа.`);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 text-[11px] cursor-pointer"
                                title="Цуцлах"
                              >
                                <UserX className="h-3 w-3" />
                                <span>Цуцлах</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                deleteDonation(donation.id);
                                showToastMessage('Хандивын бичлэгийг устгалаа.');
                              }}
                              className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 p-1.5 transition-colors cursor-pointer"
                              title="Устгах"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeTab === 'attempts' && (
        <div className="space-y-4">
          {/* Certificate Template & Sponsors/Organizers Configuration Card */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 shadow-xs shrink-0">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Батламжийн загвар (A4 Landscape), Текст ба Ивээн тэтгэгч / Зохион байгуулагчийн удирдлага
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Батламж дээрх текстийг засах, хамтран зохион байгуулагч болон ивээн тэтгэгч байгууллагуудын нэрс, логог оруулах, засах, устгах ({certificateConfig.partners.length} байгууллага бүртгэлтэй)
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowCertTemplateEditor(!showCertTemplateEditor)}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>
                    {showCertTemplateEditor
                      ? 'Батламжийн тохиргоог хураах'
                      : 'Батламжийн текст, Ивээн тэтгэгч & Лого засах'}
                  </span>
                </button>
                {attempts[0] && (
                  <button
                    type="button"
                    onClick={() => setViewingCertificateAttemptId(attempts[0].id)}
                    className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 px-3 py-2 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-amber-700" />
                    <span>A4 Батламж урьдчилан харах</span>
                  </button>
                )}
              </div>
            </div>

            {showCertTemplateEditor && (
              <div className="rounded-xl border border-amber-200 bg-white p-4 space-y-5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    1. Батламж дээрх текстүүдийг засварлах (A4 Landscape хэмжээтэй хэвлэгдэнэ)
                  </span>
                  <button
                    type="button"
                    onClick={resetCertificateConfig}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Анхны утга сэргээх</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Дээд толгой гарчиг:
                    </label>
                    <input
                      type="text"
                      value={certificateConfig.topSubtitle}
                      onChange={(e) =>
                        updateCertificateConfig({ topSubtitle: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Үндсэн гарчиг (БАТЛАМЖ / ГЭРЧИЛГЭЭ):
                    </label>
                    <input
                      type="text"
                      value={certificateConfig.mainTitle}
                      onChange={(e) =>
                        updateCertificateConfig({ mainTitle: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Уралдааны нэр:
                    </label>
                    <input
                      type="text"
                      value={certificateConfig.competitionName}
                      onChange={(e) =>
                        updateCertificateConfig({ competitionName: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Оролцогчийн нэрийн өмнөх үг:
                    </label>
                    <input
                      type="text"
                      value={certificateConfig.recipientPrefix}
                      onChange={(e) =>
                        updateCertificateConfig({ recipientPrefix: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Тамга тэмдгийн бичиг ( | тэмдгээр мөр салгана ):
                    </label>
                    <input
                      type="text"
                      value={certificateConfig.stampLines}
                      onChange={(e) =>
                        updateCertificateConfig({ stampLines: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      Батламжийн үндсэн тайлбар текст:
                    </label>
                    <textarea
                      rows={2}
                      value={certificateConfig.bodyText}
                      onChange={(e) =>
                        updateCertificateConfig({ bodyText: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Partner / Sponsor Management */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      2. Ивээн тэтгэгч байгууллага болон Хамтран зохион байгуулагчдын нэрс, лого ({certificateConfig.partners.length})
                    </span>
                  </div>

                  <form
                    onSubmit={handleSavePartner}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Байгууллагын нэр: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerNameInput}
                        onChange={(e) => setPartnerNameInput(e.target.value)}
                        placeholder="Жишээ нь: БШУЯ / МУИС / Ивээн тэтгэгч ХХК"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Төрөл:
                      </label>
                      <select
                        value={partnerRoleInput}
                        onChange={(e) =>
                          setPartnerRoleInput(e.target.value as 'organizer' | 'sponsor')
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="organizer">Хамтран зохион байгуулагч</option>
                        <option value="sponsor">Ивээн тэтгэгч байгууллага</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Лого оруулах (Зураг файл эсвэл URL):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <label className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer">
                          <Upload className="h-3 w-3 text-sky-600" />
                          <span>Зураг сонгох</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePartnerLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={partnerLogoInput}
                          onChange={(e) => setPartnerLogoInput(e.target.value)}
                          placeholder="Лого URL..."
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-1">
                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      >
                        {editingPartnerId ? (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            <span>Хадгалах</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            <span>Нэмэх</span>
                          </>
                        )}
                      </button>
                      {editingPartnerId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPartnerId(null);
                            setPartnerNameInput('');
                            setPartnerLogoInput('');
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </form>

                  {/* List of added Organizers & Sponsors */}
                  {certificateConfig.partners.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Одоогоор хамтран зохион байгуулагч эсвэл ивээн тэтгэгч байгууллага бүртгэгдээгүй байна.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {certificateConfig.partners.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.logoUrl ? (
                              <img
                                src={p.logoUrl}
                                alt={p.name}
                                className="h-8 w-8 object-contain rounded-md border border-slate-100 bg-slate-50 p-0.5 shrink-0"
                              />
                            ) : (
                              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                                <Building2 className="h-4 w-4" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate">
                                {p.name}
                              </div>
                              <span
                                className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                                  p.role === 'organizer'
                                    ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {p.role === 'organizer'
                                  ? 'Хамтран зохион байгуулагч'
                                  : 'Ивээн тэтгэгч'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPartnerId(p.id);
                                setPartnerNameInput(p.name);
                                setPartnerRoleInput(p.role);
                                setPartnerLogoInput(p.logoUrl || '');
                              }}
                              className="rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 p-1.5 text-sky-700 transition-colors cursor-pointer"
                              title="Засах"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCertPartner(p.id)}
                              className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 p-1.5 text-rose-700 transition-colors cursor-pointer"
                              title="Устгах"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Attempts Filter & Archive Management Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setAttemptArchiveFilter('active');
                  setSelectedAttemptIds([]);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  attemptArchiveFilter === 'active'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Идэвхтэй дүн ({activeAttemptsCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttemptArchiveFilter('archived');
                  setSelectedAttemptIds([]);
                }}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  attemptArchiveFilter === 'archived'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Архивласан дүн ({archivedAttemptsCount})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAttemptArchiveFilter('all');
                  setSelectedAttemptIds([]);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  attemptArchiveFilter === 'all'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Бүгд ({attempts.length})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={attemptSearch}
                onChange={(e) => setAttemptSearch(e.target.value)}
                placeholder="Оролцогч, сургууль, батламжаар хайх..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bulk Action Bar for Attempts */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    filteredAttempts.length > 0 &&
                    filteredAttempts.every((a) => selectedAttemptIds.includes(a.id))
                  }
                  onChange={() => {
                    const allIds = filteredAttempts.map((a) => a.id);
                    const allSelected =
                      allIds.length > 0 && allIds.every((id) => selectedAttemptIds.includes(id));
                    if (allSelected) {
                      setSelectedAttemptIds((prev) => prev.filter((id) => !allIds.includes(id)));
                    } else {
                      setSelectedAttemptIds((prev) => Array.from(new Set([...prev, ...allIds])));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>Харагдаж буй бүх дүнг сонгох ({filteredAttempts.length})</span>
              </label>
              {selectedAttemptIds.length > 0 && (
                <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                  Сонгосон: {selectedAttemptIds.length} дүн
                </span>
              )}
            </div>

            {selectedAttemptIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const count = selectedAttemptIds.length;
                    batchArchiveAttempts(selectedAttemptIds, true);
                    setSelectedAttemptIds([]);
                    showToastMessage(`Сонгосон ${count} уралдааны дүнг архивлалаа.`);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span>Архивлах ({selectedAttemptIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const count = selectedAttemptIds.length;
                    batchArchiveAttempts(selectedAttemptIds, false);
                    setSelectedAttemptIds([]);
                    showToastMessage(`Сонгосон ${count} уралдааны дүнг архиваас сэргээлээ.`);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer"
                >
                  <ArchiveRestore className="h-3.5 w-3.5" />
                  <span>Архиваас сэргээх</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const count = selectedAttemptIds.length;
                    batchDeleteAttempts(selectedAttemptIds);
                    setSelectedAttemptIds([]);
                    showToastMessage(`Сонгосон ${count} уралдааны дүнг бүрмөсөн устгалаа.`);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Дүнг устгах ({selectedAttemptIds.length})</span>
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-10 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredAttempts.length > 0 &&
                        filteredAttempts.every((a) => selectedAttemptIds.includes(a.id))
                      }
                      onChange={() => {
                        const allIds = filteredAttempts.map((a) => a.id);
                        const allSelected =
                          allIds.length > 0 && allIds.every((id) => selectedAttemptIds.includes(id));
                        if (allSelected) {
                          setSelectedAttemptIds((prev) => prev.filter((id) => !allIds.includes(id)));
                        } else {
                          setSelectedAttemptIds((prev) => Array.from(new Set([...prev, ...allIds])));
                        }
                      }}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-3 font-semibold">Оролцогч</th>
                  <th className="px-3 py-3 font-semibold">Ангилал</th>
                  <th className="px-3 py-3 font-semibold">Сургууль</th>
                  <th className="px-3 py-3 font-semibold">Нийт оноо</th>
                  <th className="px-3 py-3 font-semibold">Төлөв</th>
                  <th className="px-3 py-3 font-semibold">Батламж №</th>
                  <th className="px-3 py-3 font-semibold text-right">Үйлдэл</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Шүүлтүүрт тохирох уралдааны дүн байхгүй байна.
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((att) => {
                    const isChecked = selectedAttemptIds.includes(att.id);
                    return (
                      <tr
                        key={att.id}
                        className={`transition-colors ${
                          isChecked ? 'bg-amber-50/50' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedAttemptIds((prev) =>
                                prev.includes(att.id)
                                  ? prev.filter((id) => id !== att.id)
                                  : [...prev, att.id]
                              )
                            }
                            className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          <div>{att.studentName}</div>
                          {att.grade === 'team' && att.teamMembers && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              Гишүүд: {att.teamMembers}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              att.grade === '9'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : att.grade === '12'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : att.grade === 'teacher'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {att.grade === '9'
                              ? '9-р анги'
                              : att.grade === '12'
                              ? '12-р анги'
                              : att.grade === 'teacher'
                              ? 'Багш'
                              : 'Баг'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-700">{att.school}</td>
                        <td className="px-3 py-3 font-mono font-bold text-amber-700">
                          {att.totalScore} / {att.maxScore} ({att.percentage}%)
                          <IntegrityBadge report={att.integrity} />
                        </td>
                        <td className="px-3 py-3">
                          {att.isArchived ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-700 px-2 py-0.5 text-[10px] font-bold">
                              <Archive className="h-3 w-3" />
                              Архивласан
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                              Идэвхтэй
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">
                          {att.certificateNumber}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingCertificateAttemptId(att.id)}
                              className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                            >
                              <FileCheck className="h-3 w-3 text-amber-600" />
                              <span>Батламж</span>
                            </button>

                            <button
                              onClick={() => {
                                archiveAttempt(att.id, !att.isArchived);
                                showToastMessage(
                                  att.isArchived
                                    ? 'Дүнг архиваас сэргээлээ.'
                                    : 'Дүнг архивлалаа.'
                                );
                              }}
                              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                              title={att.isArchived ? 'Архиваас сэргээх' : 'Архивлах'}
                            >
                              {att.isArchived ? (
                                <>
                                  <ArchiveRestore className="h-3 w-3 text-sky-600" />
                                  <span>Сэргээх</span>
                                </>
                              ) : (
                                <>
                                  <Archive className="h-3 w-3 text-slate-600" />
                                  <span>Архивлах</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                deleteAttempt(att.id);
                                setSelectedAttemptIds((prev) => prev.filter((id) => id !== att.id));
                                showToastMessage('Уралдааны дүнг устгалаа.');
                              }}
                              className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 p-1.5 text-rose-700 transition-colors cursor-pointer"
                              title="Устгах"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Clean Question Bank, Auto GIS Generator, Manual Task Entry & Bulk/Selective Deletion */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {/* Student Question Error Reports Management Card */}
          <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/40 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/70 pb-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold shadow-xs shrink-0">
                  <Flag className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      Сурагчдаас ирсэн сорил, даалгаврын алдаа мэдээлэх хүсэлтүүд
                    </h3>
                    <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-bold text-rose-900">
                      Хүлээгдэж буй: {questionReports.filter((r) => r.status === 'pending').length} · Нийт: {questionReports.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    «Сорил» цэсэнд даалгавар ажиллаж буй бүртгэлтэй сурагчдаас илгээсэн алдааны мэдээллийг шалгаж, нэг товчоор зөв хариултаар нь шууд засах хэсэг.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {(['all', 'pending', 'resolved', 'dismissed'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setReportFilterStatus(st)}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition-colors cursor-pointer ${
                      reportFilterStatus === st
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'all'
                      ? `Бүгд (${questionReports.length})`
                      : st === 'pending'
                      ? `Шинэ (${questionReports.filter((r) => r.status === 'pending').length})`
                      : st === 'resolved'
                      ? `Засагдсан (${questionReports.filter((r) => r.status === 'resolved').length})`
                      : `Татгалзсан (${questionReports.filter((r) => r.status === 'dismissed').length})`}
                  </button>
                ))}
              </div>
            </div>

            {questionReports.filter((r) =>
              reportFilterStatus === 'all' ? true : r.status === reportFilterStatus
            ).length === 0 ? (
              <div className="rounded-xl border border-dashed border-rose-200 bg-white p-6 text-center text-xs text-slate-500">
                Одоогоор сурагчдаас ирсэн даалгавар засуулах хүсэлт байхгүй байна.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {questionReports
                  .filter((r) =>
                    reportFilterStatus === 'all' ? true : r.status === reportFilterStatus
                  )
                  .map((rep) => {
                    const fixValue =
                      editingReportFix[rep.id] !== undefined
                        ? editingReportFix[rep.id]
                        : rep.suggestedCorrectAnswer;
                    const issueLabel =
                      rep.issueType === 'wrong_answer'
                        ? 'Зөв хариулт зөрүүтэй'
                        : rep.issueType === 'wrong_name'
                        ? 'Нэр / Урт / Талбай буруу'
                        : rep.issueType === 'wrong_shape'
                        ? 'Зургийн контур / байршил зөрүүтэй'
                        : rep.issueType === 'typo_or_options'
                        ? 'Найруулга / Сонголтын алдаа'
                        : 'Бусад';

                    return (
                      <div
                        key={rep.id}
                        className={`rounded-xl border p-3.5 text-xs space-y-2.5 bg-white shadow-2xs ${
                          rep.status === 'pending'
                            ? 'border-rose-300'
                            : rep.status === 'resolved'
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-slate-200 opacity-75'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                                rep.status === 'pending'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : rep.status === 'resolved'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-300'
                              }`}
                            >
                              {rep.status === 'pending'
                                ? '⏳ Шалгаж буй'
                                : rep.status === 'resolved'
                                ? '✓ Засагдсан'
                                : '✕ Татгалзсан'}
                            </span>
                            <span className="rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              {issueLabel}
                            </span>
                            {rep.layerName && (
                              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                Давхарга: {rep.layerName}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500">
                              Илгээсэн: <b className="text-slate-900">{rep.reporterName}</b>
                              {rep.reporterSchool ? ` (${rep.reporterSchool})` : ''}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(rep.createdAt).toLocaleString('mn-MN')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                          <div className="lg:col-span-7 space-y-1">
                            <div className="font-bold text-slate-900">{rep.questionTitle}</div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px]">
                              <span className="text-slate-500">
                                Одоогийн хариу:{' '}
                                <b className="text-rose-700 line-through">{rep.currentTargetName}</b>
                              </span>
                              <span className="text-slate-500">
                                Сурагчийн санал болгосон зөв хариу:{' '}
                                <b className="text-emerald-700">{rep.suggestedCorrectAnswer}</b>
                              </span>
                            </div>
                            {rep.description && (
                              <p className="text-[11px] text-slate-600 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                Тайлбар: "{rep.description}"
                              </p>
                            )}
                          </div>

                          <div className="lg:col-span-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                            {rep.status === 'pending' && (
                              <>
                                <input
                                  type="text"
                                  value={fixValue}
                                  onChange={(e) =>
                                    setEditingReportFix((prev) => ({
                                      ...prev,
                                      [rep.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Шинэ зөв хариу..."
                                  className="flex-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    resolveQuestionReport(rep.id, {
                                      status: 'resolved',
                                      adminNote: 'Сурагчийн хүсэлтээр зөв хариултыг шинэчлэв.',
                                      applyQuestionUpdates: {
                                        questionId: rep.questionId,
                                        newTargetName: fixValue,
                                      },
                                    });
                                    showToastMessage(
                                      `Даалгаврын зөв хариултыг "${fixValue}" болгон засаж хадгаллаа!`
                                    );
                                  }}
                                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[11px] font-bold shadow-2xs cursor-pointer shrink-0"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Зөв хариугаар засах</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    resolveQuestionReport(rep.id, {
                                      status: 'dismissed',
                                      adminNote: 'Одоогийн даалгавар зөв байна.',
                                    });
                                    showToastMessage('Хүсэлтийг татгалзсан төлөвт шилжүүллээ.');
                                  }}
                                  className="rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer shrink-0"
                                >
                                  Татгалзах
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                deleteQuestionReport(rep.id);
                                showToastMessage('Мэдээллийг устгалаа.');
                              }}
                              className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 p-1.5 text-rose-700 cursor-pointer self-end sm:self-auto"
                              title="Хүсэлтийг устгах"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Unified Vector / SHP Task Builder (Single & Batch Selection by Layer) */}
          <GisContourQuestionGenerator />

          {/* Manual Question Creation Card */}
          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold">
                  <Plus className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Шинэ даалгавар гараас оруулах
                  </h3>
                  <p className="text-xs text-slate-500">
                    Уралдаан болон Сорилын асуултын санд гараас шинэ даалгавар үүсгэж нэмэх (Вектор/SHP контурын даалгаврыг «Даалгавар Бэлтгэгч» цэснээс оруулж болно)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowManualQuestionForm(!showManualQuestionForm)}
                className="rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 text-xs font-bold text-amber-900 transition-colors cursor-pointer self-start sm:self-auto"
              >
                {showManualQuestionForm ? 'Маягтыг хураах' : '+ Даалгавар гараас нэмэх'}
              </button>
            </div>

            {showManualQuestionForm && (
              <form onSubmit={handleManualQuestionSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <label className="block font-bold text-slate-700 mb-1">
                      Даалгаврын асуулт / Гарчиг *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualQTitle}
                      onChange={(e) => setManualQTitle(e.target.value)}
                      placeholder="Жишээ нь: Монгол орны хамгийн гүн нуурыг нэрлэнэ үү?"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      Төрөл (Ангилал)
                    </label>
                    <select
                      value={manualQCategory}
                      onChange={(e) => setManualQCategory(e.target.value as QuestionCategory)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
                    >
                      <option value="mongolia">Монголын газарзүй</option>
                      <option value="world">Дэлхийн газарзүй</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">
                      Оноо
                    </label>
                    <select
                      value={manualQPoints}
                      onChange={(e) => setManualQPoints(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
                    >
                      <option value={10}>10 оноо</option>
                      <option value={15}>15 оноо</option>
                      <option value={20}>20 оноо</option>
                    </select>
                  </div>
                </div>

                {/* 4 Options Input with Radio for Correct Option */}
                <div className="space-y-2">
                  <label className="block font-bold text-slate-700">
                    Хариултын 4 хувилбар (Зөв хариултын урд талын дугуйг чагтална уу) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {manualQOptions.map((opt, idx) => {
                      const isCorrect = manualQCorrectIdx === idx;
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 rounded-xl border p-2 ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50/40'
                              : 'border-slate-200 bg-slate-50/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="manualCorrectOption"
                            checked={isCorrect}
                            onChange={() => setManualQCorrectIdx(idx)}
                            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            title="Зөв хариултаар сонгох"
                          />
                          <span className="font-mono font-bold text-slate-600">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => {
                              const next = [...manualQOptions];
                              next[idx] = e.target.value;
                              setManualQOptions(next);
                            }}
                            placeholder={`Хувилбар ${String.fromCharCode(65 + idx)}...`}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                          />
                          {isCorrect && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shrink-0">
                              Зөв
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="block font-bold text-slate-700 mb-1">
                      Тайлбар / Бодолт (Заавал биш)
                    </label>
                    <input
                      type="text"
                      value={manualQExplanation}
                      onChange={(e) => setManualQExplanation(e.target.value)}
                      placeholder="Хариултын дэлгэрэнгүй тайлбар..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Оролцох ангиллууд:
                    </label>
                    <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                      {(['9', '12', 'teacher', 'team'] as GradeLevel[]).map((g) => (
                        <label key={g} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={manualQGrades.includes(g)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setManualQGrades((prev) => [...prev, g]);
                              } else {
                                setManualQGrades((prev) => prev.filter((item) => item !== g));
                              }
                            }}
                            className="h-3.5 w-3.5 rounded text-amber-600"
                          />
                          <span className="font-semibold text-slate-700">
                            {g === '9' ? '9-р' : g === '12' ? '12-р' : g === 'teacher' ? 'Багш' : 'Баг'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 font-bold text-xs shadow-sm transition-colors cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Даалгавар санд нэмэх</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Question Bank Header, Search / Filter & Bulk Delete Toolbar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">
                  Нийт даалгаврын сан: <span className="text-amber-700 font-mono">{filteredQuestions.length}</span> даалгавар
                </span>
                {customQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const total = customQuestions.length;
                      clearAllCustomQuestions();
                      setSelectedBankQuestionIds([]);
                      showToastMessage(`Даалгаврын сангийн бүх ${total} даалгаврыг цэвэрлэлээ.`);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Бүх даалгаврыг цэвэрлэх ({customQuestions.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Category Filter */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => { setQCatFilter('all'); setQPage(1); }}
                    className={`rounded-md px-2.5 py-1 cursor-pointer ${qCatFilter === 'all' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Бүгд
                  </button>
                  <button
                    onClick={() => { setQCatFilter('mongolia'); setQPage(1); }}
                    className={`rounded-md px-2.5 py-1 cursor-pointer ${qCatFilter === 'mongolia' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Монгол
                  </button>
                  <button
                    onClick={() => { setQCatFilter('world'); setQPage(1); }}
                    className={`rounded-md px-2.5 py-1 cursor-pointer ${qCatFilter === 'world' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Дэлхий
                  </button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Асуултаас хайх..."
                    value={qSearch}
                    onChange={(e) => { setQSearch(e.target.value); setQPage(1); }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:outline-none w-48 shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Selection & Deletion Bar for Question Bank */}
            {filteredQuestions.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={
                        filteredQuestions.length > 0 &&
                        filteredQuestions.every((q) => selectedBankQuestionIds.includes(q.id))
                      }
                      onChange={() => {
                        const allIds = filteredQuestions.map((q) => q.id);
                        const allSelected =
                          allIds.length > 0 &&
                          allIds.every((id) => selectedBankQuestionIds.includes(id));
                        if (allSelected) {
                          setSelectedBankQuestionIds((prev) =>
                            prev.filter((id) => !allIds.includes(id))
                          );
                        } else {
                          setSelectedBankQuestionIds((prev) =>
                            Array.from(new Set([...prev, ...allIds]))
                          );
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Шүүгдсэн бүх даалгаврыг сонгох ({filteredQuestions.length})</span>
                  </label>

                  {selectedBankQuestionIds.length > 0 && (
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                      Сонгосон: {selectedBankQuestionIds.length} даалгавар
                    </span>
                  )}
                </div>

                {selectedBankQuestionIds.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBankQuestionIds([])}
                      className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer"
                    >
                      Сонголт цуцлах
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const count = selectedBankQuestionIds.length;
                        batchDeleteCustomQuestions(selectedBankQuestionIds);
                        setSelectedBankQuestionIds([]);
                        showToastMessage(`Сонгосон ${count} даалгаврыг олноор нь устгалаа.`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Сонгосон {selectedBankQuestionIds.length} даалгаврыг устгах</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {filteredQuestions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2 text-xs text-slate-500">
                <p className="font-bold text-slate-800 text-sm">
                  Шалгалтын асуултын сан хоосон байна.
                </p>
                <p>
                  Дээрх «Шинэ даалгавар гараас оруулах» маягтаар эсвэл «🎯 Вектор/SHP-аас Даалгавар Бэлтгэгч» цэснээс даалгавруудыг оруулна уу.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paginatedQuestions.map((q, idx) => {
                  const isChecked = selectedBankQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() =>
                        setSelectedBankQuestionIds((prev) =>
                          prev.includes(q.id)
                            ? prev.filter((id) => id !== q.id)
                            : [...prev, q.id]
                        )
                      }
                      className={`rounded-xl border p-4 text-xs space-y-2 transition-colors shadow-xs cursor-pointer ${
                        isChecked
                          ? 'border-amber-500 bg-amber-50/40'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBankQuestionIds((prev) =>
                                prev.includes(q.id)
                                  ? prev.filter((id) => id !== q.id)
                                  : [...prev, q.id]
                              );
                            }}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-[10px] font-bold ${
                              q.category === 'mongolia'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-sky-50 text-sky-800 border border-sky-200'
                            }`}
                          >
                            {q.category === 'mongolia' ? 'Монголын газарзүй' : 'Дэлхийн газарзүй'}
                          </span>
                          {q.shpContourData?.layerName && (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 truncate max-w-[160px]">
                              {q.shpContourData.layerName}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-[10px]">
                            Анги: {q.gradeLevels.join(', ')} · {q.points} оноо
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomQuestion(q.id);
                              setSelectedBankQuestionIds((prev) =>
                                prev.filter((id) => id !== q.id)
                              );
                              showToastMessage(`"${q.targetName}" даалгаврыг устгалаа.`);
                            }}
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 p-1 text-rose-700 transition-colors cursor-pointer"
                            title="Даалгаврыг устгах"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-900 text-sm">
                        {(qPage - 1) * itemsPerPage + idx + 1}. {q.title}
                      </h4>
                      <p className="text-slate-600 text-[11px]">
                        Зөв хариу: <span className="font-bold text-emerald-700">{q.targetName}</span>
                      </p>
                      {q.options && q.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <span
                              key={opt.id || oIdx}
                              className={`rounded-md px-2 py-0.5 text-[10px] border ${
                                opt.isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt.text}
                            </span>
                          ))}
                        </div>
                      )}
                      {q.explanation && (
                        <p className="text-slate-600 text-[11px] italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                <span className="text-slate-500">
                  Хуудас <span className="text-slate-800 font-bold">{qPage}</span> / {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={qPage <= 1}
                    onClick={() => setQPage((p) => Math.max(1, p - 1))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-xs cursor-pointer"
                  >
                    ← Өмнөх
                  </button>
                  <button
                    disabled={qPage >= totalPages}
                    onClick={() => setQPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50 shadow-xs cursor-pointer"
                  >
                    Дараах →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GIS & Shapefile Repository Management */}
      {activeTab === 'gis_layers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-lg shadow-xs">
                📁
              </span>
              <div>
                <b className="text-sm font-bold text-slate-900">Админ: Вектор ба Shapefile (.shp.zip) сангийн удирдлага</b>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Энд оруулсан, нэрийг нь өөрчилсөн, зассан эсвэл хассан бүх вектор давхаргууд нийт хэрэглэгчдэд "Газрын зураг" цэсний "Вектор зураг" хэсэгт автоматаар шууд харагдана.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="rounded-lg bg-white border border-emerald-300 px-3 py-1 font-mono text-[11px] font-bold text-emerald-800 shadow-2xs">
                Нийт {gisLayers.length} давхарга
              </span>
            </div>
          </div>

          <CustomMapStudio />
        </div>
      )}



      {/* TAB 6: Map Usage & Quiz Task Performance Analytics */}
      {activeTab === 'analytics' &&
        (() => {
          // Sort layers by total activity (mapViews + quizAttempts) descending
          const sortedLayers = [...layerUsageStats].sort(
            (a, b) => b.mapViews + b.quizAttempts - (a.mapViews + a.quizAttempts)
          );
          const maxLayerActivity = Math.max(
            1,
            ...sortedLayers.map((l) => l.mapViews + l.quizAttempts)
          );

          // Filter task performance by selected layer
          const filteredTasks = taskPerformanceStats
            .filter(
              (t) =>
                analyticsLayerFilter === 'all' ||
                t.layerName.toLowerCase() === analyticsLayerFilter.toLowerCase()
            )
            .map((t) => {
              const total = Math.max(1, t.attempts);
              const accuracy = Math.round((t.correct / total) * 100);
              return { ...t, accuracy };
            });

          // Best performing tasks (highest accuracy, then most correct)
          const bestTasks = [...filteredTasks]
            .filter((t) => t.accuracy >= 60)
            .sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct);

          // Worst performing tasks (lowest accuracy, then most wrong)
          const worstTasks = [...filteredTasks]
            .filter((t) => t.accuracy < 65 || t.wrong > 0)
            .sort((a, b) => a.accuracy - b.accuracy || b.wrong - a.wrong);

          const uniqueTaskLayers = Array.from(
            new Set(taskPerformanceStats.map((t) => t.layerName))
          );

          return (
            <div className="space-y-6">
              {/* Section 1: Most Active Map Layers */}
              <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <Layers className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">
                        Хэрэглэгчдийн хамгийн их ажиллаж байгаа Газрын зураг / Давхаргууд
                      </h3>
                      <p className="text-xs text-slate-500">
                        Газрын зураг цэс дээрх үзэлт болон Сорил / Уралдаан дээрх даалгавар гүйцэтгэлийн нийлбэр идэвхээр эрэмбэлэв.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-800 self-start sm:self-auto">
                    Нийт {sortedLayers.length} давхарга
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-bold">#</th>
                        <th className="px-4 py-3 font-bold">Газрын зураг / Вектор давхаргын нэр</th>
                        <th className="px-4 py-3 font-bold">Төрөл</th>
                        <th className="px-4 py-3 font-bold">Газрын зураг үзэлт</th>
                        <th className="px-4 py-3 font-bold">Сорил & Уралдаан оролдлого</th>
                        <th className="px-4 py-3 font-bold">Дундаж амжилт (%)</th>
                        <th className="px-4 py-3 font-bold w-48">Идэвхийн түвшин</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedLayers.map((stat, idx) => {
                        const totalAct = stat.mapViews + stat.quizAttempts;
                        const pctBar = Math.min(100, Math.round((totalAct / maxLayerActivity) * 100));
                        const quizAcc =
                          stat.quizAttempts > 0
                            ? Math.round((stat.correctCount / stat.quizAttempts) * 100)
                            : 0;
                        const matchedLayer = gisLayers.find(
                          (l) => l.id === stat.layerId || l.name === stat.layerName
                        );

                        return (
                          <tr key={stat.layerId + idx} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 font-mono font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: matchedLayer?.color || '#4f46e5' }}
                                />
                                <span className="font-bold text-slate-900">{stat.layerName}</span>
                                {idx === 0 && (
                                  <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.2 text-[10px] font-bold text-amber-900">
                                    🔥 Хамгийн эрэлттэй
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                                {stat.geometryType}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-sky-700">
                              {stat.mapViews} удаа
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                              {stat.quizAttempts} удаа{' '}
                              <span className="text-[10px] font-normal text-slate-500">
                                ({stat.correctCount} зөв / {stat.wrongCount} буруу)
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                                  quizAcc >= 75
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : quizAcc >= 50
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                                }`}
                              >
                                {quizAcc}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-indigo-600"
                                    style={{ width: `${pctBar}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] font-bold text-slate-700 w-9 text-right">
                                  {totalAct}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Best vs Worst Performing Quiz Tasks */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      Сорил болон Уралдаан дээр хамгийн САЙН ба МУУ гүйцэтгэж байгаа даалгаврууд
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Оролцогчдын зөв болон буруу хариулсан статистикт үндэслэн хамгийн өндөр болон хамгийн бага гүйцэтгэлтэй обьектуудыг давхарга тус бүрээр харуулж байна.
                    </p>
                  </div>

                  {/* Layer filter for task analytics */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-600 whitespace-nowrap">Давхаргаар шүүх:</span>
                    <select
                      value={analyticsLayerFilter}
                      onChange={(e) => setAnalyticsLayerFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="all">Бүх давхарга ({taskPerformanceStats.length})</option>
                      {uniqueTaskLayers.map((lName) => (
                        <option key={lName} value={lName}>
                          {lName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left: Best Performing Tasks */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                          <TrendingUp className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">
                            Хамгийн сайн гүйцэтгэж байгаа даалгавар
                          </h4>
                          <p className="text-[11px] text-emerald-700">
                            Сурагчид хамгийн өндөр хувьтай зөв тааж буй обьектууд
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-900">
                        {bestTasks.length} даалгавар
                      </span>
                    </div>

                    <div className="space-y-2">
                      {bestTasks.slice(0, 6).map((task, idx) => (
                        <div
                          key={task.taskId + idx}
                          className="rounded-xl border border-emerald-200 bg-white p-3 shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 font-mono text-[11px] font-bold text-emerald-800">
                                {idx + 1}
                              </span>
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {task.objectName}
                              </span>
                            </div>
                            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white shrink-0">
                              {task.accuracy}% зөв
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="truncate max-w-[240px]">
                              Давхарга: <strong className="text-slate-700">{task.layerName}</strong>
                            </span>
                            <span className="font-mono text-emerald-800 font-semibold shrink-0">
                              ✓ {task.correct} зөв / ✕ {task.wrong} буруу (Нийт {task.attempts})
                            </span>
                          </div>

                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${task.accuracy}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Worst Performing Tasks */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white">
                          <TrendingDown className="h-4 w-4" />
                        </span>
                        <div>
                          <h4 className="font-bold text-rose-950 text-xs sm:text-sm">
                            Хамгийн муу гүйцэтгэж байгаа даалгавар (Анхаарах)
                          </h4>
                          <p className="text-[11px] text-rose-700">
                            Сурагчид хамгийн их алдаж, андуурч буй обьектууд
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 font-mono text-[11px] font-bold text-rose-900">
                        {worstTasks.length} даалгавар
                      </span>
                    </div>

                    <div className="space-y-2">
                      {worstTasks.slice(0, 6).map((task, idx) => {
                        const errorRate = 100 - task.accuracy;
                        return (
                          <div
                            key={task.taskId + idx}
                            className="rounded-xl border border-rose-200 bg-white p-3 shadow-2xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-rose-100 font-mono text-[11px] font-bold text-rose-800">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {task.objectName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="rounded-full bg-rose-100 border border-rose-300 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-800">
                                  Алдаа: {errorRate}%
                                </span>
                                <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                                  {task.accuracy}% зөв
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="truncate max-w-[240px]">
                                Давхарга: <strong className="text-slate-700">{task.layerName}</strong>
                              </span>
                              <span className="font-mono text-rose-700 font-semibold shrink-0">
                                ✕ {task.wrong} буруу / ✓ {task.correct} зөв (Нийт {task.attempts})
                              </span>
                            </div>

                            <div className="h-1.5 w-full rounded-full bg-rose-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-rose-500"
                                style={{ width: `${task.accuracy}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {activeTab === 'live' && <LiveCompetitionMonitor />}
      {viewingDonationForCert && (
        <DonationCertificateViewer
          record={{
            id: viewingDonationForCert.id,
            donorName: viewingDonationForCert.donorName,
            donorOrg: viewingDonationForCert.donorOrg,
            amountNote: viewingDonationForCert.amount ? `${viewingDonationForCert.amount.toLocaleString()} ₮` : undefined,
            wishesNote: viewingDonationForCert.wishesNote,
            certificateNumber: viewingDonationForCert.certificateNumber || 'DONOR-2026-CERT',
            issuedAt: viewingDonationForCert.reviewedAt || viewingDonationForCert.submittedAt,
          }}
          onClose={() => setViewingDonationForCert(null)}
        />
      )}
      {activeTab === 'edit_questions' && <QuestionBankEditor />}
      {activeTab === 'competition_tasks' && <CompetitionTaskPicker />}

      {/* User Profile Editor Modal for Admin */}
      <UserProfileModal
        isOpen={Boolean(editingTargetUser)}
        onClose={() => setEditingTargetUser(null)}
        targetUser={editingTargetUser}
      />
    </div>
  );
};
