'use client';

import React from 'react';

interface VillaModel3DProps {
  position?: [number, number, number];
  scale?: number;
}

export const VillaModel3D: React.FC<VillaModel3DProps> = ({
  position = [0, 0, 0],
  scale = 1,
}) => {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Main Ground Floor Structure */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.5, 2.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>

      {/* Second Floor Structure */}
      <mesh position={[0.2, 2.0, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.1, 2.2]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>

      {/* Sloped Architectural Roof */}
      <mesh position={[0.2, 2.8, 0.1]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.6, 0.7, 4]} />
        <meshStandardMaterial color="#991b1b" roughness={0.5} />
      </mesh>

      {/* Glass Balcony */}
      <mesh position={[-0.8, 1.8, 0.8]} castShadow>
        <boxGeometry args={[0.7, 0.5, 0.8]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.6} roughness={0.1} />
      </mesh>

      {/* Main Entrance Door */}
      <mesh position={[-1.11, 0.6, 0]}>
        <boxGeometry args={[0.02, 1.0, 0.6]} />
        <meshStandardMaterial color="#78350f" roughness={0.8} />
      </mesh>

      {/* Illuminated Glass Windows */}
      <mesh position={[0.2, 2.0, 1.22]}>
        <boxGeometry args={[1.2, 0.5, 0.02]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.6} />
      </mesh>

      <mesh position={[0.2, 0.8, 1.42]}>
        <boxGeometry args={[1.4, 0.6, 0.02]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};
