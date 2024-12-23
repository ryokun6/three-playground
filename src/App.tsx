import { Leva } from "leva";
import { Scene } from "./components/Scene";
import { useState, useEffect } from "react";
import { PiKeyboardBold, PiSlidersBold, PiXBold } from "react-icons/pi";

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
        <div className="bg-black/80 text-white/60 px-4 py-2 rounded-lg shadow-lg font-mono text-xs">
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

function App() {
  const [isLevaHidden, setIsLevaHidden] = useState(() => {
    const stored = localStorage.getItem("levaHidden");
    return stored === null ? true : stored === "true";
  });

  const handleLevaToggle = () => {
    const newState = !isLevaHidden;
    setIsLevaHidden(newState);
    localStorage.setItem("levaHidden", String(newState));
  };

  return (
    <main className="w-screen h-screen bg-black">
      <Scene />
      <div className="fixed bottom-4 right-4 flex gap-2">
        <KeyboardShortcuts />
        <button
          onClick={handleLevaToggle}
          className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Toggle settings"
        >
          <PiSlidersBold className="w-5 h-5" />
        </button>
        <div className="absolute bottom-12 right-4 w-96 max-h-[calc(100vh-100px)] overflow-y-auto">
          <Leva hidden={isLevaHidden} titleBar={false} fill={true} />
        </div>
      </div>
    </main>
  );
}

export default App;
