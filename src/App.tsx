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
              <span className="text-white">S</span> next shape
            </div>

            <div>
              <span className="text-white">Z</span> randomize physics
            </div>
            <div>
              <span className="text-white">X</span> randomize style
            </div>
            <div>
              <span className="text-white">C</span> switch camera
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
          value: 0.9,
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
    cameraTilt: {
      value: 0.3,
      min: 0,
      max: 1,
      step: 0.1,
      label: "tilt",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    verticalMovement: {
      value: 0.5,
      min: 0,
      max: 2,
      step: 0.1,
      label: "verticalMove",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    speedVariation: {
      value: 0.3,
      min: 0,
      max: 1,
      step: 0.1,
      label: "speedVar",
      render: (get) => get("Camera.autoCameraEnabled"),
    },
    randomizeCamera: button(() => {
      randomizeCamera();
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
        randomizePhysics();
      }),
      randomizeStyle: button(() => {
        randomizeStyle();
      }),
      physics: folder(
        {
          emissionRate: {
            value: 350,
            min: 1,
            max: 500,
            label: "emissionRate",
          },
          particleLifetime: {
            value: 2,
            min: 0.1,
            max: 3,
            label: "lifetime",
          },
          gravity: {
            value: -4.8,
            min: -9.8,
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
            value: 0.2,
            min: 0,
            max: 1,
            label: "spiral",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          pulseStrength: {
            value: 0.4,
            min: 0,
            max: 2,
            label: "pulse",
            render: (get) => get("Particle.shape") !== "waveform",
          },
          swarmEffect: {
            value: 0.2,
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
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.05,
            label: "saturation",
            render: (get) => get("Particle.autoColor"),
          },
          colorBrightness: {
            value: 0.45,
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

  // Extracted random functions
  const randomizePhysics = useCallback(() => {
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    setParticleControls({
      shapeSize: randomInRange(1, 3),
      emissionRate: randomInRange(300, 500),
      particleLifetime: randomInRange(0.4, 1.5),
      gravity: randomInRange(-20, 0),
      initialSpeed: randomInRange(0, 20),
      spread: randomInRange(0, 2),
      rotationSpeed: randomInRange(0, 2),
      spiralEffect: randomInRange(0, 1),
      pulseStrength: randomInRange(0, 1),
      swarmEffect: randomInRange(0, 1),
    });
    showToast("Randomized Physics");
  }, [setParticleControls, showToast]);

  const randomizeStyle = useCallback(() => {
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
        colorWaveLength: Math.random() * 0.9 + 0.1,
        colorSaturation: Math.random() * 0.5 + 0.25,
        colorBrightness: Math.random() * 0.7 + 0.25,
      });
    } else {
      setParticleControls({
        size: Math.random() * 0.39 + 0.01,
        startColor: randomColor(),
        endColor: randomColor(),
      });
    }
    showToast("Randomized Style");
  }, [particleControls.autoColor, setParticleControls, showToast]);

  const randomizeCamera = useCallback(() => {
    setCameraControls({
      cameraRadius: Math.random() * 5 + 0.1,
      cameraTilt: Math.random(),
      verticalMovement: Math.random() * 2,
      speedVariation: Math.random() * 1.9 + 0.1, // Speed between 0.1 and 2
    });
    showToast("Camera switched");
  }, [setCameraControls, showToast]);

  const toggleAudio = useCallback(() => {
    setAudioControls({ enabled: !audioControls.enabled });
    showToast(`Audio ${!audioControls.enabled ? "enabled" : "disabled"}`);
  }, [audioControls.enabled, setAudioControls, showToast]);

  // Add randomizeShape function
  const randomizeShape = useCallback(
    (direction: 1 | -1 = 1) => {
      const shapeValues = Object.values(ParticleShape);
      const currentIndex = shapeValues.indexOf(particleControls.shape);
      const nextIndex =
        (currentIndex + direction + shapeValues.length) % shapeValues.length;
      const nextShape = shapeValues[nextIndex];
      setParticleControls({ shape: nextShape });
      showToast(`Shape: ${nextShape}`);
    },
    [particleControls.shape, setParticleControls, showToast]
  );

  const setShape = useCallback(
    (index: number) => {
      const shapeValues = Object.values(ParticleShape);
      if (index >= 0 && index < shapeValues.length) {
        const shape = shapeValues[index];
        setParticleControls({ shape });
        showToast(`Shape: ${shape}`);
      }
    },
    [setParticleControls, showToast]
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
        value: 0.05,
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
    const handleKeyPress = (event: KeyboardEvent) => {
      // Handle number keys for direct shape selection
      const num = parseInt(event.key);
      if (
        !isNaN(num) &&
        num > 0 &&
        num <= Object.values(ParticleShape).length
      ) {
        setShape(num - 1);
        return;
      }

      switch (event.key.toLowerCase()) {
        case "a":
          toggleAudio();
          break;
        case "z":
          randomizePhysics();
          break;
        case "x":
          randomizeStyle();
          break;
        case "s": {
          randomizeShape();
          break;
        }
        case "c":
          randomizeCamera();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    audioControls,
    setAudioControls,
    randomizeCamera,
    randomizePhysics,
    randomizeStyle,
    particleControls,
    setParticleControls,
    showToast,
    randomizeShape,
    toggleAudio,
    setShape,
  ]);

  // Touch handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartTime(Date.now());
      setTouchStartX(e.touches[0].clientX);

      // Start hold timer
      const timer = window.setTimeout(() => {
        // Long press - randomize physics
        randomizePhysics();
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
        randomizeShape(swipeDistance > 0 ? 1 : -1);
        return;
      }

      // Handle quick tap (under 200ms)
      if (touchDuration < 200) {
        // Quick tap - only randomize camera zoom
        randomizeCamera();
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
    randomizeCamera,
    randomizePhysics,
    particleControls,
    setParticleControls,
    showToast,
    randomizeShape,
  ]);

  const [touchStartDistance, setTouchStartDistance] = useState<number | null>(
    null
  );
  const [initialCameraRadius, setInitialCameraRadius] = useState<number | null>(
    null
  );
  const [isActiveGesture, setIsActiveGesture] = useState(false);
  const [isPinchGesture, setIsPinchGesture] = useState(false);

  // Add mousewheel handler
  useEffect(() => {
    let initialTouchTarget: EventTarget | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      // Store the initial touch target
      initialTouchTarget = e.target;

      // Check if the touch event originated from UI elements
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("[class^='leva-']") ||
        target.closest(".fixed")
      ) {
        return;
      }

      // If we got here, we're interacting with the scene
      setIsActiveGesture(true);

      if (e.touches.length === 2) {
        setIsPinchGesture(true);
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        setTouchStartDistance(distance);
        setInitialCameraRadius(cameraControls.cameraRadius);
      } else {
        setIsPinchGesture(false);
        setTouchStartTime(Date.now());
        setTouchStartX(e.touches[0].clientX);

        // Start hold timer
        const timer = window.setTimeout(() => {
          // Long press - randomize physics
          if (isActiveGesture && !isPinchGesture) {
            randomizePhysics();
          }
        }, 500); // 500ms hold time

        setHoldTimer(timer);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActiveGesture) return;

      // Handle pinch gesture
      if (
        isPinchGesture &&
        e.touches.length === 2 &&
        touchStartDistance !== null &&
        initialCameraRadius !== null
      ) {
        e.preventDefault(); // Prevent default to avoid page zooming

        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const scale = currentDistance / touchStartDistance;
        const sensitivity = 2.0; // Adjust this value to control pinch sensitivity
        const scaledRadius = initialCameraRadius * Math.pow(scale, sensitivity);
        const newRadius = Math.max(0.3, Math.min(7, scaledRadius));

        setCameraControls({ cameraRadius: newRadius });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Check if this touch end is for a UI element touch that started on a UI element
      const target = initialTouchTarget as HTMLElement;
      if (
        target?.closest("button") ||
        target?.closest("[class^='leva-']") ||
        target?.closest(".fixed")
      ) {
        initialTouchTarget = null;
        return;
      }

      if (!isActiveGesture) {
        initialTouchTarget = null;
        return;
      }

      // Clear hold timer
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }

      // Reset pinch state if all touches are gone
      if (e.touches.length === 0) {
        setTouchStartDistance(null);
        setInitialCameraRadius(null);
        setIsPinchGesture(false);

        // Only handle swipe/tap if it wasn't a pinch gesture
        if (!isPinchGesture && touchStartTime && touchStartX) {
          const touchDuration = Date.now() - touchStartTime;
          const touchEndX = e.changedTouches[0].clientX;
          const swipeDistance = touchEndX - touchStartX;

          // Handle swipe (minimum 50px distance)
          if (Math.abs(swipeDistance) > 50) {
            randomizeShape(swipeDistance > 0 ? 1 : -1);
          }
          // Handle quick tap (under 200ms)
          else if (touchDuration < 200) {
            randomizeCamera();
          }
        }

        setIsActiveGesture(false);
      }
      // If there's still one touch remaining after a pinch
      else if (e.touches.length === 1 && isPinchGesture) {
        setTouchStartTime(Date.now());
        setTouchStartX(e.touches[0].clientX);
        setIsPinchGesture(false);
      }

      initialTouchTarget = null;
    };

    const handleTouchCancel = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }
      setTouchStartDistance(null);
      setInitialCameraRadius(null);
      setIsActiveGesture(false);
      setIsPinchGesture(false);
      initialTouchTarget = null;
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [
    touchStartTime,
    touchStartX,
    touchStartDistance,
    initialCameraRadius,
    holdTimer,
    cameraControls.autoCameraEnabled,
    cameraControls.cameraRadius,
    randomizeCamera,
    randomizePhysics,
    particleControls,
    setParticleControls,
    showToast,
    randomizeShape,
    setCameraControls,
    isActiveGesture,
    isPinchGesture,
  ]);

  return (
    <main className="w-screen h-[100dvh] bg-black select-none">
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
      <div
        className="fixed bottom-4 right-4 flex gap-2"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <KeyboardShortcuts />
        <MobileGestures />
        <button
          onClick={toggleAudio}
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
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Toggle settings"
        >
          <PiSlidersBold className="w-5 h-5" />
        </button>
        <div
          className="leva-container absolute bottom-12 right-4 w-72 max-w-[calc(100vw-24px)] max-h-[calc(100vh-100px)] overflow-y-auto"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <Leva hidden={isLevaHidden} titleBar={false} fill={true} />
        </div>
      </div>
    </main>
  );
}

export default App;
