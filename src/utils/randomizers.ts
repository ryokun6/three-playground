import { ParticleShape, ParticleControls } from "../types/particles";
import { CameraControls } from "../types/scene";

export const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

export const randomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

export const randomizePhysics = (
  setParticleControls: (controls: Partial<ParticleControls>) => void
) => {
  setParticleControls({
    shapeSize: randomInRange(0.3, 1.5),
    emissionRate: randomInRange(300, 500),
    particleLifetime: randomInRange(0.1, 1),
    gravity: randomInRange(-9.8, 0),
    initialSpeed: randomInRange(0, 20),
    spread: randomInRange(0, 2),
    rotationSpeed: randomInRange(0, 2),
    spiralEffect: randomInRange(0, 1),
    pulseStrength: randomInRange(0, 1),
    swarmEffect: randomInRange(0, 1),
  });
};

export const randomizeStyle = (
  setParticleControls: (controls: Partial<ParticleControls>) => void,
  autoColor: boolean
) => {
  if (autoColor) {
    setParticleControls({
      size: Math.random() * 0.14 + 0.01,
      colorSpeed: Math.random() * 4.9 + 0.1,
      colorWaveLength: Math.random() * 0.9 + 0.1,
      colorSaturation: Math.random() * 0.5 + 0.25,
      colorBrightness: Math.random() * 0.7 + 0.25,
    });
  } else {
    setParticleControls({
      size: Math.random() * 0.14 + 0.01,
      startColor: randomColor(),
      endColor: randomColor(),
    });
  }
};

export const randomizeCamera = (
  setCameraControls: (controls: Partial<CameraControls>) => void,
  autoCameraEnabled: boolean
) => {
  if (!autoCameraEnabled) return;

  setCameraControls({
    cameraRadius: Math.random() * 4 + 1,
    cameraTilt: Math.random(),
    verticalMovement: Math.random() * 1.9 + 0.1,
    speedVariation: Math.random() * 1.9 + 0.1,
  });
};

export const randomizeShape = (
  currentShape: ParticleShape,
  setParticleControls: (controls: Partial<ParticleControls>) => void
) => {
  const shapeValues = Object.values(ParticleShape);
  const currentShapeIndex = shapeValues.indexOf(currentShape);
  // Filter out the current shape and select randomly from remaining shapes
  const availableShapes = shapeValues.filter(
    (_, index) => index !== currentShapeIndex
  );
  const randomIndex = Math.floor(Math.random() * availableShapes.length);
  const nextShape = availableShapes[randomIndex];
  setParticleControls({ shape: nextShape });
  return nextShape;
};
