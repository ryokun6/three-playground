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

// Add getWaveformData function before generateShapePosition
const getWaveformData = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null
): number[] => {
  if (!analyser || !dataArray) return Array(1024).fill(128);
  analyser.getByteFrequencyData(dataArray);
  return Array.from(dataArray);
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
  const innerRadius = size * 0.382; // Golden ratio for better star proportions
  const outerRadius = size;
  const spikeAngle =
    Math.floor(starAngle / ((Math.PI * 2) / spikes)) * ((Math.PI * 2) / spikes);
  // Pre-calculate star-specific variables
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
  const xPos = (particleIndex / totalParticles - 0.5) * size * 4;
  const dataIndex = Math.floor(
    (particleIndex / totalParticles) * waveformData.length
  );
  const frequencyValue = waveformData[dataIndex] / 255.0; // Normalize to [0, 1]

  // Apply frequency-based color and amplitude modulation
  const frequencyAmplitude = Math.pow(frequencyValue, 1.5) * size * 3; // Emphasize higher frequencies

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
      pos.x = xPos;
      pos.y = frequencyAmplitude; // Use frequency-based amplitude
      pos.z = 0;
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
  const [autoRotate, setAutoRotate] = useState(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(2.0);
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
      camera.position.set(0, 10, 0);
    }
  }, [camera]);

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

  // Camera controls
  useControls("Camera Controls", {
    autoRotate: {
      value: autoRotate,
      label: "Auto Rotate",
      onChange: (value: boolean) => {
        setAutoRotate(value);
        if (orbitControlsRef.current) {
          orbitControlsRef.current.autoRotate = value;
        }
      },
    },
    autoRotateSpeed: {
      value: autoRotateSpeed,
      min: 0.1,
      max: 10,
      step: 0.1,
      label: "Rotation Speed",
      onChange: (value: number) => {
        setAutoRotateSpeed(value);
        if (orbitControlsRef.current) {
          orbitControlsRef.current.autoRotateSpeed = value;
        }
      },
    },
    resetCamera: button(() => {
      if (camera && orbitControlsRef.current) {
        camera.position.set(0, 10, 0);
        orbitControlsRef.current.target.set(0, 0, 0);
        orbitControlsRef.current.update();
      }
    }),
  });

  // Add effect to ensure auto-rotate state is properly initialized
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.autoRotate = autoRotate;
      orbitControlsRef.current.autoRotateSpeed = autoRotateSpeed;
    }
  }, [autoRotate, autoRotateSpeed]);

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

    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * spread;

    const audioLevel = getAudioLevel();
    const speedMultiplier = 1 + audioLevel * audioReactivity;

    // Modify velocity based on shape
    const baseSpeed = initialSpeed * speedMultiplier;
    if (shape === ParticleShape.Waveform) {
      // For waveform, allow slight horizontal movement for more dynamic effect
      particle.velocity.set(
        (Math.random() - 0.5) * baseSpeed * 0.05, // Small horizontal movement
        (Math.random() - 0.5) * baseSpeed * 0.2, // Vertical movement
        0
      );
    } else if (shape === ParticleShape.Point) {
      // Original point emission
      particle.velocity.set(
        Math.cos(angle) * baseSpeed * Math.cos(elevation) * 0.2,
        Math.abs(Math.sin(elevation)) * baseSpeed * 0.2,
        Math.sin(angle) * baseSpeed * Math.cos(elevation) * 0.2
      );
    } else {
      // For other shapes, add a small outward velocity
      const dirFromCenter = particle.position.clone().normalize();
      particle.velocity.copy(dirFromCenter).multiplyScalar(baseSpeed * 0.2);
      particle.velocity.y += (Math.random() - 0.5) * baseSpeed * 0.1;
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

    // Update shape size based on audio
    const newShapeSize =
      shapeSizeBase * (1 + audioLevel * audioReactivity * 0.5);
    setShapeSize(newShapeSize);

    const startColorObj = new THREE.Color(startColor);
    const endColorObj = new THREE.Color(endColor);
    const tempColor = new THREE.Color();

    // Update particles
    const particlesToEmit =
      emissionRate * delta * (1 + audioLevel * audioReactivity);
    let emittedCount = 0;

    particles.current.forEach((particle, i) => {
      // Store original velocity for this frame
      const originalVelocity = particle.velocity.clone();

      particle.lifetime += delta;

      // Reset dead particles
      if (particle.lifetime >= particle.maxLifetime) {
        if (emittedCount < particlesToEmit) {
          resetParticle(particle, i);
          emittedCount++;
        }
        return; // Skip the rest of the update for reset particles
      }

      const lifeProgress = particle.lifetime / particle.maxLifetime;

      // Update opacity based on lifetime
      opacities.current[i] = Math.max(0, 1 - Math.pow(lifeProgress, 2));

      // Update rotation
      particle.rotation +=
        particle.rotationSpeed * delta * (1 + audioLevel * 2);

      // Calculate all forces
      const forces = new THREE.Vector3(0, 0, 0);

      // Gravity force
      const gravityMultiplier = 1 + audioLevel * audioReactivity;
      forces.y += gravity * gravityMultiplier;

      // Spiral force
      const spiralStrength =
        spiralEffect * (1 + audioLevel * audioReactivity) * 2;
      forces.x += Math.cos(time * 2 + particle.rotation) * spiralStrength;
      forces.z += Math.sin(time * 2 + particle.rotation) * spiralStrength;

      // Swarm force
      const swarmStrength =
        swarmEffect * (1 + audioLevel * audioReactivity) * 3;
      forces.x +=
        Math.sin(time * 1.5 + particle.position.y * 0.5) * swarmStrength;
      forces.z +=
        Math.cos(time * 1.5 + particle.position.x * 0.5) * swarmStrength;

      // Radial force (inward/outward motion)
      const radialForce = Math.sin(time * 2) * pulseStrength * audioLevel * 5;
      const dirToCenter = particle.position.clone().normalize();
      forces.addScaledVector(dirToCenter, radialForce);

      // Pulse effect
      const pulseEffect = Math.sin(time * 4) * pulseStrength * audioLevel * 2;

      // Apply all forces to velocity
      particle.velocity.copy(originalVelocity);
      particle.velocity.addScaledVector(forces, delta);
      particle.velocity.multiplyScalar(1 + pulseEffect * delta);

      // Update position
      particle.position.addScaledVector(particle.velocity, delta);

      // Calculate scale
      particle.scale =
        1 +
        audioLevel *
          pulseStrength *
          Math.sin(particle.rotation + time * 4) *
          0.5;
      scales.current[i] = particle.scale;

      // Update positions array
      positions.current[i * 3] = particle.position.x;
      positions.current[i * 3 + 1] = particle.position.y;
      positions.current[i * 3 + 2] = particle.position.z;

      // Update colors
      tempColor.copy(startColorObj).lerp(endColorObj, lifeProgress);
      colors.current[i * 3] = tempColor.r;
      colors.current[i * 3 + 1] = tempColor.g;
      colors.current[i * 3 + 2] = tempColor.b;
    });

    // Update geometry attributes
    geometry.current.attributes.position.needsUpdate = true;

    if (!geometry.current.attributes.color) {
      geometry.current.setAttribute(
        "color",
        new THREE.BufferAttribute(colors.current, 3)
      );
    } else {
      geometry.current.attributes.color.needsUpdate = true;
    }

    // Update opacity attribute
    if (!geometry.current.attributes.opacity) {
      geometry.current.setAttribute(
        "opacity",
        new THREE.BufferAttribute(opacities.current, 1)
      );
    } else {
      geometry.current.attributes.opacity.needsUpdate = true;
    }

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
        autoRotate={autoRotate}
        autoRotateSpeed={autoRotateSpeed}
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
