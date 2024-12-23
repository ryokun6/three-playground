import { useRef, useEffect, useState, useMemo, forwardRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

// Add shape types enum
enum ParticleShape {
  Point = "point",
  Circle = "circle",
  Star = "star",
  Sphere = "sphere",
  Ring = "ring",
  Heart = "heart",
  Waveform = "waveform",
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  lifetime: number;
  maxLifetime: number;
  orbitalPlane: THREE.Vector3;
  orbitalSpeed: number;
  orbitalPhase: number;
}

// Add these helper functions before the Particles component
const SAMPLE_RATE = 44100; // Standard sample rate
const MIN_FREQ = 20;
const MAX_FREQ = 20000;

// Helper function to convert frequency bin index to frequency
const binToFrequency = (binIndex: number, fftSize: number): number => {
  return (binIndex * SAMPLE_RATE) / (fftSize * 2);
};

// Helper function to get the frequency bin range for audible spectrum
const getAudibleFrequencyBins = (
  fftSize: number
): { start: number; end: number } => {
  const binWidth = SAMPLE_RATE / (fftSize * 2);
  const startBin = Math.floor(MIN_FREQ / binWidth);
  const endBin = Math.ceil(MAX_FREQ / binWidth);
  return { start: startBin, end: Math.min(endBin, fftSize / 2) };
};

// Modified getWaveformData function to focus on audible range
const getWaveformData = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null
): number[] => {
  if (!analyser || !dataArray) return Array(1024).fill(128);

  analyser.getByteFrequencyData(dataArray);
  const { start, end } = getAudibleFrequencyBins(analyser.fftSize);

  // Extract only the audible frequency range
  const audibleData = Array.from(dataArray.slice(start, end));

  // Apply logarithmic scaling to better represent human hearing
  return audibleData.map((value, index) => {
    const frequency = binToFrequency(index + start, analyser.fftSize);
    // Logarithmic scaling factor (adjust human hearing perception)
    const logScale =
      Math.log10(frequency / MIN_FREQ) / Math.log10(MAX_FREQ / MIN_FREQ);
    return value * (0.3 + 0.7 * logScale); // Boost lower frequencies slightly
  });
};

// Add beat detection helper function at the top level
const getBeatIntensity = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null
): number => {
  if (!analyser || !dataArray) return 0;
  analyser.getByteFrequencyData(dataArray);

  // Focus on bass frequencies (roughly the first 1/8 of frequency data)
  const bassRange = Math.floor(dataArray.length / 8);
  let bassSum = 0;
  for (let i = 0; i < bassRange; i++) {
    bassSum += dataArray[i];
  }
  const bassAverage = bassSum / bassRange;
  return Math.pow(bassAverage / 255, 2); // Squared for more aggressive response
};

// Add these helper functions for frequency band calculations
const createFrequencyBands = (
  minFreq: number,
  maxFreq: number,
  bandCount: number
): { start: number; end: number }[] => {
  const bands: { start: number; end: number }[] = [];
  // Use logarithmic scale for frequency bands to better match human hearing
  for (let i = 0; i < bandCount; i++) {
    const start = minFreq * Math.pow(maxFreq / minFreq, i / bandCount);
    const end = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / bandCount);
    bands.push({ start, end });
  }
  return bands;
};

const getFrequencyBandEnergy = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null,
  bandStart: number,
  bandEnd: number,
  fftSize: number
): number => {
  if (!analyser || !dataArray) return 0;

  const startBin = Math.floor((bandStart * fftSize * 2) / SAMPLE_RATE);
  const endBin = Math.ceil((bandEnd * fftSize * 2) / SAMPLE_RATE);
  let sum = 0;
  let count = 0;

  for (let i = startBin; i < endBin && i < dataArray.length; i++) {
    sum += dataArray[i];
    count++;
  }

  return count > 0 ? sum / (count * 255) : 0;
};

