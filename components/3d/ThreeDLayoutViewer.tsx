'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, PerspectiveCamera, useTexture, Html, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { Plot, Road, GpsAnchor } from '@/types';
import { PlotBlock3D } from './PlotBlock3D';
import { StreetLamp3D } from './StreetLamp3D';
import { EnvironmentDecorations3D } from './EnvironmentDecorations3D';
import { StatusLegend } from '@/components/common/StatusLegend';
import { WalkCameraController } from './WalkCameraController';
import { WalkPlotProximity } from './WalkPlotProximity';
import { WalkModeOverlay } from './WalkModeOverlay';
import type { JoystickState } from './WalkCameraController';
import { Box, RotateCcw, Home, Eye, Camera, Sun, Moon, Sparkles, Navigation, Bug } from 'lucide-react';

interface ThreeDLayoutViewerProps {
  layoutWidth: number;
  layoutHeight: number;
  fileUrl?: string;
  projectName?: string;
  plots: Plot[];
  roads: Road[];
  selectedPlotId: string | null;
  onSelectPlot: (plot: Plot | null) => void;
  gpsAnchor?: GpsAnchor;
}

// Sub-component for smooth Camera animation toward selected plot or camera preset
const CameraController: React.FC<{
  selectedPlot?: Plot;
  layoutWidth: number;
  layoutHeight: number;
  controlsRef: React.RefObject<any>;
  presetAngle: 'top' | 'iso' | 'street' | 'walk' | null;
}> = ({ selectedPlot, layoutWidth, layoutHeight, controlsRef, presetAngle }) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const cameraPos = useRef(new THREE.Vector3(0, 28, 36));

  useEffect(() => {
    const worldScaleX = 40 / layoutWidth;
    const worldScaleZ = 27.5 / layoutHeight;

    let plotWx = 0;
    let plotWz = 0;
    let hasPlot = false;

    if (selectedPlot && selectedPlot.polygon_coordinates && selectedPlot.polygon_coordinates.length > 0) {
      const coords = selectedPlot.polygon_coordinates;
      const cx = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
      const cy = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
      plotWx = (cx - layoutWidth / 2) * worldScaleX;
      plotWz = (cy - layoutHeight / 2) * worldScaleZ;
      hasPlot = true;
    }

    if (presetAngle === 'top') {
      // Top-Down Plan: View full site from directly above
      targetPos.current.set(0, 0, 0);
      cameraPos.current.set(0, 36, 0.1);
    } else if (presetAngle === 'street') {
      if (hasPlot) {
        // Specific Street View: stand at eye level (y=1.8) on the road facing the selected plot
        targetPos.current.set(plotWx, 0.8, plotWz);
        const roadOffsetZ = plotWz < 0 ? 3.5 : -3.5;
        cameraPos.current.set(plotWx, 1.8, plotWz + roadOffsetZ);
      } else {
        // Default entrance central boulevard street view
        targetPos.current.set(0, 1.2, 0);
        cameraPos.current.set(0, 2.2, 11.5);
      }
    } else if (presetAngle === 'iso') {
      // 3D Orbit: View the full area so all plots across the entire layout are visible
      targetPos.current.set(0, 0, 0);
      cameraPos.current.set(0, 28, 36);
    } else {
      // Free Orbit default: Frame the entire site layout
      targetPos.current.set(0, 0, 0);
      cameraPos.current.set(0, 28, 36);
    }
  }, [selectedPlot, layoutWidth, layoutHeight, presetAngle]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetPos.current, 0.08);
      camera.position.lerp(cameraPos.current, 0.06);
      controlsRef.current.update();
    }
  });

  return null;
};

// Error boundary to prevent 3D Canvas crashes when blob or layout image URLs fail to load
class TextureErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn('3D Ground texture load warning, rendering fallback plane:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const DefaultGroundPlane: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
    <planeGeometry args={[44, 30]} />
    <meshStandardMaterial color="#0b1329" roughness={0.85} metalness={0.15} />
  </mesh>
);

