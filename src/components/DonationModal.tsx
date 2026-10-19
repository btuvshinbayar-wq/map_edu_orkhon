import { DonorCertificateSheet, type DonorCertificateRecord } from './DonorCertificateSheet';
import React, { useState } from 'react';
import {
  Heart,
  X,
  Copy,
  Check,
  Award,
  Printer,
  Sparkles,
  Building2,
  CheckCircle2,
  CreditCard,
  Gift,
  ArrowLeft,
  Clock,
  Search,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sound } from '../utils/audio';
import { DonationRecord } from '../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type { DonorCertificateRecord };

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, users, certificateConfig, donorCertificateConfig, donations, submitDonation, reviewDonation } = useApp();

  const [copiedField, setCopiedField] = useState<'account' | 'iban' | 'name' | null>(null);
  const [viewMode, setViewMode] = useState<'info' | 'certificate'>('info');

  // Donor submission form state
  const [donorName, setDonorName] = useState(currentUser?.fullName || '');
  const [donorOrg, setDonorOrg] = useState(
    currentUser?.organization || currentUser?.school || ''
  );
  const [donorPhone, setDonorPhone] = useState(currentUser?.phone || '');
  const [donorEmail, setDonorEmail] = useState(currentUser?.email || '');
  const [donationAmount, setDonationAmount] = useState<number>(1000);
  const [transactionRef, setTransactionRef] = useState('');
  const [wishesNote, setWishesNote] = useState(
    'Монгол хүүхэд, залуучуудын газарзүйн боловсрол, орон зайн сэтгэлгээг хөгжүүлэх үйлсэд амжилт хүсье!'
  );
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Search/Filter for certificates
  const [certSearchQuery, setCertSearchQuery] = useState(
    currentUser?.phone || currentUser?.email || ''
  );

  const [activeCertificate, setActiveCertificate] = useState<DonorCertificateRecord | null>(null);

  if (!isOpen) return null;

  const BANK_NAME = 'Хаан банк';
  const IBAN_PREFIX = 'MN60000500';
  const ACCOUNT_NUMBER = '5094238427';
  const ACCOUNT_HOLDER = 'Б.Түвшинбаяр';

  const adminUser =
    users.find((u) => u.role === 'admin') ||
    (currentUser?.role === 'admin' ? currentUser : null);

  const adminName = adminUser?.fullName || 'Б.Түвшинбаяр';
  const adminPosition =
    adminUser?.position || adminUser?.notes || 'Төслийн санаачлагч, Газарзүйн багш';
  const adminOrg =
    adminUser?.organization || adminUser?.school || 'Газрын зургийг хэн сайн мэдэх вэ? Интерактив платформ';

  const handleCopy = (text: string, field: 'account' | 'iban' | 'name') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    sound.playClick();
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = donorName.trim() || currentUser?.fullName || 'Эрхэм Хандивлагч';
    if (!donationAmount || donationAmount < 1000) {
      setSubmissionFeedback({
        type: 'error',
        text: 'Хандив өгөх доод хэмжээ 1,000 төгрөг байна.',
      });
      return;
    }
    if (!transactionRef.trim()) {
      setSubmissionFeedback({
        type: 'error',
        text: 'Гүйлгээний утга эсвэл шилжүүлгийн баримтын дугаарыг заавал оруулна уу.',
      });
      return;
    }

    const res = await submitDonation({
      userId: currentUser?.id,
      donorName: finalName,
      donorOrg: donorOrg.trim() || undefined,
      donorPhone: donorPhone.trim() || undefined,
      donorEmail: donorEmail.trim() || undefined,
      amount: donationAmount || 1000,
      transactionRef: transactionRef.trim(),
      bankName: 'Хаан банк',
      wishesNote: wishesNote.trim() || undefined,
    });

    setSubmissionFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });

    if (res.success) {
      setTransactionRef('');
      // update search query to show this donation
      if (donorPhone.trim()) {
        setCertSearchQuery(donorPhone.trim());
      }
    }
  };

  const handleOpenCertificate = (d: DonationRecord) => {
    if (d.status !== 'approved') return;

    setActiveCertificate({
      id: d.id,
      donorName: d.donorName,
      donorOrg: d.donorOrg,
      amountNote: `${(d.amount || 0).toLocaleString()} ₮`,
      wishesNote: d.wishesNote,
      certificateNumber: d.certificateNumber || 'DONOR-2026-CERT',
      issuedAt: d.reviewedAt || d.submittedAt,
    });
    setViewMode('certificate');
    sound.playSuccess();
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  // Filter donations relevant to this donor or search query
  const relevantDonations = donations.filter((d) => {
    if (currentUser?.role === 'admin') return true; // admin sees all
    if (certSearchQuery.trim()) {
      const q = certSearchQuery.trim().toLowerCase();
      return (
        d.donorName.toLowerCase().includes(q) ||
        (d.donorPhone || '').includes(q) ||
        (d.donorEmail || '').toLowerCase().includes(q) ||
        (d.transactionRef || '').toLowerCase().includes(q) ||
        (d.certificateNumber || '').toLowerCase().includes(q)
      );
    }
    if (currentUser?.id && d.userId === currentUser.id) return true;
    if (currentUser?.phone && d.donorPhone === currentUser.phone) return true;
    if (currentUser?.email && d.donorEmail === currentUser.email) return true;
    return d.status === 'approved'; // public can view approved certificates
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div
        className={`relative w-full ${
          viewMode === 'certificate' ? 'max-w-6xl' : 'max-w-3xl'
        } rounded-3xl border border-rose-200/80 bg-white shadow-2xl text-slate-800 my-auto max-h-[95vh] overflow-y-auto transition-all`}
      >
        {/* Top Gradient Header (Hidden in print) */}
        <div className="no-print relative overflow-hidden rounded-t-3xl bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 px-6 py-5 text-white shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/30">
                <Heart className="h-6 w-6 text-white fill-white animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase backdrop-blur-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>Donation / Төслийг дэмжих</span>
                </div>
                <h2 className="font-display text-lg sm:text-2xl font-black tracking-tight mt-0.5">
                  «Газрын зургийг хэн сайн мэдэх вэ?» төслийг дэмжих
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl bg-white/15 p-2 text-white hover:bg-white/25 transition-colors cursor-pointer"
              title="Хаах"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mode Switcher Bar (Hidden in print) */}
        <div className="no-print flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('info')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-bold transition-all cursor-pointer ${
                viewMode === 'info'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Дансны мэдээлэл & Дэмжлэг илгээх</span>
            </button>

            {activeCertificate && (
              <button
                type="button"
                onClick={() => setViewMode('certificate')}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-bold transition-all cursor-pointer ${
                  viewMode === 'certificate'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                }`}
              >
                <Award className="h-3.5 w-3.5 text-amber-600" />
                <span>Батламж үзэх ({activeCertificate.certificateNumber})</span>
              </button>
            )}
          </div>

          {viewMode === 'certificate' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('info')}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Буцах</span>
              </button>
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-1.5 font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>A4 Батламж хэвлэх / PDF хадгалах</span>
              </button>
            </div>
          )}
        </div>

        {/* VIEW 1: DONATION BANK ACCOUNT DETAILS & SUBMISSION & VERIFICATION STATUS */}
        {viewMode === 'info' && (
          <div className="p-6 space-y-6">
            {/* Warm Thank You Message Banner */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-rose-50/50 to-amber-50/80 p-5 shadow-2xs flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md">
                <Gift className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-rose-700 font-black text-sm sm:text-base">
                  <span>Чин сэтгэлээсээ БАЯРЛАЛАА! ❤️</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  Монгол орны болон дэлхийн газарзүйн боловсролыг түгээн дэлгэрүүлэх, сурагч багш нарт зориулсан интерактив газрын зураг, вектор сорилын санг хөгжүүлэх үйлсийг дэмжиж буй Танд гүн талархал илэрхийлье.{' '}
                  <strong className="text-rose-700">Баярлалаа!</strong>
                </p>
              </div>
            </div>

            {/* Khan Bank Account Card */}
            <div className="rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black text-sm shadow-sm">
                    ХААН
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                      Хандив хүлээн авах албан ёсны данс
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      Хаан банк <span className="text-emerald-300 font-mono text-base">(iban: {IBAN_PREFIX})</span>
                    </h3>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-200 self-start sm:self-auto">
                  MNT · Төгрөгийн данс
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-4">
                {/* IBAN + Account Number */}
                <div className="md:col-span-2 rounded-xl bg-white/10 border border-white/15 p-3.5 backdrop-blur-xs flex flex-col justify-between gap-2">
                  <div className="flex items-center justify-between text-xs text-emerald-200">
                    <span>Дансны дугаар (IBAN: {IBAN_PREFIX}):</span>
                    <span className="font-mono text-[11px] text-amber-300">Хаан банк</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs sm:text-sm text-emerald-300 mr-1.5">
                        ({IBAN_PREFIX})
                      </span>
                      <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white">
                        {ACCOUNT_NUMBER}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopy(ACCOUNT_NUMBER, 'account')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 text-xs font-black transition-colors cursor-pointer shadow-xs"
                      >
                        {copiedField === 'account' ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Хуулагдлаа</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Данс хуулах</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(`MN60000500${ACCOUNT_NUMBER}`, 'iban')}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer"
                        title="Бүтэн IBAN хуулах"
                      >
                        {copiedField === 'iban' ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-300" />
                            <span>IBAN хуулсан</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>IBAN</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Holder Name */}
                <div className="rounded-xl bg-white/10 border border-white/15 p-3.5 backdrop-blur-xs flex flex-col justify-between gap-2">
                  <span className="text-xs text-emerald-200">Хүлээн авагчийн нэр:</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg sm:text-xl font-black text-amber-300">
                      {ACCOUNT_HOLDER}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ACCOUNT_HOLDER, 'name')}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      {copiedField === 'name' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          <span>Хуулсан</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Нэр</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-xs text-emerald-100">
                <span>
                  📌 <strong>Дансны мэдээлэл:</strong> {BANK_NAME} (iban: {IBAN_PREFIX}){' '}
                  <strong>{ACCOUNT_NUMBER}</strong> — <strong>{ACCOUNT_HOLDER}</strong>
                </span>
                <span className="font-bold text-amber-300">Баярлалаа! 🙏</span>
              </div>
            </div>

            {/* Donation Registration Form */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-rose-200/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white font-bold shadow-xs">
                    <Heart className="h-5 w-5 fill-white" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      Дэмжлэг, хандивын шилжүүлгээ бүртгүүлэх
                    </h4>
                    <p className="text-xs text-slate-600">
                      Гүйлгээний утгаа бүртгүүлснээр админ шалгаж баталгаажуулсны дараа албан ёсны «Талархлын батламж» олгогдоно.
                    </p>
                  </div>
                </div>
              </div>

              {submissionFeedback && (
                <div
                  className={`flex items-center gap-2 rounded-xl p-3 text-xs border ${
                    submissionFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {submissionFeedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold">{submissionFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleSubmitDonation} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Хандивлагчийн нэр (Овог, нэр / Байгууллага / Анги хамт олон) *
                    </label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Жишээ нь: Д. Болд / 12А ангийн хамт олон"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-semibold focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Сургууль / Байгууллага (Сонголтоор)
                    </label>
                    <input
                      type="text"
                      value={donorOrg}
                      onChange={(e) => setDonorOrg(e.target.value)}
                      placeholder="Жишээ нь: Нийслэлийн 1-р сургууль"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Холбоо барих утас *
                    </label>
                    <input
                      type="tel"
                      required
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="99112233"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Имэйл хаяг
                    </label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="bold@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Хандивын мөнгөн дүн (₮) *{' '}
                      <span className="text-[10px] font-semibold text-rose-600">
                        (Доод хэмжээ: 1,000 ₮)
                      </span>
                    </label>
                    <div className="space-y-1.5">
                      <input
                        type="number"
                        min={1000}
                        step={500}
                        required
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-mono font-bold focus:border-rose-500 focus:outline-none"
                      />
                      <div className="flex gap-1">
                        {[1000, 5000, 10000, 20000, 50000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setDonationAmount(amt)}
                            className={`flex-1 rounded-md py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                              donationAmount === amt
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {(amt / 1000).toFixed(0)}k₮
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Шилжүүлгийн утга / Баримтын дугаар *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Банкны апп дээр бичсэн гүйлгээний утга эсвэл баримтын дугаар..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-semibold focus:border-rose-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Админ энэ утгыг Хаан банкны дансны хуулгатай тулган шалгаж баталгаажуулна.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Сэтгэлийн үг / Мэндчилгээ (Талархлын батламж дээр бичигдэнэ)
                  </label>
                  <input
                    type="text"
                    value={wishesNote}
                    onChange={(e) => setWishesNote(e.target.value)}
                    placeholder="Талархлын үг эсвэл сурагч багш нарт илгээх мэндчилгээ..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    🔒 Мэдээллийг зөвхөн баталгаажуулалт болон батламж олгоход ашиглана.
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white px-6 py-2.5 text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    <Heart className="h-4 w-4 fill-white" />
                    <span>Дэмжлэгийн мэдээлэл илгээх</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Donor Appreciation Certificate Verification & Access Section */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/70 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs">
                    <Award className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      Талархлын батламж шалгах & авах
                    </h4>
                    <p className="text-xs text-slate-600">
                      Админ таны шилжүүлгийг шалгаж <strong>баталгаажуулсны дараа</strong> албан ёсны Талархлын батламж нээгдэнэ.
                    </p>
                  </div>
                </div>

                {/* Search / Filter for user's own donations */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Утас, нэрээр батламж хайх..."
                    value={certSearchQuery}
                    onChange={(e) => setCertSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-amber-500 focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              {relevantDonations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-white/80 p-6 text-center text-slate-500 space-y-1 text-xs">
                  <FileText className="h-6 w-6 mx-auto text-amber-500" />
                  <p className="font-semibold text-slate-700">Одоогоор батламжийн бичлэг олдсонгүй.</p>
                  <p className="text-slate-500">
                    Дээрх маягтаар шилжүүлгийн утгаа илгээж бүртгүүлнэ үү. Админ шалгаж баталгаажуулсны дараа талархлын батламж энд харагдана.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {relevantDonations.map((item) => {
                    const isApproved = item.status === 'approved';
                    const isPending = item.status === 'pending';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isApproved
                            ? 'border-emerald-300 bg-emerald-50/70'
                            : isPending
                            ? 'border-amber-300 bg-amber-50/70'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 text-xs sm:text-sm font-bold">
                              {item.donorName}
                            </strong>
                            {item.donorOrg && (
                              <span className="text-[11px] text-slate-600">({item.donorOrg})</span>
                            )}
                            <span className="font-mono text-xs font-bold text-rose-700">
                              {(item.amount || 0).toLocaleString()} ₮
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                            {item.transactionRef && (
                              <span className="font-mono">
                                Утга: <strong>{item.transactionRef}</strong>
                              </span>
                            )}
                            <span>Огноо: {new Date(item.submittedAt).toLocaleDateString('mn-MN')}</span>
                            {item.certificateNumber && (
                              <span className="font-mono font-bold text-amber-900">
                                № {item.certificateNumber}
                              </span>
                            )}
                          </div>

                          {isPending && (
                            <p className="text-[11px] text-amber-800 font-medium flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>Админ таны шилжүүлгийг шалгаж байна. Баталгаажуулсны дараа батламж хэвлэх эрх нээгдэнэ.</span>
                            </p>
                          )}
                        </div>

                        {/* Status Badge & Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 text-xs font-bold">
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                              <span>Хүлээгдэж буй</span>
                            </span>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => handleOpenCertificate(item)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white px-4 py-2 text-xs font-black shadow-xs transition-all cursor-pointer"
                            >
                              <Award className="h-4 w-4" />
                              <span>Талархлын батламж харах / Хэвлэх</span>
                            </button>
                          )}

                          {/* Quick Admin action if admin is logged in */}
                          {currentUser?.role === 'admin' && isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                reviewDonation(item.id, 'approved', 'Админ баталгаажуулав');
                                sound.playSuccess();
                              }}
                              className="rounded-lg bg-emerald-600 text-white px-3 py-1 text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                            >
                              Баталгаажуулах
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: A4 LANDSCAPE DONOR APPRECIATION CERTIFICATE (Only for approved donations) */}
        {viewMode === 'certificate' && activeCertificate && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Quick Note above preview (Hidden in print) */}
            <div className="no-print flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-slate-800">
                  Энэхүү талархлын батламжийг админ албан ёсоор шалгаж баталгаажуулсан болно.{' '}
                  <strong>(Батламжийн дугаар: {activeCertificate.certificateNumber})</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handlePrintCertificate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-black shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Printer className="h-4 w-4" />
                <span>Хэвлэх / PDF татах</span>
              </button>
            </div>

            {/* Printable A4 Landscape Certificate Sheet (админы харагдацтай нэг загвар) */}
            <DonorCertificateSheet
              record={activeCertificate}
              config={donorCertificateConfig}
              partners={certificateConfig.partners}
              adminName={adminName}
              adminPosition={adminPosition}
              adminOrg={adminOrg}
            />
          </div>
        )}
      </div>
    </div>
  );
};
