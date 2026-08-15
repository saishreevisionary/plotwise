'use client';

import React, { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Plot } from '@/types';
import { Html } from '@react-three/drei';
import { VillaModel3D } from './VillaModel3D';

interface PlotBlock3DProps {
  plot: Plot;
  layoutWidth: number;
  layoutHeight: number;
  isSelected: boolean;
  onSelectPlot: (plot: Plot) => void;
  extrudeHeight?: number;
  showVilla?: boolean;
  isWalkMode?: boolean;
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
}) => {
  const [hovered, setHovered] = useState(false);
  // Suppress hovered state entirely in walk mode to avoid false triggers
  const effectiveHovered = isWalkMode ? false : hovered;

  // Convert 2D image coordinates to 3D Three.js coordinates
  const worldScaleX = 40 / layoutWidth;
  const worldScaleZ = 27.5 / layoutHeight;

  // Generate 3D Three.js Shape from 2D polygon coordinates
  const geometry = useMemo(() => {
    const coords = plot.polygon_coordinates;
    if (!coords || coords.length < 3) return null;

    const shape = new THREE.Shape();

    coords.forEach((pt, idx) => {
      const x = (pt[0] - layoutWidth / 2) * worldScaleX;
      const z = (pt[1] - layoutHeight / 2) * worldScaleZ;

      if (idx === 0) {
        shape.moveTo(x, -z);
      } else {
        shape.lineTo(x, -z);
      }
    });

    shape.closePath();

    const currentExtrudeHeight = isSelected ? extrudeHeight * 1.6 : effectiveHovered ? extrudeHeight * 1.25 : extrudeHeight;

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: currentExtrudeHeight,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, [plot.polygon_coordinates, layoutWidth, layoutHeight, extrudeHeight, isSelected, effectiveHovered]);

  // Center coordinate for label tooltip and villa position
  const centerPos = useMemo(() => {
    const coords = plot.polygon_coordinates;
    if (!coords || coords.length === 0) return { center: [0, 1, 0] as [number, number, number], vertices: [] };

    const cx = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
    const cy = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;

    const wx = (cx - layoutWidth / 2) * worldScaleX;
    const wz = (cy - layoutHeight / 2) * worldScaleZ;
    const wy = isSelected ? extrudeHeight * 1.8 + 0.3 : extrudeHeight + 0.2;

    const vertices3D = coords.map((pt) => [
      (pt[0] - layoutWidth / 2) * worldScaleX,
      0.6,
      (pt[1] - layoutHeight / 2) * worldScaleZ,
    ] as [number, number, number]);

    return { center: [wx, wy, wz] as [number, number, number], villaPos: [wx, 0.6, wz] as [number, number, number], vertices: vertices3D };
  }, [plot.polygon_coordinates, layoutWidth, layoutHeight, extrudeHeight, isSelected]);

  // Status Material colors
  const materialColor = useMemo(() => {
    if (isSelected) return '#22d3ee';
    if (effectiveHovered) return '#67e8f9';

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

  if (!geometry) return null;

  const renderVilla = showVilla && (plot.status === 'booked' || plot.status === 'sold');

  return (
    <group
      position={[0, effectiveHovered ? 0.15 : 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectPlot(plot);
      }}
      onPointerOver={(e) => {
        if (isWalkMode) return;
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => {
        if (isWalkMode) return;
        setHovered(false);
      }}
    >
      {/* Extruded 3D Glassmorphic Land Mesh (Semi-transparent) */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={materialColor}
          transparent={true}
          opacity={isSelected ? 0.75 : effectiveHovered ? 0.65 : 0.5}
          roughness={0.2}
          metalness={0.3}
          emissive={isSelected ? materialColor : effectiveHovered ? materialColor : '#000000'}
          emissiveIntensity={isSelected ? 0.5 : effectiveHovered ? 0.3 : 0}
        />
      </mesh>

      {/* Wireframe Outline for crisp architectural boundary */}
      <lineSegments position={[0, 0.01, 0]}>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color={isSelected ? '#22d3ee' : effectiveHovered ? '#ffffff' : '#1e293b'} linewidth={2} />
      </lineSegments>

      {/* Corner Boundary Posts */}
      {centerPos.vertices.map((vPos, idx) => (
        <mesh key={idx} position={vPos}>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 6]} />
          <meshStandardMaterial color={isSelected ? '#22d3ee' : '#f59e0b'} />
        </mesh>
      ))}

      {/* 3D Villa Placeholder Model on Booked/Sold Plots */}
      {renderVilla && <VillaModel3D position={centerPos.villaPos} scale={0.4} />}

      {/* 3D Floating HTML Plot Number & Dimension Badge */}
      <Html position={centerPos.center} center distanceFactor={25} zIndexRange={[100, 0]}>
        <div
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wider pointer-events-none transition-all shadow-xl whitespace-nowrap flex flex-col items-center gap-0.5 ${
            isSelected
              ? 'bg-cyan-400 text-slate-950 scale-110 font-extrabold ring-2 ring-cyan-300'
              : effectiveHovered
              ? 'bg-white text-slate-950 scale-105'
              : 'bg-slate-950/90 text-slate-100 border border-slate-700'
          }`}
        >
          <div className="flex items-center gap-1">
            <span>Plot {plot.plot_number}</span>
            {plot.status === 'available' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            {plot.status === 'booked' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            {plot.status === 'sold' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />}
          </div>
          {plot.area_cents && (
            <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-bold' : 'text-cyan-400 font-semibold'}`}>
              {plot.dimensions_text || `${plot.area_cents} Cents`}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
