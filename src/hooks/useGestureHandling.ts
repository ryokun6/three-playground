import { useState, useEffect, useCallback } from "react";

interface GestureHandlingProps {
  onRandomizePhysics: () => void;
  onRandomizeCamera: () => void;
  onRandomizeShape: () => void;
  onToggleUI: () => void;
  isUIHidden: boolean;
}

export const useGestureHandling = ({
  onRandomizePhysics,
  onRandomizeCamera,
  onRandomizeShape,
  onToggleUI,
  isUIHidden,
}: GestureHandlingProps) => {
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [isActiveGesture, setIsActiveGesture] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);

  const startHoldTimer = useCallback(() => {
    const timer = window.setTimeout(() => {
      if (isActiveGesture) {
        onRandomizePhysics();
      }
    }, 500);
    setHoldTimer(timer);
  }, [isActiveGesture, onRandomizePhysics]);

  useEffect(() => {
    let initialTouchTarget: EventTarget | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      initialTouchTarget = e.target;
      const target = e.target as HTMLElement;

      // Only prevent gestures on obvious UI elements
      if (target.tagName === "BUTTON" || target.closest("[role='button']")) {
        return;
      }

      setIsActiveGesture(true);
      setTouchStartTime(Date.now());
      setTouchStartX(e.touches[0].clientX);
      startHoldTimer();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActiveGesture) return;
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = initialTouchTarget as HTMLElement;
      if (target?.tagName === "BUTTON" || target?.closest("[role='button']")) {
        initialTouchTarget = null;
        return;
      }

      if (!isActiveGesture) {
        initialTouchTarget = null;
        return;
      }

      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }

      const touchDuration = Date.now() - touchStartTime;
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;
      const now = Date.now();

      if (Math.abs(swipeDistance) > 50) {
        onRandomizeShape();
      } else if (touchDuration < 200) {
        if (now - lastTapTime < 300) {
          onToggleUI();
          setLastTapTime(0); // Reset to prevent triple tap
        } else {
          onRandomizeCamera();
          setLastTapTime(now);
        }
      }

      setIsActiveGesture(false);
      initialTouchTarget = null;
    };

    const handleTouchCancel = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        setHoldTimer(null);
      }
      setIsActiveGesture(false);
      initialTouchTarget = null;
    };

    // Add listeners to document instead of canvas
    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [
    touchStartTime,
    touchStartX,
    holdTimer,
    onRandomizeCamera,
    onRandomizePhysics,
    onRandomizeShape,
    isActiveGesture,
    startHoldTimer,
    lastTapTime,
    onToggleUI,
    isUIHidden,
  ]);

  return {
    isActiveGesture,
  };
};
