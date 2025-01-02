import {
  PiMicrophoneBold,
  PiMicrophoneSlashBold,
  PiSlidersBold,
  PiDiceFiveBold,
  PiVideoBold,
  PiConfettiBold,
} from "react-icons/pi";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { MobileGestures } from "./MobileGestures";
import { Leva } from "leva";
import { SpotifyControls as SpotifyControlsType } from "../../hooks/useSpotifyPlayer";
import { ChineseVariant, KoreanDisplay } from "../../types/scene";
import { SpotifyControls } from "./SpotifyControls";

interface ControlsProps {
  audioEnabled: boolean;
  autoPlay: boolean;
  isLevaHidden: boolean;
  showLyrics: boolean;
  showVideo: boolean;
  onAudioToggle: () => void;
  onAutoPlayToggle: () => void;
  onLevaToggle: () => void;
  onLyricsToggle: () => void;
  onVideoToggle: () => void;
  showToast: (message: string) => void;
  spotifyControls?: SpotifyControlsType & {
    togglePlay: () => Promise<void>;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
    setShowTrackNotification: (show: boolean) => void;
  };
  onSpotifyLogin?: () => void;
  onSpotifyLogout?: () => void;
  onChineseVariantToggle: () => ChineseVariant;
  onKoreanDisplayToggle: () => KoreanDisplay;
  chineseVariant: ChineseVariant;
  koreanDisplay: KoreanDisplay;
  ktvMode: boolean;
  onKtvToggle: () => void;
  isUIHidden: boolean;
}

export const Controls = ({
  audioEnabled,
  autoPlay,
  isLevaHidden,
  showLyrics,
  showVideo,
  onAudioToggle,
  onAutoPlayToggle,
  onLevaToggle,
  onLyricsToggle,
  onVideoToggle,
  showToast,
  spotifyControls,
  onSpotifyLogin,
  onSpotifyLogout,
  onChineseVariantToggle,
  onKoreanDisplayToggle,
  chineseVariant,
  koreanDisplay,
  ktvMode,
  onKtvToggle,
  isUIHidden,
}: ControlsProps) => {
  return (
    <>
      {/* Spotify Controls - Bottom Left */}
      <div>
        {(spotifyControls?.isConnected || onSpotifyLogin) && (
          <SpotifyControls
            showLyrics={showLyrics}
            onLyricsToggle={onLyricsToggle}
            showToast={showToast}
            spotifyControls={spotifyControls}
            onSpotifyLogin={onSpotifyLogin}
            onSpotifyLogout={onSpotifyLogout}
            onChineseVariantToggle={onChineseVariantToggle}
            onKoreanDisplayToggle={onKoreanDisplayToggle}
            chineseVariant={chineseVariant}
            koreanDisplay={koreanDisplay}
            ktvMode={ktvMode}
            onKtvToggle={onKtvToggle}
          />
        )}

        {/* Other Controls - Bottom Right */}
        <div
          className={`fixed bottom-4 right-4 flex gap-2 md:flex-row flex-col transition-opacity duration-300 ease-in-out controls-wrapper ${
            isUIHidden ? "opacity-0 pointer-events-none" : ""
          }`}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
        >
          {!showVideo && (
            <>
              <KeyboardShortcuts />
              <MobileGestures />
              {audioEnabled && (
                <button
                  onClick={() => {
                    onAutoPlayToggle();
                    showToast(`Auto-play ${!autoPlay ? "on" : "off"}`);
                  }}
                  className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
                  title={autoPlay ? "Turn off auto-play" : "Turn on auto-play"}
                >
                  <PiDiceFiveBold
                    className={`w-5 h-5 transition-transform duration-[4000ms] ${
                      autoPlay ? "animate-[spin_4s_linear_infinite]" : ""
                    }`}
                  />
                </button>
              )}
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
            </>
          )}

          <button
            onClick={onVideoToggle}
            className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
            title={showVideo ? "Show particles" : "Show music video"}
          >
            {showVideo ? (
              <PiConfettiBold className="w-5 h-5" />
            ) : (
              <PiVideoBold className="w-5 h-5" />
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
            className="leva-container absolute md:bottom-12 md:right-4 bottom-4 right-12 w-72 max-w-[calc(100vw-24px)] max-h-[calc(100vh-100px)] overflow-y-auto z-50"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Leva hidden={isLevaHidden} titleBar={false} fill={true} />
          </div>
        </div>
      </div>
    </>
  );
};
