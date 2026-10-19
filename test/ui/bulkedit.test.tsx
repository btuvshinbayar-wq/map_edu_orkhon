// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';

const bulkEditQuestions = vi.fn();
let bank: any[] = [];
vi.mock('../../src/context/AppContext', () => ({
  useApp: () => ({ gisLayers: [], customQuestions: bank, bulkEditQuestions, batchDeleteCustomQuestions: vi.fn() }),
}));
import { DraftReviewModal } from '../../src/components/DraftReviewModal';
import { QuestionBankEditor } from '../../src/components/QuestionBankEditor';
import { generateComprehensiveGisQuestions } from '../../src/utils/gisAutoQuestionGenerator';

afterEach(async () => { await new Promise((r) => setTimeout(r, 60)); cleanup(); });
HTMLCanvasElement.prototype.getContext = (() =>
  new Proxy({}, { get: (_t, p) => (p === 'measureText' ? () => ({ width: 0 }) : () => undefined), set: () => true })) as any;

const ring = (cx: number, cy: number, r: number) => { const pts = Array.from({ length: 16 }, (_, k) => [cx + r * Math.cos((k / 16) * 6.283), cy + r * Math.sin((k / 16) * 6.283)]); pts.push(pts[0]); return pts; };
const lakes = Array.from({ length: 10 }, (_, i) => ({ type: 'Feature', properties: { name_mn: `Нуур ${i}` }, geometry: { type: 'Polygon', coordinates: [ring(95 + i * 1.2, 45 + (i % 3) * 0.6, 0.25 + i * 0.02)] } }));
const layer: any = { id: 'lk', name: 'Нуур', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Polygon', featureCount: 10, nameField: 'name_mn', createdAt: '', geojson: { type: 'FeatureCollection', features: lakes } };
const drafts = generateComprehensiveGisQuestions({ layers: [layer], enabledTypes: ['area', 'contour_shape'] } as any) as any[];
const areaQs = drafts.filter((q) => q.gisAutoTaskType === 'area');
const shapeQs = drafts.filter((q) => q.gisAutoTaskType === 'contour_shape');

describe('Бөөнөөр засах: нэг төрлийн асуултыг нэг дор', () => {
  it('Draft цонх: бүлэг сонгоод загварыг нэг удаа засахад тухайн төрлийн бүх асуулт шинэчлэгдэж, бусад нь хөндөгдөхгүй', () => {
    const onConfirm = vi.fn();
    const { container } = render(<DraftReviewModal title="тест" initial={drafts} onConfirm={onConfirm} onCancel={() => {}} />);
    // "Талбай · Нуур" бүлгийг сонгоно
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Талбай.* · Нуур \\(${areaQs.length}\\)`) }));
    const template = container.querySelector('textarea[rows="3"]') as HTMLTextAreaElement;
    expect(template.value).toContain('{нэр}'); // өгөгдсөн асуулт загвар болон харагдана
    fireEvent.change(template, { target: { value: 'ТАЛБАЙ хэд вэ? «{нэр}»' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${areaQs.length} даалгаварт хэрэглэх`) }));

    fireEvent.click(screen.getByRole('button', { name: /Санд нэмэх/ }));
    const saved: any[] = onConfirm.mock.calls[0][0];
    const savedArea = saved.filter((q) => q.gisAutoTaskType === 'area');
    expect(savedArea.length).toBe(areaQs.length);
    savedArea.forEach((q, i) => {
      const name = areaQs.find((o) => o.id === q.id).shpContourData.hints[0].replace('Обьект: ', '');
      expect(q.title).toBe(`ТАЛБАЙ хэд вэ? «${name}»`); // обьект бүр өөрийн нэртэйгээр
    });
    expect(new Set(savedArea.map((q) => q.title)).size).toBe(areaQs.length);
    // Бусад төрөл (контур таах) өөрчлөгдөөгүй
    saved.filter((q) => q.gisAutoTaskType === 'contour_shape').forEach((q) => expect(q.title).toBe(shapeQs.find((o) => o.id === q.id).title));
    // Хариулт/сонголт хэвээр
    savedArea.forEach((q) => expect(JSON.stringify(q.options)).toBe(JSON.stringify(areaQs.find((o) => o.id === q.id).options)));
  });

  it('Сангийн засвар: бүлгийг сонгож, оноо ба асуултыг нэг дор солиход context руу бүх даалгаврын засвар очно', () => {
    bank = [...drafts];
    bulkEditQuestions.mockClear();
    render(<QuestionBankEditor />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`Хэлбэр дүрсийг таах · Нуур \\(${shapeQs.length}\\)`) }));
    expect(screen.getAllByText(new RegExp(`${shapeQs.length} даалгавар`)).length).toBeGreaterThan(0);

    const textarea = document.querySelector('textarea[rows="3"]') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Энэ дүрс аль нь вэ? ({давхарга})' } });
    fireEvent.click(screen.getByText(/Дэд гарчиг, тайлбар, оноо/));
    fireEvent.change(screen.getByPlaceholderText('өөрчлөхгүй'), { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`${shapeQs.length} даалгаварт хэрэглэх`) }));

    expect(bulkEditQuestions).toHaveBeenCalledTimes(1);
    const [ids, fn] = bulkEditQuestions.mock.calls[0];
    expect(ids.length).toBe(shapeQs.length);
    const out = fn(shapeQs[0]);
    expect(out.title).toBe('Энэ дүрс аль нь вэ? (Нуур)');
    expect(out.points).toBe(15);
    expect(out.options).toEqual(shapeQs[0].options); // хариулт хөндөгдөөгүй
  });
});
