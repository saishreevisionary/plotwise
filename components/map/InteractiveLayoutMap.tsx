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
  Image as ImageIcon,
  Sliders,
  Upload,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  PenTool,
  MousePointerClick,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InteractiveLayoutMapProps {
  layoutWidth: number;
  layoutHeight: number;
  fileUrl?: string;
  aerialImageUrl?: string;
  aerialOpacity?: number;
  plots: Plot[];
  roads: Road[];
  selectedPlotId: string | null;
  onSelectPlot: (plot: Plot | null) => void;
  onUpdatePlotPolygon?: (plotId: string, newCoords: PolygonPoint[]) => void;
  onAddPlotClick?: () => void;
  onSplitPlotClick?: (plot: Plot) => void;
  onRealignGridClick?: (mode: 'master57' | 'blueprint' | 'drone' | 'villa4') => void;
  onUploadAerial?: (file: File) => void;
  onUpdateAerialOpacity?: (opacity: number) => void;
  onDeletePlot?: (plotId: string) => void;
  onConfirmLayout?: () => void;
  onAddNewPlotPolygon?: (coords: PolygonPoint[]) => void;
  isConfirmed?: boolean;
  isEditMode?: boolean;
  onToggleEditMode?: () => void;
}

export const InteractiveLayoutMap: React.FC<InteractiveLayoutMapProps> = ({
  layoutWidth = 1200,
  layoutHeight = 964,
  fileUrl = '/green-valley-layout.png',
  aerialImageUrl,
  aerialOpacity = 0.8,
  plots,
  roads,
  selectedPlotId,
  onSelectPlot,
  onUpdatePlotPolygon,
  onAddPlotClick,
  onSplitPlotClick,
  onRealignGridClick,
  onUploadAerial,
  onUpdateAerialOpacity,
  onDeletePlot,
  onConfirmLayout,
  onAddNewPlotPolygon,
  isConfirmed = false,
  isEditMode = false,
  onToggleEditMode,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Layer Visibility Controls
  const [showLabels, setShowLabels] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showPlots, setShowPlots] = useState(true);
  const [showBlueprint, setShowBlueprint] = useState(true);
  const [showAerial, setShowAerial] = useState(true);
  const [localAerialOpacity, setLocalAerialOpacity] = useState(aerialOpacity);
  const [showLayersDropdown, setShowLayersDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [hoveredPlotId, setHoveredPlotId] = useState<string | null>(null);

  // Manual Drawing State
  const [isDrawingNewPlot, setIsDrawingNewPlot] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<PolygonPoint[]>([]);

  // Verification state
  const [layoutConfirmed, setLayoutConfirmed] = useState(isConfirmed);
  const [isReviewBannerMinimized, setIsReviewBannerMinimized] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active editing state for selected plot polygon
  const [editingPolygon, setEditingPolygon] = useState<PolygonPoint[] | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  // Confidence counters
  const highConfidenceCount = plots.filter((p) => (p.ai_confidence ?? 0.9) >= 0.85).length;
  const mediumConfidenceCount = plots.filter(
    (p) => (p.ai_confidence ?? 0.9) >= 0.6 && (p.ai_confidence ?? 0.9) < 0.85
  ).length;
  const reviewNeededCount = plots.filter((p) => (p.ai_confidence ?? 0.9) < 0.6).length;

  // Keep local opacity in sync with prop
  useEffect(() => {
    if (aerialOpacity !== undefined) {
      setLocalAerialOpacity(aerialOpacity);
    }
  }, [aerialOpacity]);

  // Synchronize editing polygon when selection changes
  useEffect(() => {
    if (isEditMode && selectedPlot) {
      setEditingPolygon([...selectedPlot.polygon_coordinates]);
    } else {
      setEditingPolygon(null);
    }
  }, [isEditMode, selectedPlotId]);

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

  // Status & Confidence color styles for SVG Polygons
  const getPlotStyles = (plot: Plot, isSelected: boolean, isHovered: boolean) => {
    const conf = plot.ai_confidence ?? 0.9;

    if (isSelected) {
      return {
        fill: 'rgba(34, 211, 238, 0.45)',
        stroke: '#22d3ee',
        strokeWidth: '4',
        strokeDasharray: undefined,
        filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.8))',
        badgeColor: '#22d3ee',
      };
    }

    if (isHovered) {
      return {
        fill: 'rgba(255, 255, 255, 0.4)',
        stroke: '#ffffff',
        strokeWidth: '3',
        strokeDasharray: undefined,
        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6))',
        badgeColor: '#ffffff',
      };
    }

    // Visual Verification States (Requirement 4 & 10)
    if (conf < 0.6) {
      // Low confidence / Needs Review (Red)
      return {
        fill: 'rgba(239, 68, 68, 0.35)',
        stroke: '#ef4444',
        strokeWidth: '3',
        strokeDasharray: '5 4',
        filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))',
        badgeColor: '#ef4444',
      };
    }

    if (conf < 0.85) {
      // Medium confidence (Yellow)
      return {
        fill: 'rgba(245, 158, 11, 0.35)',
        stroke: '#f59e0b',
        strokeWidth: '2.5',
        strokeDasharray: '6 3',
        filter: undefined,
        badgeColor: '#f59e0b',
      };
    }

    // High confidence (Green / Status standard)
    switch (plot.status) {
      case 'available':
        return {
          fill: 'rgba(16, 185, 129, 0.35)',
          stroke: '#10b981',
          strokeWidth: '2',
          strokeDasharray: undefined,
          filter: undefined,
          badgeColor: '#10b981',
        };
      case 'booked':
        return {
          fill: 'rgba(245, 158, 11, 0.4)',
          stroke: '#f59e0b',
          strokeWidth: '2',
          strokeDasharray: undefined,
          filter: undefined,
          badgeColor: '#f59e0b',
        };
      case 'sold':
        return {
          fill: 'rgba(244, 63, 94, 0.4)',
          stroke: '#f43f5e',
          strokeWidth: '2',
          strokeDasharray: undefined,
          filter: undefined,
          badgeColor: '#f43f5e',
        };
      default:
        return {
          fill: 'rgba(16, 185, 129, 0.35)',
          stroke: '#10b981',
          strokeWidth: '2',
          strokeDasharray: undefined,
          filter: undefined,
          badgeColor: '#10b981',
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

      {/* 1. Top Image Analysis Review & Manual Correction Stage */}
      {!isReviewBannerMinimized ? (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-4xl w-[94%] pointer-events-auto animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex-1 bg-slate-900/90 backdrop-blur-xl border border-indigo-500/30 rounded-xl px-3.5 py-2 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Image Analysis Review</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {plots.length} Plots
                  </span>
                  {reviewNeededCount > 0 ? (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {reviewNeededCount} Need Review
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {highConfidenceCount} High Confidence
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Toggle Vertex Edit Mode */}
              {onToggleEditMode && (
                <button
                  onClick={onToggleEditMode}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                    isEditMode
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/30'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEditMode ? 'Finish Edit' : 'Edit Vertices'}</span>
                </button>
              )}

              {/* Draw Missing Plot Button */}
              <button
                onClick={() => {
                  setIsDrawingNewPlot(!isDrawingNewPlot);
                  setDrawingPoints([]);
                }}
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                  isDrawingNewPlot
                    ? 'bg-amber-500 text-slate-950 border-amber-400 ring-2 ring-amber-400/40 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30'
                }`}
              >
                <PenTool className="w-3 h-3" />
                <span>{isDrawingNewPlot ? 'Cancel' : 'Draw Plot'}</span>
              </button>

              {/* Confirm Layout Button */}
              {onConfirmLayout && (
                <button
                  onClick={() => {
                    setLayoutConfirmed(true);
                    onConfirmLayout();
                  }}
                  className={`px-3 py-1 rounded-lg font-bold text-xs shadow-md flex items-center gap-1 border transition-all ${
                    layoutConfirmed
                      ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400/40 hover:scale-105 active:scale-95 shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{layoutConfirmed ? 'Confirmed ✓' : 'Confirm Plot Geometry'}</span>
                </button>
              )}

              {/* Minimize Toggle Button */}
              <button
                onClick={() => setIsReviewBannerMinimized(true)}
                title="Minimize banner to see full top area"
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-all ml-1"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed Review Pill */
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-top-1 duration-200">
          <button
            onClick={() => setIsReviewBannerMinimized(false)}
            className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/40 hover:border-indigo-400 text-slate-200 px-3 py-1 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold hover:bg-slate-800 transition-all group"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Image Analysis Review ({plots.length} Plots)</span>
            <ChevronDown className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Floating Drawing Progress Action Bar */}
      {isDrawingNewPlot && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-amber-950/90 backdrop-blur-md border border-amber-500/60 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl text-xs text-amber-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <MousePointerClick className="w-4 h-4 animate-bounce text-amber-400" />
            <span>Click on image to place corners ({drawingPoints.length} vertices)</span>
          </div>

          <div className="h-4 w-px bg-amber-800" />

          <button
            type="button"
            disabled={drawingPoints.length < 3}
            onClick={() => {
              if (drawingPoints.length >= 3 && onAddNewPlotPolygon) {
                onAddNewPlotPolygon(drawingPoints);
                setIsDrawingNewPlot(false);
                setDrawingPoints([]);
              }
            }}
            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50 transition-all flex items-center gap-1 shadow-md"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Finish & Save</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsDrawingNewPlot(false);
              setDrawingPoints([]);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Left Floating Toolbar Controls */}
      <div className="absolute top-20 left-4 z-20 flex flex-wrap items-center gap-2">
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

          {/* Comprehensive Layers & Opacity Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLayersDropdown(!showLayersDropdown)}
              title="Layer Settings & Opacity"
              className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                showLayersDropdown || aerialImageUrl
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Layers</span>
              {aerialImageUrl && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
            </button>

            {/* Layer Settings Dropdown */}
            {showLayersDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3 shadow-2xl z-50 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Layer Visibility
                  </span>
                  <button
                    onClick={() => setShowLayersDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                {/* Layer switches */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      Blueprint Drawing
                    </span>
                    <input
                      type="checkbox"
                      checked={showBlueprint}
                      onChange={(e) => setShowBlueprint(e.target.checked)}
                      className="accent-indigo-600 rounded"
                    />
                  </label>

                  {aerialImageUrl && (
                    <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                        Aerial / Drone Underlay
                      </span>
                      <input
                        type="checkbox"
                        checked={showAerial}
                        onChange={(e) => setShowAerial(e.target.checked)}
                        className="accent-cyan-500 rounded"
                      />
                    </label>
                  )}

                  <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                    <span className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-emerald-400" />
                      Plot Boundaries
                    </span>
                    <input
                      type="checkbox"
                      checked={showPlots}
                      onChange={(e) => setShowPlots(e.target.checked)}
                      className="accent-emerald-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      Plot Labels & Numbers
                    </span>
                    <input
                      type="checkbox"
                      checked={showLabels}
                      onChange={(e) => setShowLabels(e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer text-slate-300 hover:text-white">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Road Network
                    </span>
                    <input
                      type="checkbox"
                      checked={showRoads}
                      onChange={(e) => setShowRoads(e.target.checked)}
                      className="accent-indigo-500 rounded"
                    />
                  </label>
                </div>

                {/* Aerial Opacity Slider & Quick Presets */}
                {aerialImageUrl && showAerial && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Layer Blend Opacity:</span>
                      <span className="font-mono text-cyan-300 font-bold">{Math.round(localAerialOpacity * 100)}%</span>
                    </div>

                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={localAerialOpacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setLocalAerialOpacity(val);
                        if (onUpdateAerialOpacity) onUpdateAerialOpacity(val);
                      }}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />

                    {/* Quick Blend Presets */}
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setLocalAerialOpacity(0.0);
                          if (onUpdateAerialOpacity) onUpdateAerialOpacity(0.0);
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                          localAerialOpacity === 0
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        📐 Plan Only
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLocalAerialOpacity(0.5);
                          if (onUpdateAerialOpacity) onUpdateAerialOpacity(0.5);
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                          localAerialOpacity === 0.5
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        🌗 50/50 Dual
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLocalAerialOpacity(1.0);
                          if (onUpdateAerialOpacity) onUpdateAerialOpacity(1.0);
                        }}
                        className={`px-1.5 py-1 rounded text-[10px] font-semibold border transition-all ${
                          localAerialOpacity === 1.0
                            ? 'bg-cyan-600 text-white border-cyan-500'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        🚁 Aerial
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload / Replace Aerial Image button */}
                {onUploadAerial && (
                  <div className="pt-2 border-t border-slate-800">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUploadAerial(f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-cyan-950/80 to-indigo-950/80 hover:from-cyan-900 hover:to-indigo-900 border border-cyan-500/30 text-cyan-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-md"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{aerialImageUrl ? 'Replace Drone Aerial Photo' : 'Attach Drone Aerial Survey'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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

        {/* Auto-Align Grid Dropdown Button */}
        {onRealignGridClick && (
          <div className="relative">
            <button
              onClick={() => setShowAlignDropdown(!showAlignDropdown)}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border border-indigo-400/40 text-xs font-bold transition-all shadow-xl flex items-center gap-1.5"
              title="Snap plots and road corridors directly onto the layout image"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Auto-Align AI Grid</span>
            </button>

            {showAlignDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-2.5 shadow-2xl z-50 space-y-1.5 text-xs animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1 flex items-center justify-between">
                  <span>AI Alignment Presets</span>
                  <span className="text-[10px] text-cyan-400 font-mono">1-Click Snap</span>
                </div>

                {/* Preset 1: Masterplan 57 Plots */}
                <button
                  onClick={() => {
                    onRealignGridClick('master57');
                    setShowAlignDropdown(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-cyan-950/60 hover:from-indigo-900/80 hover:to-cyan-900/80 border border-cyan-500/30 text-slate-200 flex items-start gap-2.5 transition-all shadow-md group"
                >
                  <span className="text-lg">🌟</span>
                  <div>
                    <div className="font-bold text-cyan-300 group-hover:text-cyan-200 flex items-center gap-1.5">
                      <span>Masterplan (57 Plots)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">MATCH</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Rows 01-11 (30&apos;x40&apos;), 12-47 (30&apos;x50&apos;), 49-57 odd plots + 30ft/40ft roads
                    </div>
                  </div>
                </button>

                {/* Preset 2: 48-Plot CAD Blueprint */}
                <button
                  onClick={() => {
                    onRealignGridClick('blueprint');
                    setShowAlignDropdown(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-indigo-950/60 hover:text-indigo-300 text-slate-200 flex items-start gap-2 transition-colors border border-transparent hover:border-indigo-500/30"
                >
                  <span className="text-base">📐</span>
                  <div>
                    <div className="font-bold text-indigo-300">48-Plot CAD Blueprint Grid</div>
                    <div className="text-[10px] text-slate-400">4 columns x 12 rows with dual central 30ft/40ft avenues</div>
                  </div>
                </button>

                {/* Preset 3: Drone Survey */}
                <button
                  onClick={() => {
                    onRealignGridClick('drone');
                    setShowAlignDropdown(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-200 flex items-start gap-2 transition-colors border border-transparent hover:border-cyan-500/30"
                >
                  <span className="text-base">🚁</span>
                  <div>
                    <div className="font-bold text-cyan-300">Drone Survey (16 Parcels)</div>
                    <div className="text-[10px] text-slate-400">Natural terrain boundary fences &amp; curved central spine road</div>
                  </div>
                </button>

                {/* Preset 4: 4-Plot Villa Colony */}
                <button
                  onClick={() => {
                    onRealignGridClick('villa4');
                    setShowAlignDropdown(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-200 flex items-start gap-2 transition-colors border border-transparent hover:border-emerald-500/30"
                >
                  <span className="text-base">🏡</span>
                  <div>
                    <div className="font-bold text-emerald-300">4-Plot Villa Colony (20ft Road)</div>
                    <div className="text-[10px] text-slate-400">4 corner villa plots bounded by 20ft perimeter roads</div>
                  </div>
                </button>
              </div>
            )}
          </div>
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
            {/* 1. Underlying Aerial / Drone Image (if uploaded) */}
            {aerialImageUrl && showAerial && (
              <image
                href={aerialImageUrl}
                x="0"
                y="0"
                width={layoutWidth}
                height={layoutHeight}
                opacity={localAerialOpacity}
                preserveAspectRatio="none"
              />
            )}

            {/* 2. Base Uploaded Site Blueprint Image */}
            {showBlueprint && (
              <image
                href={!fileUrl || fileUrl.includes('green-valley-layout') ? '/site-grid-48-blueprint.svg' : fileUrl}
                x="0"
                y="0"
                width={layoutWidth}
                height={layoutHeight}
                opacity={aerialImageUrl && showAerial ? 0.75 : 1.0}
                preserveAspectRatio="none"
              />
            )}

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
              const styles = getPlotStyles(plot, isSelected, isHovered);
              const pointsStr = plot.polygon_coordinates
                .map((pt) => `${pt[0]},${pt[1]}`)
                .join(' ');
              const center = getPolygonCenter(plot.polygon_coordinates);
              const conf = plot.ai_confidence ?? 0.9;

              return (
                <g key={plot.id} className="cursor-pointer">
                  {/* Plot Polygon */}
                  <polygon
                    points={pointsStr}
                    fill={styles.fill}
                    stroke={styles.stroke}
                    strokeWidth={styles.strokeWidth}
                    strokeDasharray={styles.strokeDasharray}
                    style={{ filter: styles.filter }}
                    onClick={(e) => {
                      if (isDrawingNewPlot) return;
                      e.stopPropagation();
                      onSelectPlot(isSelected ? null : plot);
                    }}
                    onMouseEnter={() => setHoveredPlotId(plot.id)}
                    onMouseLeave={() => setHoveredPlotId(null)}
                    className="transition-all duration-200 hover:opacity-90"
                  />

                  {/* Plot Number & Dimension Callout Labels */}
                  {showLabels && (
                    <g className="pointer-events-none">
                      {/* Plot Number */}
                      <text
                        x={center.x}
                        y={conf < 0.6 ? center.y - 12 : plot.dimensions_text ? center.y - 8 : center.y}
                        fill={isSelected ? '#22d3ee' : '#ffffff'}
                        fontSize={isSelected ? '15' : '13'}
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="drop-shadow-md tracking-wider transition-all"
                      >
                        {plot.plot_number}
                      </text>

                      {/* Confidence State Badge in center */}
                      {conf < 0.6 ? (
                        <g>
                          <rect
                            x={center.x - 38}
                            y={center.y + 2}
                            width="76"
                            height="16"
                            rx="4"
                            fill="#7f1d1d"
                            stroke="#ef4444"
                            strokeWidth="1"
                          />
                          <text
                            x={center.x}
                            y={center.y + 11}
                            fill="#fca5a5"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            ⚠ Needs Review
                          </text>
                        </g>
                      ) : conf < 0.85 ? (
                        <g>
                          <rect
                            x={center.x - 28}
                            y={center.y + 4}
                            width="56"
                            height="14"
                            rx="3"
                            fill="#78350f"
                            stroke="#f59e0b"
                            strokeWidth="0.8"
                          />
                          <text
                            x={center.x}
                            y={center.y + 12}
                            fill="#fde68a"
                            fontSize="8.5"
                            fontWeight="600"
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            🟡 {Math.round(conf * 100)}% Conf
                          </text>
                        </g>
                      ) : (
                        plot.dimensions_text && (
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
                            {plot.dimensions_text}
                          </text>
                        )
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Active Drawing Preview Polygon */}
            {isDrawingNewPlot && drawingPoints.length > 0 && (
              <g className="pointer-events-none">
                <polygon
                  points={drawingPoints.map((pt) => `${pt[0]},${pt[1]}`).join(' ')}
                  fill="rgba(245, 158, 11, 0.35)"
                  stroke="#f59e0b"
                  strokeWidth="3"
                  strokeDasharray="6 3"
                />
                {drawingPoints.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt[0]}
                    cy={pt[1]}
                    r="6"
                    fill="#f59e0b"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                ))}
              </g>
            )}

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
              </g>
            )}
          </svg>

          {/* Point-and-click overlay when drawing a new plot */}
          {isDrawingNewPlot && (
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const scaleX = layoutWidth / rect.width;
                const scaleY = layoutHeight / rect.height;
                const clickX = Math.round((e.clientX - rect.left) * scaleX);
                const clickY = Math.round((e.clientY - rect.top) * scaleY);
                setDrawingPoints((prev) => [...prev, [clickX, clickY]]);
              }}
              className="absolute inset-0 z-30 cursor-crosshair"
            />
          )}

          {/* Active SVG Vertex Drag Editor Component */}
          {isEditMode && editingPolygon && selectedPlot && (
            <PolygonEditor
              polygon={editingPolygon}
              width={layoutWidth}
              height={layoutHeight}
              onChange={(updated) => setEditingPolygon(updated)}
              onSave={handleSavePolygonEdit}
              onDeletePlot={() => {
                if (selectedPlotId && onDeletePlot) {
                  onDeletePlot(selectedPlotId);
                  if (onToggleEditMode) onToggleEditMode();
                }
              }}
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
