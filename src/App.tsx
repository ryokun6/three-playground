import { Scene } from "./components/Scene";
import { useState } from "react";
import { Toast } from "./components/ui/Toast";
import { Controls } from "./components/ui/Controls";
import { useToast } from "./hooks/useToast";
import { useGestureHandling } from "./hooks/useGestureHandling";
import { useAudioControls } from "./hooks/useAudioControls";
import { useVisualControls } from "./hooks/useVisualControls";
import { useCameraControls } from "./hooks/useCameraControls";
import { useParticleControls } from "./hooks/useParticleControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { randomizePhysics } from "./utils/randomizers";

function App() {
  const [isLevaHidden, setIsLevaHidden] = useState(() => {
    const stored = localStorage.getItem("levaHidden");
    return stored === null ? true : stored === "true";
  });
  const [isUIHidden, setIsUIHidden] = useState(false);

  const { toasts, showToast, hideToast } = useToast();
  const visualControls = useVisualControls();
  const { cameraControls, updateCameraControls, handleRandomizeCamera } =
    useCameraControls();
  const {
    particleControls,
    updateParticleControls,
    handleRandomizeShape,
    setShape,
  } = useParticleControls();

  const handleBeat = () => {
    // Each effect has independent chance to be applied
    if (Math.random() < 0.3) {
      randomizePhysics(updateParticleControls);
    }
    if (Math.random() < 0.4) {
      handleRandomizeCamera();
    }
    if (Math.random() < 0.3) {
      handleRandomizeShape();
    }
  };

  const { audioControls, setAudioControls, analyserRef, dataArrayRef } =
    useAudioControls({
      onBeat: handleBeat,
    });

  useGestureHandling({
    onRandomizePhysics: () => {
      randomizePhysics(updateParticleControls);
      showToast("Randomized Physics");
    },
    onRandomizeCamera: () => {
      handleRandomizeCamera();
      showToast("Randomized Camera");
    },
    onRandomizeShape: () => {
      const shape = handleRandomizeShape();
      if (shape) showToast(`Shape: ${shape}`);
    },
  });

  useKeyboardShortcuts({
    setIsUIHidden,
    setShape,
    setAudioControls,
    audioControls,
    updateParticleControls,
    particleControls,
    updateCameraControls,
    handleRandomizeShape,
    showToast,
  });

  const handleLevaToggle = () => {
    const newState = !isLevaHidden;
    setIsLevaHidden(newState);
    localStorage.setItem("levaHidden", String(newState));
  };

  return (
    <main className="w-screen h-[100dvh] bg-black select-none">
      {!isUIHidden &&
        toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            index={index}
            message={toast.message}
            onHide={() => hideToast(toast.id)}
          />
        ))}
      <Scene
        {...visualControls}
        audioEnabled={audioControls.enabled}
        audioGain={audioControls.gain}
        audioReactivity={audioControls.reactivity}
        audioSmoothing={audioControls.smoothing}
        audioMinDecibels={audioControls.minDecibels}
        audioMaxDecibels={audioControls.maxDecibels}
        cameraControls={cameraControls}
        particleControls={particleControls}
        onAudioError={() => setAudioControls({ enabled: false })}
        onAnalyserInit={(analyser, dataArray) => {
          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
        }}
      />
      <div
        className={`transition-opacity duration-200 ${
          isUIHidden ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Controls
          audioEnabled={audioControls.enabled}
          autoPlay={audioControls.autoPlay}
          isLevaHidden={isLevaHidden}
          onAudioToggle={() => {
            setAudioControls({ enabled: !audioControls.enabled });
            showToast(`Audio ${!audioControls.enabled ? "on" : "off"}`);
          }}
          onAutoPlayToggle={() => {
            setAudioControls({ autoPlay: !audioControls.autoPlay });
          }}
          onLevaToggle={handleLevaToggle}
          showToast={showToast}
        />
      </div>
    </main>
  );
}

export default App;
