import { useState, useEffect } from "react";
import { PiHandTapBold, PiXBold } from "react-icons/pi";

export const MobileGestures = () => {
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

  const handleToggle = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem("mobileGesturesDismissed", String(!newState));
  };

  return (
    <div className="relative">
      {isVisible && (
        <div
          onClick={handleToggle}
          className="absolute right-12 ml-4 bg-black/80 text-white/40 px-4 py-2 rounded-lg shadow-lg font-mono text-xs whitespace-nowrap cursor-pointer hover:bg-black hover:text-white/60 transition-colors"
        >
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-white">Tap</span> change camera
            </div>
            <div>
              <span className="text-white">Hold</span> randomize physics
            </div>
            <div>
              <span className="text-white">Swipe</span> change shape
            </div>
            <div>
              <span className="text-white">Double tap</span> toggle UI
            </div>
          </div>
        </div>
      )}
      <button
        onClick={handleToggle}
        className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
        title="Show gesture tips"
      >
        {isVisible ? (
          <PiXBold className="w-5 h-5" />
        ) : (
          <PiHandTapBold className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};
