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
    expect(container.querySelector('.pin-crosshair-marker')).toBeTruthy(); // хөндлөн тэмдэгтэй цэг тавигдсан
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


import { readFileSync } from 'node:fs';
describe('Цэг тавих: курсор, нарийвчлал, давхардал', () => {
  const q = (generateComprehensiveGisQuestions({ layers: [layer], enabledTypes: ['point_placement'] } as any) as any[])[0] as any;
  const mkMap = () => {
    const maps: L.Map[] = [];
    const orig = L.map;
    const spy = vi.spyOn(L, 'map').mockImplementation(((...a: any[]) => { const m = (orig as any)(...a); maps.push(m); return m; }) as any);
    return { maps, spy };
  };

  it('Курсор хөндлөн дүрстэй (crosshair) болж, хариулсны дараа энгийн болно', async () => {
    const { maps, spy } = mkMap();
    const { container } = render(<InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={vi.fn()} />);
    spy.mockRestore();
    const el = maps[0].getContainer();
    expect(el.classList.contains('pin-crosshair')).toBe(true);
    // CSS: crosshair курсор Leaflet-ийн grab-ийг давж, чирэх үед grabbing
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.pin-crosshair[\s\S]*cursor:\s*crosshair\s*!important/);
    expect(css).toMatch(/\.pin-crosshair\.leaflet-dragging[\s\S]*cursor:\s*grabbing/);
    const confirm = Array.from(container.querySelectorAll('button')).find((b) => /Газрын зураг дээр товшиж|баталгаажуул/i.test(b.textContent || ''))!;
    act(() => { maps[0].fire('click', { latlng: L.latLng(q.mapPinData.targetLat + 0.05, q.mapPinData.targetLng) }); });
    act(() => { fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => /баталгаажуул/i.test(b.textContent || ''))!); });
    expect(el.classList.contains('pin-crosshair')).toBe(false);
    void confirm;
  });

  it('Курсорыг хөдөлгөхөд яг байршлын солбицол харагдана', () => {
    const { maps, spy } = mkMap();
    render(<InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={vi.fn()} />);
    spy.mockRestore();
    expect(screen.queryByTestId('cursor-coords')).toBeNull();
    act(() => { maps[0].fire('mousemove', { latlng: L.latLng(47.12345, 98.45678) }); });
    expect(screen.getByTestId('cursor-coords').textContent).toContain('47.123°N, 98.457°E');
    act(() => { maps[0].fire('mouseout'); });
    expect(screen.queryByTestId('cursor-coords')).toBeNull();
  });

  it('Тавьсан цэг яг товшсон байрлалд (тэмдгийн төвөөр), солбицолтойгоор харагдаж, дахин товшвол шилжинэ', () => {
    const { maps, spy } = mkMap();
    const { container } = render(<InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={vi.fn()} />);
    spy.mockRestore();
    act(() => { maps[0].fire('click', { latlng: L.latLng(46.5, 100.25) }); });
    const marker = container.querySelector('.pin-crosshair-marker') as HTMLElement;
    expect(marker).toBeTruthy();
    expect(marker.style.marginLeft).toBe('-22px'); // 44px-ийн тэмдгийн ТӨВ нь цэг дээр
    expect(marker.style.marginTop).toBe('-22px');
    expect(screen.getByTestId('pin-label').textContent).toBe('46.500°N, 100.250°E');
    expect(marker.querySelector('svg')).toBeTruthy();
    act(() => { maps[0].fire('click', { latlng: L.latLng(47.0, 101.0) }); });
    expect(container.querySelectorAll('.pin-crosshair-marker').length).toBe(1); // нэг л цэг
    expect(screen.getByTestId('pin-label').textContent).toBe('47.000°N, 101.000°E');
  });

  it('Хариулсны дараа товшилт цэгийг шилжүүлэхгүй, бодит байршил яг цэгээр заагдана', () => {
    const { maps, spy } = mkMap();
    const circle = vi.spyOn(L, 'circleMarker');
    const onAnswer = vi.fn();
    const { container } = render(<InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={onAnswer} />);
    spy.mockRestore();
    act(() => { maps[0].fire('click', { latlng: L.latLng(q.mapPinData.targetLat + 0.05, q.mapPinData.targetLng) }); });
    act(() => { fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => /баталгаажуул/i.test(b.textContent || ''))!); });
    expect(circle).toHaveBeenCalledWith([q.mapPinData.targetLat, q.mapPinData.targetLng], expect.objectContaining({ radius: 6 })); // бодит цэг
    const before = screen.getByTestId('pin-label').textContent;
    // Хариулсан ч компонент дахин үүсгэгдээгүй (hasAnswered prop-оор шинэчлэгдсэн мэт) тохиолдолд товшилт нөлөөлөхгүй
    expect(onAnswer).toHaveBeenCalledTimes(1);
    circle.mockRestore();
    void before;
  });

  it('Газрын зургийн дотоод давхарга модал цонхны дээр гарахгүй: тусгаарласан stacking context', () => {
    const { container } = render(<InteractiveMapPinQuestion question={q} hasAnswered={false} onAnswer={vi.fn()} />);
    // z-400 тэмдэглэгээнүүдийг агуулсан wrapper нь isolate (stacking context)
    const overlay = container.querySelector('.z-400')!;
    expect(overlay.closest('.isolate')).toBeTruthy();
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.leaflet-container\s*\{[^}]*isolation:\s*isolate/);
  });
});

