// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import L from 'leaflet';
import { RealLeafletMap } from '../../src/components/RealLeafletMap';
import { CategoryColorEditor } from '../../src/components/CategoryColorEditor';
import { autoColorMap } from '../../src/utils/layerColors';

HTMLCanvasElement.prototype.getContext = (() =>
  new Proxy({}, { get: (_t, p) => (p === 'measureText' ? () => ({ width: 0 }) : () => undefined), set: () => true })) as any;

const kinds = ['Нуур', 'Нуур', 'Хөв', 'Далай', 'Далай', 'Тал'];
const poly = (i: number) => ({
  type: 'Feature', properties: { name: `О${i}`, type: kinds[i] }, geometry: { type: 'Polygon', coordinates: [[[100 + i, 45], [100.5 + i, 45], [100.5 + i, 45.5], [100 + i, 45]]] },
});
const geojson: any = { type: 'FeatureCollection', features: kinds.map((_, i) => poly(i)) };
const baseLayer: any = {
  id: 'z1', name: 'Бүс', visible: true, color: '#000', fillColor: '#999999', fillOpacity: 0.5, weight: 2, geometryType: 'Polygon',
  featureCount: 6, geojson, nameField: 'name', createdAt: '',
};

// Leaflet-ийн хойшлогдсон зурлага дуустал хүлээгээд цэвэрлэнэ (jsdom-ийн canvas stub-д зориулсан)
afterEach(async () => {
  await new Promise((r) => setTimeout(r, 80));
  cleanup();
});

describe('Полигоныг агуулгаар нь өнгөөр дүүргэх', () => {
  it('Газрын зураг дээр обьект бүр утгынхаа өнгөөр зурагдана', () => {
    const colorMap = { Нуур: '#ff0000', Хөв: '#00ff00', Далай: '#0000ff', Тал: '#ffff00' };
    const styles: any[] = [];
    const orig = L.geoJSON;
    const spy = vi.spyOn(L, 'geoJSON').mockImplementation(((data: any, opts: any) => {
      if (opts?.style && data?.features?.length === 6) styles.push(...data.features.map((f: any) => opts.style(f)));
      return (orig as any)(data, opts);
    }) as any);
    const layer = { ...baseLayer, colorByField: 'type', colorMap };
    const { container } = render(<RealLeafletMap vectorLayers={[layer]} hideLabels={false} />);
    spy.mockRestore();
    expect(styles.map((s) => s.fillColor)).toEqual(['#ff0000', '#ff0000', '#00ff00', '#0000ff', '#0000ff', '#ffff00']);
    // Legend
    expect(container.textContent).toContain('Бүс: type');
    expect(container.textContent).toContain('Далай');
  });

  it('Ангилал тохируулаагүй бол өмнөх шигээ нэг өнгөөр', () => {
    const styles: any[] = [];
    const orig = L.geoJSON;
    const spy = vi.spyOn(L, 'geoJSON').mockImplementation(((data: any, opts: any) => {
      if (opts?.style && data?.features?.length === 6) styles.push(...data.features.map((f: any) => opts.style(f)));
      return (orig as any)(data, opts);
    }) as any);
    render(<RealLeafletMap vectorLayers={[baseLayer]} hideLabels={false} />);
    spy.mockRestore();
    expect(new Set(styles.map((s) => s.fillColor))).toEqual(new Set(['#999999']));
  });

  it('Админы самбар: багана сонгоход өнгө автоматаар оноогдож, гараар засагдана', () => {
    const onChange = vi.fn();
    const { container } = render(<CategoryColorEditor layer={baseLayer} onChange={onChange} />);
    const select = container.querySelector('select')!;
    // "name" (обьект бүрт өөр) санал болгогдохгүй, "type" санал болгогдоно
    const opts = Array.from(select.querySelectorAll('option')).map((o) => o.value);
    expect(opts).toContain('type');
    expect(opts).not.toContain('name');
    fireEvent.change(select, { target: { value: 'type' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const update = onChange.mock.calls[0][0];
    expect(update.colorByField).toBe('type');
    expect(Object.keys(update.colorMap).sort()).toEqual(['Далай', 'Нуур', 'Тал', 'Хөв']);
    expect(new Set(Object.values(update.colorMap)).size).toBe(4);
  });

  it('Идэвхтэй үед өнгө бүрийг гараар солиход зөвхөн тухайн утга өөрчлөгдөнө', () => {
    const onChange = vi.fn();
    const layer = { ...baseLayer, colorByField: 'type', colorMap: autoColorMap(geojson, 'type') };
    const { container } = render(<CategoryColorEditor layer={layer} onChange={onChange} />);
    const pickers = container.querySelectorAll('input[type="color"]');
    expect(pickers.length).toBe(4);
    fireEvent.change(pickers[0], { target: { value: '#123456' } });
    const update = onChange.mock.calls[0][0];
    const changed = Object.entries(update.colorMap).filter(([k, v]) => v !== (layer.colorMap as any)[k]);
    expect(changed.length).toBe(1);
    expect(changed[0][1]).toBe('#123456');
    // Ангилалыг цуцлах
    fireEvent.change(container.querySelector('select')!, { target: { value: '' } });
    expect(onChange.mock.calls[1][0]).toEqual({ colorByField: undefined, colorMap: undefined });
  });
});
