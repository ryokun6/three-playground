import { useControls, button } from "leva";
import { useCallback } from "react";
import { CameraControls } from "../types/scene";
import { randomizeCamera } from "../utils/randomizers";

export const useCameraControls = () => {
  const [cameraControls, setCameraControls] = useControls("Camera", () => ({
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
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    cameraRadius: {
      value: 2.8,
      min: 0.01,
      max: 7,
      step: 0.1,
      label: "zoom",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    cameraTilt: {
      value: 0.9,
      min: 0,
      max: 1,
      step: 0.1,
      label: "tilt",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    verticalMovement: {
      value: 0.9,
      min: 0,
      max: 2,
      step: 0.1,
      label: "verticalMove",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    speedVariation: {
      value: 0.6,
      min: 0,
      max: 1,
      step: 0.1,
      label: "speedVar",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    randomizeCamera: button(() => {
      randomizeCamera(setCameraControls, cameraControls.autoCameraEnabled);
    }),
  }));

  const updateCameraControls = useCallback(
    (values: Partial<CameraControls>) => {
      setCameraControls(values);
    },
    [setCameraControls]
  );

  return {
    cameraControls,
    updateCameraControls,
  };
};
