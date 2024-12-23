import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Pixelation,
} from "@react-three/postprocessing";
import { useControls } from "leva";
import { Particles } from "./Particles";
import { useRef } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Vector2 } from "three";

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
  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  const {
    environmentPreset,
    backgroundBlur,
    brightness,
    bloomIntensity,
    bloomThreshold,
    bloomSmoothing,
    chromaticAberrationOffset,
    pixelSize,
  } = useControls(
    "Visual Effects",
    {
      environmentPreset: {
        value: "night",
        options: Object.keys(ENVIRONMENT_PRESETS),
        label: "environmentPreset",
      },
      backgroundBlur: {
        value: 0.8,
        min: 0,
        max: 1,
        step: 0.1,
        label: "backgroundBlur",
      },
      brightness: {
        value: 0.1,
        min: 0.01,
        max: 1.0,
        step: 0.01,
        label: "brightness",
      },
      bloomIntensity: {
        value: 4,
        min: 0,
        max: 5,
        step: 0.1,
        label: "bloomIntensity",
      },
      bloomThreshold: {
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.1,
        label: "bloomThreshold",
      },
      bloomSmoothing: {
        value: 0.2,
        min: 0,
        max: 1,
        step: 0.1,
        label: "bloomSmoothing",
      },
      chromaticAberrationOffset: {
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.1,
        label: "chromaticAberration",
      },
      pixelSize: {
        value: 1,
        min: 1,
        max: 16,
        step: 1,
        label: "pixelSize",
      },
    },
    { collapsed: true }
  );

  const { autoCameraEnabled, cameraSpeed, cameraRadius } = useControls(
    "Camera",
    {
      autoCameraEnabled: {
        value: true,
        label: "autoCamera",
      },
      cameraSpeed: {
        value: 1,
        min: 0.1,
        max: 3,
        step: 0.1,
        label: "speed",
      },
      cameraRadius: {
        value: 5,
        min: 0.01,
        max: 15,
        step: 0.5,
        label: "zoom",
      },
    }
  );

  function CameraController() {
    const { camera } = useThree();
    const time = useRef(0);

    useFrame((_, delta) => {
      if (autoCameraEnabled) {
        time.current += delta * cameraSpeed;

        // Animate radius using sine wave (oscillates between cameraRadius and near zero)
        const radiusScale = Math.sin(time.current * 0.5) * 0.5 + 0.5; // oscillates between 0 and 1
        const animatedRadius = radiusScale * cameraRadius;
        const x = Math.cos(time.current) * animatedRadius;
        const z = Math.sin(time.current) * animatedRadius;

        // Fixed height
        const y = cameraRadius * 2;

        // Update camera position
        camera.position.set(x, y, z);

        // Always look directly down at origin
        camera.lookAt(0, 0, 0);

        // Disable orbit controls in auto mode
        if (orbitControlsRef.current) {
          orbitControlsRef.current.target.set(0, 0, 0);
          orbitControlsRef.current.enabled = false;
        }
      } else if (
        orbitControlsRef.current &&
        !orbitControlsRef.current.enabled
      ) {
        orbitControlsRef.current.enabled = true;
      }
    });

    return null;
  }

  return (
    <Canvas
      camera={{
        position: [0, cameraRadius * 2, 0],
        fov: 50,
        near: 0.1,
        far: 1000,
      }}
    >
      <CameraController />
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Particles />

      <OrbitControls
        ref={orbitControlsRef}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI * 0.35}
        minPolarAngle={0}
      />

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
        <ChromaticAberration
          offset={
            new Vector2(
              chromaticAberrationOffset / 1000,
              chromaticAberrationOffset / 1000
            )
          }
          radialModulation={false}
          modulationOffset={0}
        />
        <Pixelation granularity={pixelSize} />
      </EffectComposer>
    </Canvas>
  );
}
