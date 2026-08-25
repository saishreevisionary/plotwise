'use client';

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Plot } from '@/types';
import { buildPlotAABBs, resolveWalkPosition, AABB } from './WalkCollisionSystem';

const BASE_WALK_SPEED = 6.2;     // world units per second
const SPRINT_MULTIPLIER = 1.75;  // Shift key sprint speed
const MOUSE_SENSITIVITY = 0.0022; // radians per pixel
const PITCH_LIMIT = 0.65;        // ~37° up/down max
const ENTRY_FRAMES = 24;         // Fast snappy 0.4s entry transition
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

// Module-level pre-allocated reusable vectors for zero Garbage Collection
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _desiredMove = new THREE.Vector3();
const _proposed = new THREE.Vector3();

/**
 * High-performance WalkCameraController
 * Features:
 *  - 0 Object Allocations per frame (Zero GC overhead / no stutters)
 *  - Velocity Damping for silky-smooth human walking feel
 *  - Shift key for fast Sprinting
 *  - High-frequency mouse look smoothing
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

  // Mutable state in refs for zero React re-renders per frame
  const yaw = useRef(0);
  const pitch = useRef(-0.05);
  const targetYaw = useRef(0);
  const targetPitch = useRef(-0.05);

  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false });
  const currentVelocity = useRef(new THREE.Vector3());
  const prevPos = useRef(new THREE.Vector3());
  const aabbs = useRef<AABB[]>([]);
  const phase = useRef<'entering' | 'active'>('entering');
  const entryTick = useRef(0);

  // Touch-based look (right-half of canvas)
  const lookTouch = useRef<{ id: number; x: number; y: number } | null>(null);

  // ── Activate / Deactivate ────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      keys.current = { w: false, a: false, s: false, d: false, shift: false };
      currentVelocity.current.set(0, 0, 0);
      lookTouch.current = null;
      return;
    }

    aabbs.current = buildPlotAABBs(plots, layoutWidth, layoutHeight);
    phase.current = 'entering';
    entryTick.current = 0;
    prevPos.current.copy(camera.position);
    currentVelocity.current.set(0, 0, 0);
  }, [isActive, plots, layoutWidth, layoutHeight, camera]);

  // ── Keyboard Listeners ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          keys.current.w = true;
          break;
        case 's':
        case 'arrowdown':
          keys.current.s = true;
          break;
        case 'a':
        case 'arrowleft':
          keys.current.a = true;
          break;
        case 'd':
        case 'arrowright':
          keys.current.d = true;
          break;
        case 'shift':
          keys.current.shift = true;
          break;
        case 'escape':
          onExit();
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          keys.current.w = false;
          break;
        case 's':
        case 'arrowdown':
          keys.current.s = false;
          break;
        case 'a':
        case 'arrowleft':
          keys.current.a = false;
          break;
        case 'd':
        case 'arrowright':
          keys.current.d = false;
          break;
        case 'shift':
          keys.current.shift = false;
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isActive, onExit]);

  // ── Desktop Pointer Lock Mouse Look ──────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return;
      targetYaw.current -= e.movementX * MOUSE_SENSITIVITY;
      targetPitch.current -= e.movementY * MOUSE_SENSITIVITY;
      targetPitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, targetPitch.current));
    };

    const onClick = () => {
      if (phase.current === 'active' && document.pointerLockElement !== canvas) {
        canvas.requestPointerLock().catch(() => {});
      }
    };

    canvas.addEventListener('click', onClick);
    window.addEventListener('mousemove', onMouseMove);

    return () => {
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('mousemove', onMouseMove);
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [isActive, gl]);

  // ── Mobile Touch Look ────────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return;

    const canvas = gl.domElement;

    const onTouchStart = (e: TouchEvent) => {
      if (lookTouch.current !== null) return;
      const t = e.changedTouches[0];
      const rect = canvas.getBoundingClientRect();
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
        targetYaw.current -= dx * LOOK_SENSITIVITY_TOUCH;
        targetPitch.current -= dy * LOOK_SENSITIVITY_TOUCH;
        targetPitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, targetPitch.current));
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
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isActive, gl]);

  // ── 60-144 FPS Zero-Allocation Frame Loop ────────────────────────────
  useFrame((_, rawDelta) => {
    if (!isActive) return;

    const delta = Math.min(rawDelta, 0.05);

    // Smooth mouse look interpolation (eliminates high-frequency jitter)
    yaw.current = THREE.MathUtils.lerp(yaw.current, targetYaw.current, 0.35);
    pitch.current = THREE.MathUtils.lerp(pitch.current, targetPitch.current, 0.35);

    // 1. Fast cinematic entry transition
    if (phase.current === 'entering') {
      entryTick.current++;
      camera.position.lerp(startPosition, 0.14);
      camera.rotation.order = 'YXZ';
      camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, pitch.current, 0.14);
      camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, yaw.current, 0.14);
      camera.rotation.z = 0;

      if (entryTick.current >= ENTRY_FRAMES) {
        camera.position.copy(startPosition);
        prevPos.current.copy(startPosition);
        phase.current = 'active';
      }
      cameraPositionRef.current.copy(camera.position);
      return;
    }

    // 2. Active walk / sprint computation
    const maxSpeed = keys.current.shift ? BASE_WALK_SPEED * SPRINT_MULTIPLIER : BASE_WALK_SPEED;

    // Unit direction vectors
    _fwd.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    _right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current));

    _desiredMove.set(0, 0, 0);

    // Keyboard inputs
    if (keys.current.w) _desiredMove.add(_fwd);
    if (keys.current.s) _desiredMove.sub(_fwd);
    if (keys.current.a) _desiredMove.sub(_right);
    if (keys.current.d) _desiredMove.add(_right);

    // Joystick inputs (mobile)
    if (joystickRef.current && (joystickRef.current.x !== 0 || joystickRef.current.z !== 0)) {
      _desiredMove.addScaledVector(_fwd, -joystickRef.current.z);
      _desiredMove.addScaledVector(_right, joystickRef.current.x);
    }

    if (_desiredMove.lengthSq() > 0.001) {
      _desiredMove.normalize().multiplyScalar(maxSpeed);
    }

    // Velocity damping: smooth acceleration & deceleration
    currentVelocity.current.lerp(_desiredMove, 0.28);

    if (currentVelocity.current.lengthSq() > 0.0001) {
      _proposed.copy(camera.position).addScaledVector(currentVelocity.current, delta);
      _proposed.y = 1.75;

      const safe = resolveWalkPosition(_proposed, prevPos.current, aabbs.current);
      prevPos.current.copy(camera.position);
      camera.position.copy(safe);
    }

    // Apply look rotation
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw.current;
    camera.rotation.x = pitch.current;
    camera.rotation.z = 0;

    // Expose live position for plot proximity checking
    cameraPositionRef.current.copy(camera.position);
  });

  return null;
};

