import React, { useState } from 'react';
import { CONTINENTS, OCEANS, WORLD_COUNTRIES, WORLD_STRAITS_AND_FEATURES } from '../data/worldGeo';
import { CountryData } from '../types';

interface WorldMapProps {
  onCountryClick?: (country: CountryData) => void;
  onFeatureClick?: (featureId: string, featureName: string) => void;
  selectedCountryId?: string | null;
  targetId?: string | null;
  interactive?: boolean;
  highlightCorrectId?: string | null;
  highlightWrongId?: string | null;
  showStraits?: boolean;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  onCountryClick,
  onFeatureClick,
  selectedCountryId,
  targetId,
  interactive = true,
  highlightCorrectId,
  highlightWrongId,
  showStraits = true,
}) => {
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<{ name: string; desc?: string } | null>(null);

  const getCountryFill = (id: string) => {
    if (highlightCorrectId === id) return '#10b981';
    if (highlightWrongId === id) return '#f43f5e';
    if (selectedCountryId === id) return '#0284c7';
    if (hoveredCountry?.id === id && interactive) return '#e2e8f0';
    if (id === 'mn') return '#f59e0b'; // Highlight Mongolia warmly in amber
    return '#f8fafc';
  };

  const getCountryStroke = (id: string) => {
    if (highlightCorrectId === id) return '#059669';
    if (highlightWrongId === id) return '#e11d48';
    if (selectedCountryId === id) return '#0369a1';
    if (hoveredCountry?.id === id && interactive) return '#64748b';
    return '#cbd5e1';
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4 select-none shadow-xs">
      <svg
        viewBox="0 0 1000 580"
        className="w-full h-auto max-h-[560px]"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.06))' }}
      >
        <defs>
          <radialGradient id="oceanBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e0f2fe" stopOpacity="1" />
          </radialGradient>
        </defs>

        {/* Global Ocean Grid Lines */}
        <rect width="1000" height="580" fill="url(#oceanBg)" rx="10" />

        {/* Latitude lines */}
        <g stroke="#bae6fd" strokeWidth="0.8" strokeDasharray="4 6" opacity="0.8">
          <line x1="50" y1="120" x2="950" y2="120" /> {/* Arctic Circle */}
          <line x1="50" y1="210" x2="950" y2="210" /> {/* Tropic of Cancer */}
          <line x1="50" y1="290" x2="950" y2="290" stroke="#7dd3fc" strokeWidth="1.2" /> {/* Equator */}
          <line x1="50" y1="370" x2="950" y2="370" /> {/* Tropic of Capricorn */}
          <line x1="50" y1="460" x2="950" y2="460" /> {/* Antarctic Circle */}
          
          {/* Prime Meridian */}
          <line x1="470" y1="50" x2="470" y2="530" stroke="#7dd3fc" strokeWidth="1" />
        </g>

        {/* Ocean Names */}
        <g pointerEvents="none" opacity="0.6">
          {OCEANS.map((ocean, idx) => (
            <text
              key={`${ocean.id}-${idx}`}
              x={ocean.coords.x}
              y={ocean.coords.y}
              textAnchor="middle"
              fill="#0369a1"
              fontSize="12"
              fontWeight="600"
              letterSpacing="2"
            >
              {ocean.name}
            </text>
          ))}
        </g>

        {/* Continents General Labels */}
        <g pointerEvents="none" opacity="0.35">
          {CONTINENTS.map((cont) => (
            <text
              key={cont.id}
              x={cont.coords.x}
              y={cont.coords.y}
              textAnchor="middle"
              fill="#475569"
              fontSize="14"
              fontWeight="800"
              letterSpacing="3"
            >
              {cont.name.toUpperCase()}
            </text>
          ))}
        </g>

        {/* Countries Layer */}
        <g id="world-countries-layer">
          {WORLD_COUNTRIES.map((country) => {
            const isSelected = selectedCountryId === country.id;
            const isHovered = hoveredCountry?.id === country.id;
            const isTarget = targetId === country.id;

            return (
              <g key={country.id} className="cursor-pointer">
                <path
                  d={country.path}
                  fill={getCountryFill(country.id)}
                  stroke={getCountryStroke(country.id)}
                  strokeWidth={isSelected || isHovered ? 2.5 : 1.2}
                  strokeLinejoin="round"
                  className="transition-colors duration-150"
                  onMouseEnter={() => setHoveredCountry(country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => interactive && onCountryClick && onCountryClick(country)}
                />

                {/* Country label */}
                <text
                  x={country.centerCoords.x}
                  y={country.centerCoords.y}
                  textAnchor="middle"
                  fill={isHovered ? '#b45309' : '#0f172a'}
                  fontSize="9.5"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  {country.name}
                </text>
                <text
                  x={country.centerCoords.x}
                  y={country.centerCoords.y + 11}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="7"
                  className="pointer-events-none"
                >
                  {country.capital}
                </text>

                {isTarget && (
                  <circle
                    cx={country.centerCoords.x}
                    cy={country.centerCoords.y}
                    r="14"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    className="animate-ping"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Strategic Straits, Canals, and Physical Features */}
        {showStraits && (
          <g id="world-straits-layer">
            {WORLD_STRAITS_AND_FEATURES.map((feature) => {
              const isCorrect = highlightCorrectId === feature.id;
              const isWrong = highlightWrongId === feature.id;
              const isTarget = targetId === feature.id;

              return (
                <g
                  key={feature.id}
                  className="cursor-pointer group"
                  onClick={() =>
                    interactive && onFeatureClick && onFeatureClick(feature.id, feature.name)
                  }
                  onMouseEnter={() =>
                    setHoveredFeature({ name: feature.name, desc: feature.description })
                  }
                  onMouseLeave={() => setHoveredFeature(null)}
                >
                  {feature.category === 'strait' ? (
                    <circle
                      cx={feature.x}
                      cy={feature.y}
                      r="6"
                      fill={isCorrect ? '#10b981' : isWrong ? '#f43f5e' : '#f59e0b'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="transition-transform duration-150 hover:scale-150"
                    />
                  ) : feature.category === 'mountain' ? (
                    <polygon
                      points={`${feature.x},${feature.y - 8} ${feature.x - 6},${feature.y + 4} ${feature.x + 6},${feature.y + 4}`}
                      fill={isCorrect ? '#10b981' : isWrong ? '#f43f5e' : '#14b8a6'}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  ) : (
                    <rect
                      x={feature.x - 4}
                      y={feature.y - 4}
                      width="8"
                      height="8"
                      transform={`rotate(45 ${feature.x} ${feature.y})`}
                      fill={isCorrect ? '#10b981' : isWrong ? '#f43f5e' : '#38bdf8'}
                      stroke="#ffffff"
                      strokeWidth="1"
                    />
                  )}

                  {isTarget && (
                    <circle
                      cx={feature.x}
                      cy={feature.y}
                      r="12"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2"
                      className="animate-ping"
                    />
                  )}

                  <text
                    x={feature.x}
                    y={feature.y - 10}
                    textAnchor="middle"
                    fill="#fef08a"
                    fontSize="8"
                    fontWeight="600"
                    className="pointer-events-none drop-shadow"
                  >
                    {feature.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Hover Card */}
      {(hoveredCountry || hoveredFeature) && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-20 max-w-xs rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-md">
          {hoveredCountry && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-semibold text-slate-900">
                <span className="text-sm font-bold text-sky-700">{countryEmoji(hoveredCountry.id)} {hoveredCountry.name}</span>
                <span className="text-slate-500">Нийслэл: {hoveredCountry.capital}</span>
              </div>
              <div className="mt-2 space-y-1 text-slate-600">
                <div className="flex justify-between text-slate-500">
                  <span>Тив: {hoveredCountry.continent}</span>
                  <span>Англи нэр: {hoveredCountry.nameEn}</span>
                </div>
                {hoveredCountry.facts[0] && (
                  <div className="pt-1 text-slate-700 italic">
                    {hoveredCountry.facts[0]}
                  </div>
                )}
              </div>
            </div>
          )}

          {hoveredFeature && !hoveredCountry && (
            <div>
              <div className="font-bold text-amber-700 text-sm">{hoveredFeature.name}</div>
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

function countryEmoji(code: string): string {
  const flags: Record<string, string> = {
    mn: '🇲🇳',
    ru: '🇷🇺',
    cn: '🇨🇳',
    kz: '🇰🇿',
    in: '🇮🇳',
    jp: '🇯🇵',
    kr: '🇰🇷',
    tr: '🇹🇷',
    sa: '🇸🇦',
    de: '🇩🇪',
    fr: '🇫🇷',
    gb: '🇬🇧',
    it: '🇮🇹',
    us: '🇺🇸',
    ca: '🇨🇦',
    mx: '🇲🇽',
    br: '🇧🇷',
    ar: '🇦🇷',
    eg: '🇪🇬',
    za: '🇿🇦',
    au: '🇦🇺',
  };
  return flags[code] || '🌐';
}
