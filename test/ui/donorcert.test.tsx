// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';

let ctx: any;
const updateDonorCertificateConfig = vi.fn();
const resetDonorCertificateConfig = vi.fn();
vi.mock('../../src/context/AppContext', () => ({ useApp: () => ctx }));

import { DonorCertificateStudio, DonationCertificateViewer } from '../../src/components/DonorCertificateStudio';
import { DonorCertificateSheet, DEFAULT_DONOR_CERTIFICATE, stampLinesOf, renderBold } from '../../src/components/DonorCertificateSheet';

afterEach(cleanup);
beforeEach(() => {
  updateDonorCertificateConfig.mockClear(); resetDonorCertificateConfig.mockClear();
  ctx = {
    donorCertificateConfig: DEFAULT_DONOR_CERTIFICATE,
    updateDonorCertificateConfig, resetDonorCertificateConfig,
    certificateConfig: { partners: [{ id: 'p1', name: 'Зохион байгуулагч ХХК', role: 'organizer' }, { id: 'p2', name: 'Ивээн Тэтгэгч', role: 'sponsor' }] },
    users: [{ id: 'a', role: 'admin', fullName: 'Б. Админ', position: 'Төслийн удирдагч', organization: 'Сургууль' }],
    currentUser: { id: 'a', role: 'admin' },
  };
});

const rec = { id: 'r1', donorName: 'Дорж Бат', donorOrg: 'Монгол ХХК', amountNote: '500,000 ₮', wishesNote: 'Амжилт хүсье', certificateNumber: 'DONOR-2026-0042', issuedAt: '2026-10-01T00:00:00Z' };

describe('Хандивлагчийн талархлын батламж: админ харж, засна', () => {
  it('Админ хандив баталгаажуулахаас өмнө ч загвар болон жишээ батламжийг харна', () => {
    render(<DonorCertificateStudio />);
    expect(screen.getByText(/Хандивлагчид өгөх талархлын батламжийн загвар/)).toBeTruthy();
    expect(screen.getAllByText('ТАЛАРХЛЫН БАТЛАМЖ').length).toBeGreaterThan(0);
    expect(screen.getByText('Жишээ Хандивлагч')).toBeTruthy(); // урьдчилан харах нь жишээ хандивлагчаар
    expect(screen.getByText('Б. Админ')).toBeTruthy(); // гарын үсэг админы мэдээллээс
    expect(screen.getByText('Зохион байгуулагч ХХК')).toBeTruthy();
  });

  it('Текстийг засахад context руу засвар очно (гарчиг, үндсэн текст, тамга)', () => {
    render(<DonorCertificateStudio />);
    fireEvent.change(screen.getByDisplayValue('ТАЛАРХЛЫН БАТЛАМЖ'), { target: { value: 'ХҮНДЭТГЭЛИЙН БАТЛАМЖ' } });
    expect(updateDonorCertificateConfig).toHaveBeenCalledWith({ mainTitle: 'ХҮНДЭТГЭЛИЙН БАТЛАМЖ' });
    fireEvent.change(screen.getByDisplayValue(/ТАЛАРХАЛ \| ✓ БАТЛАВ/), { target: { value: 'ТАМГА | {жил}' } });
    expect(updateDonorCertificateConfig).toHaveBeenLastCalledWith({ stampLines: 'ТАМГА | {жил}' });
  });

  it('Анхны загвар руу буцаах товч ажиллана', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<DonorCertificateStudio />);
    fireEvent.click(screen.getByRole('button', { name: /Анхны загвар/ }));
    expect(resetDonorCertificateConfig).toHaveBeenCalledTimes(1);
  });

  it('Баталгаажсан хандивын батламжийг админ харж чадна (өмнө нь товч дарахад юу ч болдоггүй байсан)', () => {
    const onClose = vi.fn();
    render(<DonationCertificateViewer record={rec} onClose={onClose} />);
    expect(screen.getByText('Дорж Бат', { selector: 'h2' })).toBeTruthy();
    expect(screen.getByText('Монгол ХХК')).toBeTruthy();
    expect(screen.getByText(/500,000 ₮/)).toBeTruthy();
    expect(screen.getByText('DONOR-2026-0042')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Хаах'));
    expect(onClose).toHaveBeenCalled();
  });

  it('Админы засварласан загвар хандивлагчийн батламжид яг тэр чигээрээ гарна', () => {
    ctx.donorCertificateConfig = { ...DEFAULT_DONOR_CERTIFICATE, mainTitle: 'ШИНЭ ГАРЧИГ', bodyText: 'Дэмжсэнд **маш их** баярлалаа.', stampLines: 'А | Б | {жил}' };
    const { container } = render(<DonorCertificateSheet record={rec} config={ctx.donorCertificateConfig} adminName="Б" adminPosition="П" adminOrg="О" />);
    expect(screen.getByText('ШИНЭ ГАРЧИГ')).toBeTruthy();
    expect(container.querySelector('strong')!.textContent).toBe('маш их'); // **тодруулга**
    expect(container.querySelector('[data-testid="stamp"]')!.textContent).toBe(`АБ${new Date().getFullYear()}`);
  });

  it('Туслах функцүүд', () => {
    expect(stampLinesOf({ ...DEFAULT_DONOR_CERTIFICATE, stampLines: 'X | {жил} | ' }, 2030)).toEqual(['X', '2030']);
    expect(renderBold('a **b** c').length).toBe(3);
  });
});

// ---- Удирдамж: хэвлэх/татах текст админы тохиргоотой таарна ----
vi.mock('../../src/utils/documentExport', () => ({ exportToDocx: vi.fn(), exportToPdf: vi.fn() }));
import { buildCompetitionGuidelinesHtml } from '../../src/components/CompetitionGuidelinesModal';
describe('Уралдааны удирдамжийн хэвлэх хувилбар', () => {
  it('Тохируулсан хугацаа, хурдны урамшуулал текстэд орно; хуучирсан мэдээлэл байхгүй', () => {
    const html = buildCompetitionGuidelinesHtml({ secondsPerQuestion: 45, speedBonusPercent: 80 });
    expect(html).toContain('даалгавар тус бүрт 45 секунд');
    expect(html).toContain('80% × үлдсэн хугацаа');
    expect(html).toContain('хамгийн бага хугацаанд');
    expect(html).not.toContain('{competitionSchedule');
    expect(html).not.toContain('Олимпиад');
    expect(buildCompetitionGuidelinesHtml(undefined)).toContain('даалгавар тус бүрт 30 секунд');
  });
});
