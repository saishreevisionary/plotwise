'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plot, Road, GpsAnchor, AccuracyMode, PlotStatus, ControlPointPair } from '@/types';
import { StatusLegend } from '@/components/common/StatusLegend';
import { GcpCalibrationModal } from './GcpCalibrationModal';
import {
  Layers,
  MapPin,
  Compass,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Box,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface MapGpsViewerProps {
  plots: Plot[];
  roads: Road[];
  layoutWidth: number;
  layoutHeight: number;
  selectedPlotId: string | null;
  onSelectPlot: (plot: Plot | null) => void;
  gpsAnchor?: GpsAnchor;
  accuracyMode?: AccuracyMode;
  projectName?: string;
  projectLocation?: string;
  aerialImageUrl?: string;
  fileUrl?: string;
  onUpdateGpsAnchor?: (anchor: GpsAnchor) => void;
  onConfirmGcpTransformation?: (
    transformedPlots: Plot[],
    transformedRoads: Road[],
    newAnchor: GpsAnchor,
    controlPoints: ControlPointPair[]
  ) => void;
  onSwitchTo3D?: () => void;
}

export const MapGpsViewer: React.FC<MapGpsViewerProps> = ({
  plots,
  roads,
  layoutWidth = 1200,
  layoutHeight = 964,
  selectedPlotId,
  onSelectPlot,
  gpsAnchor,
  projectName = 'Site Layout',
  projectLocation = 'Location',
  aerialImageUrl,
  fileUrl,
  onUpdateGpsAnchor,
  onConfirmGcpTransformation,
  onSwitchTo3D,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const plotLayerGroupRef = useRef<any>(null);
  const roadLayerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  // Basemap style: satellite (Esri), dark (CartoDB), streets (OSM)
  const [basemap, setBasemap] = useState<'satellite' | 'dark' | 'streets'>('satellite');
  const [showRoads, setShowRoads] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [isGcpModalOpen, setIsGcpModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Verify whether this layout is truly GPS calibrated via 4-Point GCPs
  const isGpsCalibrated = useMemo(() => {
    return !!(
      gpsAnchor?.lat &&
      gpsAnchor?.lng &&
      plots.some((p) => p.geo_polygon && p.geo_polygon.length >= 3 && p.real_world_scale_calibrated)
    );
  }, [gpsAnchor, plots]);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  // Center coordinate for the map
  const centerLat = gpsAnchor?.lat || 12.9716;
  const centerLng = gpsAnchor?.lng || 77.5946;

  // Helper for polygon styling
  const getPlotLeafletStyle = (status: PlotStatus, isSelected: boolean) => {
    if (isSelected) {
      return {
        color: '#22d3ee',
        weight: 4,
        opacity: 1,
        fillColor: '#06b6d4',
        fillOpacity: 0.7,
      };
    }
    switch (status) {
      case 'available':
        return {
          color: '#10b981',
          weight: 2,
          opacity: 0.9,
          fillColor: '#10b981',
          fillOpacity: 0.45,
        };
      case 'booked':
        return {
          color: '#f59e0b',
          weight: 2,
          opacity: 0.9,
          fillColor: '#f59e0b',
          fillOpacity: 0.5,
        };
      case 'sold':
        return {
          color: '#f43f5e',
          weight: 2,
          opacity: 0.9,
          fillColor: '#f43f5e',
          fillOpacity: 0.5,
        };
      default:
        return {
          color: '#94a3b8',
          weight: 2,
          opacity: 0.8,
          fillColor: '#94a3b8',
          fillOpacity: 0.4,
        };
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;

      const L = await import('leaflet');

      // Inject Leaflet CSS
      if (!document.getElementById('leaflet-css-bundle')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-bundle';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!isMounted) return;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 18,
          maxZoom: 22,
          zoomControl: false,
        });

        mapInstanceRef.current = map;

        plotLayerGroupRef.current = L.layerGroup().addTo(map);
        roadLayerGroupRef.current = L.layerGroup().addTo(map);
      }

      // Update Tile Layer
      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;
        if (tileLayerRef.current) {
          map.removeLayer(tileLayerRef.current);
        }

        let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        let attribution = 'Tiles &copy; Esri';

        if (basemap === 'dark') {
          tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
          attribution = '&copy; OpenStreetMap &copy; CARTO';
        } else if (basemap === 'streets') {
          tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
          attribution = '&copy; OpenStreetMap contributors';
        }

        tileLayerRef.current = L.tileLayer(tileUrl, {
          maxZoom: 22,
          maxNativeZoom: 19,
          attribution,
        }).addTo(map);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [basemap, centerLat, centerLng]);

  // Render / Update Plots & Roads ONLY IF truly GPS calibrated
  useEffect(() => {
    const renderLayers = async () => {
      if (!mapInstanceRef.current || !plotLayerGroupRef.current) return;
      const L = await import('leaflet');

      const plotGroup = plotLayerGroupRef.current;
      const roadGroup = roadLayerGroupRef.current;

      plotGroup.clearLayers();
      roadGroup.clearLayers();

      // Guard: NEVER display fake overlays if site is uncalibrated
      if (!isGpsCalibrated) {
        return;
      }

      // 1. Render Roads from geo_polygon
      if (showRoads && roads.length > 0) {
        roads.forEach((road) => {
          if (road.geo_polygon && road.geo_polygon.length >= 3) {
            const roadPoly = L.polygon(road.geo_polygon as [number, number][], {
              color: '#334155',
              weight: 2,
              fillColor: '#1e293b',
              fillOpacity: 0.8,
            });

            if (road.name) {
              roadPoly.bindTooltip(road.name, {
                permanent: false,
                direction: 'center',
                className: 'bg-slate-950 text-slate-200 border border-slate-700 px-2 py-0.5 rounded text-xs font-semibold',
              });
            }
            roadGroup.addLayer(roadPoly);
          }
        });
      }

      // 2. Render Plots from calibrated geo_polygon
      plots.forEach((plot) => {
        if (plot.geo_polygon && plot.geo_polygon.length >= 3) {
          const isSelected = plot.id === selectedPlotId;
          const style = getPlotLeafletStyle(plot.status, isSelected);

          const polygon = L.polygon(plot.geo_polygon as [number, number][], style);

          // Tooltip on Hover
          polygon.bindTooltip(
            `<div class="p-1 text-xs">
              <div class="font-bold text-white">Plot ${plot.plot_number}</div>
              <div class="text-emerald-300 font-semibold">${plot.area.toLocaleString()} sq.ft (${plot.area_sq_meters ? `${plot.area_sq_meters} m²` : ''})</div>
              <div class="capitalize font-semibold text-cyan-400 mt-0.5">${plot.status}</div>
            </div>`,
            {
              permanent: isSelected || (showLabels && plots.length <= 50),
              direction: 'center',
              className: isSelected
                ? 'bg-slate-900 border-2 border-cyan-400 text-cyan-200 px-2 py-1 rounded-lg shadow-xl font-bold text-xs'
                : 'bg-slate-950/90 border border-slate-700 text-white px-1.5 py-0.5 rounded text-[11px] font-semibold',
            }
          );

          // Click handler
          polygon.on('click', () => {
            onSelectPlot(isSelected ? null : plot);
          });

          plotGroup.addLayer(polygon);
        }
      });
    };

    renderLayers();
  }, [plots, roads, selectedPlotId, isGpsCalibrated, showRoads, showLabels]);

  // Center on Selected Plot if selection changes
  useEffect(() => {
    if (selectedPlot && selectedPlot.geo_polygon && selectedPlot.geo_polygon.length > 0 && mapInstanceRef.current) {
      const coords = selectedPlot.geo_polygon;
      const cLat = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
      const cLng = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;

      mapInstanceRef.current.panTo([cLat, cLng], { animate: true });
    }
  }, [selectedPlotId, selectedPlot]);

  // Search Address / Location using OSM Nominatim
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'PlotWise-RealEstate-GIS-App/1.0',
          },
        }
      );

      if (!res.ok) throw new Error('Search service unavailable');
      const data = await res.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([newLat, newLng], 18, { animate: true });
        }
      } else {
        setSearchError('Location not found. Try a different city or landmark.');
      }
    } catch {
      setSearchError('Unable to fetch location coordinates.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col justify-between select-none">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Left: Controls & Location Search */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-md w-full">
        {/* Search Bar */}
        <form
          onSubmit={handleLocationSearch}
          className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl p-1.5 flex items-center gap-2 shadow-2xl"
        >
          <div className="pl-2 text-indigo-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search address, city, or site location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none flex-1 font-medium"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            {isSearching ? 'Locating...' : 'Locate'}
          </button>
        </form>

        {searchError && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs px-3 py-1.5 rounded-lg backdrop-blur-md">
            {searchError}
          </div>
        )}

        {/* Map View & Layer Controls */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl p-1.5 flex items-center gap-1.5 shadow-2xl flex-wrap">
          {/* Basemap Switcher */}
          <div className="bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex items-center gap-0.5 text-xs">
            <button
              onClick={() => setBasemap('satellite')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                basemap === 'satellite'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setBasemap('dark')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                basemap === 'dark'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dark Map
            </button>
            <button
              onClick={() => setBasemap('streets')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                basemap === 'streets'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Street
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Toggle Labels */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              showLabels ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Labels
          </button>

          {/* Toggle Roads */}
          <button
            onClick={() => setShowRoads(!showRoads)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              showRoads ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Roads
          </button>

          {/* 4-Point GCP Landmark Alignment Button */}
          <button
            onClick={() => setIsGcpModalOpen(true)}
            className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isGpsCalibrated ? 'Re-align GCP Landmarks' : '4-Point GCP Calibration'}</span>
          </button>
        </div>
      </div>

      {/* Top Right: Status Badge & 3D Switch Action */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 flex-wrap justify-end">
        {/* Calibration Status Badge */}
        <div
          className={`backdrop-blur-xl border rounded-xl px-3 py-2 text-xs flex items-center gap-2 shadow-2xl ${
            isGpsCalibrated
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/90 border-amber-500/40 text-amber-300'
          }`}
        >
          {isGpsCalibrated ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="font-bold flex items-center gap-1.5">
              <span>{isGpsCalibrated ? 'GPS Calibrated Mode' : 'Site Uncalibrated (No Overlay)'}</span>
              {isGpsCalibrated && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900/80 font-mono text-cyan-300">
                  {centerLat.toFixed(4)}°, {centerLng.toFixed(4)}°
                </span>
              )}
            </div>
            <p className="text-[10px] opacity-80">
              {isGpsCalibrated
                ? 'Georeferenced from confirmed 4-Point GCP transformation'
                : 'Establish landmark correspondence to project polygons'}
            </p>
          </div>
        </div>

        {/* Quick Jump to 3D */}
        {onSwitchTo3D && selectedPlot && isGpsCalibrated && (
          <button
            onClick={onSwitchTo3D}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/20 flex items-center gap-1.5 transition-all transform hover:scale-105"
          >
            <Box className="w-4 h-4 text-cyan-200" />
            <span>View Plot {selectedPlot.plot_number} in 3D</span>
          </button>
        )}
      </div>

      {/* Uncalibrated Guidance Banner */}
      {!isGpsCalibrated && (
        <div className="absolute top-20 left-4 z-20 max-w-md bg-slate-900/95 backdrop-blur-xl border border-amber-500/40 rounded-2xl p-4 shadow-2xl text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>4-Point GCP Landmark Calibration Required</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            The aerial image has not been georeferenced yet. To project your confirmed plot boundaries onto the satellite terrain and compute real-world area, match 4 physical landmarks: <strong>[A], [B], [C], [D]</strong>.
          </p>
          <button
            onClick={() => setIsGcpModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Start 4-Point GCP Landmark Alignment</span>
          </button>
        </div>
      )}

      {/* Bottom Floating Legend */}
      {isGpsCalibrated && (
        <div className="absolute bottom-4 left-4 z-20 hidden sm:block">
          <StatusLegend />
        </div>
      )}

      {/* 4-Point GCP Dual-View Georeferencing Modal */}
      <GcpCalibrationModal
        isOpen={isGcpModalOpen}
        onClose={() => setIsGcpModalOpen(false)}
        aerialImageUrl={aerialImageUrl}
        fileUrl={fileUrl}
        layoutWidth={layoutWidth}
        layoutHeight={layoutHeight}
        plots={plots}
        roads={roads}
        gpsAnchor={gpsAnchor}
        onConfirmGcpTransformation={(transformedPlots, transformedRoads, newAnchor, controlPoints) => {
          if (onConfirmGcpTransformation) {
            onConfirmGcpTransformation(transformedPlots, transformedRoads, newAnchor, controlPoints);
          } else if (onUpdateGpsAnchor) {
            onUpdateGpsAnchor(newAnchor);
          }
        }}
      />
    </div>
  );
};