const GroundMeshWithTexture: React.FC<{ url: string }> = ({ url }) => {
  const texture = useTexture(url);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[40, 27.5]} />
      <meshStandardMaterial map={texture} roughness={0.7} metalness={0.1} />
    </mesh>
  );
};

const SafeTexturedGround: React.FC<{ url?: string; layoutHeight?: number }> = ({ url, layoutHeight }) => {
  // Guard against URLs that will crash useTexture:
  //  - blob: URLs become stale/undefined after tab navigation or re-renders
  //  - SVG files are not compatible with Three.js TextureLoader
  //  - Non-HTTP(S) URLs (relative paths, data: URIs, undefined) will 404 or throw
  const isUnsafeUrl =
    !url ||
    url.startsWith('blob:') ||
    url.includes('.svg') ||
    url.includes('green-valley-layout') ||
    (!url.startsWith('http://') && !url.startsWith('https://'));

  if (isUnsafeUrl) {
    return <DefaultGroundPlane />;
  }

  return (
    <TextureErrorBoundary fallback={<DefaultGroundPlane />}>
      <React.Suspense fallback={<DefaultGroundPlane />}>
        <GroundMeshWithTexture url={url} />
      </React.Suspense>
    </TextureErrorBoundary>
  );
};

// 3D Extruded Asphalt Road Mesh Component
const RoadMesh3D: React.FC<{
  road: Road;
  layoutWidth: number;
  layoutHeight: number;
  isWalkMode?: boolean;
  onSelectRoad?: (road: Road) => void;
}> = ({ road, layoutWidth, layoutHeight, isWalkMode = false, onSelectRoad }) => {
  const worldScaleX = 40 / layoutWidth;
  const worldScaleZ = 27.5 / layoutHeight;

  const geometry = useMemo(() => {
    const coords = road.polygon_coordinates;
    if (!coords || coords.length < 3) return null;

    const shape = new THREE.Shape();
    coords.forEach((pt, idx) => {
      const x = (pt[0] - layoutWidth / 2) * worldScaleX;
      const z = (pt[1] - layoutHeight / 2) * worldScaleZ;
      if (idx === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();

    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false });
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, [road.polygon_coordinates, layoutWidth, layoutHeight]);

  const roadCenter = useMemo(() => {
    const coords = road.polygon_coordinates;
    if (!coords || coords.length === 0) return [0, 0.2, 0] as [number, number, number];

    const cx = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
    const cy = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;

    const wx = (cx - layoutWidth / 2) * worldScaleX;
    const wz = (cy - layoutHeight / 2) * worldScaleZ;
    return [wx, 0.2, wz] as [number, number, number];
  }, [road.polygon_coordinates, layoutWidth, layoutHeight]);

  if (!geometry) return null;

  return (
    <group
      position={[0, 0.02, 0]}
      onClick={(e) => {
        if (isWalkMode) return;
        e.stopPropagation();
        onSelectRoad?.(road);
      }}
      onPointerOver={() => {
        if (!isWalkMode) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (!isWalkMode) document.body.style.cursor = 'auto';
      }}
    >
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
      {/* Road name label — hidden in walk mode (same distanceFactor giant-label issue as plot labels) */}
      {road.name && !isWalkMode && (
        <Html position={roadCenter} center distanceFactor={28} pointerEvents="none">
          <div className="bg-slate-950/90 text-amber-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider pointer-events-none shadow-md">
            {road.name}
          </div>
        </Html>
      )}
    </group>
  );
};

export const ThreeDLayoutViewer: React.FC<ThreeDLayoutViewerProps> = ({
  layoutWidth = 1200,
  layoutHeight = 964,
  fileUrl,
  projectName,
  plots,
  roads,
  selectedPlotId,
  onSelectPlot,
  gpsAnchor,
}) => {
  const controlsRef = useRef<any>(null);
  const selectedPlot = plots.find((p) => p.id === selectedPlotId);

  const [showVillas, setShowVillas] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [presetAngle, setPresetAngle] = useState<'top' | 'iso' | 'street' | 'walk' | null>('iso');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');

  // Compute common GPS Geographic Origin for local metric coordinate normalization
  const gpsOrigin = useMemo(() => {
    if (gpsAnchor && gpsAnchor.lat && gpsAnchor.lng) {
      return { lat: gpsAnchor.lat, lng: gpsAnchor.lng };
    }
    const geoPlots = plots.filter((p) => p.geo_polygon && p.geo_polygon.length > 0);
    if (geoPlots.length > 0) {
      let totalLat = 0;
      let totalLng = 0;
      let count = 0;
      geoPlots.forEach((p) => {
        p.geo_polygon!.forEach((pt) => {
          totalLat += pt[0];
          totalLng += pt[1];
          count++;
        });
      });
      return { lat: totalLat / count, lng: totalLng / count };
    }
    return null;
  }, [gpsAnchor, plots]);

  // ── Walk Mode ────────────────────────────────────────────────────────────
  const [isWalkMode, setIsWalkMode]       = useState(false);
  const [walkStartPos, setWalkStartPos]   = useState<THREE.Vector3 | null>(null);
  const [nearbyPlot, setNearbyPlot]       = useState<Plot | null>(null);

  // Shared refs — joystick written by WalkModeOverlay, read by WalkCameraController
  const joystickRef           = useRef<JoystickState>({ x: 0, z: 0 });
  // Live camera position written by WalkCameraController, read by WalkPlotProximity
  const walkCamPosRef         = useRef<THREE.Vector3>(new THREE.Vector3());

  const handleNearbyPlotChange = useCallback((plot: Plot | null) => {
    setNearbyPlot(plot);
  }, []);

  const handleEnterWalkMode = useCallback(() => {
    const worldScaleX = 40 / layoutWidth;
    const worldScaleZ = 27.5 / layoutHeight;
    let startPos: THREE.Vector3;

    if (selectedPlot && selectedPlot.polygon_coordinates.length > 0) {
      const coords = selectedPlot.polygon_coordinates;
      const cx = coords.reduce((s, p) => s + p[0], 0) / coords.length;
      const cy = coords.reduce((s, p) => s + p[1], 0) / coords.length;
      const wx = (cx - layoutWidth  / 2) * worldScaleX;
      const wz = (cy - layoutHeight / 2) * worldScaleZ;
      startPos = new THREE.Vector3(wx, 1.75, wz + 3.0);
    } else {
      startPos = new THREE.Vector3(0, 1.75, 9);
    }

    setWalkStartPos(startPos);
    setNearbyPlot(null);
    setIsWalkMode(true);
    setPresetAngle('walk');
  }, [selectedPlot, layoutWidth, layoutHeight]);

  const handleExitWalkMode = useCallback(() => {
    setIsWalkMode(false);
    setNearbyPlot(null);
    setPresetAngle('iso');
  }, []);

  const handleWalkViewDetails = useCallback((plot: Plot) => {
    onSelectPlot(plot);
    handleExitWalkMode();
  }, [onSelectPlot, handleExitWalkMode]);

  return (
    <div className="relative w-full h-full bg-slate-950 select-none">
      {/* Top Controls Overlay — z-50 ensures buttons are always on top of 3D HTML labels */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 flex-wrap">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 flex items-center gap-1 shadow-xl text-xs text-white">
          <div className="flex items-center gap-1.5 text-indigo-400 font-semibold px-2">
            <Box className="w-4 h-4" />
            <span>Interactive 3D Twin</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Camera Angle Presets — hidden while in walk mode */}
          {!isWalkMode && (
            <>
              <button
                onClick={() => setPresetAngle('iso')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  presetAngle === 'iso' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3D Orbit</span>
              </button>

              <button
                onClick={() => setPresetAngle('top')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  presetAngle === 'top' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Top-Down</span>
              </button>

              <button
                onClick={() => setPresetAngle('street')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  presetAngle === 'street' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Street View</span>
              </button>

              <div className="h-4 w-px bg-slate-800" />

              {/* Debug Mode Verification Toggle */}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border ${
                  showDebug
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20 animate-pulse'
                    : 'bg-slate-800/80 text-amber-300 border-amber-500/30 hover:bg-slate-700'
                }`}
                title="Inspect 3D polygon vertex parity & sync log"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>{showDebug ? 'Debug ON' : 'Debug Geometry'}</span>
              </button>
            </>
          )}

          {/* Walk Mode toggle */}
          <button
            onClick={isWalkMode ? handleExitWalkMode : handleEnterWalkMode}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              isWalkMode
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Enter Walk Mode — explore the layout at human eye level"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isWalkMode ? 'Exit Walk' : 'Walk Mode'}</span>
          </button>

          {!isWalkMode && (
            <>
              <div className="h-4 w-px bg-slate-800" />

              {/* Lighting Mode Toggle */}
              <button
                onClick={() => {
                  if (timeOfDay === 'day') setTimeOfDay('sunset');
                  else if (timeOfDay === 'sunset') setTimeOfDay('night');
                  else setTimeOfDay('day');
                }}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Toggle Day / Sunset / Night Lighting"
              >
                {timeOfDay === 'day'    && <Sun      className="w-3.5 h-3.5 text-amber-400" />}
                {timeOfDay === 'sunset' && <Sparkles className="w-3.5 h-3.5 text-rose-400" />}
                {timeOfDay === 'night'  && <Moon     className="w-3.5 h-3.5 text-cyan-400" />}
                <span className="capitalize">{timeOfDay} Lighting</span>
              </button>

              <div className="h-4 w-px bg-slate-800" />

              {/* Toggle 3D Villa Placeholder Models */}
              <button
                onClick={() => setShowVillas(!showVillas)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  showVillas
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                <Home className="w-3.5 h-3.5 inline mr-1" />
                <span>{showVillas ? '3D Villas ON' : 'Show 3D Villas'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Legend & Instructions — hidden in walk mode */}
      {!isWalkMode && (
        <div className="absolute bottom-4 left-4 z-20 hidden sm:block">
          <StatusLegend />
        </div>
      )}

      {/* Controls Hint — hidden in walk mode */}
      {!isWalkMode && (
        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-400 hidden md:block">
          Left-click Drag: <span className="text-white">Rotate</span> | Right-click Drag:{' '}
          <span className="text-white">Pan</span> | Scroll: <span className="text-white">Zoom</span>
        </div>
      )}

      {/* Walk Mode HTML overlay — rendered outside Canvas */}
      <WalkModeOverlay
        isActive={isWalkMode}
        nearbyPlot={nearbyPlot}
        joystickRef={joystickRef}
        onExit={handleExitWalkMode}
        onViewDetails={handleWalkViewDetails}
      />

      {/* R3F Canvas */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 22, 28]} fov={45} />

        {/* OrbitControls — disabled during walk mode to prevent camera conflict */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enabled={!isWalkMode}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={6}
          maxDistance={70}
        />

        {/* Orbital camera controller — skipped during walk mode */}
        {!isWalkMode && (
          <CameraController
            selectedPlot={selectedPlot}
            layoutWidth={layoutWidth}
            layoutHeight={layoutHeight}
            controlsRef={controlsRef}
            presetAngle={presetAngle}
          />
        )}

        {/* Walk Mode — camera controller + proximity detector inside Canvas */}
        {isWalkMode && walkStartPos && (
          <>
            <WalkCameraController
              isActive={isWalkMode}
              startPosition={walkStartPos}
              plots={plots}
              layoutWidth={layoutWidth}
              layoutHeight={layoutHeight}
              joystickRef={joystickRef}
              cameraPositionRef={walkCamPosRef}
              onExit={handleExitWalkMode}
            />
            <WalkPlotProximity
              isActive={isWalkMode}
              plots={plots}
              layoutWidth={layoutWidth}
              layoutHeight={layoutHeight}
              cameraPositionRef={walkCamPosRef}
              onNearbyPlotChange={handleNearbyPlotChange}
            />
          </>
        )}

        {/* Dynamic Sky Backdrop */}
        {timeOfDay === 'day' && <Sky sunPosition={[100, 40, 100]} inclination={0.6} azimuth={0.25} />}
        {timeOfDay === 'sunset' && <Sky sunPosition={[100, 5, 100]} inclination={0.15} azimuth={0.25} />}
        {timeOfDay === 'night' && <color attach="background" args={['#020617']} />}

        {/* Sun Directional & Ambient Lighting */}
        <ambientLight intensity={timeOfDay === 'night' ? 0.2 : timeOfDay === 'sunset' ? 0.45 : 0.7} />
        <directionalLight
          position={[25, timeOfDay === 'sunset' ? 15 : 40, 20]}
          intensity={timeOfDay === 'night' ? 0.3 : timeOfDay === 'sunset' ? 1.1 : 1.5}
          color={timeOfDay === 'sunset' ? '#ffedd5' : '#ffffff'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <hemisphereLight
          intensity={timeOfDay === 'night' ? 0.3 : 0.5}
          color={timeOfDay === 'sunset' ? '#f97316' : '#818cf8'}
          groundColor="#0f172a"
        />

        {/* Textured Ground Plane displaying uploaded layout image (with safe fallback) */}
        <SafeTexturedGround url={fileUrl} layoutHeight={layoutHeight} />

        {/* Environment Surroundings (Sidewalks, Green Belts, Trees, Cars, Entrance Gate) */}
        <EnvironmentDecorations3D
          layoutWidth={layoutWidth}
          layoutHeight={layoutHeight}
          roads={roads}
          projectName={projectName}
          timeOfDay={timeOfDay}
          hideEntranceSign={isWalkMode || presetAngle === 'street'}
        />

        {/* 3D Paved Asphalt Road Geometries */}
        {roads.map((road) => (
          <RoadMesh3D
            key={road.id}
            road={road}
            layoutWidth={layoutWidth}
            layoutHeight={layoutHeight}
            isWalkMode={isWalkMode}
            onSelectRoad={() => setPresetAngle('street')}
          />
        ))}

        {/* Shadow Plane */}
        <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={50} blur={2} far={10} />

        {/* 3D Extruded Plots Group with Exact Geometric Parity */}
        <group position={[0, 0.05, 0]}>
          {plots.map((plot) => (
            <PlotBlock3D
              key={plot.id}
              plot={plot}
              layoutWidth={layoutWidth}
              layoutHeight={layoutHeight}
              isSelected={plot.id === selectedPlotId}
              onSelectPlot={onSelectPlot}
              showVilla={showVillas}
              isWalkMode={isWalkMode}
              showDebug={showDebug}
              gpsOrigin={gpsOrigin}
            />
          ))}
        </group>
      </Canvas>

      {/* On-Screen 3D Geometry Parity Debug HUD */}
      {showDebug && (
        <div className="absolute bottom-6 right-6 z-50 max-w-sm bg-slate-900/95 backdrop-blur-xl border border-amber-500/60 rounded-2xl p-4 shadow-2xl text-xs space-y-2 text-white animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Bug className="w-4 h-4" />
              <span>3D Geometry Parity Inspector</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
              {plots.length} Irregular Plots
            </span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
            <div>
              Selected:{' '}
              <span className="text-cyan-300 font-bold">
                {selectedPlot ? `Plot ${selectedPlot.plot_number}` : 'None (Click a plot)'}
              </span>
            </div>
            {selectedPlot && (
              <>
                <div>
                  Vertices:{' '}
                  <span className="text-amber-300 font-bold">
                    {selectedPlot.polygon_coordinates?.length || 0} Vertices (100% Parity)
                  </span>
                </div>
                <div>
                  Calculated Area:{' '}
                  <span className="text-emerald-300 font-bold">
                    {selectedPlot.area} sq.ft {selectedPlot.area_sq_meters ? `(${selectedPlot.area_sq_meters} m²)` : ''}
                  </span>
                </div>
                <div>
                  Coordinate Mode:{' '}
                  <span className="text-cyan-300">
                    {selectedPlot.geo_polygon && selectedPlot.geo_polygon.length > 0
                      ? 'GPS Geo-Polygon Normalized'
                      : 'Image Pixel Polygon Normalized'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Vertices: {JSON.stringify(selectedPlot.polygon_coordinates?.slice(0, 3))}...
                </div>
              </>
            )}
            <div className="text-[10px] text-amber-400/80 pt-1 border-t border-slate-800">
              Check browser console for full vertex telemetry & logs.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
