'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Header } from '@/components/layout/Header';
import { InteractiveLayoutMap } from '@/components/map/InteractiveLayoutMap';
import { MapGpsViewer } from '@/components/map/MapGpsViewer';
import { ThreeDLayoutViewer } from '@/components/3d/ThreeDLayoutViewer';
import { PlotDetailsPanel } from '@/components/plot/PlotDetailsPanel';
import { PlotSearch } from '@/components/plot/PlotSearch';
import { PlotEditorModal } from '@/components/plot/PlotEditorModal';
import { PlotSplitModal } from '@/components/plot/PlotSplitModal';
import { ClientBrokerCodeGate } from '@/components/auth/ClientBrokerCodeGate';
import { PlotReservationModal } from '@/components/plot/PlotReservationModal';
import { AuthStore } from '@/lib/store/auth-store';
import { AppState } from '@/lib/store/app-state';
import { Project, Layout, Plot, Road, PlotStatusHistory, PlotStatus, PolygonPoint, UserProfile, GpsAnchor } from '@/types';
import {
  MapPin,
  Box,
  Layers,
  Sparkles,
  ArrowLeft,
  Edit3,
  Plus,
  Grid,
  CheckCircle2,
  Clock,
  Ban,
  TrendingUp,
  Key,
  ShieldCheck,
  Globe,
  ImageIcon,
} from 'lucide-react';

