import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useControls } from "leva";
import { Particles } from "./Particles";

// Available environment presets
const ENVIRONMENT_PRESETS = {
  night: "night",
  sunset: "sunset",
  dawn: "dawn",
  warehouse: "warehouse",
  forest: "forest",
  apartment: "apartment",
  studio: "studio",
  city: "city",
  park: "park",
  lobby: "lobby",
} as const;

export function Scene() {
  const { environmentPreset, backgroundBlur, brightness } = useControls(
    "Environment",
    {
      environmentPreset: {
        value: "night",
        options: Object.keys(ENVIRONMENT_PRESETS),
        label: "Preset",
      },
      backgroundBlur: {
        value: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
        label: "Background Blur",
      },
      brightness: {
        value: 0.15,
        min: 0.01,
        max: 1.0,
        step: 0.01,
        label: "Brightness",
      },
    },
    { collapsed: true }
  );

  const { bloomIntensity, bloomThreshold, bloomSmoothing } = useControls(
    "Bloom",
    {
      bloomIntensity: {
        value: 4,
        min: 0,
        max: 5,
        step: 0.1,
        label: "Intensity",
      },
      bloomThreshold: {
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.1,
        label: "Threshold",
      },
      bloomSmoothing: {
        value: 0.2,
        min: 0,
        max: 1,
        step: 0.1,
        label: "Smoothing",
      },
    },
    { collapsed: true }
  );

  return (
    <Canvas
      camera={{
        position: [0, 0, 5],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
    >
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Particles />
      <OrbitControls />

      <Environment
        preset={environmentPreset as keyof typeof ENVIRONMENT_PRESETS}
        background
        blur={backgroundBlur}
        backgroundIntensity={brightness}
      />

      <EffectComposer>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={bloomSmoothing}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
