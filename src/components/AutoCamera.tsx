import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

interface AutoCameraProps {
  speed: number;
  radius: number;
  cameraTilt?: number;
  verticalMovement?: number;
  speedVariation?: number;
}

export const AutoCamera = ({
  speed,
  radius,
  cameraTilt = 0.3,
  verticalMovement = 0.5,
  speedVariation = 0.3,
}: AutoCameraProps) => {
  const { camera } = useThree();
  const time = useRef(0);
  const verticalOffset = useRef(0);

  useFrame((_, delta) => {
    // Add speed variation using a sine wave
    const currentSpeed =
      speed * (1 + Math.sin(time.current * 0.5) * speedVariation);
    time.current += delta * currentSpeed;

    // Calculate base orbital position
    const x = Math.cos(time.current) * radius;
    const z = Math.sin(time.current) * radius;

    // Add vertical movement using a different frequency
    verticalOffset.current += delta * 0.5;
    const y =
      radius * (1.5 + Math.sin(verticalOffset.current) * verticalMovement);

    // Update camera position with tilt
    camera.position.set(x, y, z);

    // Calculate look-at point with tilt
    const tiltX = Math.sin(time.current * 0.5) * cameraTilt;
    const tiltZ = Math.cos(time.current * 0.5) * cameraTilt;
    camera.lookAt(tiltX, 0, tiltZ);

    // Add a slight roll effect
    camera.rotation.z = Math.sin(time.current * 0.25) * 0.1;
  });

  return null;
};
