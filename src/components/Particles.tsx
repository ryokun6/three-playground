import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Particles() {
  const points = useRef<THREE.Points>(null)
  
  const particlesCount = 5000
  const positions = useMemo(() => {
    const positions = new Float32Array(particlesCount * 3)
    
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10
    }
    
    return positions
  }, [])

  useFrame(() => {
    if (!points.current) return
    points.current.rotation.x += 0.001
    points.current.rotation.y += 0.001
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  )
} 