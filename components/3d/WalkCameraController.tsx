'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Plot } from '@/types';
import { buildPlotAABBs, resolveWalkPosition, AABB } from './WalkCollisionSystem';

const WALK_SPEED = 5.5;          // world units per second
const MOUSE_SENSITIVITY = 0.002; // radians per pixel
const PITCH_LIMIT = 0.62;        // ~35° up/down max
const ENTRY_FRAMES = 72;         // frames for cinematic transition in
const LOOK_SENSITIVITY_TOUCH = 0.005;

export interface JoystickState {
  x: number; // -1 to 1 (strafe)
  z: number; // -1 to 1 (forward/back)
}

interface WalkCameraControllerProps {
  isActive: boolean;
  startPosition: THREE.Vector3;
  plots: Plot[];
  layoutWidth: number;
  layoutHeight: number;
  joystickRef: React.RefObject<JoystickState>;
  cameraPositionRef: React.MutableRefObject<THREE.Vector3>;
  onExit: () => void;
}

/**
 * R3F component — must be mounted inside <Canvas>.
 * Owns all camera motion during Walk Mode.
 * Returns null (no JSX rendered).
 */
export const WalkCameraController: React.FC<WalkCameraControllerProps> = ({
  isActive,
  startPosition,
  plots,
  layoutWidth,
  layoutHeight,
  joystickRef,
  cameraPositionRef,
  onExit,
}) => {
  const { camera, gl } = useThree();

  // All mutable state kept in refs — zero React re-renders per frame
  const yaw   = useRef(0);
  const pitch = useRef(-0.08);
  const keys  = useRef({ w: false, a: false, s: false, d: false });
  const prevPos   = useRef(new THREE.Vector3());
  const aabbs     = useRef<AABB[]>([]);
  const phase     = useRef<'entering' | 'active'>('entering');
  const entryTick = useRef(0);

  // Touch-based camera look (right-half of screen)
  const lookTouch = useRef<{ id: number; x: number; y: number } | null>(null);

  // ── Activate / deactivate ────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      keys.current = { w: false, a: false, s: false, d: false };
      lookTouch.current = null;
      return;
    }
    // Pre-compute plot AABBs once
    aabbs.current = buildPlotAABBs(plots, layoutWidth, layoutHeight);
    phase.current = 'entering';
    entryTick.current = 0;
    prevPos.current.copy(camera.position);
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const dn = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup':    keys.current.w = true; break;
        case 's': case 'arrowdown':  keys.current.s = true; break;
        case 'a': case 'arrowleft':  keys.current.a = true; break;
        case 'd': case 'arrowright': keys.current.d = true; break;
        case 'escape': onExit(); break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w': case 'arrowup':    keys.current.w = false; break;
        case 's': case 'arrowdown':  keys.current.s = false; break;
        case 'a': case 'arrowleft':  keys.current.a = false; break;
        case 'd': case 'arrowright': keys.current.d = false; break;
      }
    };

    window.addEventListener('keydown', dn);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', dn);
      window.removeEventListener('keyup', up);
    };
  }, [isActive, onExit]);

  // ── Pointer Lock (desktop mouse look) ──────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current   -= e.movementX * MOUSE_SENSITIVITY;
      pitch.current -= e.movementY * MOUSE_SENSITIVITY;
      pitch.current  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current));
    };

    // Request pointer lock on click once walk is active
    const onClick = () => {
      if (phase.current === 'active' && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock().catch(() => {/* silently ignore on browsers that block it */});
      }
    };

    canvas.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onMouseMove);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, [isActive, gl]);

  // ── Touch look (right half of canvas, mobile) ──────────────────────
  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;

    const onTouchStart = (e: TouchEvent) => {
      if (lookTouch.current !== null) return;
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
      // Only treat as look if touch starts in right 55% of canvas
      if (t.clientX - rect.left > rect.width * 0.45) {
        lookTouch.current = { id: t.identifier, x: t.clientX, y: t.clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!lookTouch.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier !== lookTouch.current.id) continue;
        const dx = t.clientX - lookTouch.current.x;
        const dy = t.clientY - lookTouch.current.y;
        yaw.current   -= dx * LOOK_SENSITIVITY_TOUCH;
        pitch.current -= dy * LOOK_SENSITIVITY_TOUCH;
        pitch.current  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current));
        lookTouch.current.x = t.clientX;
        lookTouch.current.y = t.clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const lt = lookTouch.current;
      if (!lt) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lt.id) {
          lookTouch.current = null;
        }
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: true });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, [isActive, gl]);

  // ── Per-frame update ────────────────────────────────────────────────
  useFrame((_, rawDelta) => {
    if (!isActive) return;

    const delta = Math.min(rawDelta, 0.05); // cap to avoid large jumps on tab-switch

    // ─ Cinematic entry transition ─
    if (phase.current === 'entering') {
      entryTick.current++;
      camera.position.lerp(startPosition, 0.075);
      camera.rotation.order = 'YXZ';
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, pitch.current, 0.07);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, yaw.current,   0.07);
      camera.rotation.z = 0;

      if (entryTick.current >= ENTRY_FRAMES) {
        camera.position.copy(startPosition);
        prevPos.current.copy(startPosition);
        phase.current = 'active';
      }
      cameraPositionRef.current.copy(camera.position);
      return;
    }

    // ─ Active walk movement ─
    const speed = WALK_SPEED * delta;

    // Direction vectors derived from current yaw (horizontal only)
    const fwd   = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3( Math.cos(yaw.current), 0, -Math.sin(yaw.current));

    const move = new THREE.Vector3();

    // Keyboard input
    if (keys.current.w) move.addScaledVector(fwd,    speed);
    if (keys.current.s) move.addScaledVector(fwd,   -speed);
    if (keys.current.a) move.addScaledVector(right, -speed);
    if (keys.current.d) move.addScaledVector(right,  speed);

    // Joystick input (mobile)
    if (joystickRef.current) {
      move.addScaledVector(fwd,   -joystickRef.current.z * speed);
      move.addScaledVector(right,  joystickRef.current.x * speed);
    }

    const proposed = camera.position.clone().add(move);
    proposed.y = 1.75;

    const safe = resolveWalkPosition(proposed, prevPos.current, aabbs.current);
    prevPos.current.copy(camera.position);
    camera.position.copy(safe);

    // Apply rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;

    // Expose live position to proximity detector
    cameraPositionRef.current.copy(camera.position);
  });

  return null;
};
