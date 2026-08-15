'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { Road } from '@/types';

interface EnvironmentDecorations3DProps {
  layoutWidth: number;
  layoutHeight: number;
  roads: Road[];
  timeOfDay?: 'day' | 'sunset' | 'night';
}

// Low-poly 3D Car Model
const Car3D: React.FC<{
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
}> = ({ position, rotation = [0, 0, 0], color = '#0284c7' }) => {
  return (
    <group position={position} rotation={rotation} scale={[0.45, 0.45, 0.45]}>
      {/* Car Body Base */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.4, 0.45, 2.6]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Car Cabin Roof */}
      <mesh position={[0, 0.75, -0.1]} castShadow>
        <boxGeometry args={[1.2, 0.4, 1.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Windows Glass */}
      <mesh position={[0, 0.75, -0.1]}>
        <boxGeometry args={[1.22, 0.35, 1.35]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} roughness={0.1} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.45, 0.38, 1.31]}>
        <boxGeometry args={[0.25, 0.12, 0.04]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
      <mesh position={[0.45, 0.38, 1.31]}>
        <boxGeometry args={[0.25, 0.12, 0.04]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Taillights */}
      <mesh position={[-0.45, 0.38, -1.31]}>
        <boxGeometry args={[0.25, 0.12, 0.04]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.45, 0.38, -1.31]}>
        <boxGeometry args={[0.25, 0.12, 0.04]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Wheels */}
      {[-0.65, 0.65].map((x) =>
        [-0.75, 0.75].map((z, idx) => (
          <mesh key={`${x}-${z}-${idx}`} position={[x, 0.2, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 0.15, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
};

// Lush Round Canopy Shade Tree
const ShadeTree3D: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 1.0, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.9} />
      </mesh>

      {/* Dense Foliage Spheres */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <dodecahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial color="#16a34a" roughness={0.7} />
      </mesh>
      <mesh position={[0.2, 1.6, -0.1]} castShadow>
        <dodecahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} />
      </mesh>
      <mesh position={[-0.2, 1.5, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#22c55e" roughness={0.7} />
      </mesh>
    </group>
  );
};

// Tall Cypress Evergreen Tree
const CypressTree3D: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 0.8, 6]} />
        <meshStandardMaterial color="#451a03" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.45, 2.2, 8]} />
        <meshStandardMaterial color="#064e3b" roughness={0.6} />
      </mesh>
    </group>
  );
};

// Entrance Archway Gate
const EntranceArchway3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Left Pillar */}
      <mesh position={[-3.5, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 3.0, 0.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Right Pillar */}
      <mesh position={[3.5, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 3.0, 0.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Archway Beam Header */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.6, 0.7, 0.7]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Golden Welcome Sign Badge */}
      <Html position={[0, 3.25, 0.38]} center distanceFactor={26}>
        <div className="bg-slate-950/95 border border-amber-500/50 px-3 py-1 rounded-lg text-[11px] font-extrabold text-amber-400 tracking-widest uppercase shadow-2xl whitespace-nowrap flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>GREEN VALLEY ESTATES • MAIN ENTRANCE</span>
        </div>
      </Html>
    </group>
  );
};

