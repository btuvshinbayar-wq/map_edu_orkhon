import React, { useState } from 'react';
import { AIMAGS_DATA } from '../data/aimags';
import {
  MONGOLIA_RIVERS,
  MONGOLIA_LAKES,
  MONGOLIA_MOUNTAINS,
  STRATEGIC_BASINS,
  MONGOLIA_LANDMARKS,
} from '../data/mongoliaGeo';
import { AimagData } from '../types';

interface MongoliaMapProps {
  onAimagClick?: (aimag: AimagData) => void;
  onFeatureClick?: (featureId: string, featureName: string) => void;
  selectedAimagId?: string | null;
  targetId?: string | null;
  interactive?: boolean;
  highlightCorrectId?: string | null;
  highlightWrongId?: string | null;
  showAllLabels?: boolean;
  activeLayers?: {
    rivers?: boolean;
    lakes?: boolean;
    mountains?: boolean;
    basins?: boolean;
    landmarks?: boolean;
  };
}

export const MongoliaMap: React.FC<MongoliaMapProps> = ({
  onAimagClick,
  onFeatureClick,
  selectedAimagId,
  targetId,
  interactive = true,
  highlightCorrectId,
  highlightWrongId,
  showAllLabels = true,
  activeLayers = {
    rivers: true,
    lakes: true,
    mountains: true,
    basins: true,
    landmarks: true,
  },
}) => {
  const [hoveredAimag, setHoveredAimag] = useState<AimagData | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<{ name: string; desc?: string } | null>(null);

  const getAimagFill = (aimagId: string) => {
    if (highlightCorrectId === aimagId) return '#10b981'; // Emerald 500
    if (highlightWrongId === aimagId) return '#f43f5e'; // Rose 500
    if (selectedAimagId === aimagId) return '#0284c7'; // Sky 600
    if (hoveredAimag?.id === aimagId && interactive) return '#e2e8f0'; // Slate 200 hover
    return '#f8fafc'; // Slate 50 clean light base
  };

  const getAimagStroke = (aimagId: string) => {
    if (highlightCorrectId === aimagId) return '#059669';
    if (highlightWrongId === aimagId) return '#e11d48';
    if (selectedAimagId === aimagId) return '#0369a1';
    if (hoveredAimag?.id === aimagId && interactive) return '#64748b';
    return '#cbd5e1';
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4 select-none shadow-xs">
      {/* SVG Canvas for Mongolia */}
      <svg
        viewBox="0 0 960 580"
        className="w-full h-auto max-h-[560px]"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.06))' }}
      >
        <defs>
          <radialGradient id="lakeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer country boundary glow */}
        <g id="aimags-layer">
          {AIMAGS_DATA.map((aimag) => {
            const isHovered = hoveredAimag?.id === aimag.id;
            const isSelected = selectedAimagId === aimag.id;
            const isTarget = targetId === aimag.id;

            return (
              <g key={aimag.id} className="cursor-pointer transition-all duration-150">
                <path
                  d={aimag.path}
                  fill={getAimagFill(aimag.id)}
                  stroke={getAimagStroke(aimag.id)}
                  strokeWidth={isSelected || isHovered ? 2.5 : 1.2}
                  strokeLinejoin="round"
                  className={`${interactive ? 'cursor-pointer' : ''} transition-colors duration-150`}
                  onMouseEnter={() => setHoveredAimag(aimag)}
                  onMouseLeave={() => setHoveredAimag(null)}
                  onClick={() => interactive && onAimagClick && onAimagClick(aimag)}
                />

                {/* Target pulse indicator if specified */}
                {isTarget && (
                  <circle
                    cx={aimag.centerCoords.x}
                    cy={aimag.centerCoords.y}
                    r="12"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    className="animate-ping opacity-75"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Rivers Layer */}
        {activeLayers.rivers && (
          <g id="rivers-layer" pointerEvents="none">
            {MONGOLIA_RIVERS.map((river) => (
              <g key={river.id}>
                <path
                  d={river.path}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                />
              </g>
            ))}
          </g>
        )}

        {/* Lakes Layer */}
        {activeLayers.lakes && (
          <g id="lakes-layer">
            {MONGOLIA_LAKES.map((lake) => {
              const isLakeCorrect = highlightCorrectId === lake.id;
              const isLakeWrong = highlightWrongId === lake.id;
              const isLakeTarget = targetId === lake.id;

              return (
                <g
                  key={lake.id}
                  className="cursor-pointer group"
                  onClick={() =>
                    interactive && onFeatureClick && onFeatureClick(lake.id, lake.name)
                  }
                  onMouseEnter={() =>
                    setHoveredFeature({ name: lake.name, desc: `${lake.waterType} нуур · ${lake.areaSqKm} км²` })
                  }
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <circle
                    cx={lake.coords.x}
                    cy={lake.coords.y}
                    r={lake.coords.r}
                    fill={isLakeCorrect ? '#10b981' : isLakeWrong ? '#f43f5e' : 'url(#lakeGradient)'}
                    stroke="#e0f2fe"
                    strokeWidth="1.5"
                    className="transition-transform duration-150 hover:scale-110"
                  />
                  {isLakeTarget && (
                    <circle
                      cx={lake.coords.x}
                      cy={lake.coords.y}
                      r={lake.coords.r + 6}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      className="animate-ping"
                    />
                  )}
                  <text
                    x={lake.coords.x}
                    y={lake.coords.y - lake.coords.r - 4}
                    textAnchor="middle"
                    fill="#bae6fd"
                    fontSize="10"
                    fontWeight="600"
                    className="pointer-events-none drop-shadow"
                  >
                    {lake.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Mountain Ranges Layer */}
        {activeLayers.mountains && (
          <g id="mountains-layer">
            {MONGOLIA_MOUNTAINS.map((mountain) => {
              const isMntCorrect = highlightCorrectId === mountain.id;
              const isMntWrong = highlightWrongId === mountain.id;

              return (
                <g
                  key={mountain.id}
                  className="cursor-pointer group"
                  onClick={() =>
                    interactive && onFeatureClick && onFeatureClick(mountain.id, mountain.name)
                  }
                  onMouseEnter={() =>
                    setHoveredFeature({
                      name: mountain.name,
                      desc: `${mountain.peakName} (${mountain.peakElevationMeters} м)`,
                    })
                  }
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  {/* Mountain peak triangle icon */}
                  <polygon
                    points={`${mountain.peakCoords.x},${mountain.peakCoords.y - 12} ${mountain.peakCoords.x - 9},${mountain.peakCoords.y + 4} ${mountain.peakCoords.x + 9},${mountain.peakCoords.y + 4}`}
                    fill={isMntCorrect ? '#10b981' : isMntWrong ? '#f43f5e' : '#f59e0b'}
                    stroke="#fef3c7"
                    strokeWidth="1"
                    className="transition-transform duration-150 hover:scale-125"
                  />
                  <text
                    x={mountain.peakCoords.x}
                    y={mountain.peakCoords.y + 16}
                    textAnchor="middle"
                    fill="#fde68a"
                    fontSize="9"
                    fontWeight="600"
                    className="pointer-events-none drop-shadow"
                  >
                    ▲ {mountain.peakElevationMeters}м
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Strategic Basins (Oyu Tolgoi, Tavan Tolgoi, Erdenet) Layer */}
        {activeLayers.basins && (
          <g id="basins-layer">
            {STRATEGIC_BASINS.map((basin) => {
              const isBasinCorrect = highlightCorrectId === basin.id;
              const isBasinWrong = highlightWrongId === basin.id;

              return (
                <g
                  key={basin.id}
                  className="cursor-pointer"
                  onClick={() =>
                    interactive && onFeatureClick && onFeatureClick(basin.id, basin.name)
                  }
                  onMouseEnter={() =>
                    setHoveredFeature({ name: basin.name, desc: basin.description })
                  }
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  <rect
                    x={basin.x - 7}
                    y={basin.y - 7}
                    width="14"
                    height="14"
                    transform={`rotate(45 ${basin.x} ${basin.y})`}
                    fill={isBasinCorrect ? '#10b981' : isBasinWrong ? '#f43f5e' : '#ec4899'}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                  <text
                    x={basin.x}
                    y={basin.y - 10}
                    textAnchor="middle"
                    fill="#fbcfe8"
                    fontSize="8.5"
                    fontWeight="600"
                    className="pointer-events-none drop-shadow"
                  >
                    ◆ {basin.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* Landmarks Layer */}
        {activeLayers.landmarks && (
          <g id="landmarks-layer">
            {MONGOLIA_LANDMARKS.map((landmark) => (
              <g
                key={landmark.id}
                className="cursor-pointer"
                onClick={() =>
                  interactive && onFeatureClick && onFeatureClick(landmark.id, landmark.name)
                }
                onMouseEnter={() =>
                  setHoveredFeature({ name: landmark.name, desc: landmark.description })
                }
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <circle cx={landmark.x} cy={landmark.y} r="5" fill="#eab308" stroke="#ffffff" strokeWidth="1" />
                <text
                  x={landmark.x}
                  y={landmark.y + 14}
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="8"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  ★ {landmark.name}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Aimag Center Labels */}
        {showAllLabels && (
          <g id="labels-layer" pointerEvents="none">
            {AIMAGS_DATA.map((aimag) => (
              <g key={`lbl-${aimag.id}`}>
                <text
                  x={aimag.centerCoords.x}
                  y={aimag.centerCoords.y}
                  textAnchor="middle"
                  fill={hoveredAimag?.id === aimag.id ? '#b45309' : '#0f172a'}
                  fontSize={aimag.id === 'ulaanbaatar' ? '9' : '10'}
                  fontWeight="700"
                  className="tracking-tight"
                >
                  {aimag.name}
                </text>
                <text
                  x={aimag.centerCoords.x}
                  y={aimag.centerCoords.y + 11}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="7.5"
                  fontWeight="500"
                >
                  {aimag.center}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Compass Rose & Geographic Scale */}
        <g transform="translate(45, 480)" pointerEvents="none" opacity="0.85">
          <circle cx="20" cy="20" r="18" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M 20 6 L 24 20 L 20 18 L 16 20 Z" fill="#ef4444" />
          <path d="M 20 34 L 24 20 L 20 22 L 16 20 Z" fill="#64748b" />
          <text x="20" y="3" textAnchor="middle" fill="#ef4444" fontSize="9" fontWeight="bold">Х</text>
          <text x="20" y="47" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">У</text>
          <text x="44" y="23" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">З</text>
          <text x="-4" y="23" textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">Б</text>
          
          {/* Scale bar: 200 km */}
          <g transform="translate(60, 15)">
            <line x1="0" y1="0" x2="60" y2="0" stroke="#475569" strokeWidth="2.5" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#475569" strokeWidth="2" />
            <line x1="60" y1="-3" x2="60" y2="3" stroke="#475569" strokeWidth="2" />
            <text x="30" y="-6" textAnchor="middle" fill="#475569" fontSize="8">200 км</text>
          </g>
        </g>
      </svg>

      {/* Floating Hover Card */}
      {(hoveredAimag || hoveredFeature) && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-xs rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-md">
          {hoveredAimag && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-semibold text-slate-900">
                <span className="text-sm font-bold text-amber-700">{hoveredAimag.name} аймаг</span>
                <span className="text-slate-500">Төв: {hoveredAimag.center}</span>
              </div>
              <div className="mt-2 space-y-1 text-slate-600">
                <div className="flex justify-between text-slate-500">
                  <span>Бүс: {hoveredAimag.region}</span>
                  <span>Талбай: {hoveredAimag.areaSqKm.toLocaleString()} км²</span>
                </div>
                <div className="text-slate-500">
                  Хүн ам: ~{hoveredAimag.population.toLocaleString()}
                </div>
                <div className="pt-1 text-slate-700 line-clamp-2 italic">
                  {hoveredAimag.facts[0]}
                </div>
              </div>
            </div>
          )}

          {hoveredFeature && !hoveredAimag && (
            <div>
              <div className="font-bold text-sky-700 text-sm">{hoveredFeature.name}</div>
              {hoveredFeature.desc && (
                <div className="mt-1 text-slate-600">{hoveredFeature.desc}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
