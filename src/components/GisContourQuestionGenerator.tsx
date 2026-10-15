import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Compass,
  MapPin,
  CheckCircle2,
  Trash2,
  Eye,
  Plus,
  Zap,
  Lock,
  Unlock,
  Table,
  ShieldCheck,
  Search,
  Database,
  Sliders,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Question, ActiveGisLayer, GradeLevel } from '../types';
import { ShpContourViewer } from './ShpContourViewer';
import {
  detectBestNameField,
  extractFeatureName,
  getLayerAttributeColumns,
  calculateFeatureLengthKm,
  calculateFeatureAreaKm2,
} from '../utils/gisUtils';
import {
  generateComprehensiveGisQuestions,
  GIS_AUTO_TASK_TYPE_LABELS,
  GisAutoTaskType,
} from '../utils/gisAutoQuestionGenerator';

export const GisContourQuestionGenerator: React.FC = () => {
  const {
    gisLayers,
    updateGisLayer,
    customQuestions,
    addCustomQuestion,
    deleteCustomQuestion,
    batchDeleteCustomQuestions,
    deleteCustomQuestionsByLayer,
    batchAddCustomQuestions,
  } = useApp();

  // State for managing the created questions list at the bottom (filter by layer, search, bulk select/remove)
  const [questionLayerFilter, setQuestionLayerFilter] = useState<string>('all');
  const [questionListSearch, setQuestionListSearch] = useState<string>('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Selected GIS Layer
  const [selectedLayerId, setSelectedLayerId] = useState<string>(
    gisLayers[0]?.id || 'mongolia_boundaries'
  );

  const currentLayer: ActiveGisLayer | undefined = useMemo(() => {
    return gisLayers.find((l) => l.id === selectedLayerId) || gisLayers[0];
  }, [gisLayers, selectedLayerId]);

  // Features of the selected layer
  const features = useMemo(() => {
    if (!currentLayer || !currentLayer.geojson) return [];
    if (Array.isArray(currentLayer.geojson.features)) {
      return currentLayer.geojson.features;
    }
    if (currentLayer.geojson.type === 'Feature') {
      return [currentLayer.geojson];
    }
    return [];
  }, [currentLayer]);

  // Detect all DBF attribute columns and best name column for this layer
  const attributeColumns = useMemo(() => {
    return getLayerAttributeColumns(features);
  }, [features]);

  const autoDetectedNameField = useMemo(() => {
    return currentLayer?.nameField || detectBestNameField(features);
  }, [currentLayer?.nameField, features]);

  const [selectedNameField, setSelectedNameField] = useState<string>('');

  // Sync selectedNameField when layer changes
  useEffect(() => {
    setSelectedNameField(currentLayer?.nameField || autoDetectedNameField || '');
  }, [currentLayer?.nameField, autoDetectedNameField, selectedLayerId]);

  // Selected feature index to isolate
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState<number>(0);
  const [featureSearch, setFeatureSearch] = useState<string>('');
  const [minMetricInput, setMinMetricInput] = useState<string>('');
  const [maxMetricInput, setMaxMetricInput] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(80);

  // When layer changes, reset selected index & range filters
  useEffect(() => {
    setSelectedFeatureIdx(0);
    setFeatureSearch('');
    setMinMetricInput('');
    setMaxMetricInput('');
    setVisibleLimit(80);
  }, [selectedLayerId]);

  // Pre-compute feature names, length (km), and area (km²) once per layer/field change
  const indexedFeatures = useMemo<
    {
      feature: any;
      originalIdx: number;
      name: string;
      geomType: string;
      lengthKm: number;
      areaKm2: number;
    }[]
  >(() => {
    const activeField = selectedNameField || autoDetectedNameField;
    return features.map((f: any, idx: number) => {
      const geomType = f.geometry?.type || currentLayer?.geometryType || 'Polygon';
      return {
        feature: f,
        originalIdx: idx,
        name: extractFeatureName(f.properties, idx, activeField),
        geomType,
        lengthKm: calculateFeatureLengthKm(f),
        areaKm2: calculateFeatureAreaKm2(f),
      };
    });
  }, [features, selectedNameField, autoDetectedNameField, currentLayer?.geometryType]);

  // Determine whether this layer is primarily Polyline (length filter) or Polygon (area filter)
  const layerMetricInfo = useMemo(() => {
    const hasPolylines = indexedFeatures.some(
      (item) => item.geomType === 'LineString' || item.geomType === 'MultiLineString'
    );
    const hasPolygons = indexedFeatures.some(
      (item) => item.geomType === 'Polygon' || item.geomType === 'MultiPolygon'
    );

    const mode: 'length' | 'area' | 'none' = hasPolylines
      ? 'length'
      : hasPolygons
      ? 'area'
      : 'none';

    if (mode === 'none' || indexedFeatures.length === 0) {
      return { mode, minVal: 0, maxVal: 0, avgVal: 0, unit: '' };
    }

    const values = indexedFeatures
      .map((item) => (mode === 'length' ? item.lengthKm : item.areaKm2))
      .filter((v) => v > 0);

    if (values.length === 0) {
      return {
        mode,
        minVal: 0,
        maxVal: 0,
        avgVal: 0,
        unit: mode === 'length' ? 'км' : 'км²',
      };
    }

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avgVal = Math.round((sum / values.length) * 100) / 100;

    return {
      mode,
      minVal,
      maxVal,
      avgVal,
      unit: mode === 'length' ? 'км' : 'км²',
    };
  }, [indexedFeatures]);

  const selectedFeature = features[selectedFeatureIdx] || features[0];

  // Isolated single-feature GeoJSON
  const isolatedGeojson = useMemo(() => {
    if (!selectedFeature) return null;
    return {
      type: 'FeatureCollection',
      features: [selectedFeature],
    };
  }, [selectedFeature]);

  // Extracted feature name (editable by Admin if needed)
  const extractedName = useMemo(() => {
    if (!selectedFeature) return '';
    return extractFeatureName(
      selectedFeature.properties,
      selectedFeatureIdx,
      selectedNameField || autoDetectedNameField
    );
  }, [selectedFeature, selectedFeatureIdx, selectedNameField, autoDetectedNameField]);

  const [customTargetName, setCustomTargetName] = useState<string>('');

  // Form Fields for the new question
  const [questionTitle, setQuestionTitle] = useState('');
  const [categoryLabel, setCategoryLabel] = useState('аймаг');
  const [selectedGrades, setSelectedGrades] = useState<GradeLevel[]>([]); // Бэлтгэсэн даалгавар ангилалгүй: бүгд Сорил хэсэгт хадгалагдана
  const [questionPoints, setQuestionPoints] = useState<number>(15);
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [explanation, setExplanation] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Preview state (simulating contestant view vs revealed view)
  const [previewAnswered, setPreviewAnswered] = useState<boolean>(false);
  const [canvasTheme, setCanvasTheme] = useState<'light' | 'dark'>('light');
  const [testingQuestionModal, setTestingQuestionModal] = useState<Question | null>(null);
  const [selectedBatchTaskTypes, setSelectedBatchTaskTypes] = useState<GisAutoTaskType[]>([
    'contour_shape',
  ]);

  // Auto-detect category label from layer name or feature
  const detectCategoryLabel = (layerName: string): string => {
    const lower = layerName.toLowerCase();
    if (lower.includes('сум') || lower.includes('sum') || lower.includes('soum')) return 'сум';
    if (lower.includes('аймаг') || lower.includes('boundary') || lower.includes('хил')) return 'аймаг';
    if (lower.includes('гол') || lower.includes('нуур') || lower.includes('ус') || lower.includes('hydro')) return 'гол / нуур';
    if (lower.includes('хамгаалалт') || lower.includes('тхгн') || lower.includes('парк')) return 'тусгай хамгаалалттай газар';
    if (lower.includes('орд') || lower.includes('уурхай') || lower.includes('mining')) return 'стратегийн орд';
    if (lower.includes('зам') || lower.includes('road')) return 'авто замын коридор';
    return 'газарзүйн обьект';
  };

  // When selected feature or name column changes, automatically populate fields and distractors!
  useEffect(() => {
    if (!selectedFeature || !currentLayer) return;

    const detected = detectCategoryLabel(currentLayer.name);
    setCategoryLabel(detected);

    const activeField = selectedNameField || autoDetectedNameField;
    const fName = extractFeatureName(selectedFeature.properties, selectedFeatureIdx, activeField);
    setCustomTargetName(fName);

    setQuestionTitle(`🔍 [Бодит SHP Контур] Зурагт өгөгдсөн контур дүрс аль ${detected} вэ?`);

    // Sibling feature names for distractors using pre-computed indexedFeatures
    const siblingNames: string[] = indexedFeatures
      .map((item) => item.name)
      .filter((n: string) => Boolean(n) && n !== fName);

    // Pick 3 random unique distractors
    const shuffledSiblings: string[] = [...new Set(siblingNames)]
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Fallbacks if fewer than 3 sibling features exist in the layer
    const fallbackDistractors = [
      'Архангай аймаг',
      'Завхан аймаг',
      'Булган аймаг',
      'Увс аймаг',
      'Хөвсгөл аймаг',
      'Өмнөговь аймаг',
    ].filter((n) => n !== fName);

    while (shuffledSiblings.length < 3) {
      const fb = fallbackDistractors.find((d) => !shuffledSiblings.includes(d) && d !== fName);
      if (fb) shuffledSiblings.push(fb);
      else shuffledSiblings.push(`Сонголт ${shuffledSiblings.length + 1}`);
    }

    // Assemble 4 options and shuffle
    const allOptions: string[] = [fName, ...shuffledSiblings].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    // Auto-explanation
    const props = selectedFeature.properties || {};
    const center = props.CENTER ? ` Төв нь ${props.CENTER}.` : '';
    const area = props.AREA_SQKM ? ` Нутаг дэвсгэр: ${props.AREA_SQKM.toLocaleString()} км².` : '';
    const note = props.HIGHLIGHT ? ` Онцлог: ${props.HIGHLIGHT}.` : '';
    setExplanation(`Энэ бол ${fName}-ийн бодит хил хязгаарын вектор контур юм.${center}${area}${note}`);
    setPreviewAnswered(false);
  }, [selectedFeature, selectedFeatureIdx, currentLayer, features, selectedNameField, autoDetectedNameField]);

  const effectiveTargetName = customTargetName.trim() || extractedName;

  // Masked and Real attributes calculation (ensuring name field and matching values are masked)
  const { maskedProps, realProps } = useMemo(() => {
    if (!selectedFeature) return { maskedProps: {}, realProps: {} };
    const raw = selectedFeature.properties || {};
    const real: Record<string, any> = {};
    const masked: Record<string, string> = {};
    const activeField = (selectedNameField || autoDetectedNameField || '').toUpperCase();
    const targetLower = effectiveTargetName.toLowerCase();

    Object.entries(raw).forEach(([k, val]) => {
      if (k === 'id' || k === 'centerCoords') return;
      const keyUpper = k.toUpperCase();
      const valStr = String(val ?? '').trim();
      real[k] = val;

      // Mask if this key is the selected name column, or a known name/center column, or contains the target name
      const isNameKey =
        keyUpper === activeField ||
        keyUpper.includes('NAME') ||
        keyUpper.includes('НЭР') ||
        keyUpper.includes('NER') ||
        keyUpper.includes('TITLE') ||
        keyUpper.includes('CENTER') ||
        keyUpper.includes('ТӨВ') ||
        keyUpper.includes('AIMAG') ||
        keyUpper.includes('АЙМАГ') ||
        keyUpper.includes('SUM') ||
        keyUpper.includes('SOUM') ||
        keyUpper.includes('СУМ') ||
        keyUpper.includes('ADM1') ||
        keyUpper.includes('ADM2') ||
        (targetLower.length > 2 && valStr.toLowerCase().includes(targetLower));

      if (isNameKey) {
        masked[k] = '[ ? ? ? НУУЦЛАГДСАН ]';
      } else {
        masked[k] = valStr;
      }
    });

    if (Object.keys(masked).length === 0) {
      masked['НЭР'] = '[ ? ? ? НУУЦЛАГДСАН ]';
      masked['КООРДИНАТ'] = 'WGS84 бодит контур';
    }

    return { maskedProps: masked, realProps: real };
  }, [selectedFeature, selectedNameField, autoDetectedNameField, effectiveTargetName]);

  // Handler: Save Single Feature Contest Question
  const handleSaveQuestion = () => {
    if (!selectedFeature || !effectiveTargetName) return;

    // Ensure one option matches effectiveTargetName
    const finalOptions = options.includes(effectiveTargetName)
      ? options
      : [effectiveTargetName, ...options.slice(1)];

    const newQuestion: Question = {
      id: `custom_shp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      category: 'mongolia',
      gradeLevels: selectedGrades,
      type: 'shp_contour_guess',
      title:
        questionTitle ||
        `🔍 [Бодит SHP Обьект] Зурагт өгөгдсөн обьект аль ${categoryLabel} вэ?`,
      subtitle: `Ямар ч нэршилгүй суурь зураг (хиймэл дагуул эсвэл контур) болон масштабын шугамыг ажиглан таана уу. Нэр ба аттрибют мэдээлэл нууцлагдсан.`,
      targetName: effectiveTargetName,
      targetId: selectedFeature.properties?.id || `feat_${selectedFeatureIdx}`,
      explanation: explanation || `${effectiveTargetName}-ийн бодит орон зайн байршил.`,
      difficulty: 'medium',
      points: questionPoints,
      gisAutoTaskType: 'contour_shape',
      shpContourData: {
        featureId: selectedFeature.properties?.id || `f_${selectedFeatureIdx}`,
        layerName: currentLayer?.name || 'Вектор давхарга',
        geometryType: selectedFeature.geometry?.type || 'Polygon',
        geojson: isolatedGeojson,
        categoryLabel: categoryLabel || 'Аймаг',
        maskedProperties: maskedProps,
        realProperties: realProps,
        targetName: effectiveTargetName,
        options: finalOptions,
        hints: [
          `WGS84 бодит солбицолтой нэргүй суурь зураг`,
          `Зүүн доод булангийн масштабын шугамыг (км) ажиглана уу`,
        ],
      },
      options: finalOptions.map((opt, i) => ({
        id: String(i + 1),
        text: opt,
        isCorrect: opt.trim() === effectiveTargetName.trim(),
      })),
    };

    addCustomQuestion(newQuestion);
    setSuccessToast(
      `"${effectiveTargetName}" обьектийг таслан авч уралдааны даалгавар болгон санд амжилттай нэмлээ!`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Filter features list by search AND by Polyline length (km) or Polygon area (km²) range!
  const filteredFeatures = useMemo(() => {
    const term = featureSearch.trim().toLowerCase();
    const minVal = minMetricInput.trim() !== '' ? Number(minMetricInput) : null;
    const maxVal = maxMetricInput.trim() !== '' ? Number(maxMetricInput) : null;

    return indexedFeatures.filter((item) => {
      if (term && !item.name.toLowerCase().includes(term)) {
        return false;
      }
      if (layerMetricInfo.mode === 'length') {
        if (minVal !== null && !Number.isNaN(minVal) && item.lengthKm < minVal) return false;
        if (maxVal !== null && !Number.isNaN(maxVal) && item.lengthKm > maxVal) return false;
      } else if (layerMetricInfo.mode === 'area') {
        if (minVal !== null && !Number.isNaN(minVal) && item.areaKm2 < minVal) return false;
        if (maxVal !== null && !Number.isNaN(maxVal) && item.areaKm2 > maxVal) return false;
      }
      return true;
    });
  }, [indexedFeatures, featureSearch, minMetricInput, maxMetricInput, layerMetricInfo.mode]);

  // Handler: Apply filtered objects to Map, Competition & Challenge (selectedFeatureIndices)
  const handleApplyFilterToActiveLayer = () => {
    if (!currentLayer) return;
    if (filteredFeatures.length === 0) return;
    const isAll = filteredFeatures.length === indexedFeatures.length;
    updateGisLayer(currentLayer.id, {
      selectedFeatureIndices: isAll
        ? undefined
        : filteredFeatures.map((item) => item.originalIdx),
    });
    setSuccessToast(
      `Шүүлтүүрт тохирсон ${filteredFeatures.length} обьектийг Газрын зураг, Уралдаан, Сорил хэсэгт харуулахаар тохирууллаа!`
    );
    setTimeout(() => setSuccessToast(null), 4500);
  };

  // Handler: Batch Generate Questions for Filtered (or All) features in this layer!
  const handleBatchGenerateAll = () => {
    const sourceList = filteredFeatures.length > 0 ? filteredFeatures : indexedFeatures;
    if (!currentLayer || sourceList.length === 0) return;

    const activeField = selectedNameField || autoDetectedNameField;
    const activeFieldUpper = (activeField || '').toUpperCase();
    const allUniqueNames = Array.from(
      new Set(indexedFeatures.map((item) => item.name).filter(Boolean))
    );
    // Cap batch generation to 100 features at once so question bank remains fast
    const targetSlice = sourceList.slice(0, 100);

    const isRangeFiltered =
      minMetricInput.trim() !== '' || maxMetricInput.trim() !== '';
    const rangeDesc = isRangeFiltered
      ? layerMetricInfo.mode === 'length'
        ? ` (Урт: ${minMetricInput || '0'}–${maxMetricInput || '∞'} км)`
        : layerMetricInfo.mode === 'area'
        ? ` (Талбай: ${minMetricInput || '0'}–${maxMetricInput || '∞'} км²)`
        : ''
      : '';

    const generatedBatch: Question[] = targetSlice.map(
      ({ feature: feat, originalIdx: idx, name: fName, lengthKm, areaKm2, geomType }) => {
        const fNameLower = fName.toLowerCase();
        const singleGeo = {
          type: 'FeatureCollection',
          features: [feat],
        };

        // Distractors from pre-computed unique sibling names (O(1) sampling)
        const siblingPool = allUniqueNames.filter((n) => n !== fName);
        const shuffledSiblings: string[] = siblingPool
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);

        const fallbackDistractors = [
          'Архангай аймаг',
          'Завхан аймаг',
          'Булган аймаг',
          'Увс аймаг',
          'Хөвсгөл аймаг',
          'Өмнөговь аймаг',
        ].filter((n) => n !== fName);

        while (shuffledSiblings.length < 3) {
          const fb = fallbackDistractors.find(
            (d) => !shuffledSiblings.includes(d) && d !== fName
          );
          if (fb) shuffledSiblings.push(fb);
          else shuffledSiblings.push(`Сонголт ${shuffledSiblings.length + 1}`);
        }

        const allOpts: string[] = [fName, ...shuffledSiblings].sort(
          () => Math.random() - 0.5
        );

        // Mask properties
        const raw = feat.properties || {};
        const real: Record<string, any> = {};
        const masked: Record<string, string> = {};

        Object.entries(raw).forEach(([k, val]) => {
          if (k === 'id' || k === 'centerCoords') return;
          const keyUpper = k.toUpperCase();
          const valStr = String(val ?? '').trim();
          real[k] = val;
          if (
            keyUpper === activeFieldUpper ||
            keyUpper.includes('NAME') ||
            keyUpper.includes('НЭР') ||
            keyUpper.includes('NER') ||
            keyUpper.includes('TITLE') ||
            keyUpper.includes('CENTER') ||
            keyUpper.includes('ТӨВ') ||
            keyUpper.includes('AIMAG') ||
            keyUpper.includes('АЙМАГ') ||
            keyUpper.includes('SUM') ||
            keyUpper.includes('SOUM') ||
            keyUpper.includes('СУМ') ||
            keyUpper.includes('ADM1') ||
            keyUpper.includes('ADM2') ||
            (fNameLower.length > 2 && valStr.toLowerCase().includes(fNameLower))
          ) {
            masked[k] = '[ ? ? ? НУУЦЛАГДСАН ]';
          } else {
            masked[k] = valStr;
          }
        });

        const metricHint =
          geomType === 'LineString' || geomType === 'MultiLineString'
            ? `Урт: ${lengthKm.toLocaleString()} км`
            : geomType === 'Polygon' || geomType === 'MultiPolygon'
            ? `Талбай: ${areaKm2.toLocaleString()} км²`
            : 'Бодит координатын байршил';

        return {
          id: `custom_batch_${Date.now()}_${idx}_${Math.random()
            .toString(36)
            .substring(2, 6)}`,
          category: 'mongolia' as const,
          gradeLevels: selectedGrades,
          type: 'shp_contour_guess' as const,
          title: `🔍 [Бодит SHP Обьект] Зурагт өгөгдсөн обьект аль ${categoryLabel} вэ?`,
          subtitle: `Contour map болон масштабын хэмжээсийг (${metricHint}) шинжлэн таана уу.`,
          targetName: fName,
          targetId: feat.properties?.id || `feat_${idx}`,
          explanation: `${fName} (${metricHint}).`,
          difficulty: 'medium' as const,
          points: questionPoints,
          gisAutoTaskType: 'contour_shape',
          shpContourData: {
            featureId: feat.properties?.id || `batch_f_${idx}`,
            layerName: currentLayer.name,
            geometryType: (geomType as any) || 'Polygon',
            geojson: singleGeo,
            categoryLabel: categoryLabel || 'Аймаг',
            maskedProperties: masked,
            realProperties: real,
            targetName: fName,
            options: allOpts,
            hints: [metricHint, 'Бодит координатын хил зааг'],
          },
          options: allOpts.map((opt: string, optIdx: number) => ({
            id: String(optIdx + 1),
            text: opt,
            isCorrect: opt.trim() === fName.trim(),
          })),
        };
      }
    );

    batchAddCustomQuestions(generatedBatch);
    setSuccessToast(
      `"${currentLayer.name}" давхаргын шүүгдсэн ${generatedBatch.length} обьектоор${rangeDesc} уралдааны даалгавар үүсгэж санд амжилттай нэмлээ!`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Main Studio Card */}
      <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs font-bold text-lg">
              🎯
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Вектор / SHP Давхаргаас Сонгож Даалгавар Бэлтгэгч (Ганц ганцаар болон Олноор нэмэх)
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Систем автоматаар даалгавар үүсгэхгүй. Зөвхөн Админ тодорхой давхаргаас (layer) сонгож ганц ганцаар эсвэл шүүсэн обьектуудаар олноор нь асуултын санд нэмнэ.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveQuestion}
              disabled={!selectedFeature || !effectiveTargetName}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Зүүн талд сонгосон 1 обьектоор даалгавар нэмэх"
            >
              <Plus className="h-4 w-4" />
              <span>Сонгосон 1 обьектоор нэмэх</span>
            </button>

            <button
              type="button"
              onClick={handleBatchGenerateAll}
              disabled={!currentLayer || filteredFeatures.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Сонгосон давхаргын шүүгдсэн (эсвэл бүх) обьектоор олноор нь даалгавар нэмэх"
            >
              <Zap className="h-4 w-4" />
              <span>
                {filteredFeatures.length < features.length
                  ? `Сонгосон давхаргын шүүгдсэн ${filteredFeatures.length} обьектоор олноор нэмэх`
                  : `Сонгосон давхаргын ${features.length} обьектоор олноор нэмэх`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (!currentLayer) return;
                // Temporarily filter currentLayer geojson features to only filteredFeatures when admin has applied a search/length/area filter
                const filteredLayerForBatch: ActiveGisLayer =
                  filteredFeatures.length > 0 && filteredFeatures.length < features.length
                    ? {
                        ...currentLayer,
                        geojson: {
                          type: 'FeatureCollection',
                          features: filteredFeatures.map((item) => item.feature),
                        },
                      }
                    : currentLayer;

                const batchQuestions = generateComprehensiveGisQuestions({
                  layers: [filteredLayerForBatch],
                  enabledTypes: selectedBatchTaskTypes,
                  gradeLevels: selectedGrades,
                  pointsPerQuestion: questionPoints,
                  maxQuestionsPerLayer: Math.max(20, filteredFeatures.length * selectedBatchTaskTypes.length),
                });
                if (batchQuestions.length > 0) {
                  batchAddCustomQuestions(batchQuestions);
                  setSuccessToast(
                    `"${currentLayer.name}" давхаргаас сонгосон ${selectedBatchTaskTypes.length} төрлөөр ${batchQuestions.length} даалгавар олноор үүсгэж санд нэмлээ!`
                  );
                  setTimeout(() => setSuccessToast(null), 5000);
                }
              }}
              disabled={!currentLayer || features.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3.5 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Сонгосон давхаргаас сонгосон даалгаврын төрлүүдээр олноор нэмэх"
            >
              <Plus className="h-4 w-4" />
              <span>Сонгосон төрлүүдээр ({selectedBatchTaskTypes.length}) олноор нэмэх</span>
            </button>
          </div>
        </div>

        {/* Selectable Task Types Bar for Batch Addition from Chosen Layer */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-800">
              Сонгосон давхаргаас («{currentLayer?.name || 'Сонгоогүй'}») олноор даалгавар нэмэх төрөл сонгох:
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setSelectedBatchTaskTypes(GIS_AUTO_TASK_TYPE_LABELS.map((t) => t.id))
                }
                className="font-semibold text-sky-700 hover:underline cursor-pointer"
              >
                Бүх төрлийг чагтлах
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedBatchTaskTypes(['contour_shape'])}
                className="font-semibold text-slate-600 hover:underline cursor-pointer"
              >
                Зөвхөн контур дүрс таах
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {GIS_AUTO_TASK_TYPE_LABELS.map((t) => {
              const checked = selectedBatchTaskTypes.includes(t.id);
              return (
                <label
                  key={t.id}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] cursor-pointer transition-all ${
                    checked
                      ? `${t.badgeColor} font-bold shadow-2xs`
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelectedBatchTaskTypes((prev) =>
                        prev.includes(t.id)
                          ? prev.length > 1
                            ? prev.filter((item) => item !== t.id)
                            : prev
                          : [...prev, t.id]
                      );
                    }}
                    className="h-3 w-3 rounded text-sky-600 cursor-pointer"
                  />
                  <span>{t.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 2-Column Workflow Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Layer & Feature Selection */}
          <div className="lg:col-span-5 space-y-4">
            {/* Step 1: Select GIS Layer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Вектор / SHP давхарга сонгох ({gisLayers.length} давхарга байна)
              </label>
              <select
                value={selectedLayerId}
                onChange={(e) => setSelectedLayerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-medium focus:border-sky-500 focus:outline-none shadow-xs"
              >
                {gisLayers.map((layer) => (
                  <option key={layer.id} value={layer.id}>
                    {layer.name} ({layer.featureCount || layer.geojson?.features?.length || 1} обьект · {layer.geometryType})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 1.5: Select DBF Attribute Column for Object Name */}
            {attributeColumns.length > 0 && (
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3 space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                  <Database className="h-3.5 w-3.5 text-sky-600" />
                  <span>Обьектийн нэр унших багана (.dbf талбар):</span>
                </label>
                <select
                  value={selectedNameField}
                  onChange={(e) => setSelectedNameField(e.target.value)}
                  className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:border-sky-500 focus:outline-none"
                >
                  {attributeColumns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.key} — Жишээ: {col.sampleValues.join(', ') || 'хоосон'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Step 1.8: Polyline Length (km) OR Polygon Area (km²) Range Filter & Batch Generator */}
            {layerMetricInfo.mode !== 'none' && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                    <Sliders className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                    <span>
                      {layerMetricInfo.mode === 'length'
                        ? '📏 Polyline обьектийг уртаар нь шүүх (км):'
                        : '📐 Polygon обьектийг талбайн хэмжээгээр нь шүүх (км²):'}
                    </span>
                  </span>
                  <span className="rounded-full bg-amber-200/90 px-2 py-0.5 text-[10px] font-bold text-amber-950 font-mono">
                    {filteredFeatures.length} / {features.length} обьект
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-amber-900 bg-white/80 rounded-lg px-2.5 py-1 border border-amber-200/80 font-mono">
                  <span>
                    Хамгийн бага: <b>{layerMetricInfo.minVal.toLocaleString()} {layerMetricInfo.unit}</b>
                  </span>
                  <span>·</span>
                  <span>
                    Дундаж: <b>{layerMetricInfo.avgVal.toLocaleString()} {layerMetricInfo.unit}</b>
                  </span>
                  <span>·</span>
                  <span>
                    Хамгийн их: <b>{layerMetricInfo.maxVal.toLocaleString()} {layerMetricInfo.unit}</b>
                  </span>
                </div>

                {/* Min & Max Range Inputs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                      Доод утга (Min {layerMetricInfo.unit}):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={minMetricInput}
                      onChange={(e) => {
                        setMinMetricInput(e.target.value);
                        setVisibleLimit(80);
                      }}
                      placeholder={`жнь: ${Math.floor(layerMetricInfo.minVal)}`}
                      className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                      Дээд утга (Max {layerMetricInfo.unit}):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={maxMetricInput}
                      onChange={(e) => {
                        setMaxMetricInput(e.target.value);
                        setVisibleLimit(80);
                      }}
                      placeholder={`жнь: ${Math.ceil(layerMetricInfo.maxVal)}`}
                      className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Range Preset Chips */}
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMinMetricInput('');
                      setMaxMetricInput('');
                    }}
                    className="rounded-md bg-white hover:bg-amber-100 border border-amber-300 px-2 py-0.5 font-semibold text-amber-900 cursor-pointer"
                  >
                    Бүгд ({features.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMinMetricInput(String(Math.round(layerMetricInfo.avgVal)));
                      setMaxMetricInput('');
                    }}
                    className="rounded-md bg-white hover:bg-amber-100 border border-amber-300 px-2 py-0.5 font-semibold text-amber-900 cursor-pointer"
                  >
                    {layerMetricInfo.mode === 'length'
                      ? `Урт (≥ ${Math.round(layerMetricInfo.avgVal).toLocaleString()} км)`
                      : `Том талбайтай (≥ ${Math.round(layerMetricInfo.avgVal).toLocaleString()} км²)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMinMetricInput('0');
                      setMaxMetricInput(String(Math.round(layerMetricInfo.avgVal)));
                    }}
                    className="rounded-md bg-white hover:bg-amber-100 border border-amber-300 px-2 py-0.5 font-semibold text-amber-900 cursor-pointer"
                  >
                    {layerMetricInfo.mode === 'length'
                      ? `Богино (≤ ${Math.round(layerMetricInfo.avgVal).toLocaleString()} км)`
                      : `Жижиг/Дунд (≤ ${Math.round(layerMetricInfo.avgVal).toLocaleString()} км²)`}
                  </button>
                </div>

                {/* Action buttons: Batch Generate Questions from Filtered Range & Apply to Map */}
                <div className="pt-1 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={handleBatchGenerateAll}
                    disabled={filteredFeatures.length === 0}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 px-3 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Шүүгдсэн {filteredFeatures.length} обьектоор олноор нь даалгавар үүсгэх
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyFilterToActiveLayer}
                    disabled={filteredFeatures.length === 0}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-amber-100 border border-amber-400 text-amber-950 py-1.5 px-3 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <span>
                      🎯 Зөвхөн энэ {filteredFeatures.length} обьектийг Газрын зураг / Уралдаанд идэвхжүүлэх
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Single Feature to Isolate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  2. Салган авах обьектийг жагсаалтаас сонгох
                </label>
                <span className="text-[11px] text-sky-700 font-semibold font-mono">
                  {filteredFeatures.length} / {features.length} обьект
                </span>
              </div>

              {/* Search features */}
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Обьектын нэрээр хайх (жнь: Хөвсгөл)..."
                  value={featureSearch}
                  onChange={(e) => setFeatureSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Feature Selection Cards */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 rounded-xl border border-slate-200 bg-slate-50/50 p-2">
                {filteredFeatures.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-400">
                    Шүүлтүүрт тохирох обьект олдсонгүй
                  </div>
                ) : (
                  <>
                    {filteredFeatures.slice(0, visibleLimit).map((item) => {
                      const isSelected = selectedFeatureIdx === item.originalIdx;
                      const metricBadge =
                        item.geomType === 'LineString' || item.geomType === 'MultiLineString'
                          ? `${item.lengthKm.toLocaleString()} км`
                          : item.geomType === 'Polygon' || item.geomType === 'MultiPolygon'
                          ? `${item.areaKm2.toLocaleString()} км²`
                          : item.geomType;

                      return (
                        <button
                          key={item.originalIdx}
                          onClick={() => setSelectedFeatureIdx(item.originalIdx)}
                          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white font-bold shadow-xs'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/70'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <MapPin
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isSelected ? 'text-white' : 'text-sky-600'
                              }`}
                            />
                            <span className="truncate">{item.name}</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                              isSelected ? 'bg-sky-700 text-sky-100' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {metricBadge}
                          </span>
                        </button>
                      );
                    })}
                    {filteredFeatures.length > visibleLimit && (
                      <button
                        type="button"
                        onClick={() => setVisibleLimit((prev) => prev + 100)}
                        className="w-full py-2 text-center text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-100/70 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Цааш харах (+{filteredFeatures.length - visibleLimit} обьект)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Editable Target Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Сонгосон обьектийн жинхэнэ нэр (Зөв хариулт):
              </label>
              <input
                type="text"
                value={customTargetName}
                onChange={(e) => {
                  const newName = e.target.value;
                  const oldName = customTargetName;
                  setCustomTargetName(newName);
                  setOptions((prev) =>
                    prev.map((opt) => (opt === oldName ? newName : opt))
                  );
                }}
                placeholder="Жишээ нь: Хөвсгөл аймаг"
                className="w-full rounded-lg border border-emerald-400 bg-emerald-50/30 px-3 py-1.5 text-xs font-bold text-emerald-950 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Step 3: Question Options & Distractors */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                3. Хариултын 4 сонголт (3 буруу хувилбар тухайн давхаргаас автоматаар татагдсан)
              </label>

              <div className="grid grid-cols-1 gap-2">
                {options.map((opt, idx) => {
                  const isCorrect = opt.trim() === effectiveTargetName.trim();
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx] = e.target.value;
                          setOptions(updated);
                        }}
                        className={`flex-1 rounded-lg border px-2.5 py-1.5 text-xs focus:outline-none ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-semibold'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      />
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-700 px-1.5 py-0.5 bg-emerald-100 rounded">
                          Зөв хариу
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Target Grades & Points */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Хадгалах газар:
                </label>
                <p className="text-[11px] leading-snug text-slate-600">
                  Бэлтгэсэн бүх даалгавар <strong>Сорил</strong> хэсэгт хадгалагдана. Уралдаанд аль даалгаврыг
                  оруулахыг <strong>Уралдааны даалгавар</strong> табаас ангилал тус бүрээр сонгоно.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Даалгаврын оноо:
                </label>
                <select
                  value={questionPoints}
                  onChange={(e) => setQuestionPoints(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none w-full"
                >
                  <option value={10}>10 оноо</option>
                  <option value={15}>15 оноо (Стандарт)</option>
                  <option value={20}>20 оноо (Хүндэвтэр)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3">
              <button
                onClick={handleSaveQuestion}
                disabled={!selectedFeature || !effectiveTargetName}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-2.5 px-4 font-bold text-xs shadow-md transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Энэ обьектоор уралдааны даалгавар үүсгэх</span>
              </button>
            </div>
          </div>

          {/* Right Column: Visual Preview of Isolated Contour with Label-Free Basemaps */}
          <div className="lg:col-span-7 flex flex-col space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  Уралдаан / Сорил дээр харагдах байдал (Нэргүй суурь зурагтай):
                </span>
                <span className="rounded-md bg-sky-100 text-sky-800 px-2 py-0.5 font-bold text-[11px]">
                  {effectiveTargetName || 'Сонгогдоогүй'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setPreviewAnswered(false)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                    !previewAnswered
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Lock className="h-3 w-3" />
                  <span>Нууцалсан горим</span>
                </button>
                <button
                  onClick={() => setPreviewAnswered(true)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer ${
                    previewAnswered
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Unlock className="h-3 w-3" />
                  <span>Илчилсэн горим</span>
                </button>
              </div>
            </div>

            {isolatedGeojson && (
              <ShpContourViewer
                geojson={isolatedGeojson}
                geometryType={selectedFeature?.geometry?.type || currentLayer?.geometryType || 'Polygon'}
                maskedProperties={maskedProps}
                realProperties={realProps}
                targetName={effectiveTargetName}
                hasAnswered={previewAnswered}
                isCorrect={true}
                categoryLabel={categoryLabel || 'Обьект'}
                hints={[
                  'Нэргүй суурь зураг болон Монгол улсын хилийн хүрээгээр орон зайн баримжаа авна уу',
                ]}
              />
            )}
          </div>
        </div>
      </div>

      {/* List of Created Custom Contest Questions (Grouped & Filterable by Layer, Bulk Select & Per-Layer Delete) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Вектор/SHP-аас үүсгэгдсэн идэвхтэй уралдааны даалгаврын жагсаалт ({customQuestions.length})
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Аль давхаргын (layer) обьект болохыг ялгах, бөөнөөр нь сонгох, давхарга тус бүрээр сонгох болон хасах удирдлага.
            </p>
          </div>

          {/* Search inside created questions */}
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={questionListSearch}
              onChange={(e) => setQuestionListSearch(e.target.value)}
              placeholder="Даалгаврын нэр эсвэл давхаргаар хайх..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {customQuestions.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
            Одоогоор вектор давхаргаас таслан авч үүсгэсэн асуулт байхгүй байна. Дээрх цонхноос обьект сонгон "Уралдааны даалгавар үүсгэх" эсвэл "Шүүгдсэн обьектоор олноор үүсгэх" товч дарна уу.
          </div>
        ) : (
          (() => {
            // Compute unique layers in customQuestions with counts & colors
            const layerGroupsMap = new Map<
              string,
              { layerName: string; count: number; color: string; ids: string[]; geomType: string }
            >();

            customQuestions.forEach((q) => {
              const lName = q.shpContourData?.layerName || 'Бусад давхарга';
              const matchedLayer = gisLayers.find((l) => l.name === lName);
              const existing = layerGroupsMap.get(lName);
              if (existing) {
                existing.count += 1;
                existing.ids.push(q.id);
              } else {
                layerGroupsMap.set(lName, {
                  layerName: lName,
                  count: 1,
                  color: matchedLayer?.color || '#0284c7',
                  ids: [q.id],
                  geomType: q.shpContourData?.geometryType || matchedLayer?.geometryType || 'Polygon',
                });
              }
            });

            const layerGroups = Array.from(layerGroupsMap.values());

            // Filter displayed questions by selected layer tab & search query
            const displayedQuestions = customQuestions.filter((q) => {
              const lName = q.shpContourData?.layerName || 'Бусад давхарга';
              if (questionLayerFilter !== 'all' && lName !== questionLayerFilter) return false;
              if (questionListSearch.trim()) {
                const term = questionListSearch.toLowerCase();
                return (
                  q.targetName.toLowerCase().includes(term) ||
                  q.title.toLowerCase().includes(term) ||
                  lName.toLowerCase().includes(term)
                );
              }
              return true;
            });

            const displayedIds = displayedQuestions.map((q) => q.id);
            const selectedSet = new Set(selectedQuestionIds);
            const allDisplayedSelected =
              displayedIds.length > 0 && displayedIds.every((id) => selectedSet.has(id));

            const toggleSelectQuestion = (id: string) => {
              setSelectedQuestionIds((prev) =>
                prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
              );
            };

            const handleSelectAllDisplayed = () => {
              if (allDisplayedSelected) {
                const dispSet = new Set(displayedIds);
                setSelectedQuestionIds((prev) => prev.filter((id) => !dispSet.has(id)));
              } else {
                setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
              }
            };

            const handleToggleSelectLayerGroup = (layerName: string, layerIds: string[]) => {
              const allLayerSelected =
                layerIds.length > 0 && layerIds.every((id) => selectedSet.has(id));
              if (allLayerSelected) {
                const removeSet = new Set(layerIds);
                setSelectedQuestionIds((prev) => prev.filter((id) => !removeSet.has(id)));
              } else {
                setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...layerIds])));
              }
            };

            const handleBulkDeleteSelected = () => {
              if (selectedQuestionIds.length === 0) return;
              const removedCount = selectedQuestionIds.length;
              batchDeleteCustomQuestions(selectedQuestionIds);
              setSelectedQuestionIds([]);
              setSuccessToast(`Сонгосон ${removedCount} даалгаврыг жагсаалтаас бөөнөөр нь хаслаа.`);
              setTimeout(() => setSuccessToast(null), 4000);
            };

            const handleRemoveEntireLayerQuestions = (layerName: string, count: number) => {
              deleteCustomQuestionsByLayer(layerName);
              setSelectedQuestionIds((prev) =>
                prev.filter((id) => {
                  const q = customQuestions.find((item) => item.id === id);
                  return (q?.shpContourData?.layerName || 'Бусад давхарга') !== layerName;
                })
              );
              if (questionLayerFilter === layerName) {
                setQuestionLayerFilter('all');
              }
              setSuccessToast(`"${layerName}" давхаргын бүх ${count} даалгаврыг хаслаа.`);
              setTimeout(() => setSuccessToast(null), 4000);
            };

            return (
              <div className="space-y-4">
                {/* Layer Filter & Per-Layer Bulk Selection / Deletion Cards */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      Давхаргаар (Layer) ялгах, сонгох ба хасах ({layerGroups.length} давхарга):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedQuestionIds(customQuestions.map((q) => q.id))}
                        className="rounded-lg bg-white hover:bg-sky-50 border border-slate-200 px-2.5 py-1 font-semibold text-sky-700 transition-colors cursor-pointer"
                      >
                        ✓ Бүх даалгаврыг сонгох ({customQuestions.length})
                      </button>
                      {selectedQuestionIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedQuestionIds([])}
                          className="rounded-lg bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 transition-colors cursor-pointer"
                        >
                          Сонголтыг цуцлах ({selectedQuestionIds.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Layer Group Chips with Per-Layer Select & Per-Layer Remove */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestionLayerFilter('all')}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
                        questionLayerFilter === 'all'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Бүх давхарга</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                          questionLayerFilter === 'all'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {customQuestions.length}
                      </span>
                    </button>

                    {layerGroups.map((grp) => {
                      const isFiltered = questionLayerFilter === grp.layerName;
                      const selectedInLayerCount = grp.ids.filter((id) => selectedSet.has(id)).length;
                      const allInLayerSelected =
                        grp.ids.length > 0 && selectedInLayerCount === grp.ids.length;

                      return (
                        <div
                          key={grp.layerName}
                          className={`flex items-center gap-1.5 rounded-xl border p-1 pr-2 text-xs transition-all ${
                            isFiltered
                              ? 'border-sky-500 bg-sky-50/90 shadow-2xs'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          {/* Filter by this layer */}
                          <button
                            type="button"
                            onClick={() =>
                              setQuestionLayerFilter(isFiltered ? 'all' : grp.layerName)
                            }
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-100/80 text-left cursor-pointer"
                            title="Энэ давхаргын даалгавруудыг шүүж харах"
                          >
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: grp.color }}
                            />
                            <span className="font-bold text-slate-800 max-w-[180px] truncate">
                              {grp.layerName}
                            </span>
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-bold text-slate-700">
                              {grp.count}
                            </span>
                          </button>

                          {/* Select / Deselect all tasks in this layer */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectLayerGroup(grp.layerName, grp.ids)}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                              allInLayerSelected
                                ? 'bg-sky-600 text-white'
                                : selectedInLayerCount > 0
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : 'bg-slate-100 hover:bg-sky-50 text-slate-700'
                            }`}
                            title={`"${grp.layerName}" давхаргын бүх даалгаврыг бөөнөөр сонгох / болих`}
                          >
                            {allInLayerSelected
                              ? '✓ Бүгд сонгогдсон'
                              : selectedInLayerCount > 0
                              ? `${selectedInLayerCount}/${grp.count} сонгосон`
                              : 'Давхаргаар сонгох'}
                          </button>

                          {/* Delete all tasks in this layer */}
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveEntireLayerQuestions(grp.layerName, grp.count)
                            }
                            className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-1 text-[10px] font-bold transition-colors cursor-pointer"
                            title={`"${grp.layerName}" давхаргын бүх ${grp.count} даалгаврыг бөөнөөр хасах`}
                          >
                            Хасах
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bulk Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allDisplayedSelected}
                        onChange={handleSelectAllDisplayed}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                      <span>
                        Жагсаалтад харагдаж буй бүгдийг сонгох ({displayedQuestions.length})
                      </span>
                    </label>
                    {selectedQuestionIds.length > 0 && (
                      <span className="rounded-full bg-sky-100 border border-sky-300 px-2.5 py-0.5 text-[11px] font-bold text-sky-900">
                        Сонгосон: {selectedQuestionIds.length} даалгавар
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedQuestionIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkDeleteSelected}
                        className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Сонгосон {selectedQuestionIds.length} даалгаврыг бөөнөөр хасах</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured List / Table View of Questions with Layer Badges */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <tr>
                        <th className="w-10 px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={allDisplayedSelected}
                            onChange={handleSelectAllDisplayed}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-2.5 font-bold">#</th>
                        <th className="px-3 py-2.5 font-bold">Обьектийн нэр (Зөв хариу)</th>
                        <th className="px-3 py-2.5 font-bold">Аль давхаргынх (Layer)</th>
                        <th className="px-3 py-2.5 font-bold">Геометр төрөл</th>
                        <th className="px-3 py-2.5 font-bold">Ангилал & Оноо</th>
                        <th className="px-3 py-2.5 font-bold text-right">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                            Шүүлтүүрт тохирох даалгавар олдсонгүй.
                          </td>
                        </tr>
                      ) : (
                        displayedQuestions.map((q, idx) => {
                          const isChecked = selectedSet.has(q.id);
                          const lName = q.shpContourData?.layerName || 'Бусад давхарга';
                          const matchedLayer = gisLayers.find((l) => l.name === lName);
                          const layerColor = matchedLayer?.color || '#0284c7';
                          const geomType = q.shpContourData?.geometryType || 'Polygon';

                          return (
                            <tr
                              key={q.id}
                              onClick={() => toggleSelectQuestion(q.id)}
                              className={`transition-colors cursor-pointer ${
                                isChecked ? 'bg-sky-50/70' : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td
                                className="px-3 py-2.5 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSelectQuestion(q.id)}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                />
                              </td>
                              <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="font-bold text-slate-900">{q.targetName}</div>
                                <div className="text-[11px] text-slate-500 line-clamp-1">
                                  {q.title}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-2xs">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: layerColor }}
                                  />
                                  <span className="truncate max-w-[200px]">{lName}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                                  {geomType}
                                </span>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-amber-700">
                                    {q.points} оноо
                                  </span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-[11px] text-slate-600">
                                    {q.gradeLevels?.length ? q.gradeLevels.join(', ') : 'Зөвхөн Сорил'}
                                  </span>
                                </div>
                              </td>
                              <td
                                className="px-3 py-2.5 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTestingQuestionModal(q)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 text-[11px] font-semibold text-sky-700 transition-colors cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" />
                                    <span>Шалгах</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteCustomQuestion(q.id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-700 transition-colors cursor-pointer"
                                    title="Устгах"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>Хасах</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Modal: Test & Preview a Single Question */}
      {testingQuestionModal && testingQuestionModal.shpContourData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-sky-100 text-sky-800 font-bold px-2 py-0.5 text-xs">
                  Уралдааны сорилын горимд харагдах байдал (Суурь зураггүй)
                </span>
              </div>
              <button
                onClick={() => setTestingQuestionModal(null)}
                className="rounded-lg bg-slate-100 p-1 text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 text-sm">{testingQuestionModal.title}</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">{testingQuestionModal.subtitle}</p>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
              <ShpContourViewer
                geojson={testingQuestionModal.shpContourData.geojson}
                geometryType={testingQuestionModal.shpContourData.geometryType}
                maskedProperties={testingQuestionModal.shpContourData.maskedProperties}
                realProperties={testingQuestionModal.shpContourData.realProperties}
                targetName={testingQuestionModal.shpContourData.targetName}
                hasAnswered={false}
                categoryLabel={testingQuestionModal.shpContourData.categoryLabel}
                hints={testingQuestionModal.shpContourData.hints}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              {testingQuestionModal.options?.map((opt) => (
                <div
                  key={opt.id}
                  className={`rounded-xl border p-2.5 text-xs font-semibold ${
                    opt.isCorrect
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <span className="font-mono mr-1.5">{opt.id}.</span> {opt.text}
                  {opt.isCorrect && (
                    <span className="ml-2 text-[10px] text-emerald-700 font-bold">(Зөв)</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTestingQuestionModal(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 font-bold text-xs cursor-pointer"
              >
                Хаах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
