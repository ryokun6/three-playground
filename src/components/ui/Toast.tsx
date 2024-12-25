import { useState, useEffect } from "react";

interface ToastProps {
  message: string;
  onHide: () => void;
  index?: number;
}

export const Toast = ({ message, onHide, index = 0 }: ToastProps) => {
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
      style={{ bottom: `${64 + index * 48}px` }}
      className={`fixed left-1/2 -translate-x-1/2 bg-black/80 text-white/80 px-4 py-2 rounded-lg shadow-lg font-mono text-sm z-[9999] transition-all duration-300 ${
        isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
    >
      {message}
    </div>
  );
};
