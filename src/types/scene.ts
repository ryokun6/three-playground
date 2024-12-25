import { Vector2 } from "three";
import { ParticleControls } from "./particles";

export const ENVIRONMENT_PRESETS = [
  "night",
  "sunset",
  "dawn",
  "warehouse",
  "forest",
  "apartment",
  "studio",
  "city",
  "park",
  "lobby",
] as const;

export type EnvironmentPreset = (typeof ENVIRONMENT_PRESETS)[number];

export interface SceneProps {
  environmentPreset: EnvironmentPreset;
  backgroundBlur: number;
  brightness: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  chromaticAberrationOffset: Vector2;
  pixelSize: number;
  vignetteIntensity: number;
  vignetteOffset: number;
  noiseIntensity: number;
  colorGradingHue: number;
  colorGradingSaturation: number;
  colorGradingBrightness: number;
  colorGradingContrast: number;
  audioEnabled: boolean;
  audioGain: number;
  audioReactivity: number;
  audioSmoothing: number;
  audioMinDecibels: number;
  audioMaxDecibels: number;
  cameraControls: CameraControls;
  particleControls: ParticleControls;
  onAudioError: () => void;
  onAnalyserInit: (analyser: AnalyserNode, dataArray: Uint8Array) => void;
}

export interface CameraControls {
  autoCameraEnabled: boolean;
  cameraSpeed: number;
  cameraRadius: number;
  cameraTilt: number;
  verticalMovement: number;
  speedVariation: number;
}
