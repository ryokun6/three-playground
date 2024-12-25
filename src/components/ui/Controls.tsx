import {
  PiMicrophoneBold,
  PiMicrophoneSlashBold,
  PiPlayBold,
  PiPauseBold,
  PiSlidersBold,
} from "react-icons/pi";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { MobileGestures } from "./MobileGestures";
import { Leva } from "leva";

interface ControlsProps {
  audioEnabled: boolean;
  autoPlay: boolean;
  isLevaHidden: boolean;
  onAudioToggle: () => void;
  onAutoPlayToggle: () => void;
  onLevaToggle: () => void;
  showToast: (message: string) => void;
}

export const Controls = ({
  audioEnabled,
  autoPlay,
  isLevaHidden,
  onAudioToggle,
  onAutoPlayToggle,
  onLevaToggle,
  showToast,
}: ControlsProps) => {
  return (
    <div
      className="fixed bottom-4 right-4 flex gap-2"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <KeyboardShortcuts />
      <MobileGestures />
      <button
        onClick={onAudioToggle}
        className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
        title={audioEnabled ? "Turn off audio" : "Turn on audio"}
      >
        {audioEnabled ? (
          <PiMicrophoneBold className="w-5 h-5" />
        ) : (
          <PiMicrophoneSlashBold className="w-5 h-5" />
        )}
      </button>
      <button
        onClick={() => {
          onAutoPlayToggle();
          showToast(`Auto-play ${!autoPlay ? "on" : "off"}`);
        }}
        className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
        title={autoPlay ? "Turn off auto-play" : "Turn on auto-play"}
      >
        {autoPlay ? (
          <PiPauseBold className="w-5 h-5" />
        ) : (
          <PiPlayBold className="w-5 h-5" />
        )}
      </button>
      <button
        onClick={onLevaToggle}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
        title="Settings"
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
  );
};
