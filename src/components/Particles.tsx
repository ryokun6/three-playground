import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls, button, folder } from "leva";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  rotationSpeed: number;
  scale: number;
  lifetime: number;
  maxLifetime: number;
}

interface SavedState {
  physics: {
    emissionRate: number;
    particleLifetime: number;
    gravity: number;
    initialSpeed: number;
    spread: number;
    audioReactivity: number;
    rotationSpeed: number;
    spiralEffect: number;
    pulseStrength: number;
    swarmEffect: number;
  };
  particle: {
    size: number;
    startColor: string;
    endColor: string;
  };
  camera: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    autoRotate: boolean;
    autoRotateSpeed: number;
  };
}

export function Particles() {
  const [count] = useState(500);
  const [size, setSize] = useState(0.1);
  const [speed] = useState(0.005);
  const [startColor, setStartColor] = useState("#ffffff");
  const [endColor, setEndColor] = useState("#ffffff");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(2.0);

  const orbitControlsRef = useRef<OrbitControlsImpl>(null);
  const points = useRef<THREE.Points>(null);
  const geometry = useRef<THREE.BufferGeometry>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const dataArray = useRef<Uint8Array | null>(null);

  const { camera } = useThree();
  const defaultCameraPosition = new THREE.Vector3(0, 0, 5);
  const defaultCameraTarget = new THREE.Vector3(0, 0, 0);

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

  useControls({
    "Camera Controls": folder({
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
          camera.position.copy(defaultCameraPosition);
          orbitControlsRef.current.target.copy(defaultCameraTarget);
          orbitControlsRef.current.update();
        }
      }),
    }),
    "Save/Load State": folder({
      saveState: button(() => {
        if (!camera || !orbitControlsRef.current) return;

        const state: SavedState = {
          physics: {
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
          particle: {
            size,
            startColor,
            endColor,
          },
          camera: {
            position: {
              x: camera.position.x,
              y: camera.position.y,
              z: camera.position.z,
            },
            target: {
              x: orbitControlsRef.current.target.x,
              y: orbitControlsRef.current.target.y,
              z: orbitControlsRef.current.target.z,
            },
            autoRotate,
            autoRotateSpeed,
          },
        };

        localStorage.setItem("particles-state", JSON.stringify(state));
      }),
      loadState: button(() => {
        const savedStateStr = localStorage.getItem("particles-state");
        if (!savedStateStr || !camera || !orbitControlsRef.current) return;

        try {
          const savedState: SavedState = JSON.parse(savedStateStr);

          // Restore physics parameters
          set(savedState.physics);

          // Restore particle parameters
          setControls({
            size: savedState.particle.size,
            startColor: savedState.particle.startColor,
            endColor: savedState.particle.endColor,
          });

          // Restore camera state
          camera.position.set(
            savedState.camera.position.x,
            savedState.camera.position.y,
            savedState.camera.position.z
          );
          orbitControlsRef.current.target.set(
            savedState.camera.target.x,
            savedState.camera.target.y,
            savedState.camera.target.z
          );
          setAutoRotate(savedState.camera.autoRotate);
          setAutoRotateSpeed(savedState.camera.autoRotateSpeed);
          orbitControlsRef.current.autoRotate = savedState.camera.autoRotate;
          orbitControlsRef.current.autoRotateSpeed =
            savedState.camera.autoRotateSpeed;
          orbitControlsRef.current.update();
        } catch (error) {
          console.error("Error loading saved state:", error);
        }
      }),
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
  const emissionPoint = new THREE.Vector3(0, 0, 0);

  const resetParticle = (particle: Particle) => {
    particle.position.copy(emissionPoint);
    const angle = Math.random() * Math.PI * 2;
    const elevation = (Math.random() - 0.5) * spread;

    const audioLevel = getAudioLevel();
    const speedMultiplier = 1 + audioLevel * audioReactivity;

    // Base velocity
    const baseSpeed = initialSpeed * speedMultiplier;
    particle.velocity.set(
      Math.cos(angle) * baseSpeed * Math.cos(elevation),
      Math.abs(Math.sin(elevation)) * baseSpeed,
      Math.sin(angle) * baseSpeed * Math.cos(elevation)
    );

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
        lifetime: Infinity,
        maxLifetime: particleLifetime,
      }));
    particles.current.forEach(resetParticle);

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

    // Update material
    if (points.current.material) {
      const material = points.current.material as THREE.PointsMaterial;
      material.size = baseSize;
      material.vertexColors = true;
    }
  });

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
        </bufferGeometry>
        <pointsMaterial
          size={size}
          vertexColors={true}
          transparent={true}
          opacity={0.8}
          sizeAttenuation={true}
        />
      </points>
    </>
  );
}
