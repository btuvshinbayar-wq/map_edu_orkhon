// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';

vi.mock('../../src/context/AppContext', () => ({ useApp: () => ({ gisLayers: [] }) }));
import { DraftReviewModal } from '../../src/components/DraftReviewModal';
import { generateComprehensiveGisQuestions } from '../../src/utils/gisAutoQuestionGenerator';

HTMLCanvasElement.prototype.getContext = (() =>
  new Proxy({}, { get: (_t, p) => (p === 'measureText' ? () => ({ width: 0 }) : () => undefined), set: () => true })) as any;

const lakes = Array.from({ length: 12 }, (_, i) => {
  const cx = 95 + i * 1.1, cy = 45 + (i % 4) * 0.7, r = 0.2 + (i % 3) * 0.08;
  const ring = Array.from({ length: 24 }, (_, k) => [cx + r * Math.cos((k / 24) * 2 * Math.PI), cy + r * Math.sin((k / 24) * 2 * Math.PI)]);
  ring.push(ring[0]);
  return { type: 'Feature', properties: { name_mn: `Нуур ${i}` }, geometry: { type: 'Polygon', coordinates: [ring] } };
});
const layer: any = {
  id: 'lk', name: 'Нуур', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Polygon',
  featureCount: 12, geojson: { type: 'FeatureCollection', features: lakes }, nameField: 'name_mn', createdAt: '',
};
const drafts = generateComprehensiveGisQuestions({ layers: [layer], enabledTypes: ['contour_shape', 'point_placement'] } as any) as any[];

// Leaflet-ийн хойшлогдсон зурлага дуустал хүлээгээд цэвэрлэнэ (jsdom-ийн canvas stub-д зориулсан)
afterEach(async () => {
  await new Promise((r) => setTimeout(r, 80));
  cleanup();
});

describe('Даалгаврыг хадгалахаас өмнө урьдчилан харах, засах', () => {
  it('Үүсгэсэн бүх даалгавар жагсагдаж, хадгалахад зөвхөн сонгосон, засагдсан нь очно', () => {
    const onConfirm = vi.fn();
    const { container } = render(<DraftReviewModal title="тест" initial={drafts} onConfirm={onConfirm} onCancel={() => {}} />);
    expect(container.querySelectorAll('textarea').length).toBe(drafts.length); // асуулт бүрийн текст засах талбар
    expect(screen.getByText(new RegExp(`${drafts.length} / ${drafts.length} даалгавар сонгосон`))).toBeTruthy();

    // 1-р даалгаврын текстийг засна
    const first = container.querySelectorAll('textarea')[0] as HTMLTextAreaElement;
    fireEvent.change(first, { target: { value: 'ЗАСАГДСАН АСУУЛТ' } });
    // 2-р даалгаврыг хасна
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[1]);

    const save = screen.getByRole('button', { name: new RegExp(`Санд нэмэх \\(${drafts.length - 1}\\)`) });
    expect((save as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(save);

    const saved = onConfirm.mock.calls[0][0];
    expect(saved.length).toBe(drafts.length - 1);
    expect(saved[0].title).toBe('ЗАСАГДСАН АСУУЛТ');
    expect(saved.some((q: any) => q.id === drafts[1].id)).toBe(false); // хасагдсан нь орсонгүй
  });

  it('Хоосон/буруу засвартай бол Санд нэмэх идэвхгүй болж, шалтгааныг улаанаар харуулна', () => {
    const onConfirm = vi.fn();
    const { container } = render(<DraftReviewModal title="тест" initial={drafts} onConfirm={onConfirm} onCancel={() => {}} />);
    const firstTextarea = container.querySelectorAll('textarea')[0] as HTMLTextAreaElement;
    fireEvent.change(firstTextarea, { target: { value: '   ' } });
    const save = screen.getByRole('button', { name: /Санд нэмэх/ }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(screen.getAllByText(/Асуултын текст хоосон байна/).length).toBeGreaterThan(0);
    fireEvent.click(save);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Сонголтын текст засч, зөв хариултыг солиход даалгавар зөв хадгалагдана', () => {
    const onConfirm = vi.fn();
    const { container } = render(<DraftReviewModal title="тест" initial={drafts.filter((q) => q.options?.length)} onConfirm={onConfirm} onCancel={() => {}} />);
    const card = container.querySelector('input[type="radio"]')!.closest('div.rounded-xl')!;
    const radios = card.querySelectorAll('input[type="radio"]');
    const wrongIdx = Array.from(radios).findIndex((r) => !(r as HTMLInputElement).checked);
    fireEvent.click(radios[wrongIdx]); // өөр хариултыг зөв болгоно
    const textInputs = card.querySelectorAll('input[aria-label^="Сонголт"]');
    fireEvent.change(textInputs[wrongIdx], { target: { value: 'ШИНЭ ХАРИУЛТ' } });
    fireEvent.click(screen.getByRole('button', { name: /Санд нэмэх/ }));
    const q = onConfirm.mock.calls[0][0][0];
    expect(q.options.filter((o: any) => o.isCorrect).length).toBe(1);
    expect(q.options[wrongIdx].isCorrect).toBe(true);
    expect(q.options[wrongIdx].text).toBe('ШИНЭ ХАРИУЛТ');
    expect(q.targetName).toBe('ШИНЭ ХАРИУЛТ');
  });

  it('Зургийг харах товч нь контур болон цэг байрлуулах даалгаврын газрын зургийг нээнэ', () => {
    const contour = drafts.find((q) => q.gisAutoTaskType === 'contour_shape');
    const pin = drafts.find((q) => q.type === 'interactive_map_pin');
    for (const q of [contour, pin]) {
      const { container, unmount } = render(<DraftReviewModal title="тест" initial={[q]} onConfirm={() => {}} onCancel={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: /Зургийг харах/ }));
      expect(container.querySelector('.leaflet-container')).toBeTruthy();
      unmount();
    }
  });
});
