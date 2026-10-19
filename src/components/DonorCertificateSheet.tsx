import React from 'react';
import { Heart, Award, Building2, CheckCircle2 } from 'lucide-react';
import type { CertificatePartner, DonorCertificateConfig } from '../types';

export interface DonorCertificateRecord {
  id: string;
  donorName: string;
  donorOrg?: string;
  amountNote?: string;
  wishesNote?: string;
  certificateNumber: string;
  issuedAt: string;
}

export const DEFAULT_DONOR_CERTIFICATE: DonorCertificateConfig = {
  topLine: '«ГАЗРЫН ЗУРГИЙГ ХЭН САЙН МЭДЭХ ВЭ?» ИНТЕРАКТИВ ПЛАТФОРМ',
  mainTitle: 'ТАЛАРХЛЫН БАТЛАМЖ',
  badgeText: 'Хүндэт Хандивлагч & Дэмжигч',
  introText: 'Боловсрол, шинжлэх ухааныг дэмжигч эрхэм хүндэт',
  bodyText:
    'Монгол улсын ерөнхий боловсролын сургуулийн сурагчид, газарзүйн багш нарын орон зайн сэтгэлгээ, газрын зураг болон GIS вектор мэдээлэлтэй ажиллах ур чадварыг хөгжүүлэх **«Газрын зургийг хэн сайн мэдэх вэ?»** интерактив уралдаан, сорилын системийг хөгжүүлэхэд үнэтэй хувь нэмэр оруулж, чин сэтгэлийн дэмжлэг үзүүлсэнд гүн талархал илэрхийлж энэхүү батламжийг хадгалуулав.',
  thanksText: 'ТАНД ЧИН СЭТГЭЛЭЭСЭЭ БАЯРЛАЛАА!',
  stampLines: 'ТАЛАРХАЛ | ✓ БАТЛАВ | {жил}',
};

/** `**тодруулах**` markup-ийг <strong> болгоно */
export const renderBold = (text: string): React.ReactNode[] =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <React.Fragment key={i}>{part}</React.Fragment>,
  );

export const stampLinesOf = (cfg: DonorCertificateConfig, year = new Date().getFullYear()): string[] =>
  cfg.stampLines.split('|').map((l) => l.trim().replace(/\{жил\}/g, String(year))).filter(Boolean);

interface Props {
  record: DonorCertificateRecord;
  config: DonorCertificateConfig;
  partners?: CertificatePartner[];
  adminName: string;
  adminPosition: string;
  adminOrg: string;
}

/** Хандивлагчийн талархлын батламж (A4 хэвтээ). Хандивлагчийн цонх болон админы харагдац хоёр нэг загвар ашиглана. */
export const DonorCertificateSheet: React.FC<Props> = ({ record, config, partners = [], adminName, adminPosition, adminOrg }) => {
  const organizers = partners.filter((p) => p.role === 'organizer');
  const sponsors = partners.filter((p) => p.role === 'sponsor');
  const stamp = stampLinesOf(config);

  return (
    <div className="a4-landscape-certificate relative mx-auto w-full max-w-[1060px] aspect-[297/210] overflow-hidden rounded-xl border-4 border-double border-amber-600/90 bg-gradient-to-br from-amber-50/80 via-white to-rose-50/50 px-8 py-6 sm:px-12 sm:py-8 text-center shadow-xl flex flex-col justify-between select-none">
      <div className="absolute top-2.5 left-3 text-amber-600 font-display text-xl">❖</div>
      <div className="absolute top-2.5 right-3 text-amber-600 font-display text-xl">❖</div>
      <div className="absolute bottom-2.5 left-3 text-amber-600 font-display text-xl">❖</div>
      <div className="absolute bottom-2.5 right-3 text-amber-600 font-display text-xl">❖</div>

      <div className="space-y-2">
        {partners.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 border-b border-amber-200/70 pb-2.5">
            {organizers.map((org) => (
              <div key={org.id} className="flex items-center gap-1.5 rounded-lg bg-white/90 border border-amber-200/80 px-2.5 py-1 shadow-2xs">
                {org.logoUrl ? <img src={org.logoUrl} alt={org.name} className="h-5 w-5 object-contain rounded-xs shrink-0" /> : <Building2 className="h-3.5 w-3.5 text-amber-700 shrink-0" />}
                <span className="text-[11px] font-bold text-slate-800">{org.name}</span>
              </div>
            ))}
            {sponsors.map((sp) => (
              <div key={sp.id} className="flex items-center gap-1.5 rounded-lg bg-amber-50/90 border border-amber-300/80 px-2.5 py-1 shadow-2xs">
                {sp.logoUrl ? <img src={sp.logoUrl} alt={sp.name} className="h-5 w-5 object-contain rounded-xs shrink-0" /> : <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" />}
                <span className="text-[11px] font-bold text-amber-950">{sp.name}</span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-1 space-y-1">
          <p className="text-[11px] font-bold tracking-widest text-rose-700 uppercase">{config.topLine}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-widest text-amber-900">{config.mainTitle}</h1>
          {config.badgeText && (
            <div className="flex items-center justify-center gap-2 pt-0.5">
              <span className="rounded-full bg-rose-100 px-3.5 py-0.5 text-[11px] font-bold text-rose-900 border border-rose-300">{config.badgeText}</span>
            </div>
          )}
        </div>
      </div>

      <div className="my-auto space-y-3 py-2">
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium">{config.introText}</p>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">{record.donorName}</h2>
          {record.donorOrg && <p className="text-xs sm:text-sm font-bold text-amber-800">{record.donorOrg}</p>}
          {record.amountNote && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 border border-amber-300 px-3.5 py-0.5 text-xs font-bold text-amber-950">
                <Heart className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
                <span>Дэмжлэг: {record.amountNote}</span>
              </span>
            </div>
          )}
        </div>

        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-slate-700 leading-relaxed font-medium px-4">{renderBold(config.bodyText)}</p>

        {record.wishesNote && (
          <div className="mx-auto max-w-xl rounded-xl border border-amber-200/90 bg-white/90 px-4 py-2 text-xs italic text-slate-600 shadow-2xs">“{record.wishesNote}”</div>
        )}

        {config.thanksText && (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-black text-rose-700 tracking-wide">
              <Heart className="h-4 w-4 fill-rose-600 text-rose-600" />
              <span>{config.thanksText}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between pt-3 border-t border-amber-200/90 text-left text-xs">
        <div className="max-w-xs">
          <p className="font-semibold text-slate-700 text-[11px]">{adminPosition}:</p>
          <p className="text-slate-900 font-bold text-sm mt-0.5">{adminName}</p>
          <p className="text-[11px] text-slate-600">{adminOrg}</p>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-rose-600 bg-rose-50/90 text-center text-rose-800 rotate-[-8deg] shadow-2xs">
            <div className="text-[8px] font-bold uppercase leading-tight" data-testid="stamp">
              {stamp.map((l, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <br />}
                  {l}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="text-right">
          <p className="font-semibold text-slate-700 text-[11px]">Батламжийн дугаар:</p>
          <p className="font-mono text-amber-800 font-bold text-sm">{record.certificateNumber}</p>
          <div className="flex items-center justify-end gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
            <span>Огноо: {new Date(record.issuedAt).toLocaleDateString('mn-MN')}</span>
            <span className="inline-flex items-center gap-0.5 text-emerald-700 font-sans font-bold">
              <CheckCircle2 className="h-3 w-3" /> Баталгаажсан
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
