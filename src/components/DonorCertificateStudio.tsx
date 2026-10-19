import React, { useState } from 'react';
import { Award, Printer, RotateCcw, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DonorCertificateSheet, DEFAULT_DONOR_CERTIFICATE, type DonorCertificateRecord } from './DonorCertificateSheet';

const SAMPLE: DonorCertificateRecord = {
  id: 'sample',
  donorName: 'Жишээ Хандивлагч',
  donorOrg: 'Жишээ ХХК',
  amountNote: '100,000 ₮',
  wishesNote: 'Сурагчдын мэдлэг, ур чадвар өсөн нэмэгдэх болтугай.',
  certificateNumber: 'DONOR-2026-0001',
  issuedAt: new Date().toISOString(),
};

export const useAdminSignature = () => {
  const { users, currentUser } = useApp();
  const admin = users.find((u) => u.role === 'admin') || (currentUser?.role === 'admin' ? currentUser : null);
  return {
    adminName: admin?.fullName || 'Админ',
    adminPosition: admin?.position || admin?.notes || 'Төслийн санаачлагч',
    adminOrg: admin?.organization || admin?.school || 'Газрын зургийг хэн сайн мэдэх вэ? Интерактив платформ',
  };
};

/** Хандивлагчид өгөх талархлын батламжийн загварыг админ харж, засах самбар (жишээ хандивлагчаар урьдчилан харна) */
export const DonorCertificateStudio: React.FC = () => {
  const { donorCertificateConfig: cfg, updateDonorCertificateConfig, resetDonorCertificateConfig, certificateConfig } = useApp();
  const sig = useAdminSignature();
  const [open, setOpen] = useState(true);

  const field = (label: string, key: keyof typeof cfg, rows = 1, hint?: string) => (
    <label className="block text-xs">
      <span className="mb-1 block font-semibold text-slate-700">{label}</span>
      {rows > 1 ? (
        <textarea value={cfg[key]} rows={rows} onChange={(e) => updateDonorCertificateConfig({ [key]: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
      ) : (
        <input value={cfg[key]} onChange={(e) => updateDonorCertificateConfig({ [key]: e.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5" />
      )}
      {hint && <span className="mt-0.5 block text-[10px] text-slate-500">{hint}</span>}
    </label>
  );

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs space-y-3" data-testid="donor-cert-studio">
      <div className="flex flex-wrap items-center gap-2">
        <Award className="h-4 w-4 text-amber-700" />
        <button type="button" onClick={() => setOpen((x) => !x)} className="text-sm font-black text-slate-900 hover:underline cursor-pointer">
          {open ? '▾' : '▸'} Хандивлагчид өгөх талархлын батламжийн загвар
        </button>
        <div className="ml-auto flex gap-1.5">
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer">
            <Printer className="h-3.5 w-3.5" /> Жишээг хэвлэх
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Батламжийн загварыг анхны утгад нь буцаах уу?')) resetDonorCertificateConfig();
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Анхны загвар
          </button>
        </div>
      </div>

      {open && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
          <div className="no-print space-y-2.5">
            {field('Дээд мөр', 'topLine')}
            {field('Гарчиг', 'mainTitle')}
            {field('Тэмдэг бичиг (өнгөт шошго)', 'badgeText')}
            {field('Хандивлагчийн нэрийн өмнөх текст', 'introText')}
            {field('Үндсэн талархлын текст', 'bodyText', 5, '**ингэж** бичвэл тодорч харагдана')}
            {field('Төгсгөлийн талархал', 'thanksText')}
            {field('Тамганы мөрүүд', 'stampLines', 1, '"|"-ээр мөр тусгаарлана. {жил} нь одоогийн оноор солигдоно')}
            <p className="rounded-lg bg-slate-50 p-2 text-[10px] leading-relaxed text-slate-600">
              Хандивлагчийн нэр, байгууллага, дүн, хүслийн текст болон батламжийн дугаар нь хандив бүрээс автоматаар орно. Зохион байгуулагч, ивээн тэтгэгчдийн
              лого болон гарын үсгийн мэдээлэл (админы нэр, албан тушаал) нь «Батламжийн тохиргоо» болон админы профайлаас авагдана.
            </p>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <DonorCertificateSheet record={SAMPLE} config={cfg} partners={certificateConfig.partners} {...sig} />
            <p className="no-print mt-1.5 text-center text-[10px] text-slate-500">Урьдчилан харах: жишээ хандивлагчаар</p>
          </div>
        </div>
      )}
    </div>
  );
};

/** Баталгаажсан хандив бүрийн батламжийг админ харах цонх */
export const DonationCertificateViewer: React.FC<{ record: DonorCertificateRecord; onClose: () => void }> = ({ record, onClose }) => {
  const { donorCertificateConfig, certificateConfig } = useApp();
  const sig = useAdminSignature();
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 sm:p-6 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="w-full max-w-[1100px] rounded-2xl bg-white p-4 shadow-2xl">
        <div className="no-print mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-900">Талархлын батламж: {record.donorName}</h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-amber-400 cursor-pointer">
              <Printer className="h-4 w-4" /> Хэвлэх / PDF
            </button>
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 cursor-pointer" aria-label="Хаах">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <DonorCertificateSheet record={record} config={donorCertificateConfig} partners={certificateConfig.partners} {...sig} />
      </div>
    </div>
  );
};

export { DEFAULT_DONOR_CERTIFICATE };
