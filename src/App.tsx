import { Leva, useControls, button, folder } from "leva";
import { Scene } from "./components/Scene";
import { useState, useEffect, useCallback } from "react";
import {
  PiKeyboardBold,
  PiSlidersBold,
  PiXBold,
  PiMicrophoneBold,
  PiMicrophoneSlashBold,
  PiHandTapBold,
} from "react-icons/pi";
import { Vector2 } from "three";

type EnvironmentPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse";

export interface SceneProps {
  environmentPreset: EnvironmentPreset;
  backgroundBlur: number;
  brightness: number;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomSmoothing: number;
  chromaticAberrationOffset: Vector2;
  pixelSize: number;
  audioEnabled: boolean;
  audioGain: number;
  audioReactivity: number;
  audioSmoothing: number;
  audioMinDecibels: number;
  audioMaxDecibels: number;
  cameraControls: {
    autoCameraEnabled: boolean;
    cameraSpeed: number;
    cameraRadius: number;
  };
  particleControls: {
    shape: string;
    shapeSize: number;
    orbitalSpeed: number;
    expandWithAudio: boolean;
    emissionRate: number;
    particleLifetime: number;
    gravity: number;
    initialSpeed: number;
    spread: number;
    rotationSpeed: number;
    spiralEffect: number;
    pulseStrength: number;
    swarmEffect: number;
    size: number;
    autoColor: boolean;
    startColor: string;
    endColor: string;
    colorSpeed: number;
    colorWaveLength: number;
    colorSaturation: number;
    colorBrightness: number;
  };
  onAudioError: () => void;
}

enum ParticleShape {
  Point = "point",
  Circle = "circle",
  Star = "star",
  Sphere = "sphere",
  Ring = "ring",
  Heart = "heart",
  Waveform = "waveform",
}

