import { useRef, useEffect, useState, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls, button } from "leva";
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

export function Particles() {
  const [count] = useState(500);
  const [size, setSize] = useState(0.1);
  const [startColor, setStartColor] = useState("#ff0000");
  const [endColor, setEndColor] = useState("#00ff00");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioGain, setAudioGain] = useState(1.0);
  const [audioSmoothing, setAudioSmoothing] = useState(0.8);
  const [audioMinDecibels, setAudioMinDecibels] = useState(-90);
  const [audioMaxDecibels, setAudioMaxDecibels] = useState(-10);
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.Point);
  const [shapeSize, setShapeSize] = useState(2);
  const [shapeSizeBase, setShapeSizeBase] = useState(2);

  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const points = useRef<THREE.Points>(null);
  const geometry = useRef<THREE.BufferGeometry>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);

  const { camera } = useThree();

  // Initialize camera position
  useEffect(() => {
    if (camera) {
      if (shape === ParticleShape.Waveform) {
        // Position camera for 3D waveform view
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
      } else {
        // Default camera position for other shapes
        camera.position.set(0, 10, 0);
      }
    }
  }, [camera, shape]);

  const [
    {
      emissionRate,
      particleLifetime,
      gravity,
      initialSpeed,
      spread,
      audioReactivity,
      rotationSpeed,
      spiralEffect,
      pulseStrength,
      swarmEffect,
    },
    set,
  ] = useControls("Physics", () => ({
    emissionRate: { value: 50, min: 1, max: 200 },
    particleLifetime: { value: 2.0, min: 0.1, max: 5 },
    gravity: { value: -9.8, min: -20, max: 0 },
    initialSpeed: { value: 5.0, min: 0, max: 20 },
    spread: { value: 0.5, min: 0, max: 2 },
    audioReactivity: { value: 4.6, min: 0, max: 5 },
    rotationSpeed: { value: 0.5, min: 0, max: 2 },
    spiralEffect: { value: 0.46, min: 0, max: 1 },
    pulseStrength: { value: 1.48, min: 0, max: 2 },
    swarmEffect: { value: 0.61, min: 0, max: 1 },
    shape: {
      value: ParticleShape.Ring,
      options: Object.values(ParticleShape),
      onChange: (value: ParticleShape) => setShape(value),
    },
    shapeSize: {
      value: 1.5,
      min: 0.1,
      max: 5,
      step: 0.1,
      onChange: (value: number) => {
        setShapeSizeBase(value);
        setShapeSize(value);
      },
    },
    randomize: button(() => {
      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;
      set({
        emissionRate: randomInRange(1, 200),
        particleLifetime: randomInRange(0.1, 5),
        gravity: randomInRange(-20, 0),
        initialSpeed: randomInRange(0, 20),
        spread: randomInRange(0, 2),
        audioReactivity: randomInRange(0, 5),
        rotationSpeed: randomInRange(0, 2),
        spiralEffect: randomInRange(0, 1),
        pulseStrength: randomInRange(0, 2),
        swarmEffect: randomInRange(0, 1),
      });
    }),
  }));

  const [, setControls] = useControls("Particle", () => ({
    size: {
      value: 0.15,
      min: 0.01,
      max: 0.4,
      step: 0.01,
      onChange: (value) => setSize(value),
    },
    startColor: {
      value: "#ffffff",
      onChange: (value) => setStartColor(value),
    },
    endColor: {
      value: "#ffffff",
      onChange: (value) => setEndColor(value),
    },
    randomize: button(() => {
      const randomColor = () => {
        const hue = Math.random() * 360;
        const saturation = Math.random() * 100;
        const lightness = Math.random() * 100;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      };
      setControls({
        size: Math.random() * 0.39 + 0.01,
        startColor: randomColor(),
        endColor: randomColor(),
      });
    }),
  }));

  // Add audio controls
  useControls("Audio", {
    enabled: {
      value: audioEnabled,
      label: "Audio",
      onChange: (value: boolean) => {
        setAudioEnabled(value);
        if (value) {
          initAudio();
        } else if (audioContext.current) {
          audioContext.current.close();
          audioContext.current = null;
        }
      },
    },
    gain: {
      value: audioGain,
      min: 0,
      max: 5,
      step: 0.1,
      label: "Gain",
      onChange: (value: number) => {
        setAudioGain(value);
      },
    },
    smoothing: {
      value: audioSmoothing,
      min: 0,
      max: 0.99,
      step: 0.01,
      label: "Smoothing",
      onChange: (value: number) => {
        setAudioSmoothing(value);
        if (analyser.current) {
          analyser.current.smoothingTimeConstant = value;
        }
      },
    },
    minDecibels: {
      value: audioMinDecibels,
      min: -100,
      max: 0,
      step: 1,
      label: "Min Vol",
      onChange: (value: number) => {
        setAudioMinDecibels(value);
        if (analyser.current) {
          analyser.current.minDecibels = value;
        }
      },
    },
    maxDecibels: {
      value: audioMaxDecibels,
      min: -100,
      max: 0,
      step: 1,
      label: "Max Vol",
      onChange: (value: number) => {
        setAudioMaxDecibels(value);
        if (analyser.current) {
          analyser.current.maxDecibels = value;
        }
      },
    },
  });

  // Update initAudio function
  const initAudio = async () => {
    try {
      audioContext.current = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.current.createMediaStreamSource(stream);
      const gainNode = audioContext.current.createGain();
      analyser.current = audioContext.current.createAnalyser();

      // Configure analyser for frequency analysis
      analyser.current.fftSize = 2048; // Increased for better frequency resolution
      analyser.current.smoothingTimeConstant = audioSmoothing;
      analyser.current.minDecibels = audioMinDecibels;
      analyser.current.maxDecibels = audioMaxDecibels;

      // Configure gain
      gainNode.gain.value = audioGain;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(analyser.current);

      // Initialize data array for frequency data
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setAudioEnabled(false);
    }
  };

  // Update getAudioLevel function
  const getAudioLevel = () => {
    if (!analyser.current || !dataArray.current || !audioEnabled) return 0;

    analyser.current.getByteFrequencyData(dataArray.current);
    const average =
      dataArray.current.reduce((acc, val) => acc + val, 0) /
      dataArray.current.length;
    const normalizedLevel = (average / 128.0) * audioGain;
    return normalizedLevel;
  };

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
        scale: 1,
        lifetime: particleLifetime + 1, // Initialize as "dead"
        maxLifetime: particleLifetime,
      }));

    // Initialize opacities
    opacities.current.fill(0.0); // Start with zero opacity

    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current || !geometry.current) return;

    const audioLevel = getAudioLevel();
    const baseSize = size * (1 + audioLevel * audioReactivity * 0.5);
    const time = state.clock.getElapsedTime();

    // Update shape size based on audio only for non-waveform shapes
    const newShapeSize =
      shape === ParticleShape.Waveform
        ? shapeSizeBase
        : shapeSizeBase * (1 + audioLevel * audioReactivity * 0.5);
    setShapeSize(newShapeSize);

    const startColorObj = new THREE.Color(startColor);
    const endColorObj = new THREE.Color(endColor);
    const tempColor = new THREE.Color();

    if (shape === ParticleShape.Waveform) {
      // Create frequency bands
      const bandCount = 16; // Number of distinct frequency bands
      const frequencyBands = createFrequencyBands(
        MIN_FREQ,
        MAX_FREQ,
        bandCount
      );
      const beatIntensity = getBeatIntensity(
        analyser.current,
        dataArray.current
      );

      // Update frequency data
      if (analyser.current && dataArray.current) {
        analyser.current.getByteFrequencyData(dataArray.current);
      }

      particles.current.forEach((particle, i) => {
        // Calculate which ring this particle belongs to
        const particlesPerRing = Math.floor(
          particles.current.length / bandCount
        );
        const ringIndex = Math.floor(i / particlesPerRing);
        const particleInRingIndex = i % particlesPerRing;
        const angleInRing =
          (particleInRingIndex / particlesPerRing) * Math.PI * 2;

        // Get the frequency band for this ring
        const band = frequencyBands[Math.min(ringIndex, bandCount - 1)];
        const bandEnergy = getFrequencyBandEnergy(
          analyser.current,
          dataArray.current,
          band.start,
          band.end,
          analyser.current?.fftSize || 2048
        );

        // Calculate base radius with frequency response
        const baseRadius = shapeSize * (1 + ringIndex * 0.2);
        const energyRadius = baseRadius * (1 + bandEnergy * 2);

        // Add time-based movement
        const wobble = Math.sin(time * 2 + ringIndex * 0.5) * 0.1;

        // Calculate position with spiral effect
        const heightOffset =
          (ringIndex / bandCount) * shapeSize * 4 - shapeSize * 2;
        const spiralOffset = (ringIndex / bandCount) * Math.PI * 0.5;

        // Add unique rotation speed for each ring
        // Alternate direction and speed based on ring index
        const ringRotationSpeed =
          (ringIndex % 2 === 0 ? 1 : -1) * (0.05 + ringIndex * 0.02);
        const rotationAngle = time * ringRotationSpeed;

        // Calculate final position with rotation
        const finalAngle = angleInRing + spiralOffset + rotationAngle;
        particle.position.x =
          Math.cos(finalAngle) * energyRadius * (1 + wobble);
        particle.position.z =
          Math.sin(finalAngle) * energyRadius * (1 + wobble);
        particle.position.y = heightOffset + bandEnergy * shapeSize * 2;

        // Scale based on frequency energy
        const scaleBase = 1 + bandEnergy * 1.5;
        const beatScale = beatIntensity * 0.5;
        particle.scale =
          scaleBase * (1 + beatScale) * (1 + (ringIndex / bandCount) * 0.5);
        scales.current[i] = particle.scale;

        // Color interpolation based on frequency and position
        const colorProgress = bandEnergy * 0.6 + (ringIndex / bandCount) * 0.4;
        tempColor.copy(startColorObj).lerp(endColorObj, colorProgress);
        colors.current[i * 3] = tempColor.r;
        colors.current[i * 3 + 1] = tempColor.g;
        colors.current[i * 3 + 2] = tempColor.b;

        // Update positions array
        positions.current[i * 3] = particle.position.x;
        positions.current[i * 3 + 1] = particle.position.y;
        positions.current[i * 3 + 2] = particle.position.z;

        // Update opacity based on energy, position, and rotation
        const distanceFromCenter =
          particle.position.length() / (energyRadius * 2);
        const rotationOpacity = 0.3 + Math.abs(Math.sin(finalAngle)) * 0.7; // Opacity varies with rotation
        opacities.current[i] = Math.min(
          1,
          (0.4 + bandEnergy * 0.6) *
            (1 - distanceFromCenter * 0.3) *
            (1 + beatIntensity * 0.3) *
            rotationOpacity
        );
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

        const pulseEffect = Math.sin(time * 4) * pulseStrength * audioLevel * 2;
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

        tempColor.copy(startColorObj).lerp(endColorObj, lifeProgress);
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
    if (points.current.material) {
      const material = points.current.material as THREE.PointsMaterial;
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
      <points ref={points}>
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
