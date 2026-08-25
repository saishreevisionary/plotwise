'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plot, Road, ControlPointPair, GpsAnchor, PolygonPoint } from '@/types';
import { LayoutAnalyzerService } from '@/lib/ai/layout-analyzer';
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  Move,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';

interface GcpCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  aerialImageUrl?: string;
  fileUrl?: string;
  layoutWidth: number;
  layoutHeight: number;
  plots: Plot[];
  roads: Road[];
  gpsAnchor?: GpsAnchor;
  onConfirmGcpTransformation: (
    transformedPlots: Plot[],
    transformedRoads: Road[],
    newAnchor: GpsAnchor,
    controlPoints: ControlPointPair[]
  ) => void;
}

export const GcpCalibrationModal: React.FC<GcpCalibrationModalProps> = ({
  isOpen,
  onClose,
  aerialImageUrl,
  fileUrl,
  layoutWidth,
  layoutHeight,
  plots,
  roads,
  gpsAnchor,
  onConfirmGcpTransformation,
}) => {
  const defaultLat = gpsAnchor?.lat || 12.9716;
  const defaultLng = gpsAnchor?.lng || 77.5946;

  // 4 Ground Control Points (GCPs): Image Pixels <-> Real World GPS Coordinates
  const [controlPoints, setControlPoints] = useState<ControlPointPair[]>([
    {
      id: 'A',
      label: 'NW Landmark (Point A)',
      image_point: [Math.round(layoutWidth * 0.16), Math.round(layoutHeight * 0.16)],
      geo_point: [defaultLat + 0.00075, defaultLng - 0.00075],
    },
    {
      id: 'B',
      label: 'NE Landmark (Point B)',
      image_point: [Math.round(layoutWidth * 0.84), Math.round(layoutHeight * 0.16)],
      geo_point: [defaultLat + 0.00075, defaultLng + 0.00075],
    },
    {
      id: 'C',
      label: 'SE Landmark (Point C)',
      image_point: [Math.round(layoutWidth * 0.84), Math.round(layoutHeight * 0.84)],
      geo_point: [defaultLat - 0.00075, defaultLng + 0.00075],
    },
    {
      id: 'D',
      label: 'SW Landmark (Point D)',
      image_point: [Math.round(layoutWidth * 0.16), Math.round(layoutHeight * 0.84)],
      geo_point: [defaultLat - 0.00075, defaultLng - 0.00075],
    },
  ]);

  const [activeGcpId, setActiveGcpId] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [draggingImageGcp, setDraggingImageGcp] = useState<string | null>(null);

  // Satellite Map Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const satelliteMapContainerRef = useRef<HTMLDivElement | null>(null);
  const satelliteMapInstanceRef = useRef<any>(null);
  const leafletGcpGroupRef = useRef<any>(null);
  const leafletPreviewGroupRef = useRef<any>(null);
  const imageCanvasRef = useRef<HTMLDivElement | null>(null);

  // Live Affine least-squares transformation calculation
  const gcpResult = useMemo(() => {
    return LayoutAnalyzerService.solveGcpAffineTransform(controlPoints);
  }, [controlPoints]);

  // Handle Dragging GCP on Image Canvas
  const handleImageCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingImageGcp || !imageCanvasRef.current) return;
    const rect = imageCanvasRef.current.getBoundingClientRect();
    const scaleX = layoutWidth / rect.width;
    const scaleY = layoutHeight / rect.height;

    const px = Math.round(Math.max(0, Math.min(layoutWidth, (e.clientX - rect.left) * scaleX)));
    const py = Math.round(Math.max(0, Math.min(layoutHeight, (e.clientY - rect.top) * scaleY)));

    setControlPoints((prev) =>
      prev.map((cp) => (cp.id === draggingImageGcp ? { ...cp, image_point: [px, py] } : cp))
    );
  };

  const handleImageCanvasPointerUp = () => {
    setDraggingImageGcp(null);
  };

  // Initialize Satellite Leaflet Map
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === 'undefined' || !satelliteMapContainerRef.current) return;
      const L = await import('leaflet');

      if (!isMounted) return;

      if (!satelliteMapInstanceRef.current && satelliteMapContainerRef.current) {
        const centerLat = controlPoints[0].geo_point[0];
        const centerLng = controlPoints[0].geo_point[1];

        const map = L.map(satelliteMapContainerRef.current, {
          center: [centerLat, centerLng],
          zoom: 18,
          maxZoom: 22,
          zoomControl: false,
        });

        satelliteMapInstanceRef.current = map;

        // Esri World Imagery Satellite Tiles
        L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            maxZoom: 22,
            maxNativeZoom: 19,
            attribution: 'Tiles &copy; Esri',
          }
        ).addTo(map);

        leafletGcpGroupRef.current = L.layerGroup().addTo(map);
        leafletPreviewGroupRef.current = L.layerGroup().addTo(map);

        // Click to place active GCP
        map.on('click', (e: any) => {
          const lat = Number(e.latlng.lat.toFixed(7));
          const lng = Number(e.latlng.lng.toFixed(7));
          setControlPoints((prev) =>
            prev.map((cp) => (cp.id === activeGcpId ? { ...cp, geo_point: [lat, lng] } : cp))
          );
        });
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Update Leaflet GCP Markers & Live Projected Polygons
  useEffect(() => {
    if (!isOpen || !satelliteMapInstanceRef.current) return;

    const updateLeafletLayers = async () => {
      const L = await import('leaflet');
      const gcpGroup = leafletGcpGroupRef.current;
      const previewGroup = leafletPreviewGroupRef.current;

      if (!gcpGroup || !previewGroup) return;

      gcpGroup.clearLayers();
      previewGroup.clearLayers();

      // 1. Render 4 Draggable GCP Leaflet Pins
      controlPoints.forEach((cp) => {
        const isActive = cp.id === activeGcpId;
        const icon = L.divIcon({
          className: 'custom-leaflet-gcp-pin',
          html: `<div style="background:${isActive ? '#06b6d4' : '#f59e0b'}; color:#0f172a; font-weight:900; font-size:13px; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2.5px solid #ffffff; box-shadow:0 4px 16px rgba(0,0,0,0.7); cursor:grab; transform:${isActive ? 'scale(1.2)' : 'scale(1)'}; transition:all 0.15s;">${cp.id}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker(cp.geo_point, { icon, draggable: true });

        marker.on('dragend', (e: any) => {
          const newPos = e.target.getLatLng();
          setControlPoints((prev) =>
            prev.map((p) =>
              p.id === cp.id
                ? { ...p, geo_point: [Number(newPos.lat.toFixed(7)), Number(newPos.lng.toFixed(7))] }
                : p
            )
          );
        });

        marker.on('click', () => {
          setActiveGcpId(cp.id as any);
        });

        marker.bindTooltip(`GCP [${cp.id}] Satellite Anchor`, {
          permanent: false,
          direction: 'top',
          className: 'bg-slate-950 text-amber-300 font-bold border border-amber-500/40 text-xs px-2 py-0.5 rounded shadow-lg',
        });

        gcpGroup.addLayer(marker);
      });

      // 2. Render Live Preview Polygons ONLY if GCP result is valid
      if (gcpResult.isValid) {
        plots.forEach((plot) => {
          const geoPoly = LayoutAnalyzerService.projectPolygonWithGcp(
            plot.polygon_coordinates,
            gcpResult.matrix
          );
          if (geoPoly.length >= 3) {
            const poly = L.polygon(geoPoly as [number, number][], {
              color: '#22d3ee',
              weight: 2,
              fillColor: '#06b6d4',
              fillOpacity: 0.35,
            });
            previewGroup.addLayer(poly);
          }
        });
      }
    };

    updateLeafletLayers();
  }, [isOpen, controlPoints, activeGcpId, gcpResult, plots]);

  // Location Search Handler (Nominatim)
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
            'User-Agent': 'PlotWise-GIS-App/1.0',
          },
        }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);

        // Center map on searched coordinates
        if (satelliteMapInstanceRef.current) {
          satelliteMapInstanceRef.current.setView([newLat, newLng], 18, { animate: true });
        }

        // Reposition 4 GCPs around the new center
        setControlPoints([
          {
            id: 'A',
            label: 'NW Landmark (Point A)',
            image_point: [Math.round(layoutWidth * 0.16), Math.round(layoutHeight * 0.16)],
            geo_point: [newLat + 0.00075, newLng - 0.00075],
          },
          {
            id: 'B',
            label: 'NE Landmark (Point B)',
            image_point: [Math.round(layoutWidth * 0.84), Math.round(layoutHeight * 0.16)],
            geo_point: [newLat + 0.00075, newLng + 0.00075],
          },
          {
            id: 'C',
            label: 'SE Landmark (Point C)',
            image_point: [Math.round(layoutWidth * 0.84), Math.round(layoutHeight * 0.84)],
            geo_point: [newLat - 0.00075, newLng + 0.00075],
          },
          {
            id: 'D',
            label: 'SW Landmark (Point D)',
            image_point: [Math.round(layoutWidth * 0.16), Math.round(layoutHeight * 0.84)],
            geo_point: [newLat - 0.00075, newLng - 0.00075],
          },
        ]);
      } else {
        setSearchError('Location not found. Try entering city or landmark name.');
      }
    } catch {
      setSearchError('Unable to connect to location geocoding service.');
    } finally {
      setIsSearching(false);
    }
  };

  // Confirm and Apply GCP Transformation
  const handleApplyGcpTransformation = () => {
    if (!gcpResult.isValid) return;

    // 1. Transform all plots to geo_polygon & calculate true geodesic areas
    const transformedPlots = plots.map((p) => {
      const geoPoly = LayoutAnalyzerService.projectPolygonWithGcp(
        p.polygon_coordinates,
        gcpResult.matrix
      );
      const { areaSqMeters, areaSqFeet } = LayoutAnalyzerService.calculateGeodesicPolygonArea(geoPoly);

      return {
        ...p,
        geo_polygon: geoPoly,
        area_sq_meters: areaSqMeters,
        area: areaSqFeet,
        price: areaSqFeet * 2800,
        real_world_scale_calibrated: true,
        accuracy_mode: 'calibrated' as const,
      };
    });

    // 2. Transform all roads
    const transformedRoads = roads.map((r) => {
      const geoPoly = LayoutAnalyzerService.projectPolygonWithGcp(
        r.polygon_coordinates,
        gcpResult.matrix
      );
      return {
        ...r,
        geo_polygon: geoPoly,
      };
    });

    // 3. Compute center anchor
    const avgLat = controlPoints.reduce((s, cp) => s + cp.geo_point[0], 0) / controlPoints.length;
    const avgLng = controlPoints.reduce((s, cp) => s + cp.geo_point[1], 0) / controlPoints.length;

    const newAnchor: GpsAnchor = {
      lat: Number(avgLat.toFixed(7)),
      lng: Number(avgLng.toFixed(7)),
      rotation_degrees: 0,
      meters_per_pixel: 0.18,
    };

    onConfirmGcpTransformation(transformedPlots, transformedRoads, newAnchor, controlPoints);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-2xl flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-white">4-Point Ground Control Point (GCP) Georeferencing</h2>
              {gcpResult.isValid ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Valid Calibration • RMS Error: {gcpResult.rmsErrorMeters}m
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Calibration failed / landmarks do not match
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag points <strong className="text-amber-300">[A, B, C, D]</strong> on the Aerial Image to site corners, then drag corresponding markers on Satellite Map.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Dual-View Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-3 overflow-hidden bg-slate-950">
        {/* LEFT VIEW: Source Aerial Image with Draggable Landmark Pins */}
        <div className="relative flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Label Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>SOURCE: Uploaded Aerial / Site Image</span>
            </span>
            <span className="text-[11px] text-slate-400">Drag [A], [B], [C], [D] to recognizable corners</span>
          </div>

          {/* Canvas Wrapper */}
          <div
            ref={imageCanvasRef}
            onPointerMove={handleImageCanvasPointerMove}
            onPointerUp={handleImageCanvasPointerUp}
            className="relative flex-1 w-full h-full flex items-center justify-center p-4 overflow-hidden select-none"
          >
            <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 max-w-full max-h-full">
              {/* Aerial Image */}
              <img
                src={aerialImageUrl || fileUrl || '/site-grid-48-blueprint.svg'}
                alt="Source Aerial"
                className="w-full h-auto max-h-[60vh] object-contain pointer-events-none block"
              />

              {/* Draggable Pins A, B, C, D on Image */}
              {controlPoints.map((cp) => {
                const isActive = cp.id === activeGcpId;
                const leftPercent = (cp.image_point[0] / layoutWidth) * 100;
                const topPercent = (cp.image_point[1] / layoutHeight) * 100;

                return (
                  <div
                    key={cp.id}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setActiveGcpId(cp.id as any);
                      setDraggingImageGcp(cp.id);
                    }}
                    style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing z-30 transition-transform ${
                      isActive ? 'scale-125' : 'scale-100 hover:scale-110'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shadow-2xl border-2 border-white ${
                        isActive ? 'bg-cyan-400 text-slate-950 ring-4 ring-cyan-400/40' : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {cp.id}
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-slate-950/90 text-[10px] text-amber-300 font-mono border border-slate-800 shadow-md">
                      [{cp.image_point[0]}px, {cp.image_point[1]}px]
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT VIEW: Target Satellite Map with Draggable Geo Pins */}
        <div className="relative flex flex-col bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          {/* Search Bar & Title Header */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 text-xs flex-wrap">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>TARGET: Esri Satellite Ground Imagery</span>
            </span>

            {/* Address Search */}
            <form onSubmit={handleLocationSearch} className="flex items-center gap-1.5 flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search real site address / coordinates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-md transition-all shrink-0"
              >
                {isSearching ? 'Locating...' : 'Locate'}
              </button>
            </form>
          </div>

          {searchError && (
            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs px-3 py-1">
              {searchError}
            </div>
          )}

          {/* Leaflet Satellite Map */}
          <div ref={satelliteMapContainerRef} className="w-full flex-1 min-h-[400px] z-0" />
        </div>
      </div>

      {/* Bottom Action Footer & Telemetry Table */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4 flex-wrap shadow-2xl">
        {/* 4 GCP Coordinate Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 text-xs">
          {controlPoints.map((cp) => {
            const isActive = cp.id === activeGcpId;
            return (
              <div
                key={cp.id}
                onClick={() => setActiveGcpId(cp.id as any)}
                className={`p-2 rounded-xl border cursor-pointer transition-all ${
                  isActive
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                    isActive ? 'bg-cyan-400 text-slate-950' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {cp.id}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {cp.image_point[0]}px, {cp.image_point[1]}px
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300 truncate">
                  {cp.geo_point[0].toFixed(6)}°, {cp.geo_point[1].toFixed(6)}°
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!gcpResult.isValid}
            onClick={handleApplyGcpTransformation}
            className={`px-5 py-2 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 transition-all ${
              gcpResult.isValid
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply & Confirm 4-Point GCP Transformation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
