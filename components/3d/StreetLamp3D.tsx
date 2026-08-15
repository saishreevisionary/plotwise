'use client';

import React from 'react';

interface StreetLamp3DProps {
  position: [number, number, number];
}

export const StreetLamp3D: React.FC<StreetLamp3DProps> = ({ position }) => {
  return (
    <group position={position}>
      {/* Lamp Pole */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.4, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Horizontal Arm */}
      <mesh position={[0.25, 2.3, 0]} rotation={[0, 0, -Math.PI / 12]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} />
      </mesh>

      {/* Light Head */}
      <mesh position={[0.5, 2.35, 0]}>
        <boxGeometry args={[0.25, 0.08, 0.15]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Glowing Light Source */}
      <mesh position={[0.5, 2.3, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>

      {/* Point Light Source */}
      <pointLight position={[0.5, 2.2, 0]} intensity={1.2} distance={8} color="#fef08a" />
    </group>
  );
};
