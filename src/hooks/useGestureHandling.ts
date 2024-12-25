import { useState, useEffect } from "react";

interface GestureHandlingProps {
  onRandomizePhysics: () => void;
  onRandomizeCamera: () => void;
  onRandomizeShape: () => void;
}

export const useGestureHandling = ({
  onRandomizePhysics,
  onRandomizeCamera,
  onRandomizeShape,
}: GestureHandlingProps) => {
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [isActiveGesture, setIsActiveGesture] = useState(false);

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

      setTouchStartTime(Date.now());
      setTouchStartX(e.touches[0].clientX);

      // Start hold timer
      const timer = window.setTimeout(() => {
        // Long press - randomize physics
        if (isActiveGesture) {
          onRandomizePhysics();
        }
      }, 500); // 500ms hold time

      setHoldTimer(timer);
    };

    const handleTouchMove = () => {
      if (!isActiveGesture) return;
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

      const touchDuration = Date.now() - touchStartTime;
      const touchEndX = e.changedTouches[0].clientX;
      const swipeDistance = touchEndX - touchStartX;

      // Handle swipe (minimum 50px distance)
      if (Math.abs(swipeDistance) > 50) {
        onRandomizeShape();
      }
      // Handle quick tap (under 200ms)
      else if (touchDuration < 200) {
        onRandomizeCamera();
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
    holdTimer,
    onRandomizeCamera,
    onRandomizePhysics,
    onRandomizeShape,
    isActiveGesture,
  ]);

  return {
    isActiveGesture,
  };
};
