import React, { useState } from 'react';
import { getSeatStatusColor, getSeatStatusLabel } from '../../utils/helpers';
import { ZONE_TYPES } from '../../data/mockData';
import { Badge } from '../ui/index';

const ZONE_COLORS = {
  silent:    '#EFF6FF',
  group:     '#F5F3FF',
  window:    '#F0FDFE',
  charging:  '#FFFBEB',
  ac:        '#ECFDF5',
  bookshelf: '#FEF3C7',
};

const STATUS_ORDER = ['available','occupied','away','reserved','maintenance'];

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
      {[
        { s: 'available',   label: 'Available' },
        { s: 'occupied',    label: 'Occupied' },
        { s: 'away',        label: 'Away' },
        { s: 'reserved',    label: 'Reserved' },
        { s: 'maintenance', label: 'Maintenance' },
      ].map(({ s, label }) => (
        <div key={s} className="flex items-center gap-1.5 text-xs text-t2">
          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: getSeatStatusColor(s) }} />
          {label}
        </div>
      ))}
    </div>
  );
}

export default function LibraryMap({
  seats,
  selectedSeat,
  onSelectSeat,
  highlightIds,
  readonly = false,
  compact = false,
}) {
  const [tooltip, setTooltip] = useState(null);

  if (!seats || seats.length === 0) {
    return <div className="text-center text-t3 text-sm py-8">No seats to display.</div>;
  }

  const maxRow = Math.max(...seats.map(s => s.row));
  const maxCol = Math.max(...seats.map(s => s.col));

  // Group seats by zone for background rendering
  const seatMap = {};
  seats.forEach(s => { seatMap[`${s.row}-${s.col}`] = s; });

  const cellSize = compact ? 28 : 36;
  const gap = compact ? 4 : 6;
  const mapW = (maxCol + 1) * (cellSize + gap) - gap + 32;
  const mapH = (maxRow + 1) * (cellSize + gap) - gap + 32;

  return (
    <div>
      <div className="relative overflow-auto">
        <svg
          width={mapW}
          height={mapH}
          className="block mx-auto"
          style={{ minWidth: Math.min(mapW, 360) }}
        >
          {/* Zone backgrounds */}
          {Object.entries(
            seats.reduce((acc, s) => {
              const key = s.zone;
              if (!acc[key]) acc[key] = [];
              acc[key].push(s);
              return acc;
            }, {})
          ).map(([zone, zSeats]) => {
            const rows = zSeats.map(s => s.row);
            const cols = zSeats.map(s => s.col);
            const minR = Math.min(...rows), maxR = Math.max(...rows);
            const minC = Math.min(...cols), maxC = Math.max(...cols);
            const x = 16 + minC * (cellSize + gap) - 4;
            const y = 16 + minR * (cellSize + gap) - 4;
            const w = (maxC - minC + 1) * (cellSize + gap) - gap + 8;
            const h = (maxR - minR + 1) * (cellSize + gap) - gap + 8;
            return (
              <rect key={zone} x={x} y={y} width={w} height={h}
                rx="10" ry="10"
                fill={ZONE_COLORS[zone] || '#F8FAFC'}
                stroke="none"
                opacity="0.6"
              />
            );
          })}

          {/* Seats */}
          {seats.map(seat => {
            const x = 16 + seat.col * (cellSize + gap);
            const y = 16 + seat.row * (cellSize + gap);
            const isSelected = selectedSeat?.id === seat.id;
            const isHighlighted = highlightIds?.includes(seat.id);
            const color = getSeatStatusColor(seat.status);
            const isClickable = !readonly && seat.status === 'available';
            const isDisabled = seat.status === 'maintenance';

            return (
              <g key={seat.id}>
                {/* Highlight ring */}
                {isHighlighted && !isSelected && (
                  <rect
                    x={x - 3} y={y - 3}
                    width={cellSize + 6} height={cellSize + 6}
                    rx="9" ry="9"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                )}
                {/* Selected ring */}
                {isSelected && (
                  <rect
                    x={x - 3} y={y - 3}
                    width={cellSize + 6} height={cellSize + 6}
                    rx="9" ry="9"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="2.5"
                  />
                )}
                {/* Seat body */}
                <rect
                  x={x} y={y}
                  width={cellSize} height={cellSize}
                  rx="6" ry="6"
                  fill={color}
                  opacity={isDisabled ? 0.35 : 1}
                  style={{ cursor: isClickable ? 'pointer' : isDisabled ? 'not-allowed' : 'default' }}
                  onClick={() => !readonly && !isDisabled && onSelectSeat?.(seat)}
                  onMouseEnter={() => setTooltip({ seat, x: x + cellSize, y })}
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Seat label */}
                {!compact && (
                  <text
                    x={x + cellSize / 2}
                    y={y + cellSize / 2 + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                    onClick={() => !readonly && !isDisabled && onSelectSeat?.(seat)}
                  >
                    {seat.label.replace('S', '')}
                  </text>
                )}
                {/* Charging indicator */}
                {seat.features?.includes('charging') && !compact && (
                  <text
                    x={x + cellSize - 6} y={y + 10}
                    textAnchor="middle"
                    fontSize="8"
                    style={{ pointerEvents: 'none' }}
                  >⚡</text>
                )}
              </g>
            );
          })}

          {/* SVG Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={Math.min(tooltip.x + 6, mapW - 140)}
                y={Math.max(tooltip.y - 10, 4)}
                width="130" height="58"
                rx="8" ry="8"
                fill="#0F172A"
                opacity="0.95"
              />
              <text x={Math.min(tooltip.x + 14, mapW - 132)} y={Math.max(tooltip.y + 8, 16)}
                fill="white" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">
                {tooltip.seat.label}
              </text>
              <text x={Math.min(tooltip.x + 14, mapW - 132)} y={Math.max(tooltip.y + 24, 32)}
                fill="#94A3B8" fontSize="10" fontFamily="Inter, sans-serif">
                {getSeatStatusLabel(tooltip.seat.status)}
              </text>
              <text x={Math.min(tooltip.x + 14, mapW - 132)} y={Math.max(tooltip.y + 40, 48)}
                fill="#94A3B8" fontSize="9" fontFamily="Inter, sans-serif">
                {ZONE_TYPES.find(z => z.id === tooltip.seat.zone)?.label || tooltip.seat.zone}
              </text>
            </g>
          )}
        </svg>
      </div>
      <Legend />
    </div>
  );
}
