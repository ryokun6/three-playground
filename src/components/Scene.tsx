import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Pixelation,
} from "@react-three/postprocessing";
import { Vector2 } from "three";
import { Particles } from "./Particles";
import { AutoCamera } from "./AutoCamera";

type EnvironmentPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse";

interface SceneProps {
  environmentPreset: EnvironmentPreset;
  backgroundBlur: number;
  brightness: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  chromaticAberrationOffset: Vector2;
  pixelSize: number;
  audioEnabled: boolean;
  audioGain: number;
  audioReactivity: number;
  audioSmoothing: number;
  audioMinDecibels: number;
  audioMaxDecibels: number;
  cameraControls: {
    autoCameraEnabled: boolean;
    cameraSpeed: number;
    cameraRadius: number;
    cameraTilt: number;
    verticalMovement: number;
    speedVariation: number;
  };
  particleControls: {
    shape: string;
    shapeSize: number;
    orbitalSpeed: number;
    expandWithAudio: boolean;
    emissionRate: number;
    particleLifetime: number;
    gravity: number;
    initialSpeed: number;
    spread: number;
    rotationSpeed: number;
    spiralEffect: number;
    pulseStrength: number;
    swarmEffect: number;
    size: number;
    autoColor: boolean;
    startColor: string;
    endColor: string;
    colorSpeed: number;
    colorWaveLength: number;
    colorSaturation: number;
    colorBrightness: number;
  };
  onAudioError?: () => void;
}

export const Scene = ({
  environmentPreset,
  backgroundBlur,
  brightness,
  bloomIntensity,
  bloomThreshold,
  bloomSmoothing,
  chromaticAberrationOffset,
  pixelSize,
  audioEnabled,
  audioGain,
  audioReactivity,
  audioSmoothing,
  audioMinDecibels,
  audioMaxDecibels,
  cameraControls,
  particleControls,
  onAudioError,
}: SceneProps) => {
  return (
    <Canvas
      gl={{
        antialias: false,
        preserveDrawingBuffer: true,
      }}
      dpr={[1, 1]}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#000000"]} />
      <Environment
        preset={environmentPreset}
        background
        blur={backgroundBlur}
        backgroundIntensity={brightness}
        resolution={256}
      />
      <Particles
        audioEnabled={audioEnabled}
        audioGain={audioGain}
        audioReactivity={audioReactivity}
        audioSmoothing={audioSmoothing}
        audioMinDecibels={audioMinDecibels}
        audioMaxDecibels={audioMaxDecibels}
        onAudioError={onAudioError}
        {...particleControls}
      />
      {cameraControls.autoCameraEnabled && (
        <AutoCamera
          speed={cameraControls.cameraSpeed}
          radius={cameraControls.cameraRadius}
          cameraTilt={cameraControls.cameraTilt}
          verticalMovement={cameraControls.verticalMovement}
          speedVariation={cameraControls.speedVariation}
        />
      )}
      <EffectComposer>
        <Bloom
          intensity={bloomIntensity}
          luminanceThreshold={bloomThreshold}
          luminanceSmoothing={bloomSmoothing}
          mipmapBlur
        />
        <ChromaticAberration
          offset={chromaticAberrationOffset}
          radialModulation={false}
          modulationOffset={0}
        />
        <Pixelation granularity={pixelSize} />
      </EffectComposer>
    </Canvas>
  );
};
