import { useControls, folder } from "leva";
import { Vector2 } from "three";
import { EnvironmentPreset, ENVIRONMENT_PRESETS } from "../types/scene";

export const useVisualControls = () => {
  const visualControls = useControls(
    "Visuals",
    {
      environment: folder({
        environmentPreset: {
          value: "sunset" as EnvironmentPreset,
          options: ENVIRONMENT_PRESETS,
          label: "preset",
        },
        backgroundBlur: {
          value: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
          label: "blur",
        },
        brightness: {
          value: 0.03,
          min: 0.01,
          max: 1.0,
          step: 0.01,
          label: "brightness",
        },
      }),
      postProcessing: folder({
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
          value: 0.1,
          min: 0,
          max: 3,
          step: 0.1,
          label: "chromaticAberration",
        },
        pixelSize: {
          value: 0,
          min: 0,
          max: 16,
          step: 1,
          label: "pixelSize",
        },
        vignetteIntensity: {
          value: 0.6,
          min: 0,
          max: 1,
          step: 0.1,
          label: "vignetteIntensity",
        },
        vignetteOffset: {
          value: 0.1,
          min: 0,
          max: 1,
          step: 0.1,
          label: "vignetteOffset",
        },
        noiseIntensity: {
          value: 0.25,
          min: 0,
          max: 1,
          step: 0.05,
          label: "noiseIntensity",
        },
      }),
      colorGrading: folder({
        colorGradingHue: {
          value: 3.6,
          min: 0,
          max: 6.28,
          step: 0.1,
          label: "hue",
        },
        colorGradingSaturation: {
          value: 0.5,
          min: 0,
          max: 1,
          step: 0.1,
          label: "saturation",
        },
        colorGradingBrightness: {
          value: 1,
          min: 0,
          max: 2,
          step: 0.1,
          label: "brightness",
        },
        colorGradingContrast: {
          value: 1,
          min: 0,
          max: 2,
          step: 0.1,
          label: "contrast",
        },
      }),
    },
    { collapsed: true }
  );

  return {
    ...visualControls,
    environmentPreset: visualControls.environmentPreset as EnvironmentPreset,
    chromaticAberrationOffset: new Vector2(
      visualControls.chromaticAberrationOffset / 1000,
      visualControls.chromaticAberrationOffset / 1000
    ),
  };
};
