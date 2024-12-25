import { EnvironmentPreset } from "../types/scene";

export const ENVIRONMENT_PRESETS: Record<EnvironmentPreset, EnvironmentPreset> =
  {
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
