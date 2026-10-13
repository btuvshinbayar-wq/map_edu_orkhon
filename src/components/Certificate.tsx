import React, { useState, useRef } from 'react';
import {
  Award,
  Printer,
  X,
  CheckCircle2,
  Users,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Save,
  RotateCcw,
  Building2,
} from 'lucide-react';
import { CompetitionAttempt, CertificatePartner } from '../types';
import { useApp } from '../context/AppContext';

interface CertificateProps {
  attempt: CompetitionAttempt;
  onClose?: () => void;
  inlinePreview?: boolean;
}

export const Certificate: React.FC<CertificateProps> = ({
  attempt,
  onClose,
  inlinePreview = false,
}) => {
  const {
    users,
    currentUser,
    certificateConfig,
    updateCertificateConfig,
    resetCertificateConfig,
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  const adminUser =
    users.find((u) => u.role === 'admin') ||
    (currentUser?.role === 'admin' ? currentUser : null);

  const adminName = adminUser?.fullName || 'Б. Түвшинбаяр';
  const adminPosition =
    adminUser?.position || adminUser?.notes || 'Газарзүйн багш, Шалгалтын комиссын дарга';
  const adminOrg =
    adminUser?.organization || adminUser?.school || 'Нийслэлийн 1-р сургууль';

  // Quick editor toggle when viewing modal as admin
  const [isEditingCert, setIsEditingCert] = useState(false);

  // Partner form state inside quick editor
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerRole, setNewPartnerRole] = useState<'organizer' | 'sponsor'>('organizer');
  const [newPartnerLogo, setNewPartnerLogo] = useState<string>('');
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewPartnerLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddOrUpdatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    if (editingPartnerId) {
      const updated = certificateConfig.partners.map((p) =>
        p.id === editingPartnerId
          ? {
              ...p,
              name: newPartnerName.trim(),
              role: newPartnerRole,
              logoUrl: newPartnerLogo.trim() || undefined,
            }
          : p
      );
      updateCertificateConfig({ partners: updated });
      setEditingPartnerId(null);
    } else {
      const created: CertificatePartner = {
        id: `partner_${Date.now()}`,
        name: newPartnerName.trim(),
        role: newPartnerRole,
        logoUrl: newPartnerLogo.trim() || undefined,
      };
      updateCertificateConfig({
        partners: [...certificateConfig.partners, created],
      });
    }

    setNewPartnerName('');
    setNewPartnerLogo('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartEditPartner = (partner: CertificatePartner) => {
    setEditingPartnerId(partner.id);
    setNewPartnerName(partner.name);
    setNewPartnerRole(partner.role);
    setNewPartnerLogo(partner.logoUrl || '');
  };

  const handleDeletePartner = (id: string) => {
    updateCertificateConfig({
      partners: certificateConfig.partners.filter((p) => p.id !== id),
    });
    if (editingPartnerId === id) {
      setEditingPartnerId(null);
      setNewPartnerName('');
      setNewPartnerLogo('');
    }
  };

  const categoryName =
    attempt.grade === '9'
      ? '9-р ангийн ангилал'
      : attempt.grade === '12'
      ? '12-р ангийн ангилал'
      : attempt.grade === 'teacher'
      ? 'Багшийн ангилал'
      : 'Багийн ангилал';

  const organizers = certificateConfig.partners.filter((p) => p.role === 'organizer');
  const sponsors = certificateConfig.partners.filter((p) => p.role === 'sponsor');
  const stampParts = (certificateConfig.stampLines || 'Шалгасан | ✓ БАТЛАВ | 2026')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);

  // The A4 Landscape Certificate Sheet (297mm : 210mm = 1.414 aspect ratio)
  const certificateSheet = (
    <div
      className="a4-landscape-certificate relative mx-auto w-full max-w-[1060px] aspect-[297/210] overflow-hidden rounded-xl border-4 border-double border-amber-600/80 bg-gradient-to-br from-amber-50/60 via-white to-amber-50/40 px-8 py-6 sm:px-12 sm:py-8 text-center shadow-lg flex flex-col justify-between select-none"
    >
      {/* Subtle ornate corners */}
      <div className="absolute top-2.5 left-3 text-amber-600/70 font-display text-xl">❖</div>
      <div className="absolute top-2.5 right-3 text-amber-600/70 font-display text-xl">❖</div>
      <div className="absolute bottom-2.5 left-3 text-amber-600/70 font-display text-xl">❖</div>
      <div className="absolute bottom-2.5 right-3 text-amber-600/70 font-display text-xl">❖</div>

      {/* TOP SECTION: Co-Organizers & Sponsors Header Bar + Main Title */}
      <div className="space-y-2">
        {/* Partner Logos & Names Row at Top */}
        {certificateConfig.partners.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 border-b border-amber-200/70 pb-2.5">
            {organizers.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Зохион байгуулагч:
                </span>
                {organizers.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center gap-1.5 rounded-lg bg-white/90 border border-amber-200/80 px-2.5 py-1 shadow-2xs"
                  >
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={org.name}
                        className="h-6 w-6 object-contain rounded-xs shrink-0"
                      />
                    ) : (
                      <Building2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    )}
                    <span className="text-[11px] font-bold text-slate-800">
                      {org.name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {sponsors.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Ивээн тэтгэгч:
                </span>
                {sponsors.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-50/90 border border-amber-300/80 px-2.5 py-1 shadow-2xs"
                  >
                    {sp.logoUrl ? (
                      <img
                        src={sp.logoUrl}
                        alt={sp.name}
                        className="h-6 w-6 object-contain rounded-xs shrink-0"
                      />
                    ) : (
                      <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    )}
                    <span className="text-[11px] font-bold text-amber-950">
                      {sp.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Titles */}
        <div className="pt-1 space-y-0.5">
          <p className="text-[11px] font-bold tracking-widest text-amber-800 uppercase">
            {certificateConfig.topSubtitle}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-widest text-amber-900">
            {certificateConfig.mainTitle}
          </h1>
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <p className="text-xs text-slate-700 font-semibold">
              {certificateConfig.competitionName}
            </p>
            <span className="text-amber-400">•</span>
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-300">
              {categoryName}
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: Recipient Name, Citation Text & Score Metrics */}
      <div className="my-auto space-y-3 py-2">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium">
            {certificateConfig.recipientPrefix}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {attempt.grade === 'team' && attempt.teamName
              ? attempt.teamName
              : attempt.studentName}
          </h2>

          {attempt.grade === 'team' && attempt.teamMembers && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 font-medium">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                Багийн гишүүд: <strong>{attempt.teamMembers}</strong>
              </span>
            </div>
          )}

          <p className="text-xs text-slate-600">
            <span className="font-bold text-amber-800">{attempt.school}</span>
            {' · '}
            <span className="font-medium">{attempt.aimag}</span>
          </p>
        </div>

        <p className="mx-auto max-w-2xl text-xs sm:text-[13px] text-slate-700 leading-relaxed font-medium px-4">
          {certificateConfig.bodyText}
        </p>

        {/* Score Highlights Compact Bar */}
        <div className="mx-auto max-w-xl grid grid-cols-3 gap-3 rounded-xl border border-amber-200 bg-white/95 px-4 py-2.5 text-center shadow-2xs">
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Нийт авсан оноо</p>
            <p className="text-lg font-black text-amber-800">
              {attempt.totalScore} / {attempt.maxScore}{' '}
              <span className="text-xs text-emerald-700 font-bold">
                ({attempt.percentage}%)
              </span>
            </p>
          </div>
          <div className="border-x border-amber-100">
            <p className="text-[10px] text-slate-500 font-medium">Монголын газарзүй</p>
            <p className="text-lg font-black text-sky-800">
              {attempt.mongoliaScore} / {attempt.mongoliaMaxScore}{' '}
              <span className="text-[10px] font-normal text-slate-500">
                ({attempt.mongoliaCount} даалгавар)
              </span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-medium">Дэлхийн газарзүй</p>
            <p className="text-lg font-black text-emerald-800">
              {attempt.worldScore} / {attempt.worldMaxScore}{' '}
              <span className="text-[10px] font-normal text-slate-500">
                ({attempt.worldCount} даалгавар)
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Signatures, Official Seal & Certificate Number */}
      <div className="flex items-end justify-between pt-3 border-t border-amber-200/90 text-left text-xs">
        <div className="max-w-xs">
          <p className="font-semibold text-slate-700 text-[11px]">{adminPosition}:</p>
          <p className="text-slate-900 font-bold text-sm mt-0.5">{adminName}</p>
          <p className="text-[11px] text-slate-600">{adminOrg}</p>
        </div>

        {/* Verification Stamp Visual */}
        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-amber-600 bg-amber-50/90 text-center text-amber-800 rotate-[-10deg] shadow-2xs">
            <div className="text-[8px] font-bold uppercase leading-tight">
              {stampParts.map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < stampParts.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-700 text-[11px]">Батламжийн дугаар:</p>
          <p className="font-mono text-amber-800 font-bold text-sm">
            {attempt.certificateNumber}
          </p>
          <div className="flex items-center justify-end gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
            <span>Огноо: {new Date(attempt.completedAt).toLocaleDateString('mn-MN')}</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-700 font-sans font-bold">
              <CheckCircle2 className="h-3 w-3" /> Баталгаажсан
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (inlinePreview) {
    return certificateSheet;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl text-slate-800 my-auto max-h-[95vh] overflow-y-auto">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-bold text-slate-900">
              Цахим батламж / Сертификат (A4 Landscape — 297×210 мм)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsEditingCert(!isEditingCert)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  isEditingCert
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>
                  {isEditingCert
                    ? 'Засварлагчийг хаах'
                    : 'Текст, Ивээн тэтгэгч & Лого засах'}
                </span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>A4 Landscape Хэвлэх / PDF хадгалах</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Inline Admin Editor inside Modal (Hidden in print) */}
        {isAdmin && isEditingCert && (
          <div className="no-print mb-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/70 pb-2.5">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-700" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Батламжийн текст, Хамтран зохион байгуулагч ба Ивээн тэтгэгчдийн удирдлага
                </h4>
              </div>
              <button
                type="button"
                onClick={resetCertificateConfig}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Анхны утга сэргээх</span>
              </button>
            </div>

            {/* 1. Certificate Text Fields */}
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Co-Organizers & Sponsors Manager */}
            <div className="border-t border-amber-200/80 pt-3 space-y-3">
              <h5 className="font-bold text-slate-900 text-xs">
                Хамтран зохион байгуулагч болон Ивээн тэтгэгч байгууллагууд ({certificateConfig.partners.length})
              </h5>

              <form
                onSubmit={handleAddOrUpdatePartner}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white p-3 rounded-xl border border-slate-200"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Байгууллагын нэр:
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartnerName}
                    onChange={(e) => setNewPartnerName(e.target.value)}
                    placeholder="Жишээ нь: МУБИС Газарзүйн тэнхим"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Оролцооны төрөл:
                  </label>
                  <select
                    value={newPartnerRole}
                    onChange={(e) =>
                      setNewPartnerRole(e.target.value as 'organizer' | 'sponsor')
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="organizer">Хамтран зохион байгуулагч</option>
                    <option value="sponsor">Ивээн тэтгэгч байгууллага</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Лого зураг оруулах (Файл эсвэл URL):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer"
                    >
                      <Upload className="h-3 w-3 text-sky-600" />
                      <span>Лого сонгох</span>
                    </button>
                    <input
                      type="text"
                      value={newPartnerLogo}
                      onChange={(e) => setNewPartnerLogo(e.target.value)}
                      placeholder="URL..."
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none"
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
                        <span>Шинэчлэх</span>
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
                        setNewPartnerName('');
                        setNewPartnerLogo('');
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </form>

              {/* Existing Partners List */}
              {certificateConfig.partners.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {certificateConfig.partners.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs"
                    >
                      {p.logoUrl ? (
                        <img
                          src={p.logoUrl}
                          alt={p.name}
                          className="h-6 w-6 object-contain rounded-xs"
                        />
                      ) : (
                        <Building2 className="h-4 w-4 text-slate-400" />
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {p.role === 'organizer'
                            ? 'Хамтран зохион байгуулагч'
                            : 'Ивээн тэтгэгч'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartEditPartner(p)}
                        className="ml-1 rounded p-1 text-sky-600 hover:bg-sky-50 cursor-pointer"
                        title="Засах"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePartner(p.id)}
                        className="rounded p-1 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Устгах"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render A4 Landscape Certificate */}
        {certificateSheet}
      </div>
    </div>
  );
};
