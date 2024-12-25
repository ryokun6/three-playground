import { useControls, folder, button } from "leva";
import { useCallback } from "react";
import { ParticleShape, ParticleControls } from "../types/particles";
import {
  randomizePhysics,
  randomizeStyle,
  randomizeShape,
} from "../utils/randomizers";

export const useParticleControls = () => {
  const [particleControls, setParticleControls] = useControls(
    "Particle",
    () => ({
      shape: {
        value: ParticleShape.Sphere,
        options: Object.values(ParticleShape),
        label: "shape",
      },
      shapeSize: {
        value: 0.8,
        min: 0.1,
        max: 5,
        step: 0.1,
        label: "shapeSize",
      },
      emissionRate: {
        value: 497,
        min: 1,
        max: 500,
        label: "emission",
      },
      particleLifetime: {
        value: 0.24,
        min: 0.1,
        max: 2,
        label: "lifetime",
      },
      size: {
        value: 0.08,
        min: 0.01,
        max: 0.4,
        step: 0.01,
        label: "size",
      },
      autoColor: {
        value: true,
        label: "autoColor",
      },
      randomizePhysics: button(() => {
        randomizePhysics(setParticleControls);
      }),
      randomizeStyle: button(() => {
        randomizeStyle(setParticleControls, particleControls.autoColor);
      }),
      physics: folder(
        {
          gravity: {
            value: -4.6,
            min: -9.8,
            max: 0,
            label: "gravity",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          initialSpeed: {
            value: 18.4,
            min: 0,
            max: 20,
            label: "speed",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          spread: {
            value: 0.57,
            min: 0,
            max: 2,
            label: "spread",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          rotationSpeed: {
            value: 0.89,
            min: 0,
            max: 2,
            label: "rotation",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          spiralEffect: {
            value: 0.32,
            min: 0,
            max: 1,
            label: "spiral",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          pulseStrength: {
            value: 0.65,
            min: 0,
            max: 2,
            label: "pulse",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          swarmEffect: {
            value: 0.37,
            min: 0,
            max: 1,
            label: "swarm",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          orbitalSpeed: {
            value: 1,
            min: 0,
            max: 2,
            step: 0.1,
            label: "orbitalSpeed",
            render: (get) => get("Particle.shape") === "waveform",
          },
          expandWithAudio: {
            value: true,
            label: "expandWithAudio",
            render: (get) => get("Particle.shape") === "waveform",
          },
        },
        { collapsed: true }
      ),
      styles: folder(
        {
          startColor: {
            value: "#ffffff",
            render: (get) => !get("Particle.autoColor"),
            label: "startColor",
          },
          endColor: {
            value: "#ffffff",
            render: (get) => !get("Particle.autoColor"),
            label: "endColor",
          },
          colorSpeed: {
            value: 1.0,
            min: 0.1,
            max: 5.0,
            step: 0.1,
            label: "speed",
            render: (get) => get("Particle.autoColor"),
          },
          colorWaveLength: {
            value: 0.5,
            min: 0.1,
            max: 1.0,
            step: 0.05,
            label: "waveLength",
            render: (get) => get("Particle.autoColor"),
          },
          colorSaturation: {
            value: 0.6,
            min: 0,
            max: 1,
            step: 0.05,
            label: "saturation",
            render: (get) => get("Particle.autoColor"),
          },
          colorBrightness: {
            value: 0.7,
            min: 0,
            max: 1,
            step: 0.05,
            label: "brightness",
            render: (get) => get("Particle.autoColor"),
          },
        },
        { collapsed: true }
      ),
    })
  );

  const updateParticleControls = useCallback(
    (values: Partial<ParticleControls>) => {
      setParticleControls(values);
    },
    [setParticleControls]
  );

  const handleRandomizeShape = useCallback(() => {
    const nextShape = randomizeShape(
      particleControls.shape,
      setParticleControls
    );
    return nextShape;
  }, [particleControls.shape, setParticleControls]);

  const setShape = useCallback(
    (index: number) => {
      const shapeValues = Object.values(ParticleShape);
      if (index >= 0 && index < shapeValues.length) {
        const shape = shapeValues[index];
        setParticleControls({ shape });
        return shape;
      }
      return null;
    },
    [setParticleControls]
  );

  return {
    particleControls,
    updateParticleControls,
    handleRandomizeShape,
    setShape,
  };
};
