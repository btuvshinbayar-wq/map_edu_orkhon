// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, act } from '@testing-library/react';
import L from 'leaflet';

vi.mock('../../src/context/AppContext', () => ({ useApp: () => ({ gisLayers: [] }) }));

import { InteractiveMapPinQuestion } from '../../src/components/InteractiveMapPinQuestion';
import { generateComprehensiveGisQuestions } from '../../src/utils/gisAutoQuestionGenerator';

const features = Array.from({ length: 6 }, (_, i) => ({
  type: 'Feature', properties: { name_mn: `Хот ${i}` }, geometry: { type: 'Point', coordinates: [100 + i, 45 + i * 0.2] },
}));
const layer: any = {
  id: 'p1', name: 'Хотууд', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.3, weight: 2, geometryType: 'Point',
  featureCount: 6, geojson: { type: 'FeatureCollection', features }, nameField: 'name_mn', createdAt: '',
};

// jsdom-д <canvas> байхгүй тул Leaflet-ийн canvas renderer-д зориулж хоосон stub өгнө (зөвхөн тестийн орчин)
HTMLCanvasElement.prototype.getContext = (() =>
  new Proxy({}, { get: (_t, p) => (p === 'measureText' ? () => ({ width: 0 }) : () => undefined), set: () => true })) as any;

// Leaflet-ийн хойшлогдсон зурлага дуустал хүлээгээд цэвэрлэнэ (jsdom-ийн canvas stub-д зориулсан)
afterEach(async () => {
  await new Promise((r) => setTimeout(r, 80));
  cleanup();
});

describe('Цэг байрлуулах даалгавар (point_placement)', () => {
  const qs = generateComprehensiveGisQuestions({ layers: [layer], enabledTypes: ['point_placement'] } as any);
  const q = qs[0] as any;

  it('Даалгавар үүсдэг', () => {
    expect(qs.length).toBe(6);
    expect(q.type).toBe('interactive_map_pin');
    const names = features.map((f) => f.properties.name_mn);
    expect(names).toContain(q.mapPinData.targetName);
    expect(q.mapPinData.allowedDistanceKm).toBeGreaterThan(0);
  });

  it('Компонент дэлгэцлэгдэж, газрын зураг бэлэн болно', async () => {
    const onAnswer = vi.fn();
    const { container } = render(<InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={onAnswer} />);
    expect(container.querySelector('.leaflet-container')).toBeTruthy();
    expect(screen.getAllByText(/Цэг Тавих/i).length).toBeGreaterThan(0);
    // Баталгаажуулах товч байгаа эсэх
    const buttons = Array.from(container.querySelectorAll('button')).map((b) => b.textContent || '');
    console.log('товчнууд:', buttons.map((t) => t.trim()).filter(Boolean).join(' | '));
  });

  const run = async (offsetDeg: number) => {
    const maps: L.Map[] = [];
    const orig = L.map;
    const spy = vi.spyOn(L, 'map').mockImplementation(((...a: any[]) => { const m = (orig as any)(...a); maps.push(m); return m; }) as any);
    const onAnswer = vi.fn();
    const { container } = render(<InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={onAnswer} />);
    const map = maps[0];
    expect(map).toBeTruthy();
    // Хэрэглэгч газрын зураг дээр товшино
    act(() => { map.fire('click', { latlng: L.latLng(q.mapPinData.targetLat + offsetDeg, q.mapPinData.targetLng) }); });
    expect(container.querySelector('.competition-user-pin')).toBeTruthy(); // 📍 цэг тавигдсан
    // Баталгаажуулна
    const confirm = Array.from(container.querySelectorAll('button')).find((b) => /баталгаажуул|шалгах|илгээ/i.test(b.textContent || ''));
    expect(confirm, 'баталгаажуулах товч олдсонгүй').toBeTruthy();
    act(() => { fireEvent.click(confirm!); });
    spy.mockRestore();
    return { onAnswer, container };
  };

  it('Зөв байршилд товшвол зөв гэж үнэлнэ', async () => {
    const { onAnswer, container } = await run(0.05);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer.mock.calls[0][0]).toBe(true);
    expect(container.querySelector('.competition-target-pin')).toBeTruthy(); // бодит байршил харагдсан
  });

  it('Хол байршилд товшвол буруу гэж үнэлнэ', async () => {
    const { onAnswer } = await run(3);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onAnswer.mock.calls[0][0]).toBe(false);
    expect(onAnswer.mock.calls[0][1]).toBeGreaterThan(300); // км
  });
});
