import { Scene } from "./components/Scene";
import { useState, useEffect } from "react";
import { Toast } from "./components/ui/Toast";
import { Controls } from "./components/ui/Controls";
import { LyricsDisplay } from "./components/LyricsDisplay";
import { YouTubeVideo } from "./components/YouTubeVideo";
import { motion, AnimatePresence } from "motion/react";
import { useToast } from "./hooks/useToast";
import { useGestureHandling } from "./hooks/useGestureHandling";
import { useAudioControls } from "./hooks/useAudioControls";
import { useVisualControls } from "./hooks/useVisualControls";
import { useCameraControls } from "./hooks/useCameraControls";
import { useParticleControls } from "./hooks/useParticleControls";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSpotifyPlayer } from "./hooks/useSpotifyPlayer";
import { useSpotifyAuth } from "./hooks/useSpotifyAuth";
import { useLyricsControls } from "./hooks/useLyricsControls";
import { randomizePhysics } from "./utils/randomizers";

function App() {
  const [isLevaHidden, setIsLevaHidden] = useState(() => {
    const stored = localStorage.getItem("levaHidden");
    return stored === null ? true : stored === "true";
  });
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [isUIDimmed, setIsUIDimmed] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

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

  const { toasts, showToast, hideToast } = useToast();

  const visualControls = useVisualControls();
  const { cameraControls, updateCameraControls, handleRandomizeCamera } =
    useCameraControls();

  const {
    lyricsControls,
    toggleChineseVariant,
    toggleKoreanDisplay,
    toggleKtvMode,
  } = useLyricsControls();

  const { audioControls, setAudioControls, analyserRef, dataArrayRef } =
    useAudioControls({
      onBeat: handleBeat,
    });

  const {
    particleControls,
    updateParticleControls,
    handleRandomizeShape,
    setShape,
  } = useParticleControls();

  const { token, login, logout } = useSpotifyAuth();
  const spotifyControls = useSpotifyPlayer(token, showToast);

  useGestureHandling({
    onRandomizePhysics: () => {
      randomizePhysics(updateParticleControls);
    },
    onRandomizeCamera: () => {
      handleRandomizeCamera();
    },
    onRandomizeShape: () => {
      handleRandomizeShape();
    },
    onToggleUI: () => setIsUIHidden(!isUIHidden),
    isUIHidden,
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
      <div className="fixed inset-0 z-50">
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
          showVideo={showVideo}
          onVideoToggle={() => setShowVideo(!showVideo)}
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
          onChineseVariantToggle={toggleChineseVariant}
          onKoreanDisplayToggle={toggleKoreanDisplay}
          chineseVariant={lyricsControls.chineseVariant}
          koreanDisplay={lyricsControls.koreanDisplay}
          ktvMode={lyricsControls.ktvMode}
          onKtvToggle={toggleKtvMode}
          isUIHidden={isUIHidden}
        />
      </div>

      <AnimatePresence>
        {spotifyControls?.showTrackNotification &&
          spotifyControls?.currentTrack && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 16, y: -16 }}
              animate={{ opacity: 1, scale: 1, x: 16, y: -16 }}
              exit={{
                opacity: 0,
                scale: 0.3,
                x: 0,
                y: 0,
                transition: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              className="fixed bottom-2 left-2 origin-bottom-left z-50"
            >
              <div className="bg-black/20 backdrop-blur-md p-3 w-full min-w-[280px] max-w-[320px] rounded-xl shadow-lg flex items-center gap-4">
                {spotifyControls.currentTrack.album?.images?.[0]?.url && (
                  <div className="flex w-16 h-16 shrink-0">
                    <img
                      src={spotifyControls.currentTrack.album.images[0].url}
                      alt="Album artwork"
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>
                )}
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-white font-medium text-lg truncate w-full">
                    {spotifyControls.currentTrack.name}
                  </span>
                  <span className="text-white/60 truncate w-full">
                    {spotifyControls.currentTrack.artists[0].name}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {!isUIHidden &&
        toasts.map((toast, index) => (
          <Toast
            key={toast.id}
            index={index}
            message={toast.message}
            onHide={() => hideToast(toast.id)}
          />
        ))}
      {!showVideo && (
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
      )}
      {showVideo && spotifyControls?.currentTrack && (
        <YouTubeVideo controls={spotifyControls} />
      )}
      {spotifyControls?.currentTrack && showLyrics && (
        <LyricsDisplay
          controls={spotifyControls}
          font={lyricsControls.font}
          alignment={lyricsControls.alignment}
          chineseVariant={lyricsControls.chineseVariant}
          koreanDisplay={lyricsControls.koreanDisplay}
          fontSize={lyricsControls.fontSize}
        />
      )}
    </main>
  );
}

export default App;
