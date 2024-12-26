import { Scene } from "./components/Scene";
import { useState, useEffect } from "react";
import { Toast } from "./components/ui/Toast";
import { Controls } from "./components/ui/Controls";
import { LyricsDisplay } from "./components/LyricsDisplay";
import { useToast } from "./hooks/useToast";
import { useGestureHandling } from "./hooks/useGestureHandling";
import { useAudioControls } from "./hooks/useAudioControls";
import { useVisualControls } from "./hooks/useVisualControls";
import { useCameraControls } from "./hooks/useCameraControls";
import { useParticleControls } from "./hooks/useParticleControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSpotifyPlayer } from "./hooks/useSpotifyPlayer";
import { useSpotifyAuth } from "./hooks/useSpotifyAuth";
import { randomizePhysics } from "./utils/randomizers";

function App() {
  const [isLevaHidden, setIsLevaHidden] = useState(() => {
    const stored = localStorage.getItem("levaHidden");
    return stored === null ? true : stored === "true";
  });
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [isUIDimmed, setIsUIDimmed] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      setIsUIDimmed(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsUIDimmed(true), 3000);
    };

    const events = ["mousemove", "keydown", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, []);

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

  const { token, login, logout } = useSpotifyAuth();
  const spotifyControls = useSpotifyPlayer(token, showToast);

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
    setShowLyrics,
    showLyrics,
  });

  const handleLevaToggle = () => {
    const newState = !isLevaHidden;
    setIsLevaHidden(newState);
    localStorage.setItem("levaHidden", String(newState));
  };

  return (
    <main className="w-screen h-[100dvh] bg-black select-none">
      <div
        className={`fixed inset-0 z-50 ${
          isUIHidden ? "opacity-0 pointer-events-none" : ""
        }`}
      >
        <style>{`
          @media (min-width: 768px) {
            .controls-wrapper {
              transition: opacity 1.2s ease;
              opacity: ${isUIDimmed ? "0" : "1"};
            }
          }
        `}</style>
        <Controls
          audioEnabled={audioControls.enabled}
          autoPlay={audioControls.autoPlay}
          isLevaHidden={isLevaHidden}
          showLyrics={showLyrics}
          onAudioToggle={() => {
            setAudioControls({ enabled: !audioControls.enabled });
            showToast(`Audio ${!audioControls.enabled ? "on" : "off"}`);
          }}
          onAutoPlayToggle={() => {
            setAudioControls({ autoPlay: !audioControls.autoPlay });
          }}
          onLevaToggle={handleLevaToggle}
          onLyricsToggle={() => setShowLyrics(!showLyrics)}
          showToast={showToast}
          spotifyControls={spotifyControls}
          onSpotifyLogin={() => {
            login();
            showToast("Connecting to Spotify...");
          }}
          onSpotifyLogout={() => {
            logout();
            showToast("Disconnected from Spotify");
          }}
        />
      </div>
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
      {!isUIHidden && spotifyControls?.currentTrack && showLyrics && (
        <LyricsDisplay controls={spotifyControls} />
      )}
    </main>
  );
}

export default App;
