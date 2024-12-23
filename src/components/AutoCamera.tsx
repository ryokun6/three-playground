import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

interface AutoCameraProps {
  speed: number;
  radius: number;
}

export const AutoCamera = ({ speed, radius }: AutoCameraProps) => {
  const { camera } = useThree();
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta * speed;

    // Animate radius using sine wave (oscillates between radius and near zero)
    const radiusScale = Math.sin(time.current * 0.5) * 0.5 + 0.5; // oscillates between 0 and 1
    const animatedRadius = radiusScale * radius;
    const x = Math.cos(time.current) * animatedRadius;
    const z = Math.sin(time.current) * animatedRadius;

    // Fixed height
    const y = radius * 2;

    // Update camera position
    camera.position.set(x, y, z);

    // Always look directly down at origin
    camera.lookAt(0, 0, 0);
  });

  return null;
};