const ENVIRONMENT_PRESETS: Record<EnvironmentPreset, EnvironmentPreset> = {
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

// Toast component
const Toast = ({
  message,
  onHide,
  index = 0,
}: {
  message: string;
  onHide: () => void;
  index?: number;
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 800);

    const hideTimer = setTimeout(() => {
      onHide();
    }, 1000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [onHide]);

  return (
    <div
      style={{ bottom: `${96 + index * 48}px` }}
      className={`fixed left-1/2 -translate-x-1/2 bg-black/80 text-white/80 px-4 py-2 rounded-lg shadow-lg font-mono text-sm z-[9999] transition-all duration-300 ${
        isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      {message}
    </div>
  );
};

const KeyboardShortcuts = () => {
  const [isVisible, setIsVisible] = useState(() => {
    const dismissed = localStorage.getItem("keyboardShortcutsDismissed");
    return dismissed !== "true";
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  if (isMobile) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("keyboardShortcutsDismissed", "true");
  };

  const handleToggle = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem("keyboardShortcutsDismissed", String(!newState));
  };

  return (
    <>
      {isVisible ? (
        <div className="bg-black/80 text-white/40 px-4 py-2 rounded-lg shadow-lg font-mono text-xs">
          <div className="flex gap-4 items-center">
            <div>
              <span className="text-white">A</span> toggle audio
            </div>
            <div>
              <span className="text-white">S</span> switch camera
            </div>
            <div>
              <span className="text-white">Z</span> randomize physics
            </div>
            <div>
              <span className="text-white">X</span> randomize style
            </div>
            <div>
              <span className="text-white">C</span> next shape
            </div>
            <button
              onClick={handleDismiss}
              className="ml-2 text-white/40 hover:text-white transition-colors"
              title="Hide keyboard shortcuts"
            >
              <PiXBold className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleToggle}
          className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Show keyboard shortcuts"
        >
          <PiKeyboardBold className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

const MobileGestures = () => {
  const [isVisible, setIsVisible] = useState(() => {
    const dismissed = localStorage.getItem("mobileGesturesDismissed");
    return dismissed !== "true";
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  if (!isMobile) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("mobileGesturesDismissed", "true");
  };

  const handleToggle = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem("mobileGesturesDismissed", String(!newState));
  };

  return (
    <>
      {isVisible ? (
        <div className="bg-black/80 text-white/40 px-4 py-2 rounded-lg shadow-lg font-mono text-xs">
          <div className="flex flex-col gap-2">
            <div className="flex gap-4 items-center">
              <div>
                <span className="text-white">Tap</span> change zoom
              </div>
              <div>
                <span className="text-white">Hold</span> randomize physics
              </div>
              <div>
                <span className="text-white">Swipe</span> change shape
              </div>
              <button
                onClick={handleDismiss}
                className="ml-2 text-white/40 hover:text-white transition-colors"
                title="Hide gesture tips"
              >
                <PiXBold className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleToggle}
          className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Show gesture tips"
        >
          <PiHandTapBold className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

function App() {
  const [isLevaHidden, setIsLevaHidden] = useState(() => {
    const stored = localStorage.getItem("levaHidden");
    return stored === null ? true : stored === "true";
  });

  // Touch handling state
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>(
    []
  );

  const showToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1000);
  }, []);

  const [audioControls, setAudioControls] = useControls("Audio", () => ({
    enabled: {
      value: false,
      label: "audioEnabled",
    },
    reactivity: {
      value: 4.5,
      min: 0,
      max: 5,
      step: 0.1,
      label: "reactivity",
    },
    gain: {
      value: 1.0,
      min: 0,
      max: 5,
      step: 0.1,
      label: "gain",
    },
    advanced: folder(
      {
        smoothing: {
          value: 0.7,
          min: 0,
          max: 0.99,
          step: 0.01,
          label: "smoothing",
        },
        minDecibels: {
          value: -90,
          min: -100,
          max: 0,
          step: 1,
          label: "minVol",
        },
        maxDecibels: {
          value: -10,
          min: -100,
          max: 0,
          step: 1,
          label: "maxVol",
        },
      },
      { collapsed: true, render: (get) => get("Audio.enabled") }
    ),
  }));

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
      value: 2.5,
      min: 0.01,
      max: 7,
      step: 0.1,
      label: "zoom",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    randomizeCamera: button(() => {
      setCameraControls({ cameraRadius: Math.random() * 3 });
    }),
  }));

  const [particleControls, setParticleControls] = useControls(
    "Particle",
    () => ({
      shape: {
        value: ParticleShape.Waveform,
        options: Object.values(ParticleShape),
        label: "shape",
      },
      shapeSize: {
        value: 3.8,
        min: 0.1,
        max: 5,
        step: 0.1,
        label: "shapeSize",
      },
      size: {
        value: 0.1,
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
        const randomInRange = (min: number, max: number) =>
          Math.random() * (max - min) + min;

        setParticleControls({
          shapeSize: randomInRange(0.1, 5),
          emissionRate: randomInRange(1, 200),
          particleLifetime: randomInRange(0.1, 5),
          gravity: randomInRange(-20, 0),
          initialSpeed: randomInRange(0, 20),
          spread: randomInRange(0, 2),
          rotationSpeed: randomInRange(0, 2),
          spiralEffect: randomInRange(0, 1),
          pulseStrength: randomInRange(0, 2),
          swarmEffect: randomInRange(0, 1),
        });
      }),
      randomizeStyle: button(() => {
        const randomColor = () => {
          const r = Math.floor(Math.random() * 256);
          const g = Math.floor(Math.random() * 256);
          const b = Math.floor(Math.random() * 256);
          return `#${r.toString(16).padStart(2, "0")}${g
            .toString(16)
            .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        };

        if (particleControls.autoColor) {
          setParticleControls({
            size: Math.random() * 0.39 + 0.01,
            colorSpeed: Math.random() * 4.9 + 0.1,
            colorWaveLength: Math.random() * 9.9 + 0.1,
            colorSaturation: Math.random(),
            colorBrightness: Math.random(),
          });
        } else {
          setParticleControls({
            size: Math.random() * 0.39 + 0.01,
            startColor: randomColor(),
            endColor: randomColor(),
          });
        }
      }),
      physics: folder(
        {
          emissionRate: {
            value: 200,
            min: 1,
            max: 200,
            label: "emissionRate",
          },
          particleLifetime: {
            value: 2.0,
            min: 0.1,
            max: 5,
            label: "lifetime",
          },
          gravity: {
            value: -9.8,
            min: -20,
            max: 0,
            label: "gravity",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          initialSpeed: {
            value: 5.0,
            min: 0,
            max: 20,
            label: "speed",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          spread: {
            value: 0.5,
            min: 0,
            max: 2,
            label: "spread",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          rotationSpeed: {
            value: 0.5,
            min: 0,
            max: 2,
            label: "rotation",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          spiralEffect: {
            value: 0.46,
            min: 0,
            max: 1,
            label: "spiral",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          pulseStrength: {
            value: 1.48,
            min: 0,
            max: 2,
            label: "pulse",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          swarmEffect: {
            value: 0.61,
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
            value: 2.0,
            min: 0.1,
            max: 10.0,
            step: 0.1,
            label: "waveLength",
            render: (get) => get("Particle.autoColor"),
          },
          colorSaturation: {
            value: 0.8,
            min: 0,
            max: 1,
            step: 0.05,
            label: "saturation",
            render: (get) => get("Particle.autoColor"),
          },
          colorBrightness: {
            value: 0.6,
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
    "Visuals",
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
    },
    { collapsed: true }
  );

  const handleLevaToggle = () => {
    const newState = !isLevaHidden;
    setIsLevaHidden(newState);
    localStorage.setItem("levaHidden", String(newState));
  };

  // Add keyboard shortcut handler
  useEffect(() => {
    const randomColor = () => {
      const hue = Math.random() * 360;
      const saturation = Math.random() * 100;
      const lightness = Math.random() * 100;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      const keyboardHintsVisible =
        localStorage.getItem("keyboardShortcutsDismissed") !== "true";

      switch (event.key.toLowerCase()) {
        case "a":
          setAudioControls({ enabled: !audioControls.enabled });
          if (keyboardHintsVisible) {
            showToast(
              `Audio ${!audioControls.enabled ? "enabled" : "disabled"}`
            );
          }
          break;
        case "z":
          setParticleControls({
            shapeSize: Math.random() * 4.9 + 0.1,
            emissionRate: Math.random() * 199 + 1,
            particleLifetime: Math.random() * 4.9 + 0.1,
            gravity: Math.random() * -20,
            initialSpeed: Math.random() * 20,
            spread: Math.random() * 2,
            rotationSpeed: Math.random() * 2,
            spiralEffect: Math.random(),
            pulseStrength: Math.random() * 2,
            swarmEffect: Math.random(),
          });
          if (keyboardHintsVisible) {
            showToast("Randomized Physics");
          }
          break;
        case "x":
          if (particleControls.autoColor) {
            setParticleControls({
              size: Math.random() * 0.39 + 0.01,
              colorSpeed: Math.random() * 4.9 + 0.1,
              colorWaveLength: Math.random() * 9.9 + 0.1,
              colorSaturation: Math.random(),
              colorBrightness: Math.random(),
            });
          } else {
            setParticleControls({
              size: Math.random() * 0.39 + 0.01,
              startColor: randomColor(),
              endColor: randomColor(),
            });
          }
          if (keyboardHintsVisible) {
            showToast("Randomized Style");
          }
          break;
        case "c": {
          const shapeValues = Object.values(ParticleShape);
          const currentIndex = shapeValues.indexOf(particleControls.shape);
          const nextIndex = (currentIndex + 1) % shapeValues.length;
          const nextShape = shapeValues[nextIndex];
          setParticleControls({ shape: nextShape });
          if (keyboardHintsVisible) {
            showToast(`Shape: ${nextShape}`);
          }
          break;
        }
        case "s":
          setCameraControls({ cameraRadius: Math.random() * 3 });
          if (keyboardHintsVisible) {
            showToast("Camera switched");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    audioControls,
    setAudioControls,
    setCameraControls,
    particleControls,
    setParticleControls,
    showToast,
  ]);

  // Touch handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartTime(Date.now());
      setTouchStartX(e.touches[0].clientX);

      // Start hold timer
      const timer = window.setTimeout(() => {
        // Long press - randomize physics
        setParticleControls({
          shapeSize: Math.random() * 4.9 + 0.1,
          emissionRate: Math.random() * 199 + 1,
          particleLifetime: Math.random() * 4.9 + 0.1,
          gravity: Math.random() * -20,
          initialSpeed: Math.random() * 20,
          spread: Math.random() * 2,
          rotationSpeed: Math.random() * 2,
          spiralEffect: Math.random(),
          pulseStrength: Math.random() * 2,
          swarmEffect: Math.random(),
        });
        showToast("Randomized Physics");
      }, 500); // 500ms hold time

      setHoldTimer(timer);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear hold timer
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }

      const touchDuration = Date.now() - touchStartTime;
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;

      // Handle swipe (minimum 50px distance)
      if (Math.abs(swipeDistance) > 50) {
        const shapeValues = Object.values(ParticleShape);
        const currentIndex = shapeValues.indexOf(particleControls.shape);
        const nextIndex =
          swipeDistance > 0
            ? (currentIndex + 1) % shapeValues.length
            : (currentIndex - 1 + shapeValues.length) % shapeValues.length;
        const nextShape = shapeValues[nextIndex];
        setParticleControls({ shape: nextShape });
        showToast(`Shape: ${nextShape}`);
        return;
      }

      // Handle quick tap (under 200ms)
      if (touchDuration < 200) {
        // Quick tap - only randomize camera zoom
        const newRadius = Math.random() * 8;
        setCameraControls({ cameraRadius: newRadius });
      }
    };

    const handleTouchCancel = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [
    touchStartTime,
    touchStartX,
    holdTimer,
    setCameraControls,
    setParticleControls,
    particleControls,
    showToast,
  ]);

  return (
    <main className="w-screen h-screen bg-black select-none">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          index={index}
          message={toast.message}
          onHide={() =>
            setToasts((prev) => prev.filter((t) => t.id !== toast.id))
          }
        />
      ))}
      <Scene
        environmentPreset={environmentPreset as EnvironmentPreset}
        backgroundBlur={backgroundBlur}
        brightness={brightness}
        bloomIntensity={bloomIntensity}
        bloomThreshold={bloomThreshold}
        bloomSmoothing={bloomSmoothing}
        chromaticAberrationOffset={
          new Vector2(
            chromaticAberrationOffset / 1000,
            chromaticAberrationOffset / 1000
          )
        }
        pixelSize={pixelSize}
        audioEnabled={audioControls.enabled}
        audioGain={audioControls.gain}
        audioReactivity={audioControls.reactivity}
        audioSmoothing={audioControls.smoothing}
        audioMinDecibels={audioControls.minDecibels}
        audioMaxDecibels={audioControls.maxDecibels}
        cameraControls={cameraControls}
        particleControls={particleControls}
        onAudioError={() => setAudioControls({ enabled: false })}
      />
      <div className="fixed bottom-4 right-4 flex gap-2">
        <KeyboardShortcuts />
        <MobileGestures />
        <button
          onClick={() => setAudioControls({ enabled: !audioControls.enabled })}
          className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
          title={audioControls.enabled ? "Disable audio" : "Enable audio"}
        >
          {audioControls.enabled ? (
            <PiMicrophoneBold className="w-5 h-5" />
          ) : (
            <PiMicrophoneSlashBold className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={handleLevaToggle}
          className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Toggle settings"
        >
          <PiSlidersBold className="w-5 h-5" />
        </button>
        <div className="absolute bottom-12 right-4 w-72 max-w-[calc(100vw-24px)] max-h-[calc(100vh-100px)] overflow-y-auto">
          <Leva hidden={isLevaHidden} titleBar={false} fill={true} />
        </div>
      </div>
    </main>
  );
}

export default App;
