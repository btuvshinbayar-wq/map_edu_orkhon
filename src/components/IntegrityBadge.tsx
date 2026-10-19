import React from 'react';
import type { IntegrityReport } from '../types';
import { formatDuration } from '../lib/scoring';

/** Оролдлогын шударга байдлын тэмдэг: цонх сольсон тоо, хугацаа, дуусгасан эсэх (админд зориулсан) */
export const IntegrityBadge: React.FC<{ report?: IntegrityReport | null }> = ({ report }) => {
  if (!report) return <span className="text-[10px] text-slate-400">Цонхны бүртгэл алга</span>;
  const detail = report.events
    .map((e, i) => `${i + 1}. ${new Date(e.at).toLocaleTimeString('mn-MN')} · ${e.question + 1}-р асуулт · ${e.kinds.includes('fullscreen_exit') ? 'бүтэн дэлгэцээс гарсан' : formatDuration(e.ms)}`)
    .join('\n');
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] font-bold" data-testid="integrity-badge">
      {report.windowLeaves === 0 ? (
        <span className="rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-emerald-800">🖥 Цонх сольсонгүй</span>
      ) : (
        <span className="rounded-md border border-rose-300 bg-rose-50 px-1.5 py-0.5 text-rose-700" title={detail}>
          🖥 Цонх сольсон: {report.windowLeaves}× ({formatDuration(report.awayMs)})
        </span>
      )}
      {report.terminated && (
        <span className="rounded-md border border-slate-400 bg-slate-100 px-1.5 py-0.5 text-slate-700">
          ⛔ {report.terminatedReason === 'limit' ? 'Дээд тоо хэтэрч дууссан' : 'Гарч дууссан'}
        </span>
      )}
      {report.blockedActions > 0 && (
        <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-amber-800" title="Хуулах, буулгах, баруун товшилт гэх мэт хориглосон оролдлого">
          ✋ {report.blockedActions} хориглосон оролдлого
        </span>
      )}
    </span>
  );
};
