import { useState, useEffect } from "react";
import { PiKeyboardBold } from "react-icons/pi";

export const KeyboardShortcuts = () => {
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

  return (
    <div className="relative">
      {isVisible && (
        <div className="absolute whitespace-nowrap bottom-12 right-0 bg-black/80 text-white/40 px-4 py-2 rounded-lg shadow-lg font-mono text-xs">
          <div className="flex flex-col gap-1">
            <div>
              <span className="text-white">A</span> audio
            </div>
            <div>
              <span className="text-white">S</span> shape
            </div>
            <div>
              <span className="text-white">D</span> auto-play
            </div>
            <div>
              <span className="text-white">F</span> lyrics
            </div>
            <div>
              <span className="text-white">Z</span> physics
            </div>
            <div>
              <span className="text-white">X</span> style
            </div>
            <div>
              <span className="text-white">C</span> camera
            </div>
            <div>
              <span className="text-white">1-6</span> select shape
            </div>
            <div>
              <span className="text-white">ESC</span> toggle UI
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsVisible((v) => !v)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
        title="Show keyboard shortcuts"
      >
        <PiKeyboardBold className="w-5 h-5" />
      </button>
    </div>
  );
};