// Add shape generation functions
const generateShapePosition = (
  shape: ParticleShape,
  size: number,
  analyser: AnalyserNode | null = null,
  dataArray: Uint8Array | null = null,
  particleIndex: number = 0,
  totalParticles: number = 1
): THREE.Vector3 => {
  const pos = new THREE.Vector3();

  // Declare all variables at the top
  const angle = Math.random() * Math.PI * 2;
  const starAngle = Math.random() * Math.PI * 2;
  const spikes = 5;
  const innerRadius = size * 0.382;
  const outerRadius = size;
  const spikeAngle =
    Math.floor(starAngle / ((Math.PI * 2) / spikes)) * ((Math.PI * 2) / spikes);
  const angleToSpike = starAngle - spikeAngle;
  const normalizedAngle = angleToSpike % ((Math.PI * 2) / spikes);
  const spikeBlend = Math.abs(normalizedAngle / (Math.PI / spikes) - 1);
  const starRadius =
    innerRadius + (outerRadius - innerRadius) * Math.pow(spikeBlend, 0.5);

  const phi = Math.random() * Math.PI * 2;
  const theta = Math.acos(2 * Math.random() - 1);
  const ringWidth = size * 0.2;
  const ringRadius = size + (Math.random() - 0.5) * ringWidth;
  const t = Math.random() * Math.PI * 2;
  const heartSize = size * 0.8;

  // Pre-declare waveform variables
  const waveformData = getWaveformData(analyser, dataArray);
  const waveformRadius = size * 2;
  const waveformAngle = (particleIndex / totalParticles) * Math.PI * 2;
  const dataIndex = Math.floor(
    (particleIndex / totalParticles) * waveformData.length
  );
  const frequencyValue = waveformData[dataIndex] / 255.0;
  const beatIntensity = getBeatIntensity(analyser, dataArray);
  const frequencyAmplitude =
    Math.pow(frequencyValue, 1.2) * size * 3 * (1 + beatIntensity * 2);

  switch (shape) {
    case ParticleShape.Circle:
      pos.x = Math.cos(angle) * size;
      pos.z = Math.sin(angle) * size;
      break;

    case ParticleShape.Star:
      pos.x = Math.cos(starAngle) * starRadius;
      pos.z = Math.sin(starAngle) * starRadius;
      break;

    case ParticleShape.Sphere:
      pos.x = size * Math.sin(theta) * Math.cos(phi);
      pos.y = size * Math.sin(theta) * Math.sin(phi);
      pos.z = size * Math.cos(theta);
      break;

    case ParticleShape.Ring:
      pos.x = Math.cos(angle) * ringRadius;
      pos.z = Math.sin(angle) * ringRadius;
      break;

    case ParticleShape.Heart:
      pos.x = heartSize * 16 * Math.pow(Math.sin(t), 3);
      pos.y =
        heartSize *
        (13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t));
      pos.z = (Math.random() - 0.5) * size * 0.3;
      pos.multiplyScalar(0.01);
      break;

    case ParticleShape.Waveform:
      pos.x = Math.cos(waveformAngle) * waveformRadius;
      pos.z = Math.sin(waveformAngle) * waveformRadius;
      pos.y = frequencyAmplitude;
      break;

    default:
      pos.set(0, 0, 0);
      break;
  }

  return pos;
};

interface ParticlesProps {
  audioEnabled: boolean;
  onAudioError?: () => void;
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
  audioGain?: number;
  audioSmoothing?: number;
  audioMinDecibels?: number;
  audioMaxDecibels?: number;
  audioReactivity?: number;
}

