import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  lifetime: number
  maxLifetime: number
}

export function Particles() {
  const [count] = useState(500)
  const [size, setSize] = useState(0.1)
  const [speed] = useState(0.005)
  const [color, setColor] = useState('#ffffff')
  
  const points = useRef<THREE.Points>(null)
  const geometry = useRef<THREE.BufferGeometry>(null)
  
  const { 
    emissionRate,
    particleLifetime,
    gravity,
    initialSpeed,
    spread
  } = useControls('Physics', {
    emissionRate: { value: 50, min: 1, max: 200 },
    particleLifetime: { value: 2, min: 0.1, max: 5 },
    gravity: { value: -9.8, min: -20, max: 0 },
    initialSpeed: { value: speed * 1000, min: 0, max: 20 },
    spread: { value: 0.5, min: 0, max: 2 }
  })

  useControls('Particle', {
    size: {
      value: size,
      min: 0.01,
      max: 0.40,
      step: 0.01,
      onChange: (value) => setSize(value)
    },
    color: {
      value: color,
      onChange: (value) => setColor(value)
    }
  })

  const particles = useRef<Particle[]>([])
  const positions = useRef(new Float32Array(count * 3))
  const emissionPoint = new THREE.Vector3(0, 0, 0)

  const resetParticle = (particle: Particle) => {
    particle.position.copy(emissionPoint)
    const angle = Math.random() * Math.PI * 2
    const elevation = (Math.random() - 0.5) * spread
    particle.velocity.set(
      Math.cos(angle) * initialSpeed * Math.cos(elevation),
      Math.abs(Math.sin(elevation)) * initialSpeed,
      Math.sin(angle) * initialSpeed * Math.cos(elevation)
    )
    particle.lifetime = 0
    particle.maxLifetime = particleLifetime
  }

  // Initialize particles
  useEffect(() => {
    particles.current = Array(count).fill(null).map(() => ({
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      lifetime: Infinity,
      maxLifetime: particleLifetime
    }))
    particles.current.forEach(resetParticle)
  }, [count])

  useFrame((state, delta) => {
    if (!points.current || !geometry.current) return

    // Update particles
    const particlesToEmit = emissionRate * delta
    let emittedCount = 0

    particles.current.forEach((particle, i) => {
      particle.lifetime += delta

      // Reset dead particles
      if (particle.lifetime >= particle.maxLifetime) {
        if (emittedCount < particlesToEmit) {
          resetParticle(particle)
          emittedCount++
        }
      }

      // Update physics
      particle.velocity.y += gravity * delta
      particle.position.addScaledVector(particle.velocity, delta)

      // Update positions array
      positions.current[i * 3] = particle.position.x
      positions.current[i * 3 + 1] = particle.position.y
      positions.current[i * 3 + 2] = particle.position.z
    })

    geometry.current.attributes.position.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry ref={geometry}>
        <bufferAttribute
          attach="attributes-position"
          count={positions.current.length / 3}
          array={positions.current}
          itemSize={3}
          needsUpdate={true}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </points>
  )
} 