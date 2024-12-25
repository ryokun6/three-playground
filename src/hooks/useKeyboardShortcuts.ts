import { useEffect } from "react";
import { randomizePhysics, randomizeStyle } from "../utils/randomizers";
import { CameraControls } from "../types/scene";
import { ParticleControls } from "../types/particles";

interface UseKeyboardShortcutsProps {
  setIsUIHidden: (value: React.SetStateAction<boolean>) => void;
  setShape: (index: number) => string | null;
  setAudioControls: (
    values: Partial<{ enabled: boolean; autoPlay: boolean }>
  ) => void;
  audioControls: { enabled: boolean; autoPlay: boolean };
  updateParticleControls: (values: Partial<ParticleControls>) => void;
  particleControls: { autoColor: boolean };
  updateCameraControls: (values: Partial<CameraControls>) => void;
  handleRandomizeShape: () => string | null;
  showToast: (message: string) => void;
}

export const useKeyboardShortcuts = ({
  setIsUIHidden,
  setShape,
  setAudioControls,
  audioControls,
  updateParticleControls,
  particleControls,
  updateCameraControls,
  handleRandomizeShape,
  showToast,
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle ESC key for UI toggle
      if (event.key === "Escape") {
        setIsUIHidden((prev) => !prev);
        return;
      }

      // Handle number keys for direct shape selection
      const num = parseInt(event.key);
      if (num > 0 && num <= 6) {
        const shape = setShape(num - 1);
        if (shape) showToast(`Shape: ${shape}`);
        return;
      }

      switch (event.key.toLowerCase()) {
        case "a":
          setAudioControls({ enabled: !audioControls.enabled });
          showToast(`Audio ${!audioControls.enabled ? "on" : "off"}`);
          break;
        case "z":
          randomizePhysics(updateParticleControls);
          showToast("Randomized Physics");
          break;
        case "x":
          randomizeStyle(updateParticleControls, particleControls.autoColor);
          showToast("Randomized Style");
          break;
        case "s": {
          const shape = handleRandomizeShape();
          if (shape) showToast(`Shape: ${shape}`);
          break;
        }
        case "c":
          updateCameraControls({
            cameraRadius: Math.random() * 4 + 1,
            cameraTilt: Math.random(),
            verticalMovement: Math.random() * 1.9 + 0.1,
            speedVariation: Math.random() * 1.9 + 0.1,
          });
          showToast("Randomized Camera");
          break;
        case "d":
          setAudioControls({ autoPlay: !audioControls.autoPlay });
          showToast(`Auto-play ${!audioControls.autoPlay ? "on" : "off"}`);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    setIsUIHidden,
    audioControls,
    setAudioControls,
    updateCameraControls,
    updateParticleControls,
    particleControls,
    showToast,
    handleRandomizeShape,
    setShape,
  ]);
};
