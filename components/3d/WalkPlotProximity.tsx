'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Plot } from '@/types';

const PROXIMITY_RADIUS = 3.2; // world units — about 1 plot-width
const CHECK_EVERY_N_FRAMES = 8; // proximity scan interval

interface PlotCentroid {
  plot: Plot;
  wx: number;
  wz: number;
}

interface WalkPlotProximityProps {
  isActive: boolean;
  plots: Plot[];
  layoutWidth: number;
  layoutHeight: number;
  cameraPositionRef: React.RefObject<THREE.Vector3>;
  onNearbyPlotChange: (plot: Plot | null) => void;
}

/**
 * R3F component — must be inside <Canvas>.
 * Scans plot centroids every N frames to detect which plot the user is near.
 * Calls onNearbyPlotChange only when the nearby plot actually changes.
 * Returns null (no Three.js geometry).
 */
export const WalkPlotProximity: React.FC<WalkPlotProximityProps> = ({
  isActive,
  plots,
  layoutWidth,
  layoutHeight,
  cameraPositionRef,
  onNearbyPlotChange,
}) => {
  const sx = 40 / layoutWidth;
  const sz = 27.5 / layoutHeight;

  const frameCount    = useRef(0);
  const lastNearbyId  = useRef<string | null>(null);
  const centroids     = useRef<PlotCentroid[]>([]);

  // Pre-compute centroids when plots or scale change
  useEffect(() => {
    centroids.current = plots.map((plot) => {
      const coords = plot.polygon_coordinates;
      const len = coords.length || 1;
      const cx = coords.reduce((s, [x]) => s + x, 0) / len;
      const cy = coords.reduce((s, [, y]) => s + y, 0) / len;
      return {
        plot,
        wx: (cx - layoutWidth / 2) * sx,
        wz: (cy - layoutHeight / 2) * sz,
      };
    });
  }, [plots, layoutWidth, layoutHeight, sx, sz]);

  // Reset when walk mode deactivates
  useEffect(() => {
    if (!isActive) {
      lastNearbyId.current = null;
      frameCount.current = 0;
    }
  }, [isActive]);

  useFrame(() => {
    if (!isActive) return;

    frameCount.current++;
    if (frameCount.current % CHECK_EVERY_N_FRAMES !== 0) return;

    const cam = cameraPositionRef.current;
    if (!cam) return;

    let nearest: Plot | null = null;
    let nearestDist = PROXIMITY_RADIUS;

    for (const { plot, wx, wz } of centroids.current) {
      const dist = Math.sqrt((cam.x - wx) ** 2 + (cam.z - wz) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = plot;
      }
    }

    const newId = nearest?.id ?? null;
    if (newId !== lastNearbyId.current) {
      lastNearbyId.current = newId;
      onNearbyPlotChange(nearest);
    }
  });

  return null;
};
