'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plot, Road, PolygonPoint, PlotStatus } from '@/types';
import { StatusLegend } from '@/components/common/StatusLegend';
import { PolygonEditor } from './PolygonEditor';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  Compass,
  Edit3,
  Plus,
  Box,
  Layers,
  MapPin,
  Grid,
  Sparkles,
} from 'lucide-react';

interface InteractiveLayoutMapProps {
  layoutWidth: number;
  layoutHeight: number;
  fileUrl?: string;
  plots: Plot[];
  roads: Road[];
  selectedPlotId: string | null;
  onSelectPlot: (plot: Plot | null) => void;
  onUpdatePlotPolygon?: (plotId: string, newCoords: PolygonPoint[]) => void;
  onAddPlotClick?: () => void;
  onSplitPlotClick?: (plot: Plot) => void;
  onRealignGridClick?: () => void;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

export const InteractiveLayoutMap: React.FC<InteractiveLayoutMapProps> = ({
  layoutWidth = 1200,
  layoutHeight = 964,
  fileUrl = '/green-valley-layout.png',
  plots,
  roads,
  selectedPlotId,
  onSelectPlot,
  onUpdatePlotPolygon,
  onAddPlotClick,
  onSplitPlotClick,
  onRealignGridClick,
  isEditMode = false,
  onToggleEditMode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [showLabels, setShowLabels] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [hoveredPlotId, setHoveredPlotId] = useState<string | null>(null);

  // Active editing state for selected plot polygon
  const [editingPolygon, setEditingPolygon] = useState<PolygonPoint[] | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  // Synchronize editing polygon when selection changes
  useEffect(() => {
    if (isEditMode && selectedPlot) {
      setEditingPolygon([...selectedPlot.polygon_coordinates]);
    } else {
      setEditingPolygon(null);
    }
  }, [isEditMode, selectedPlotId]);

  // Center & zoom to selected plot when selected from search or list
  useEffect(() => {
    if (selectedPlot && !isEditMode) {
      const coords = selectedPlot.polygon_coordinates;
      if (coords.length > 0) {
        const cx = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
        const cy = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;

        // Auto zoom and pan toward plot center
        setZoom(1.4);
        setPan({
          x: (layoutWidth / 2 - cx) * 0.8,
          y: (layoutHeight / 2 - cy) * 0.8,
        });
      }
    }
  }, [selectedPlotId]);

  const handleZoomIn = () => setZoom((prev) => Math.min(3.5, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.25));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return; // Don't pan when editing polygon
    if (e.button === 0) {
      setIsDraggingPan(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingPan && !isEditMode) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDraggingPan(false);

  // Status color styles for SVG Polygons
  const getPlotStyles = (status: PlotStatus, isSelected: boolean, isHovered: boolean) => {
    if (isSelected) {
      return {
        fill: 'rgba(34, 211, 238, 0.45)',
        stroke: '#22d3ee',
        strokeWidth: '4',
        filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.8))',
      };
    }

    if (isHovered) {
      return {
        fill: 'rgba(255, 255, 255, 0.4)',
        stroke: '#ffffff',
        strokeWidth: '3',
        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
      };
    }

    switch (status) {
      case 'available':
        return {
          fill: 'rgba(16, 185, 129, 0.35)',
          stroke: '#10b981',
          strokeWidth: '2',
        };
      case 'booked':
        return {
          fill: 'rgba(245, 158, 11, 0.4)',
          stroke: '#f59e0b',
          strokeWidth: '2',
        };
      case 'sold':
        return {
          fill: 'rgba(244, 63, 94, 0.4)',
          stroke: '#f43f5e',
          strokeWidth: '2',
        };
      default:
        return {
          fill: 'rgba(148, 163, 184, 0.3)',
          stroke: '#94a3b8',
          strokeWidth: '2',
        };
    }
  };

  // Polygon center helper
  const getPolygonCenter = (points: PolygonPoint[]) => {
    if (points.length === 0) return { x: 0, y: 0 };
    const cx = points.reduce((sum, p) => sum + p[0], 0) / points.length;
    const cy = points.reduce((sum, p) => sum + p[1], 0) / points.length;
    return { x: cx, y: cy };
  };

  const handleSavePolygonEdit = () => {
    if (selectedPlotId && editingPolygon && onUpdatePlotPolygon) {
      onUpdatePlotPolygon(selectedPlotId, editingPolygon);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none cursor-grab active:cursor-grabbing flex flex-col justify-between"
    >
      {/* Blueprint Grid Background Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: `24px 24px, 48px 48px, 48px 48px`,
        }}
      />

      {/* Top Map Controls Bar */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 flex items-center gap-1 shadow-xl">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            title="Reset View"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-800 my-auto mx-1" />

          <button
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? 'Hide Plot Labels' : 'Show Plot Labels'}
            className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              showLabels ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {showLabels ? <Eye className="w-4 h-4 text-indigo-400" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Labels</span>
          </button>

          <button
            onClick={() => setShowRoads(!showRoads)}
            title={showRoads ? 'Hide Roads Layer' : 'Show Roads Layer'}
            className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              showRoads ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Roads</span>
          </button>
        </div>

        {/* AI Vertex Edit Toggle */}
        {onToggleEditMode && (
          <button
            onClick={onToggleEditMode}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xl flex items-center gap-1.5 border ${
              isEditMode
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                : 'bg-slate-900/90 text-cyan-400 border-cyan-500/30 hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditMode ? 'Editing Vertices' : 'Edit Layout'}</span>
          </button>
        )}

        {/* Split Block into Small Plots Button */}
        {onSplitPlotClick && selectedPlot && (
          <button
            onClick={() => onSplitPlotClick(selectedPlot)}
            className="px-3 py-2 rounded-xl bg-indigo-900/90 hover:bg-indigo-800 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all shadow-xl flex items-center gap-1.5 animate-pulse"
          >
            <Grid className="w-4 h-4 text-indigo-400" />
            <span>Split Block (Plot {selectedPlot.plot_number})</span>
          </button>
        )}

        {/* Auto-Align Blueprint Grid Button */}
        {onRealignGridClick && (
          <button
            onClick={onRealignGridClick}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-indigo-400/40 text-xs font-bold transition-all shadow-xl flex items-center gap-1.5"
            title="Snap plots and road corridors directly onto blueprint line grid"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Auto-Align Grid</span>
          </button>
        )}

        {/* Add Plot Button */}
        {onAddPlotClick && (
          <button
            onClick={onAddPlotClick}
            className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-xl flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plot</span>
          </button>
        )}
      </div>

      {/* Bottom Floating Legend & Stats */}
      <div className="absolute bottom-4 left-4 z-20 hidden sm:block">
        <StatusLegend />
      </div>

      {/* Compass / Orientation */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 flex items-center gap-2 shadow-xl">
        <Compass className="w-4 h-4 text-indigo-400" />
        <span className="font-semibold text-white">NORTH ↑</span>
      </div>

      {/* Main Transformable SVG Viewport */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <div className="relative shadow-2xl border border-indigo-500/20 rounded-lg overflow-hidden bg-slate-950">
          <svg
            viewBox={`0 0 ${layoutWidth} ${layoutHeight}`}
            className="w-full max-w-[1400px] h-auto max-h-[85vh] block"
          >
            {/* Base Uploaded Site Blueprint Image */}
            <image
              href={!fileUrl || fileUrl.includes('green-valley-layout') ? '/site-grid-48-blueprint.svg' : fileUrl}
              x="0"
              y="0"
              width={layoutWidth}
              height={layoutHeight}
              preserveAspectRatio="none"
            />

            {/* Roads Layer */}
            {showRoads &&
              roads.map((road) => {
                const pointsStr = road.polygon_coordinates
                  .map((pt) => `${pt[0]},${pt[1]}`)
                  .join(' ');
                const center = getPolygonCenter(road.polygon_coordinates);

                // Calculate centerline path for yellow lane stripe
                const pts = road.polygon_coordinates;
                let centerlineStr = '';
                if (pts.length >= 4) {
                  const m1x = (pts[0][0] + pts[3][0]) / 2;
                  const m1y = (pts[0][1] + pts[3][1]) / 2;
                  const m2x = (pts[1][0] + pts[2][0]) / 2;
                  const m2y = (pts[1][1] + pts[2][1]) / 2;
                  centerlineStr = `${m1x},${m1y} ${m2x},${m2y}`;
                }

                return (
                  <g key={road.id}>
                    {/* Asphalt Road Surface */}
                    <polygon
                      points={pointsStr}
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke="#475569"
                      strokeWidth="2.5"
                    />

                    {/* Yellow Center Dashed Lane Stripe */}
                    {centerlineStr && (
                      <polyline
                        points={centerlineStr}
                        fill="none"
                        stroke="#facc15"
                        strokeWidth="2"
                        strokeDasharray="8 6"
                        opacity="0.85"
                      />
                    )}

                    {/* Road Name Badge Label */}
                    {showLabels && road.name && (
                      <g>
                        <rect
                          x={center.x - 65}
                          y={center.y - 10}
                          width="130"
                          height="20"
                          rx="4"
                          fill="#0f172a"
                          stroke="#334155"
                          strokeWidth="1"
                        />
                        <text
                          x={center.x}
                          y={center.y + 1}
                          fill="#f8fafc"
                          fontSize="10"
                          fontWeight="bold"
                          letterSpacing="0.5"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="pointer-events-none tracking-wider"
                        >
                          {road.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

            {/* Plots SVG Polygon Layer */}
            {plots.map((plot) => {
              const isSelected = plot.id === selectedPlotId;
              const isHovered = plot.id === hoveredPlotId;
              const styles = getPlotStyles(plot.status, isSelected, isHovered);
              const pointsStr = plot.polygon_coordinates
                .map((pt) => `${pt[0]},${pt[1]}`)
                .join(' ');
              const center = getPolygonCenter(plot.polygon_coordinates);

              return (
                <g key={plot.id} className="cursor-pointer">
                  {/* Plot Polygon */}
                  <polygon
                    points={pointsStr}
                    fill={styles.fill}
                    stroke={styles.stroke}
                    strokeWidth={styles.strokeWidth}
                    style={{ filter: styles.filter }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectPlot(plot);
                    }}
                    onMouseEnter={() => setHoveredPlotId(plot.id)}
                    onMouseLeave={() => setHoveredPlotId(null)}
                    className="transition-all duration-200 hover:opacity-90"
                  />

                  {/* Plot Number & Dimension Callout Labels */}
                  {showLabels && (
                    <g className="pointer-events-none">
                      <text
                        x={center.x}
                        y={plot.dimensions_text ? center.y - 8 : center.y}
                        fill={isSelected ? '#22d3ee' : '#ffffff'}
                        fontSize={isSelected ? '15' : '13'}
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="drop-shadow-md tracking-wider transition-all"
                      >
                        {plot.plot_number}
                      </text>
                      {plot.dimensions_text && (
                        <text
                          x={center.x}
                          y={center.y + 10}
                          fill={isSelected ? '#a5f3fc' : '#cbd5e1'}
                          fontSize="10"
                          fontWeight="600"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="drop-shadow-md"
                        >
                          {plot.dimensions_text} {plot.area_cents ? `(${plot.area_cents} Cents)` : ''}
                        </text>
                      )}
                    </g>
                  )}

                  {/* Low AI Confidence warning icon on polygon if < 0.85 */}
                  {plot.ai_confidence < 0.85 && (
                    <circle
                      cx={center.x + 22}
                      cy={center.y - 12}
                      r="4"
                      fill="#f59e0b"
                      className="animate-ping pointer-events-none"
                    />
                  )}
                </g>
              );
            })}

            {/* CAD Dimension Overlay Lines (for 4-Plot 20ft Road layout) */}
            {layoutHeight === 1024 && (
              <g className="pointer-events-none stroke-rose-500 fill-rose-400 font-mono text-[11px] font-bold">
                {/* Top Overall Width Callout: 83'-9" */}
                <line x1="95" y1="50" x2="675" y2="50" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="95,50 102,46 102,54" fill="#f43f5e" />
                <polygon points="675,50 668,46 668,54" fill="#f43f5e" />
                <rect x="345" y="40" width="80" height="20" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
                <text x="385" y="54" textAnchor="middle" fill="#fb7185">83&apos;-9&quot;</text>

                {/* Bottom Split Widths: 42'-0" & 41'-9" */}
                <line x1="95" y1="965" x2="385" y2="965" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="95,965 102,961 102,969" fill="#f43f5e" />
                <polygon points="385,965 378,961 378,969" fill="#f43f5e" />
                <rect x="210" y="955" width="60" height="20" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
                <text x="240" y="969" textAnchor="middle" fill="#fb7185">42&apos;-0&quot;</text>

                <line x1="385" y1="965" x2="675" y2="965" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="385,965 392,961 392,969" fill="#f43f5e" />
                <polygon points="675,965 668,961 668,969" fill="#f43f5e" />
                <rect x="500" y="955" width="60" height="20" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
                <text x="530" y="969" textAnchor="middle" fill="#fb7185">41&apos;-9&quot;</text>

                {/* Left Split Heights: 65'-0" & 65'-0" */}
                <line x1="40" y1="115" x2="40" y2="525" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="40,115 36,122 44,122" fill="#f43f5e" />
                <polygon points="40,525 36,518 44,518" fill="#f43f5e" />
                <rect x="10" y="310" width="60" height="20" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
                <text x="40" y="324" textAnchor="middle" fill="#fb7185">65&apos;-0&quot;</text>

                <line x1="40" y1="525" x2="40" y2="940" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="40,525 36,532 44,532" fill="#f43f5e" />
                <polygon points="40,940 36,933 44,933" fill="#f43f5e" />
                <rect x="10" y="720" width="60" height="20" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
                <text x="40" y="734" textAnchor="middle" fill="#fb7185">65&apos;-0&quot;</text>

                {/* Right Overall Height Callout: 130'-0" */}
                <line x1="730" y1="115" x2="730" y2="940" stroke="#f43f5e" strokeWidth="1.5" />
                <polygon points="730,115 726,122 734,122" fill="#f43f5e" />
                <polygon points="730,940 726,933 734,933" fill="#f43f5e" />
                <rect x="700" y="515" width="60" height="20" rx="3" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
                <text x="730" y="529" textAnchor="middle" fill="#fb7185">130&apos;-0&quot;</text>
              </g>
            )}
          </svg>

          {/* Active SVG Vertex Drag Editor Component */}
          {isEditMode && editingPolygon && selectedPlot && (
            <PolygonEditor
              polygon={editingPolygon}
              width={layoutWidth}
              height={layoutHeight}
              onChange={(updated) => setEditingPolygon(updated)}
              onSave={handleSavePolygonEdit}
              onCancel={() => {
                if (onToggleEditMode) onToggleEditMode();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
