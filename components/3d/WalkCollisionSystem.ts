import * as THREE from 'three';
import { Plot } from '@/types';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// World space boundaries
const WORLD_HALF_W = 19.2;
const WORLD_HALF_D = 12.8;
const PLAYER_RADIUS = 0.42; // Collision capsule radius

/**
 * Pre-computes AABB bounding boxes for all plots in world space.
 * Executed once on walk activation and cached in a ref.
 */
export function buildPlotAABBs(
  plots: Plot[],
  layoutWidth: number,
  layoutHeight: number
): AABB[] {
  const sx = 40 / layoutWidth;
  const sz = 27.5 / layoutHeight;

  return plots.map((plot) => {
    const coords = plot.polygon_coordinates;
    if (!coords || coords.length < 3) {
      return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
    }
    const xs = coords.map(([x]) => (x - layoutWidth / 2) * sx);
    const zs = coords.map(([, y]) => (y - layoutHeight / 2) * sz);

    // Inward padding allows smooth navigation through roads and alleys
    return {
      minX: Math.min(...xs) + 0.08,
      maxX: Math.max(...xs) - 0.08,
      minZ: Math.min(...zs) + 0.08,
      maxZ: Math.max(...zs) - 0.08,
    };
  });
}

// Reusable zero-allocation result vector
const _resolved = new THREE.Vector3();

/**
 * High-performance, zero-allocation sliding collision resolver.
 * Keeps frame rates smooth without triggering Garbage Collector sweeps.
 */
export function resolveWalkPosition(
  proposed: THREE.Vector3,
  prev: THREE.Vector3,
  aabbs: AABB[]
): THREE.Vector3 {
  _resolved.set(
    Math.max(-WORLD_HALF_W, Math.min(WORLD_HALF_W, proposed.x)),
    1.75,
    Math.max(-WORLD_HALF_D, Math.min(WORLD_HALF_D, proposed.z))
  );

  const len = aabbs.length;
  for (let i = 0; i < len; i++) {
    const box = aabbs[i];
    const inX = _resolved.x > box.minX - PLAYER_RADIUS && _resolved.x < box.maxX + PLAYER_RADIUS;
    const inZ = _resolved.z > box.minZ - PLAYER_RADIUS && _resolved.z < box.maxZ + PLAYER_RADIUS;

    if (inX && inZ) {
      // 1. Try sliding along X axis (new X, retain old Z)
      const slideX_X = _resolved.x;
      const slideX_Z = prev.z;
      const blockedX = slideX_X > box.minX - PLAYER_RADIUS && slideX_X < box.maxX + PLAYER_RADIUS;
      const blockedZ = slideX_Z > box.minZ - PLAYER_RADIUS && slideX_Z < box.maxZ + PLAYER_RADIUS;

      if (!blockedX || !blockedZ) {
        _resolved.set(slideX_X, 1.75, slideX_Z);
        continue;
      }

      // 2. Try sliding along Z axis (retain old X, new Z)
      const slideZ_X = prev.x;
      const slideZ_Z = _resolved.z;
      const bZX = slideZ_X > box.minX - PLAYER_RADIUS && slideZ_X < box.maxX + PLAYER_RADIUS;
      const bZZ = slideZ_Z > box.minZ - PLAYER_RADIUS && slideZ_Z < box.maxZ + PLAYER_RADIUS;

      if (!bZX || !bZZ) {
        _resolved.set(slideZ_X, 1.75, slideZ_Z);
        continue;
      }

      // Fully blocked corner — revert to previous safe position
      _resolved.set(prev.x, 1.75, prev.z);
      return _resolved;
    }
  }

  return _resolved;
}