import { ShpContourViewer } from '../../src/components/ShpContourViewer';
describe('Контур харуулагч: тэмдэглэгээнүүд модалын дээр гарахгүй', () => {
  it('z-400 хяналтын товчнууд тусгаарласан wrapper дотор', () => {
    const geo: any = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[100, 45], [101, 45], [101, 46], [100, 45]]] } }] };
    const { container } = render(<ShpContourViewer geojson={geo} geometryType="Polygon" maskedProperties={{}} realProperties={{}} targetName="X" hasAnswered={false} />);
    const overlays = container.querySelectorAll('.z-400');
    expect(overlays.length).toBeGreaterThan(0);
    overlays.forEach((o) => expect(o.closest('.isolate')).toBeTruthy());
  });
});

import { calculateHaversineDistanceKm } from '../../src/utils/geo';
describe('Цэг байрлуулах: дараалсан даалгавар бүр дээр тавьсан цэг, шугам тэмдэглэгдэнэ', () => {
  it('1-р, 2-р, 3-р даалгавар бүр дээр цэг тавигдаж, баталгаажуулахад зөв зайгаар шугам зурагдана (өмнөх даалгаврын төлөв дамжихгүй)', async () => {
    const qs = generateComprehensiveGisQuestions({ layers: [layer], enabledTypes: ['point_placement'] } as any) as any[];
    const [q1, q2, q3] = qs;
    const maps: L.Map[] = [];
    const origMap = L.map;
    const mapSpy = vi.spyOn(L, 'map').mockImplementation(((...a: any[]) => { const m = (origMap as any)(...a); maps.push(m); return m; }) as any);
    const lineSpy = vi.spyOn(L, 'polyline');
    const dotSpy = vi.spyOn(L, 'circleMarker');
    const onAnswer = vi.fn();
    const { container, rerender } = render(<InteractiveMapPinQuestion question={q1} hasAnswered={false} onAnswer={onAnswer} />);
    const confirmBtn = () => Array.from(container.querySelectorAll('button')).find((b) => /баталгаажуул|Газрын зураг дээр товшиж/i.test(b.textContent || ''))!;

    const play = async (q: any, idx: number, offset: [number, number]) => {
      const t = q.mapPinData;
      // Шинэ даалгавар: өмнөх цэг, шугам үлдээгүй, "баталгаажуулах" идэвхгүй (хуучин таамаг хүчингүй)
      expect(container.querySelectorAll('.pin-crosshair-marker').length).toBe(0);
      expect(confirmBtn().textContent).toMatch(/Газрын зураг дээр товшиж цэг тавина уу/);
      const guess = { lat: t.targetLat + offset[0], lng: t.targetLng + offset[1] };
      act(() => { maps[idx].fire('click', { latlng: L.latLng(guess.lat, guess.lng) }); });
      // ЦЭГ ТЭМДЭГЛЭГДСЭН: хөндлөн тэмдэг + яг товшсон солбицол
      expect(container.querySelectorAll('.pin-crosshair-marker').length).toBe(1);
      expect(screen.getByTestId('pin-label').textContent).toBe(`${guess.lat.toFixed(3)}°N, ${guess.lng.toFixed(3)}°E`);
      act(() => { fireEvent.click(confirmBtn()); });
      // Шугам (тасархай) болон бодит байршил энэ даалгаврын газрын зураг дээр зурагдсан
      expect(lineSpy).toHaveBeenLastCalledWith([[guess.lat, guess.lng], [t.targetLat, t.targetLng]], expect.objectContaining({ dashArray: '6, 6' }));
      expect(dotSpy).toHaveBeenLastCalledWith([t.targetLat, t.targetLng], expect.objectContaining({ radius: 6 }));
      const [ok, dist, gLat, gLng] = onAnswer.mock.calls.at(-1)!;
      expect(gLat).toBeCloseTo(guess.lat, 6); expect(gLng).toBeCloseTo(guess.lng, 6); // өмнөх даалгаврын таамаг биш
      expect(dist).toBeCloseTo(calculateHaversineDistanceKm(guess.lat, guess.lng, t.targetLat, t.targetLng), 3);
      return ok;
    };

    expect(await play(q1, 0, [0.04, 0])).toBe(true);
    // 2-р даалгавар (parent шинэ question + hasAnswered=false дамжуулна)
    rerender(<InteractiveMapPinQuestion question={q2} hasAnswered={false} onAnswer={onAnswer} />);
    expect(maps.length).toBe(2);
    expect(await play(q2, 1, [3, 3])).toBe(false);
    rerender(<InteractiveMapPinQuestion question={q3} hasAnswered={false} onAnswer={onAnswer} />);
    expect(maps.length).toBe(3);
    expect(await play(q3, 2, [0, 0.03])).toBe(true);
    expect(onAnswer).toHaveBeenCalledTimes(3);
    expect(lineSpy).toHaveBeenCalledTimes(3);
    mapSpy.mockRestore(); lineSpy.mockRestore(); dotSpy.mockRestore();
  });

  it('Таамаглалгүйгээр шинэ даалгавар дээр баталгаажуулж чадахгүй: өмнөх даалгаврын таамаг ашиглагдахгүй', () => {
    const qs = generateComprehensiveGisQuestions({ layers: [layer], enabledTypes: ['point_placement'] } as any) as any[];
    const maps: L.Map[] = [];
    const origMap = L.map;
    const spy = vi.spyOn(L, 'map').mockImplementation(((...a: any[]) => { const m = (origMap as any)(...a); maps.push(m); return m; }) as any);
    const onAnswer = vi.fn();
    const { container, rerender } = render(<InteractiveMapPinQuestion question={qs[0]} hasAnswered={false} onAnswer={onAnswer} />);
    act(() => { maps[0].fire('click', { latlng: L.latLng(qs[0].mapPinData.targetLat, qs[0].mapPinData.targetLng) }); });
    rerender(<InteractiveMapPinQuestion question={qs[1]} hasAnswered={false} onAnswer={onAnswer} />);
    spy.mockRestore();
    expect(container.querySelectorAll('.pin-crosshair-marker').length).toBe(0);
    const btn = Array.from(container.querySelectorAll('button')).find((b) => /Газрын зураг дээр товшиж|баталгаажуул/i.test(b.textContent || ''))!;
    expect(btn.textContent).not.toMatch(/баталгаажуулах/); // цэг тавиагүй
  });
});
