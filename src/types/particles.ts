export enum ParticleShape {
  Point = "point",
  Circle = "circle",
  Star = "star",
  Sphere = "sphere",
  Heart = "heart",
  Waveform = "waveform",
}

export interface ParticleControls {
  shape: ParticleShape;
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
}
