import * as THREE from 'three';
import { Plot } from '@/types';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// World space constants — must match ThreeDLayoutViewer & PlotBlock3D
const WORLD_HALF_W = 19.2; // slightly inside the 40-unit width
const WORLD_HALF_D = 12.8; // slightly inside the 27.5-unit depth
const PLAYER_RADIUS = 0.45; // collision capsule radius

/**
 * Pre-computes AABB bounding boxes for all plots in world space.
 * Call once when walk mode activates — store in a ref, not state.
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

    // Shrink box slightly inward so player can still pass between close plots
    return {
      minX: Math.min(...xs) + 0.08,
      maxX: Math.max(...xs) - 0.08,
      minZ: Math.min(...zs) + 0.08,
      maxZ: Math.max(...zs) - 0.08,
    };
  });
}

/**
 * Resolves a proposed walk position against world boundaries and plot AABBs.
 * Uses sliding collision: tries to slide along one axis when blocked.
 * Always locks Y to WALK_HEIGHT (1.75). Never returns below ground.
 */
export function resolveWalkPosition(
  proposed: THREE.Vector3,
  prev: THREE.Vector3,
  aabbs: AABB[]
): THREE.Vector3 {
  // Clamp to world boundary first
  const p = proposed.clone();
  p.y = 1.75;
  p.x = Math.max(-WORLD_HALF_W, Math.min(WORLD_HALF_W, p.x));
  p.z = Math.max(-WORLD_HALF_D, Math.min(WORLD_HALF_D, p.z));

  // Check each plot AABB
  for (const box of aabbs) {
    const inX = p.x > box.minX - PLAYER_RADIUS && p.x < box.maxX + PLAYER_RADIUS;
    const inZ = p.z > box.minZ - PLAYER_RADIUS && p.z < box.maxZ + PLAYER_RADIUS;

    if (inX && inZ) {
      // Try sliding along X (keep new X, revert to prev Z)
      const slideX = new THREE.Vector3(p.x, 1.75, prev.z);
      const slideXBlockedX = slideX.x > box.minX - PLAYER_RADIUS && slideX.x < box.maxX + PLAYER_RADIUS;
      const slideXBlockedZ = slideX.z > box.minZ - PLAYER_RADIUS && slideX.z < box.maxZ + PLAYER_RADIUS;

      if (!slideXBlockedX || !slideXBlockedZ) {
        return slideX;
      }

      // Try sliding along Z (keep new Z, revert to prev X)
      const slideZ = new THREE.Vector3(prev.x, 1.75, p.z);
      const slideZBlockedX = slideZ.x > box.minX - PLAYER_RADIUS && slideZ.x < box.maxX + PLAYER_RADIUS;
      const slideZBlockedZ = slideZ.z > box.minZ - PLAYER_RADIUS && slideZ.z < box.maxZ + PLAYER_RADIUS;

      if (!slideZBlockedX || !slideZBlockedZ) {
        return slideZ;
      }

      // Fully blocked — stay at previous position
      return prev.clone().setY(1.75);
    }
  }

  return p;
}
