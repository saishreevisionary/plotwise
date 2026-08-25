'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Plot } from '@/types';
import { Html } from '@react-three/drei';
import { VillaModel3D } from './VillaModel3D';

interface PlotBlock3DProps {
  plot: Plot;
  layoutWidth: number;
  layoutHeight: number;
  isSelected: boolean;
  onSelectPlot: (plot: Plot | null) => void;
  extrudeHeight?: number;
  showVilla?: boolean;
  isWalkMode?: boolean;
  showDebug?: boolean;
  gpsOrigin?: { lat: number; lng: number } | null;
}

export const PlotBlock3D: React.FC<PlotBlock3DProps> = ({
  plot,
  layoutWidth = 1600,
  layoutHeight = 1100,
  isSelected,
  onSelectPlot,
  extrudeHeight = 0.6,
  showVilla = true,
  isWalkMode = false,
  showDebug = false,
  gpsOrigin = null,
}) => {
  const [hovered, setHovered] = useState(false);
  const effectiveHovered = isWalkMode ? false : hovered;

  // Convert 2D pixel or GPS coordinates to Local 3D World Coordinates (meters)
  const worldScaleX = 40 / layoutWidth;
  const worldScaleZ = 27.5 / layoutHeight;

  // Transform coordinates: Uses GPS coordinates if available, otherwise confirmed image pixel coordinates
  const local3DPoints = useMemo(() => {
    // Case 1: Georeferenced Geo-Polygon Available
    if (plot.geo_polygon && plot.geo_polygon.length >= 3 && gpsOrigin) {
      const originLatRad = (gpsOrigin.lat * Math.PI) / 180;
      const mPerLat = 111139.0;
      const mPerLng = 111139.0 * Math.cos(originLatRad);
      const geoScale = 0.45; // 1 meter = 0.45 Three.js scene units

      return plot.geo_polygon.map((pt) => {
        const dLat = pt[0] - gpsOrigin.lat;
        const dLng = pt[1] - gpsOrigin.lng;
        const eastMeters = dLng * mPerLng;
        const northMeters = dLat * mPerLat;
        return [eastMeters * geoScale, -northMeters * geoScale] as [number, number];
      });
    }

    // Case 2: Confirmed Image Mode Pixel Polygon
    const coords = plot.polygon_coordinates || [];
    return coords.map((pt) => [
      (pt[0] - layoutWidth / 2) * worldScaleX,
      (pt[1] - layoutHeight / 2) * worldScaleZ,
    ] as [number, number]);
  }, [plot.geo_polygon, plot.polygon_coordinates, gpsOrigin, layoutWidth, layoutHeight, worldScaleX, worldScaleZ]);

  // Log debug verification data when debug mode is enabled
  useEffect(() => {
    if (showDebug && local3DPoints.length > 0) {
      console.log(`[3D Digital Twin Sync] Plot ${plot.plot_number}:`, {
        plotId: plot.id,
        plotNumber: plot.plot_number,
        vertexCount: local3DPoints.length,
        isGpsCalibrated: !!(plot.geo_polygon && plot.geo_polygon.length > 0),
        gpsPolygon: plot.geo_polygon || 'Image Mode (Uncalibrated)',
        local3DVertices: local3DPoints,
        areaSqFt: plot.area,
        areaSqMeters: plot.area_sq_meters,
      });
    }
  }, [showDebug, plot, local3DPoints]);

  // Generate 3D Three.js Shape with 100% vertex parity
  const geometry = useMemo(() => {
    if (!local3DPoints || local3DPoints.length < 3) return null;

    const shape = new THREE.Shape();

    local3DPoints.forEach((pt, idx) => {
      const x = pt[0];
      const z = pt[1];

      if (idx === 0) {
        shape.moveTo(x, -z);
      } else {
        shape.lineTo(x, -z);
      }
    });

    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: extrudeHeight,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, [local3DPoints, extrudeHeight]);

  // Center coordinate for label tooltip, debug spheres, and villa position
  const centerPos = useMemo(() => {
    if (!local3DPoints || local3DPoints.length === 0) {
      return { center: [0, 1, 0] as [number, number, number], villaPos: [0, 0.6, 0] as [number, number, number], vertices: [] };
    }

    const cx = local3DPoints.reduce((sum, p) => sum + p[0], 0) / local3DPoints.length;
    const cz = local3DPoints.reduce((sum, p) => sum + p[1], 0) / local3DPoints.length;
    const wy = isSelected ? extrudeHeight * 1.8 + 0.3 : extrudeHeight + 0.25;

    const vertices3D = local3DPoints.map((pt) => [pt[0], extrudeHeight + 0.05, pt[1]] as [number, number, number]);

    return {
      center: [cx, wy, cz] as [number, number, number],
      villaPos: [cx, extrudeHeight, cz] as [number, number, number],
      vertices: vertices3D,
    };
  }, [local3DPoints, extrudeHeight, isSelected]);

  // Status Material colors
  const materialColor = useMemo(() => {
    if (isSelected) return '#22d3ee';
    if (effectiveHovered) return '#38bdf8';

    switch (plot.status) {
      case 'available':
        return '#10b981'; // Green
      case 'booked':
        return '#f59e0b'; // Amber / Orange
      case 'sold':
        return '#ef4444'; // Red
      default:
        return '#64748b';
    }
  }, [plot.status, isSelected, effectiveHovered]);

  // Clean up pointer cursor if component unmounts while hovered
  useEffect(() => {
    return () => {
      if (hovered) {
        document.body.style.cursor = 'auto';
      }
    };
  }, [hovered]);

  if (!geometry) return null;

  const renderVilla = showVilla && (plot.status === 'booked' || plot.status === 'sold');

  return (
    <group
      position={[0, isSelected ? 0.2 : effectiveHovered ? 0.1 : 0, 0]}
      scale={[1, isSelected ? 1.35 : effectiveHovered ? 1.15 : 1, 1]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectPlot(isSelected ? null : plot);
      }}
      onPointerOver={(e) => {
        if (isWalkMode) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (isWalkMode) return;
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Extruded 3D Glassmorphic Land Mesh */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={materialColor}
          transparent={true}
          opacity={isSelected ? 0.85 : effectiveHovered ? 0.75 : 0.55}
          roughness={0.2}
          metalness={0.1}
          wireframe={showDebug}
        />
      </mesh>

      {/* Debug Mode: Glowing Vertex Corner Spheres */}
      {showDebug &&
        centerPos.vertices.map((vPos, idx) => (
          <mesh key={idx} position={vPos}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
        ))}

      {/* Plot Number & Real-World Area Badge Overlay */}
      <Html position={centerPos.center} center distanceFactor={24} zIndexRange={[100, 0]}>
        <div
          className={`pointer-events-none transition-all duration-200 select-none ${
            isSelected
              ? 'scale-125 font-bold'
              : effectiveHovered
              ? 'scale-110'
              : 'opacity-90'
          }`}
        >
          <div
            className={`px-2 py-1 rounded-lg text-xs flex flex-col items-center gap-0.5 shadow-xl border backdrop-blur-md ${
              isSelected
                ? 'bg-cyan-950/95 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/50'
                : 'bg-slate-950/85 border-slate-700 text-white'
            }`}
          >
            <div className="font-extrabold flex items-center gap-1">
              <span>{plot.plot_number}</span>
              {showDebug && (
                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-mono">
                  {local3DPoints.length}v
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-300 font-medium">
              {plot.geo_polygon && plot.geo_polygon.length > 0 && plot.area > 0 ? `${plot.area} sq.ft` : 'Uncalibrated'}
            </div>
          </div>
        </div>
      </Html>

      {/* 3D Modern Villa Architecture Model (if booked/sold) */}
      {renderVilla && <VillaModel3D position={centerPos.villaPos} />}
    </group>
  );
};