export default function InteractiveMapPage({
  params,
}: {
  params: Promise<{ id: string; layoutId: string }>;
}) {
  const { id: projectId, layoutId } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [roads, setRoads] = useState<Road[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(AuthStore.getCurrentUser());

  // Selected plot state (Single source of truth across Image Mode, Map/GPS, and 3D)
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>('plot-gv-27');

  // View Mode: 'image' (2D Image Layout), 'map' (Satellite Map/GPS), or '3d' (ThreeJS 3D Twin)
  const [viewMode, setViewMode] = useState<'image' | 'map' | '3d'>('image');

  // Edit Mode state for vertex dragging
  const [isEditMode, setIsEditMode] = useState(false);

  // Plot Editor Modal state
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);

  // Plot Split Modal state
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [targetSplitPlot, setTargetSplitPlot] = useState<Plot | null>(null);

  // Plot Reservation / Hold Modal state
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  // Client Broker Code Gate Modal state
  const [showBrokerGate, setShowBrokerGate] = useState(false);

  useEffect(() => {
    const user = AuthStore.getCurrentUser();
    setCurrentUser(user);
    if (user.role === 'client' && !user.broker_code) {
      setShowBrokerGate(true);
    }
  }, []);

  // Handle Plot Subdivision into Small Plots
  const handleSplitPlotGrid = (plotId: string, rows: number, cols: number, startNumber: number) => {
    const createdPlots = AppState.splitPlotIntoGrid(plotId, rows, cols, startNumber);
    if (createdPlots.length > 0) {
      loadData();
      setSelectedPlotId(createdPlots[0].id);
    }
  };

  // Handle Aerial Image Upload & Opacity Updates
  const handleUploadAerial = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      AppState.updateLayoutAerial(layoutId, url, 0.85);
      loadData();
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateAerialOpacity = (opacity: number) => {
    if (layout?.aerial_image_url) {
      AppState.updateLayoutAerial(layoutId, layout.aerial_image_url, opacity);
      loadData();
    }
  };

  const handleUpdateGpsAnchor = (anchor: GpsAnchor) => {
    AppState.updateLayoutGpsAnchor(layoutId, anchor);
    loadData();
  };

  // Status History for selected plot
  const [plotHistory, setPlotHistory] = useState<PlotStatusHistory[]>([]);

  // Load state
  const loadData = () => {
    const proj = AppState.getProjectById(projectId);
    const lay = AppState.getLayoutById(layoutId);
    if (proj) setProject(proj);
    if (lay) setLayout(lay);

    const fetchedPlots = AppState.getPlotsByLayoutId(layoutId);
    setPlots([...fetchedPlots]);

    const fetchedRoads = AppState.getRoadsByLayoutId(layoutId);
    setRoads([...fetchedRoads]);

    if (fetchedPlots.length > 0) {
      setSelectedPlotId((prev) => {
        if (prev && fetchedPlots.some((p) => p.id === prev)) return prev;
        return fetchedPlots[0].id;
      });
    }
  };

  useEffect(() => {
    const sync = async () => {
      await AppState.syncFromSupabase();
      loadData();
    };
    sync();
  }, [projectId, layoutId]);

  // Load history whenever selected plot changes
  useEffect(() => {
    if (selectedPlotId) {
      setPlotHistory(AppState.getPlotHistory(selectedPlotId));
    } else {
      setPlotHistory([]);
    }
  }, [selectedPlotId]);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) || null;

  // Handle Plot Status Change with celebration confetti
  const handleStatusChange = (
    plotId: string,
    newStatus: PlotStatus,
    notes?: string,
    custName?: string,
    custPhone?: string,
    deedNumber?: string,
    paymentRef?: string,
    tokenAmount?: number
  ) => {
    const updated = AppState.updatePlotStatus(
      plotId,
      newStatus,
      currentUser.name || 'Sales Manager',
      notes,
      custName,
      custPhone,
      deedNumber,
      paymentRef,
      tokenAmount
    );

    if (updated) {
      loadData();
      if (newStatus === 'booked' || newStatus === 'sold') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }
  };

  // Handle Polygon Vertex Edit Save
  const handleUpdatePolygon = (plotId: string, newCoords: PolygonPoint[]) => {
    const updated = AppState.updatePlotPolygon(plotId, newCoords);
    if (updated) {
      loadData();
      setIsEditMode(false);
    }
  };

  // Handle Plot Metadata Save
  const handleSavePlotDetails = (plotData: Partial<Plot>) => {
    if (editingPlot) {
      AppState.updatePlotDetails(editingPlot.id, plotData);
    } else {
      AppState.addPlot({
        layout_id: layoutId,
        plot_number: plotData.plot_number || 'A-41',
        area: plotData.area || 1200,
        price: plotData.price || 1800000,
        facing: plotData.facing || 'East',
        status: plotData.status || 'available',
        polygon_coordinates: [
          [700, 700],
          [820, 700],
          [820, 840],
          [700, 840],
        ],
        ai_confidence: 0.98,
        ai_detected: false,
      });
    }
    loadData();
    setIsEditorModalOpen(false);
    setEditingPlot(null);
  };

  // Handle Plot Delete
  const handleDeletePlot = (plotId: string) => {
    const plotToDelete = plots.find((p) => p.id === plotId);
    if (!plotToDelete) return;

    if (
      window.confirm(
        `Are you sure you want to remove Plot ${plotToDelete.plot_number}? This action cannot be undone.`
      )
    ) {
      AppState.deletePlot(plotId);
      setSelectedPlotId(null);
      loadData();
    }
  };

  // Handle Manually Drawn Plot Polygon
  const handleAddNewPlotPolygon = (coords: PolygonPoint[]) => {
    const xs = coords.map((p) => p[0]);
    const ys = coords.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    const areaSqFt = Math.round(w * h * 0.25) || 1500;
    const nextNum = plots.length + 1;
    const plotNumStr = nextNum < 10 ? `P0${nextNum}` : `P${nextNum}`;

    AppState.addPlot({
      layout_id: layoutId,
      plot_number: plotNumStr,
      area: areaSqFt,
      price: areaSqFt * 2500,
      facing: 'East',
      status: 'available',
      polygon_coordinates: coords,
      ai_confidence: 1.0,
      ai_detected: false,
    });
    loadData();
  };

  // Handle Confirm Layout & Transition to GPS / Map
  const handleConfirmLayout = () => {
    AppState.updateLayoutStatus(layoutId, 'completed');
    setViewMode('map');
  };

  // Handle True 4-Point GCP Georeferencing Confirmation
  const handleConfirmGcpTransformation = (
    transformedPlots: Plot[],
    transformedRoads: Road[],
    newAnchor: GpsAnchor
  ) => {
    if (!layout) return;

    AppState.updateLayoutGpsAnchor(layout.id, newAnchor);
    setPlots(transformedPlots);
    setRoads(transformedRoads);
    setLayout((prev) =>
      prev
        ? {
            ...prev,
            gps_anchor: newAnchor,
            accuracy_mode: 'calibrated',
            calibration_status: 'calibrated',
          }
        : prev
    );

    transformedPlots.forEach((p) => {
      AppState.updatePlot(p.id, {
        geo_polygon: p.geo_polygon,
        area: p.area,
        area_sq_meters: p.area_sq_meters,
        price: p.price,
        real_world_scale_calibrated: true,
        accuracy_mode: 'calibrated',
      });
    });
  };

  // Count stats
  const totalPlots = plots.length;
  const availablePlots = plots.filter((p) => p.status === 'available').length;
  const bookedPlots = plots.filter((p) => p.status === 'booked').length;
  const soldPlots = plots.filter((p) => p.status === 'sold').length;

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Top Application Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl px-4 flex items-center justify-between z-40 shrink-0 shadow-md">
        {/* Left: Back & Project Title */}
        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${projectId}`}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            title="Back to Project Overview"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-white text-base tracking-tight truncate max-w-xs md:max-w-md">
                {project?.name || 'Green Valley Residency'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase hidden sm:inline-block">
                Digital Twin Map
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {project?.location || 'Sector 42, Palm Avenue'}
            </p>
          </div>
        </div>

        {/* Center: Search Plot */}
        <div className="hidden sm:block">
          <PlotSearch
            plots={plots}
            selectedPlotId={selectedPlotId}
            onSelectPlot={(p) => setSelectedPlotId(p ? p.id : null)}
          />
        </div>

        {/* Right: 3-Way Mode Switcher & Actions */}
        <div className="flex items-center gap-3">
          {currentUser.role !== 'admin' && (
            <button
              onClick={() => setIsReservationModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{currentUser.role === 'broker' ? 'Hold Plot (48-Hr)' : 'Reserve Plot'}</span>
            </button>
          )}

          {/* 3-Way Mode View Toggle: [Image Layout] [Map/GPS] [3D Digital Twin] */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1 shadow-inner">
            <button
              onClick={() => setViewMode('image')}
              title="2D Blueprint & Aerial Layout"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'image'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Image Layout</span>
              <span className="md:hidden">2D</span>
            </button>

            <button
              onClick={() => setViewMode('map')}
              title="Real-World Satellite GPS Map"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'map'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden md:inline">Map / GPS</span>
              <span className="md:hidden">Map</span>
            </button>

            <button
              onClick={() => setViewMode('3d')}
              title="3D Walk & Orbit Digital Twin"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-300" />
              <span className="hidden md:inline">3D Twin</span>
              <span className="md:hidden">3D</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Inventory & Dual-Mode Status Bar */}
      <div className="h-10 border-b border-slate-800/80 bg-slate-900/60 px-4 flex items-center justify-between text-xs text-slate-300 shrink-0 overflow-x-auto gap-4">
        {/* Left: Inventory Counts */}
        <div className="flex items-center gap-5 font-medium shrink-0">
          <div className="flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total:</span>
            <span className="font-bold text-white">{totalPlots} Plots</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Available:</span>
            <span className="font-bold">{availablePlots}</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Booked:</span>
            <span className="font-bold">{bookedPlots}</span>
          </div>

          <div className="flex items-center gap-1.5 text-rose-400">
            <Ban className="w-3.5 h-3.5" />
            <span>Sold:</span>
            <span className="font-bold">{soldPlots}</span>
          </div>
        </div>

        {/* Center/Right: Geospatial & Dual-Mode Status Indicators */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Analysis Status */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Image Analysis:</span>
            <span className="font-semibold text-slate-200">
              {layout?.processing_status === 'completed' ? 'Verified' : 'Complete'}
            </span>
          </div>

          {/* GPS Calibration Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
            {layout?.gps_anchor?.lat ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>GPS Calibrated</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-semibold flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-500" />
                <span>GPS Uncalibrated (Image Mode)</span>
              </span>
            )}
          </div>

          {/* Active Plot Selection Indicator */}
          {selectedPlot && (
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 rounded-md text-[11px]">
              <span className="text-slate-400">Selected:</span>
              <span className="font-bold text-indigo-300">Plot {selectedPlot.plot_number}</span>
              {selectedPlot.geo_polygon && selectedPlot.geo_polygon.length > 0 ? (
                <span className="text-emerald-400 font-mono">({selectedPlot.area} sq.ft / {selectedPlot.area_sq_meters || Math.round(selectedPlot.area / 10.7639)}m²)</span>
              ) : (
                <span className="text-slate-400">({selectedPlot.area} sq.ft)</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Viewing Canvas Container (Toggles Image Layout / Satellite Map / 3D) */}
        <div className="flex-1 min-w-0 h-full relative">
          {viewMode === 'image' ? (
            <InteractiveLayoutMap
              layoutWidth={layout?.original_width || 1200}
              layoutHeight={layout?.original_height || 964}
              fileUrl={layout?.file_url || '/site-grid-48-blueprint.svg'}
              aerialImageUrl={layout?.aerial_image_url}
              aerialOpacity={layout?.aerial_opacity}
              plots={plots}
              roads={roads}
              selectedPlotId={selectedPlotId}
              onSelectPlot={(p) => setSelectedPlotId(p ? p.id : null)}
              onUpdatePlotPolygon={handleUpdatePolygon}
              onUploadAerial={handleUploadAerial}
              onUpdateAerialOpacity={handleUpdateAerialOpacity}
              isEditMode={isEditMode}
              onToggleEditMode={() => setIsEditMode(!isEditMode)}
              onAddPlotClick={() => {
                setEditingPlot(null);
                setIsEditorModalOpen(true);
              }}
              onSplitPlotClick={(p) => {
                setTargetSplitPlot(p);
                setIsSplitModalOpen(true);
              }}
              onRealignGridClick={(mode) => {
                AppState.realignLayoutGrid(layoutId, layout?.original_width, layout?.original_height, mode);
                loadData();
              }}
              onDeletePlot={handleDeletePlot}
              onAddNewPlotPolygon={handleAddNewPlotPolygon}
              onConfirmLayout={handleConfirmLayout}
              isConfirmed={layout?.status === 'completed'}
            />
          ) : viewMode === 'map' ? (
            <MapGpsViewer
              plots={plots}
              roads={roads}
              layoutWidth={layout?.original_width || 1200}
              layoutHeight={layout?.original_height || 964}
              selectedPlotId={selectedPlotId}
              onSelectPlot={(p) => setSelectedPlotId(p ? p.id : null)}
              gpsAnchor={layout?.gps_anchor}
              accuracyMode={layout?.accuracy_mode || 'calibrated'}
              projectName={project?.name}
              projectLocation={project?.location}
              aerialImageUrl={layout?.aerial_image_url || layout?.file_url}
              fileUrl={layout?.file_url}
              onUpdateGpsAnchor={handleUpdateGpsAnchor}
              onConfirmGcpTransformation={handleConfirmGcpTransformation}
              onSwitchTo3D={() => setViewMode('3d')}
            />
          ) : (
            <ThreeDLayoutViewer
              layoutWidth={layout?.original_width || 1200}
              layoutHeight={layout?.original_height || 964}
              fileUrl={layout?.aerial_image_url || layout?.file_url}
              projectName={project?.name}
              plots={plots}
              roads={roads}
              selectedPlotId={selectedPlotId}
              onSelectPlot={(p) => setSelectedPlotId(p ? p.id : null)}
              gpsAnchor={layout?.gps_anchor}
            />
          )}
        </div>

        {/* Plot Details Drawer */}
        {selectedPlot && (
          <PlotDetailsPanel
            plot={selectedPlot}
            history={plotHistory}
            onClose={() => setSelectedPlotId(null)}
            onStatusChange={handleStatusChange}
            onEditClick={(p) => {
              setEditingPlot(p);
              setIsEditorModalOpen(true);
            }}
            onDeleteClick={handleDeletePlot}
            onSplitClick={(p: Plot) => {
              setTargetSplitPlot(p);
              setIsSplitModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Plot Editor Modal */}
      <PlotEditorModal
        isOpen={isEditorModalOpen}
        plot={editingPlot}
        layoutId={layoutId}
        onClose={() => {
          setIsEditorModalOpen(false);
          setEditingPlot(null);
        }}
        onSave={handleSavePlotDetails}
      />

      {/* Plot Subdivision Grid Split Modal */}
      <PlotSplitModal
        isOpen={isSplitModalOpen}
        plot={targetSplitPlot}
        onClose={() => {
          setIsSplitModalOpen(false);
          setTargetSplitPlot(null);
        }}
        onSplit={handleSplitPlotGrid}
      />

      {/* Plot Reservation & Hold Modal */}
      <PlotReservationModal
        isOpen={isReservationModalOpen}
        plot={selectedPlot}
        currentUser={currentUser}
        onClose={() => setIsReservationModalOpen(false)}
        onSuccess={() => loadData()}
      />

      {/* Client Broker Code Gate Modal */}
      <ClientBrokerCodeGate
        isOpen={showBrokerGate}
        onVerified={(broker) => {
          setCurrentUser(AuthStore.getCurrentUser());
          setShowBrokerGate(false);
        }}
        onClose={() => setShowBrokerGate(false)}
      />
    </div>
  );
}