export const Particles = forwardRef<THREE.Points, ParticlesProps>(
  (
    {
      audioEnabled,
      onAudioError,
      shape: initialShape,
      shapeSize: initialShapeSize,
      orbitalSpeed: initialOrbitalSpeed,
      expandWithAudio: initialExpandWithAudio,
      emissionRate,
      particleLifetime,
      gravity,
      initialSpeed,
      spread,
      rotationSpeed,
      spiralEffect,
      pulseStrength,
      swarmEffect,
      size,
      autoColor,
      startColor,
      endColor,
      colorSpeed,
      colorWaveLength,
      colorSaturation,
      colorBrightness,
      audioGain = 1.0,
      audioSmoothing = 0.8,
      audioMinDecibels = -90,
      audioMaxDecibels = -10,
      audioReactivity = 1.0,
    },
    ref
  ) => {
    const [count] = useState(500);
    const [shape, setShape] = useState<ParticleShape>(
      initialShape as ParticleShape
    );
    const [shapeSize, setShapeSize] = useState(initialShapeSize);
    const [shapeSizeBase, setShapeSizeBase] = useState(initialShapeSize);
    const [orbitalSpeed, setOrbitalSpeed] = useState(initialOrbitalSpeed);
    const [expandWithAudio, setExpandWithAudio] = useState(
      initialExpandWithAudio
    );

    // Add effects to update states when props change
    useEffect(() => {
      setShape(initialShape as ParticleShape);
    }, [initialShape]);

    useEffect(() => {
      setShapeSize(initialShapeSize);
      setShapeSizeBase(initialShapeSize);
    }, [initialShapeSize]);

    useEffect(() => {
      setOrbitalSpeed(initialOrbitalSpeed);
    }, [initialOrbitalSpeed]);

    useEffect(() => {
      setExpandWithAudio(initialExpandWithAudio);
    }, [initialExpandWithAudio]);

    const orbitControlsRef = useRef<OrbitControlsImpl>(null);
    const internalPointsRef = useRef<THREE.Points>(null);
    const geometry = useRef<THREE.BufferGeometry>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);
    const dataArray = useRef<Uint8Array | null>(null);

    // Add getAudioLevel function
    const getAudioLevel = () => {
      if (!analyser.current || !dataArray.current || !audioEnabled) return 0;

      analyser.current.getByteFrequencyData(dataArray.current);
      const average =
        dataArray.current.reduce((acc, val) => acc + val, 0) /
        dataArray.current.length;
      const normalizedLevel = (average / 128.0) * audioGain;
      return normalizedLevel;
    };

    // Initialize audio when enabled changes
    useEffect(() => {
      const initAudio = async () => {
        try {
          audioContext.current = new AudioContext();
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const source = audioContext.current.createMediaStreamSource(stream);
          const gainNode = audioContext.current.createGain();
          analyser.current = audioContext.current.createAnalyser();

          // Configure analyser for frequency analysis
          analyser.current.fftSize = 2048;
          analyser.current.smoothingTimeConstant = audioSmoothing;
          analyser.current.minDecibels = audioMinDecibels;
          analyser.current.maxDecibels = audioMaxDecibels;

          // Configure gain
          gainNode.gain.value = audioGain;

          // Connect nodes
          source.connect(gainNode);
          gainNode.connect(analyser.current);

          // Initialize data array for frequency data
          dataArray.current = new Uint8Array(
            analyser.current.frequencyBinCount
          );
        } catch (error) {
          console.error("Error accessing microphone:", error);
          onAudioError?.();
        }
      };

      if (audioEnabled) {
        initAudio();
      } else if (audioContext.current) {
        audioContext.current.close();
        audioContext.current = null;
      }

      return () => {
        if (audioContext.current) {
          audioContext.current.close();
          audioContext.current = null;
        }
      };
    }, [
      audioEnabled,
      audioSmoothing,
      audioMinDecibels,
      audioMaxDecibels,
      audioGain,
      onAudioError,
    ]);

    // Use the forwarded ref if provided, otherwise use internal ref
    const pointsRef =
      (ref as React.MutableRefObject<THREE.Points>) || internalPointsRef;

    const { camera } = useThree();

    // Initialize camera position
    useEffect(() => {
      if (camera) {
        if (shape === ParticleShape.Waveform) {
          // Position camera for centered sphere view
          camera.position.set(15, 0, 0);
          camera.lookAt(0, 0, 0);
        } else {
          // Default camera position for other shapes
          camera.position.set(0, 10, 0);
        }
      }
    }, [camera, shape]);

    const particles = useRef<Particle[]>([]);
    const positions = useRef(new Float32Array(count * 3));
    const colors = useRef(new Float32Array(count * 3));
    const scales = useRef(new Float32Array(count));
    const opacities = useRef(new Float32Array(count));

    const resetParticle = (particle: Particle, index: number) => {
      // Get position based on selected shape
      particle.position.copy(
        generateShapePosition(
          shape,
          shapeSize,
          analyser.current,
          dataArray.current,
          index,
          particles.current.length
        )
      );

      if (shape === ParticleShape.Waveform) {
        // Minimal initial velocity for waveform particles
        particle.velocity.set(0, 0, 0);
      } else {
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * spread;
        const audioLevel = getAudioLevel();
        const beatIntensity = getBeatIntensity(
          analyser.current,
          dataArray.current
        );
        const speedMultiplier =
          1 + audioLevel * audioReactivity + beatIntensity * 3;
        const baseSpeed = initialSpeed * speedMultiplier;

        if (shape === ParticleShape.Point) {
          particle.velocity.set(
            Math.cos(angle) * baseSpeed * Math.cos(elevation) * 0.2,
            Math.abs(Math.sin(elevation)) * baseSpeed * 0.2,
            Math.sin(angle) * baseSpeed * Math.cos(elevation) * 0.2
          );
        } else {
          const dirFromCenter = particle.position.clone().normalize();
          particle.velocity.copy(dirFromCenter).multiplyScalar(baseSpeed * 0.2);
          particle.velocity.y += (Math.random() - 0.5) * baseSpeed * 0.1;
        }
      }

      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = (Math.random() - 0.5) * rotationSpeed;
      particle.scale = 1.0;
      particle.lifetime = 0;
      particle.maxLifetime = particleLifetime;
    };

    // Initialize particles
    useEffect(() => {
      particles.current = Array(count)
        .fill(null)
        .map(() => ({
          position: new THREE.Vector3(),
          velocity: new THREE.Vector3(),
          rotation: 0,
          rotationSpeed: 0,
          scale: 0,
          lifetime: particleLifetime + 1, // Start with expired lifetime
          maxLifetime: particleLifetime,
          orbitalPlane: new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
          ).normalize(),
          orbitalSpeed: orbitalSpeed,
          orbitalPhase: Math.random() * Math.PI * 2,
        }));

      opacities.current.fill(0.0);
      scales.current.fill(0.0);

      return () => {
        if (audioContext.current) {
          audioContext.current.close();
        }
      };
    }, [count, particleLifetime, orbitalSpeed]);

    useFrame((state, delta) => {
      if (!pointsRef.current || !geometry.current) return;

      const audioLevel = getAudioLevel();
      const baseSize = size * (1 + audioLevel * audioReactivity * 0.5);
      const time = state.clock.getElapsedTime();

      // Update shape size based on audio only for non-waveform shapes
      const newShapeSize =
        shape === ParticleShape.Waveform
          ? shapeSizeBase *
            (expandWithAudio ? 1 + audioLevel * audioReactivity : 1)
          : shapeSizeBase * (1 + audioLevel * audioReactivity * 0.5);
      setShapeSize(newShapeSize);

      const startColorObj = new THREE.Color(startColor);
      const endColorObj = new THREE.Color(endColor);
      const tempColor = new THREE.Color();

      // Helper function to generate wave-based color
      const getWaveColor = (progress: number) => {
        const waveTime = time * colorSpeed;
        const wavePhase = progress * Math.PI * 2 * colorWaveLength + waveTime;

        // Get frequency band energies for different color components
        const lowBandEnergy = getFrequencyBandEnergy(
          analyser.current,
          dataArray.current,
          20, // Low frequencies (20Hz - 200Hz)
          200,
          analyser.current?.fftSize || 2048
        );

        const midBandEnergy = getFrequencyBandEnergy(
          analyser.current,
          dataArray.current,
          200, // Mid frequencies (200Hz - 2000Hz)
          2000,
          analyser.current?.fftSize || 2048
        );

        const highBandEnergy = getFrequencyBandEnergy(
          analyser.current,
          dataArray.current,
          2000, // High frequencies (2kHz - 20kHz)
          20000,
          analyser.current?.fftSize || 2048
        );

        // Use low frequencies to modulate the base hue
        const baseHue = (Math.sin(wavePhase) * 0.5 + 0.5) * 360;
        const hueShift = lowBandEnergy * 60; // Up to 60 degrees shift
        const hue = (baseHue + hueShift) % 360;

        // Use mid frequencies to affect saturation
        const baseSaturation = colorSaturation;
        const saturationBoost = midBandEnergy * 0.3; // Up to 30% boost
        const s = Math.min(1, baseSaturation * (1 + saturationBoost));

        // Use high frequencies to affect brightness
        const baseBrightness = colorBrightness;
        const brightnessBoost = highBandEnergy * 0.4; // Up to 40% boost
        const l = Math.min(1, baseBrightness * (1 + brightnessBoost));

        if (s === 0) {
          return new THREE.Color(l, l, l);
        }

        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };

        const h = hue / 360;
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        const r = hue2rgb(p, q, h + 1 / 3);
        const g = hue2rgb(p, q, h);
        const b = hue2rgb(p, q, h - 1 / 3);

        return new THREE.Color(r, g, b);
      };

      if (shape === ParticleShape.Waveform) {
        // Create frequency bands
        const bandCount = 16; // Number of distinct frequency bands
        const frequencyBands = createFrequencyBands(
          MIN_FREQ,
          MAX_FREQ,
          bandCount
        );

        // Update frequency data
        if (analyser.current && dataArray.current) {
          analyser.current.getByteFrequencyData(dataArray.current);
        }

        // Calculate bass energy for ring spacing with smoothing
        const bassEnergy = getFrequencyBandEnergy(
          analyser.current,
          dataArray.current,
          20, // Start of bass frequency
          150, // End of bass frequency
          analyser.current?.fftSize || 2048
        );

        // Calculate expansion factors
        const audioExpansion = expandWithAudio
          ? 1 + audioLevel * audioReactivity * 0.1
          : 1;
        const bassExpansion = expandWithAudio
          ? 1 + (1 - Math.pow(bassEnergy, 0.5)) * 0.2
          : 1;
        const totalExpansion = audioExpansion * bassExpansion;

        // Sphere formation parameters
        const sphereBaseRadius = shapeSize * 0.5;
        const sphereRadius = sphereBaseRadius * totalExpansion;

        // Calculate perfect sphere distribution
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const angleIncrement = Math.PI * 2 * goldenRatio;

        // Calculate number of particles to emit this frame
        const particlesToEmit =
          emissionRate *
          delta *
          (expandWithAudio ? 1 + audioLevel * audioReactivity : 1);
        let emittedCount = 0;

        particles.current.forEach((particle, i) => {
          // Update lifetime
          particle.lifetime += delta;

          // Check if particle should be reset
          if (particle.lifetime >= particle.maxLifetime) {
            if (emittedCount < particlesToEmit) {
              // Reset lifetime and update orbital parameters
              particle.lifetime = 0;
              particle.maxLifetime = particleLifetime;
              particle.orbitalSpeed = orbitalSpeed;
              particle.orbitalPhase = Math.random() * Math.PI * 2;
              particle.orbitalPlane
                .set(
                  Math.random() - 0.5,
                  Math.random() - 0.5,
                  Math.random() - 0.5
                )
                .normalize();
              emittedCount++;
            } else {
              // If we're not emitting new particles, make this one invisible
              opacities.current[i] = 0;
              scales.current[i] = 0;
              return;
            }
          }

          // Calculate lifetime progress for opacity and scale
          const lifeProgress = particle.lifetime / particle.maxLifetime;
          const fadeInDuration = 0.2; // 20% of lifetime for fade in
          const fadeOutStart = 0.8; // Start fading out at 80% of lifetime

          // Calculate base scale and opacity with audio reactivity toggle
          const baseScale = expandWithAudio
            ? 0.8 + audioLevel * audioReactivity * 0.3
            : 0.8;
          const opacity = expandWithAudio
            ? 0.7 + audioLevel * audioReactivity * 0.3
            : 0.7;

          // Apply fade in/out to opacity and scale
          let finalOpacity = opacity;
          let finalScale = baseScale;

          if (lifeProgress < fadeInDuration) {
            const fadeInProgress = lifeProgress / fadeInDuration;
            finalOpacity *= fadeInProgress;
            finalScale *= fadeInProgress;
          } else if (lifeProgress > fadeOutStart) {
            const fadeOutProgress =
              (lifeProgress - fadeOutStart) / (1 - fadeOutStart);
            finalOpacity *= 1 - fadeOutProgress;
            finalScale *= 1 - fadeOutProgress;
          }

          // Update scale and opacity
          scales.current[i] = finalScale;
          opacities.current[i] = Math.min(1, finalOpacity);

          // Calculate perfect sphere point distribution using Fibonacci sphere
          const t = i / particles.current.length;
          const inclination = Math.acos(1 - 2 * t);
          const azimuth = angleIncrement * i;

          // Get the frequency band for this particle
          const bandIndex = Math.floor(t * bandCount);
          const band = frequencyBands[Math.min(bandIndex, bandCount - 1)];
          const bandEnergy = getFrequencyBandEnergy(
            analyser.current,
            dataArray.current,
            band.start,
            band.end,
            analyser.current?.fftSize || 2048
          );

          // Smooth the band energy response
          const smoothedBandEnergy = Math.pow(bandEnergy, 1.5);

          // Calculate base position on sphere
          const baseRadius = sphereRadius * (1 + smoothedBandEnergy * 0.2);
          const sinInclination = Math.sin(inclination);

          // Calculate base position (before orbital rotation)
          const basePosition = new THREE.Vector3(
            baseRadius * sinInclination * Math.cos(azimuth),
            baseRadius * sinInclination * Math.sin(azimuth),
            baseRadius * Math.cos(inclination)
          );

          // Create orbital rotation matrix
          const orbitalTime = time * particle.orbitalSpeed;
          const orbitalAngle = orbitalTime + particle.orbitalPhase;
          const rotationAxis = particle.orbitalPlane;
          const rotationMatrix = new THREE.Matrix4();
          rotationMatrix.makeRotationAxis(rotationAxis, orbitalAngle);

          // Apply orbital rotation to position
          const position = basePosition.clone();
          position.applyMatrix4(rotationMatrix);

          // Add expansion effect to orbital path
          const expansionFactor = 1 + audioLevel * audioReactivity * 1;
          position.multiplyScalar(expansionFactor);

          // Add subtle wobble based on audio
          const wobbleAmount = smoothedBandEnergy * 0.1;
          const wobbleFreq = time * 1.5;
          const wobble = Math.sin(wobbleFreq + t * Math.PI * 2) * wobbleAmount;
          position.multiplyScalar(1 + wobble);

          // Update particle position
          particle.position.copy(position);

          // Color interpolation based on position and lifetime
          const colorProgress = t + smoothedBandEnergy * 0.3;
          if (autoColor) {
            tempColor.copy(getWaveColor(colorProgress));
          } else {
            tempColor.copy(startColorObj).lerp(endColorObj, colorProgress);
          }
          colors.current[i * 3] = tempColor.r;
          colors.current[i * 3 + 1] = tempColor.g;
          colors.current[i * 3 + 2] = tempColor.b;

          // Update positions array
          positions.current[i * 3] = particle.position.x;
          positions.current[i * 3 + 1] = particle.position.y;
          positions.current[i * 3 + 2] = particle.position.z;
        });
      } else {
        // Original particle update logic for other shapes
        const particlesToEmit =
          emissionRate * delta * (1 + audioLevel * audioReactivity);
        let emittedCount = 0;

        particles.current.forEach((particle, i) => {
          particle.lifetime += delta;

          if (particle.lifetime >= particle.maxLifetime) {
            if (emittedCount < particlesToEmit) {
              resetParticle(particle, i);
              emittedCount++;
            }
            return;
          }

          const lifeProgress = particle.lifetime / particle.maxLifetime;
          opacities.current[i] = Math.max(0, 1 - Math.pow(lifeProgress, 2));

          // Update rotation
          particle.rotation +=
            particle.rotationSpeed * delta * (1 + audioLevel * 2);

          // Calculate forces and update position
          const forces = new THREE.Vector3(0, 0, 0);
          forces.y += gravity * (1 + audioLevel * audioReactivity);

          const spiralStrength =
            spiralEffect * (1 + audioLevel * audioReactivity) * 2;
          forces.x += Math.cos(time * 2 + particle.rotation) * spiralStrength;
          forces.z += Math.sin(time * 2 + particle.rotation) * spiralStrength;

          const swarmStrength =
            swarmEffect * (1 + audioLevel * audioReactivity) * 3;
          forces.x +=
            Math.sin(time * 1.5 + particle.position.y * 0.5) * swarmStrength;
          forces.z +=
            Math.cos(time * 1.5 + particle.position.x * 0.5) * swarmStrength;

          const pulseEffect =
            Math.sin(time * 4) * pulseStrength * audioLevel * 2;
          particle.velocity.addScaledVector(forces, delta);
          particle.velocity.multiplyScalar(1 + pulseEffect * delta);
          particle.position.addScaledVector(particle.velocity, delta);

          // Update scale
          particle.scale =
            1 +
            audioLevel *
              pulseStrength *
              Math.sin(particle.rotation + time * 4) *
              0.5;
          scales.current[i] = particle.scale;

          // Update positions and colors
          positions.current[i * 3] = particle.position.x;
          positions.current[i * 3 + 1] = particle.position.y;
          positions.current[i * 3 + 2] = particle.position.z;

          if (autoColor) {
            tempColor.copy(getWaveColor(lifeProgress));
          } else {
            tempColor.copy(startColorObj).lerp(endColorObj, lifeProgress);
          }
          colors.current[i * 3] = tempColor.r;
          colors.current[i * 3 + 1] = tempColor.g;
          colors.current[i * 3 + 2] = tempColor.b;
        });
      }

      // Update geometry attributes
      geometry.current.attributes.position.needsUpdate = true;
      geometry.current.attributes.color.needsUpdate = true;
      geometry.current.attributes.opacity.needsUpdate = true;

      // Update material
      if (pointsRef.current.material) {
        const material = pointsRef.current.material as THREE.PointsMaterial;
        material.size = baseSize;
        material.vertexColors = true;
      }
    });

    // Create circular texture
    const particleTexture = useMemo(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext("2d");

      if (context) {
        // Create gradient
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        // Draw circle
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(32, 32, 32, 0, Math.PI * 2);
        context.fill();
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }, []);

    // Update particle functions
    const randomizePhysics = () => {
      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      setShapeSize(randomInRange(0.1, 5));
    };

    const randomizeParticleStyle = () => {
      // Keep this function for external use
    };

    // Expose the functions through a ref
    const functionRef = useRef({
      randomizePhysics,
      randomizeParticleStyle,
    });

    return (
      <>
        <OrbitControls
          ref={orbitControlsRef}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={20}
          makeDefault
        />
        <points ref={pointsRef} userData={{ functions: functionRef.current }}>
          <bufferGeometry ref={geometry}>
            <bufferAttribute
              attach="attributes-position"
              count={positions.current.length / 3}
              array={positions.current}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={colors.current.length / 3}
              array={colors.current}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-opacity"
              count={opacities.current.length}
              array={opacities.current}
              itemSize={1}
            />
          </bufferGeometry>
          <pointsMaterial
            size={size}
            vertexColors={true}
            transparent={true}
            opacity={0.8}
            sizeAttenuation={true}
            alphaTest={0.001}
            blending={THREE.AdditiveBlending}
            map={particleTexture}
            depthWrite={false}
          />
        </points>
      </>
    );
  }
);
