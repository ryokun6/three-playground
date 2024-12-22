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

// Add shape generation functions
const generateShapePosition = (
  shape: ParticleShape,
  size: number
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
      pos.z = (Math.random() - 0.5) * size * 0.3; // Add some depth
      pos.multiplyScalar(0.01); // Scale down the heart shape
      break;

    default: // Point shape or fallback
      pos.set(0, 0, 0);
      break;
  }

  return pos;
};

export function Particles() {
  const [count] = useState(500);
  const [size, setSize] = useState(0.1);
  const [speed] = useState(0.005);
  const [startColor, setStartColor] = useState("#ffffff");
  const [endColor, setEndColor] = useState("#ffffff");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(2.0);
  const [shape, setShape] = useState<ParticleShape>(ParticleShape.Point);
  const [shapeSize, setShapeSize] = useState(2);

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
    particleLifetime: { value: 2, min: 0.1, max: 5 },
    gravity: { value: -9.8, min: -20, max: 0 },
    initialSpeed: { value: speed * 1000, min: 0, max: 20 },
    spread: { value: 0.5, min: 0, max: 2 },
    audioReactivity: { value: 1.0, min: 0, max: 5 },
    rotationSpeed: { value: 0.5, min: 0, max: 2 },
    spiralEffect: { value: 0.3, min: 0, max: 1 },
    pulseStrength: { value: 0.5, min: 0, max: 2 },
    swarmEffect: { value: 0.3, min: 0, max: 1 },
    shape: {
      value: ParticleShape.Point,
      options: Object.values(ParticleShape),
      onChange: (value: ParticleShape) => setShape(value),
    },
    shapeSize: {
      value: 2,
      min: 0.1,
      max: 5,
      step: 0.1,
      onChange: (value: number) => setShapeSize(value),
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
      value: size,
      min: 0.01,
      max: 0.4,
      step: 0.01,
      onChange: (value) => setSize(value),
    },
    startColor: {
      value: startColor,
      onChange: (value) => setStartColor(value),
    },
    endColor: {
      value: endColor,
      onChange: (value) => setEndColor(value),
    },
    audio: {
      value: audioEnabled,
      onChange: (value) => {
        setAudioEnabled(value);
        if (value) {
          initAudio();
        } else if (audioContext.current) {
          audioContext.current.close();
          audioContext.current = null;
        }
      },
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

  const initAudio = async () => {
    try {
      audioContext.current = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.current.createMediaStreamSource(stream);
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      source.connect(analyser.current);
      dataArray.current = new Uint8Array(analyser.current.frequencyBinCount);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setAudioEnabled(false);
    }
  };

  const getAudioLevel = () => {
    if (!analyser.current || !dataArray.current || !audioEnabled) return 0;

    analyser.current.getByteFrequencyData(dataArray.current);
    const average =
      dataArray.current.reduce((acc, val) => acc + val, 0) /
      dataArray.current.length;
    return average / 128.0; // Normalize to 0-1 range
  };

  const particles = useRef<Particle[]>([]);
  const positions = useRef(new Float32Array(count * 3));
  const colors = useRef(new Float32Array(count * 3));
  const scales = useRef(new Float32Array(count));
  const opacities = useRef(new Float32Array(count));

  const resetParticle = (particle: Particle) => {
    // Get position based on selected shape
    particle.position.copy(generateShapePosition(shape, shapeSize));

    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * spread;

    const audioLevel = getAudioLevel();
    const speedMultiplier = 1 + audioLevel * audioReactivity;

    // Modify velocity based on shape
    const baseSpeed = initialSpeed * speedMultiplier;
    if (shape === ParticleShape.Point) {
      // Original point emission
      particle.velocity.set(
        Math.cos(angle) * baseSpeed * Math.cos(elevation),
        Math.abs(Math.sin(elevation)) * baseSpeed,
        Math.sin(angle) * baseSpeed * Math.cos(elevation)
      );
    } else {
      // For shapes, add a small outward velocity
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
          resetParticle(particle);
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
      const radialForce = Math.sin(time * 2) * audioLevel * pulseStrength * 5;
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