export const EnvironmentDecorations3D: React.FC<EnvironmentDecorations3DProps> = ({
  layoutWidth = 1200,
  layoutHeight = 964,
  roads = [],
  timeOfDay = 'day',
}) => {
  const worldScaleX = 40 / layoutWidth;
  const worldScaleZ = 27.5 / layoutHeight;

  // Road Sidewalk Curbs
  const sidewalkMeshes = useMemo(() => {
    return roads.map((road) => {
      const coords = road.polygon_coordinates;
      if (!coords || coords.length < 3) return null;

      const shape = new THREE.Shape();
      coords.forEach((pt, idx) => {
        const wx = (pt[0] - layoutWidth / 2) * worldScaleX;
        const wz = (pt[1] - layoutHeight / 2) * worldScaleZ;
        const expand = 0.08;
        if (idx === 0) shape.moveTo(wx - expand, -(wz - expand));
        else shape.lineTo(wx - expand, -(wz - expand));
      });
      shape.closePath();

      const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
      geom.rotateX(-Math.PI / 2);
      return { id: road.id, geom };
    });
  }, [roads, layoutWidth, layoutHeight]);

  // Park Lawn / Green Belts along borders
  const greenBelts = useMemo(() => {
    const belts: Array<{ pos: [number, number, number]; size: [number, number, number] }> = [
      // Top Green Belt
      { pos: [0, 0.01, -12.5], size: [38, 0.02, 1.2] },
      // Bottom Green Belt
      { pos: [0, 0.01, 12.5], size: [38, 0.02, 1.2] },
      // Left Perimeter Belt
      { pos: [-18.5, 0.01, 0], size: [1.2, 0.02, 25] },
      // Right Perimeter Belt
      { pos: [18.5, 0.01, 0], size: [1.2, 0.02, 25] },
    ];
    return belts;
  }, []);

  // Roadside Trees
  const roadsideTrees = useMemo(() => {
    const trees: Array<{ pos: [number, number, number]; type: 'shade' | 'cypress' }> = [
      { pos: [-17, 0, -11.5], type: 'shade' },
      { pos: [-11, 0, -11.5], type: 'cypress' },
      { pos: [-5, 0, -11.5], type: 'shade' },
      { pos: [5, 0, -11.5], type: 'shade' },
      { pos: [11, 0, -11.5], type: 'cypress' },
      { pos: [17, 0, -11.5], type: 'shade' },

      { pos: [-17, 0, 11.5], type: 'cypress' },
      { pos: [-11, 0, 11.5], type: 'shade' },
      { pos: [-5, 0, 11.5], type: 'cypress' },
      { pos: [5, 0, 11.5], type: 'cypress' },
      { pos: [11, 0, 11.5], type: 'shade' },
      { pos: [17, 0, 11.5], type: 'cypress' },

      { pos: [-17.5, 0, -6], type: 'shade' },
      { pos: [-17.5, 0, 6], type: 'cypress' },
      { pos: [17.5, 0, -6], type: 'cypress' },
      { pos: [17.5, 0, 6], type: 'shade' },
    ];
    return trees;
  }, []);

  // Vehicles along 40ft Main Road
  const vehicles = useMemo(() => {
    const cars: Array<{
      pos: [number, number, number];
      rot: [number, number, number];
      color: string;
    }> = [
      { pos: [-8, 0, 0.4], rot: [0, Math.PI / 2, 0], color: '#0284c7' }, // Blue Sedan
      { pos: [2, 0, -0.4], rot: [0, -Math.PI / 2, 0], color: '#dc2626' }, // Red SUV
      { pos: [12, 0, 0.4], rot: [0, Math.PI / 2, 0], color: '#10b981' }, // Green EV
    ];
    return cars;
  }, []);

  return (
    <group>
      {/* Green Landscape Belts / Lawn Grounds */}
      {greenBelts.map((gb, idx) => (
        <mesh key={idx} position={gb.pos} receiveShadow>
          <boxGeometry args={gb.size} />
          <meshStandardMaterial color="#15803d" roughness={0.8} />
        </mesh>
      ))}

      {/* Concrete Sidewalk Curbs */}
      {sidewalkMeshes.map((s) =>
        s && s.geom ? (
          <mesh key={`curb-${s.id}`} geometry={s.geom} position={[0, 0.01, 0]} receiveShadow>
            <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
          </mesh>
        ) : null
      )}

      {/* Road Zebra Crosswalk Striping */}
      {[-3, 3].map((x, idx) => (
        <group key={`zebra-${idx}`} position={[x * 3.2, 0.02, 0]}>
          {[-0.8, -0.4, 0, 0.4, 0.8].map((z, sIdx) => (
            <mesh key={sIdx} position={[0, 0, z]}>
              <boxGeometry args={[0.3, 0.01, 0.2]} />
              <meshBasicMaterial color="#f8fafc" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Main Entrance Gate Archway */}
      <EntranceArchway3D position={[0, 0, 13.0]} />

      {/* Roadside Trees */}
      {roadsideTrees.map((tree, idx) =>
        tree.type === 'shade' ? (
          <ShadeTree3D key={idx} position={tree.pos} scale={0.9} />
        ) : (
          <CypressTree3D key={idx} position={tree.pos} scale={0.9} />
        )
      )}

      {/* 3D Vehicles */}
      {vehicles.map((car, idx) => (
        <Car3D key={idx} position={car.pos} rotation={car.rot} color={car.color} />
      ))}
    </group>
  );
};
