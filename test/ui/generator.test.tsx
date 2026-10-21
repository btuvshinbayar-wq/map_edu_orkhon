// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cleanup, render, screen, fireEvent, act, within } from '@testing-library/react';

const batchAddCustomQuestions = vi.fn();
const addCustomQuestion = vi.fn();
let layers: any[] = [];
vi.mock('../../src/context/AppContext', () => ({
  useApp: () => ({
    gisLayers: layers, updateGisLayer: vi.fn(), customQuestions: [], addCustomQuestion, deleteCustomQuestion: vi.fn(),
    batchDeleteCustomQuestions: vi.fn(), deleteCustomQuestionsByLayer: vi.fn(), batchAddCustomQuestions,
  }),
}));
vi.mock('../../src/utils/audio', () => ({ sound: new Proxy({}, { get: () => () => undefined }) }));
import { GisContourQuestionGenerator } from '../../src/components/GisContourQuestionGenerator';

HTMLCanvasElement.prototype.getContext = (() =>
  new Proxy({}, { get: (_t, p) => (p === 'measureText' ? () => ({ width: 0 }) : () => undefined), set: () => true })) as any;
afterEach(async () => { await new Promise((r) => setTimeout(r, 60)); cleanup(); });

const ring = (cx: number, cy: number, r: number) => { const pts = Array.from({ length: 16 }, (_, k) => [cx + r * Math.cos((k / 16) * 6.283), cy + r * Math.sin((k / 16) * 6.283)]); pts.push(pts[0]); return pts; };
beforeEach(() => {
  batchAddCustomQuestions.mockClear(); addCustomQuestion.mockClear();
  layers = [{
    id: 'ai', name: 'Аймгийн хил', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.5, weight: 2, geometryType: 'Polygon', featureCount: 10,
    nameField: 'aimag_name', createdAt: '',
    geojson: { type: 'FeatureCollection', features: Array.from({ length: 10 }, (_, i) => ({ type: 'Feature', properties: { aimag_name: `Аймаг ${i}` }, geometry: { type: 'Polygon', coordinates: [ring(95 + i * 1.3, 45 + (i % 3) * 0.8, 0.3 + i * 0.03)] } })) },
  }];
});

describe('Даалгавар бэлтгэгч: давхардсан товчнууд арилсан', () => {
  it('Даалгавар үүсгэх товч ЗӨВХӨН хоёр: ганц обьектоор, олноор (төрлөөр). Давхардсан "олноор нэмэх" товч алга', () => {
    render(<GisContourQuestionGenerator />);
    const names = screen.getAllByRole('button').map((b) => (b.textContent || '').replace(/\s+/g, ' ').trim());
    expect(names.filter((n) => /олноор/.test(n) && /нэмэх|үүсгэх/.test(n))).toEqual(['10 обьектоор, 1 төрлөөр олноор үүсгэх']);
    expect(names.some((n) => /Сонгосон давхаргын .* обьектоор олноор нэмэх/.test(n))).toBe(false);
    expect(names.some((n) => /олноор нь даалгавар үүсгэх/.test(n))).toBe(false);
    expect(names.some((n) => /Сонгосон 1 обьектоор нэмэх/.test(n))).toBe(true); // ганц обьектийн товч хэвээр
    expect(names.some((n) => /Газрын зураг \/ Уралдаанд идэвхжүүлэх/.test(n))).toBe(true); // өөр үүрэгтэй (газрын зургийн шүүлт) тул хэвээр
  });

  it('Үлдсэн олноор үүсгэх товч: шалгах цонх нээгдэж, баталсны дараа л санд орно', async () => {
    render(<GisContourQuestionGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /10 обьектоор, 1 төрлөөр олноор үүсгэх/ }));
    expect(screen.getByText(/Даалгаврыг урьдчилан харах ба засах/)).toBeTruthy();
    expect(batchAddCustomQuestions).not.toHaveBeenCalled(); // шууд нэмэгдээгүй
    expect(screen.getByText(/10 \/ 10 даалгавар сонгосон/)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Санд нэмэх \(10\)/ })); });
    expect(batchAddCustomQuestions).toHaveBeenCalledTimes(1);
    const saved = batchAddCustomQuestions.mock.calls[0][0];
    expect(saved.length).toBe(10);
    expect(saved.every((q: any) => q.gisAutoTaskType === 'contour_shape' && q.shpContourData.layerName === 'Аймгийн хил')).toBe(true);
    expect(saved.every((q: any) => Array.isArray(q.gradeLevels) && q.gradeLevels.length === 0)).toBe(true); // ангилалгүй: зөвхөн Сорил
  });
});

describe('Даалгавар бэлтгэгч: 30-аас олон обьект', () => {
  it('45 обьекттой давхаргаас 45 даалгавар үүсч, шалгах цонх 30-аар хуудаслаж, санд бүгд нэмэгдэнэ', async () => {
    layers = [{
      id: 'sum', name: 'Сум', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.5, weight: 2, geometryType: 'Polygon', featureCount: 45, nameField: 'nm', createdAt: '',
      geojson: { type: 'FeatureCollection', features: Array.from({ length: 45 }, (_, i) => ({ type: 'Feature', properties: { nm: `Сум ${i}` }, geometry: { type: 'Polygon', coordinates: [ring(95 + (i % 15) * 0.8, 45 + Math.floor(i / 15) * 0.8, 0.2 + (i % 5) * 0.02)] } })) },
    }];
    render(<GisContourQuestionGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /45 обьектоор, 1 төрлөөр олноор үүсгэх/ }));
    expect(screen.getByText(/45 \/ 45 даалгавар сонгосон/)).toBeTruthy(); // 30 биш 45
    expect(document.querySelectorAll('textarea[aria-label="Асуултын текст"]').length).toBe(30); // эхний хуудас
    expect(screen.getByText(/30 \/ 45 даалгавар харагдаж байна/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Цааш харуулах \(\+15\)/ }));
    expect(document.querySelectorAll('textarea[aria-label="Асуултын текст"]').length).toBe(45);
    expect(screen.queryByText(/харагдаж байна/)).toBeNull();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Санд нэмэх \(45\)/ })); });
    expect(batchAddCustomQuestions.mock.calls.at(-1)![0].length).toBe(45);
  });

  it('Хуудасласан үед нуугдсан даалгавар ч санд орно (харагдахгүй байсан ч)', async () => {
    layers = [{
      id: 'sum', name: 'Сум', visible: true, color: '#000', fillColor: '#000', fillOpacity: 0.5, weight: 2, geometryType: 'Polygon', featureCount: 80, nameField: 'nm', createdAt: '',
      geojson: { type: 'FeatureCollection', features: Array.from({ length: 80 }, (_, i) => ({ type: 'Feature', properties: { nm: `Сум ${i}` }, geometry: { type: 'Polygon', coordinates: [ring(95 + (i % 20) * 0.7, 45 + Math.floor(i / 20) * 0.8, 0.2 + (i % 5) * 0.02)] } })) },
    }];
    render(<GisContourQuestionGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /80 обьектоор, 1 төрлөөр олноор үүсгэх/ }));
    expect(document.querySelectorAll('textarea[aria-label="Асуултын текст"]').length).toBe(30);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Санд нэмэх \(80\)/ })); });
    const saved = batchAddCustomQuestions.mock.calls.at(-1)![0];
    expect(saved.length).toBe(80);
    expect(new Set(saved.map((q: any) => q.shpContourData.featureId)).size).toBe(80);
  });
});
