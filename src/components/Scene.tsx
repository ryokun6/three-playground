import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Particles } from './Particles.tsx'

export function Scene() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 75,
        near: 0.1,
        far: 1000
      }}
    >
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Particles />
      <OrbitControls />
    </Canvas>
  )
} 