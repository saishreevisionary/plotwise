'use client';

import React, { useState, useRef } from 'react';
import { PolygonPoint } from '@/types';
import { Plus, Check, X, Trash2, Move, Square, RotateCw } from 'lucide-react';

interface PolygonEditorProps {
  polygon: PolygonPoint[];
  width: number;
  height: number;
  onChange: (newPolygon: PolygonPoint[]) => void;
  onSave: () => void;
  onCancel: () => void;
  isAddingNew?: boolean;
}

export const PolygonEditor: React.FC<PolygonEditorProps> = ({
  polygon,
  width,
  height,
  onChange,
  onSave,
  onCancel,
  isAddingNew = false,
}) => {
  const [activeVertex, setActiveVertex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const pointsString = polygon.map((pt) => `${pt[0]},${pt[1]}`).join(' ');

  // Handle vertex drag
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.stopPropagation();
    setActiveVertex(index);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeVertex === null || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Clamp coordinates to canvas bounds
    const clampedX = Math.round(Math.max(0, Math.min(width, mouseX)));
    const clampedY = Math.round(Math.max(0, Math.min(height, mouseY)));

    const updated = [...polygon];
    updated[activeVertex] = [clampedX, clampedY];
    onChange(updated);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeVertex !== null) {
      setActiveVertex(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Point and click for drawing new polygon
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAddingNew || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const clickX = Math.round((e.clientX - rect.left) * scaleX);
    const clickY = Math.round((e.clientY - rect.top) * scaleY);

    onChange([...polygon, [clickX, clickY]]);
  };

  // Auto-rectify to clean orthogonal rectangle bounding box
  const handleAutoRectify = () => {
    if (polygon.length === 0) return;
    const xs = polygon.map((p) => p[0]);
    const ys = polygon.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const rectified: PolygonPoint[] = [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
    ];
    onChange(rectified);
  };

  // Insert vertex at midpoint of edge `edgeIdx`
  const handleInsertMidpoint = (edgeIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const p1 = polygon[edgeIdx];
    const p2 = polygon[(edgeIdx + 1) % polygon.length];
    const midX = Math.round((p1[0] + p2[0]) / 2);
    const midY = Math.round((p1[1] + p2[1]) / 2);

    const updated = [...polygon];
    updated.splice(edgeIdx + 1, 0, [midX, midY]);
    onChange(updated);
  };

  // Delete active vertex
  const handleDeleteVertex = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (polygon.length <= 3) return; // Keep minimum 3 vertices
    const updated = polygon.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div className="relative w-full h-full">
      {/* Editor Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl text-xs text-white">
        <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
          <Move className="w-4 h-4 animate-bounce" />
          <span>{isAddingNew ? 'Click canvas to add plot corners' : 'Drag handles to fit layout line'}</span>
        </div>

        <div className="h-4 w-px bg-slate-700" />

        <button
          type="button"
          onClick={handleAutoRectify}
          title="Auto-align to clean orthogonal rectangle"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold border border-cyan-500/30 transition-all"
        >
          <Square className="w-3.5 h-3.5" />
          <span>Auto-Box</span>
        </button>

        <div className="h-4 w-px bg-slate-700" />

        <span className="text-slate-400 font-mono">{polygon.length} Vertices</span>

        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={onSave}
            disabled={polygon.length < 3}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md disabled:opacity-50 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Plot</span>
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas Editing Overlay */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        onClick={handleSvgClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full absolute inset-0 z-20 cursor-crosshair touch-none select-none"
      >
        {/* Active Editing Polygon */}
        {polygon.length > 0 && (
          <polygon
            points={pointsString}
            fill="rgba(34, 211, 238, 0.3)"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeDasharray="6 3"
            className="transition-all"
          />
        )}

        {/* Edge Midpoint Plus Handles (Click to insert new vertex) */}
        {!isAddingNew &&
          polygon.map((p1, idx) => {
            const p2 = polygon[(idx + 1) % polygon.length];
            const midX = (p1[0] + p2[0]) / 2;
            const midY = (p1[1] + p2[1]) / 2;

            return (
              <g key={`mid-${idx}`} onClick={(e) => handleInsertMidpoint(idx, e)} className="cursor-pointer">
                <circle
                  cx={midX}
                  cy={midY}
                  r="7"
                  fill="#0f172a"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  className="hover:scale-125 transition-transform"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  fill="#22d3ee"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  +
                </text>
              </g>
            );
          })}

        {/* Draggable Vertex Handles */}
        {polygon.map((pt, idx) => {
          const isSelected = activeVertex === idx;
          return (
            <g key={idx} className="cursor-grab active:cursor-grabbing">
              {/* Pulse Ring */}
              <circle
                cx={pt[0]}
                cy={pt[1]}
                r={isSelected ? 14 : 10}
                fill="rgba(34, 211, 238, 0.3)"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              {/* Inner Handle */}
              <circle
                cx={pt[0]}
                cy={pt[1]}
                r={isSelected ? 7 : 5}
                fill={isSelected ? '#22d3ee' : '#ffffff'}
                stroke="#0891b2"
                strokeWidth="2"
                onPointerDown={(e) => handlePointerDown(idx, e)}
              />
              {/* Vertex Label */}
              <text
                x={pt[0]}
                y={pt[1] - 12}
                fill="#ffffff"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                className="pointer-events-none drop-shadow-md"
              >
                V{idx + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

