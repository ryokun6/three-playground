import {
  PiMicrophoneBold,
  PiMicrophoneSlashBold,
  PiPlayBold,
  PiPauseBold,
  PiSlidersBold,
  PiSpotifyLogoBold,
  PiSkipBackBold,
  PiSkipForwardBold,
  PiSignOutBold,
  PiDiceFiveBold,
  PiTextTBold,
} from "react-icons/pi";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { MobileGestures } from "./MobileGestures";
import { Leva } from "leva";
import { SpotifyControls } from "../../hooks/useSpotifyPlayer";
import { LyricsDisplay } from "../LyricsDisplay";

interface ControlsProps {
  audioEnabled: boolean;
  autoPlay: boolean;
  isLevaHidden: boolean;
  showLyrics: boolean;
  onAudioToggle: () => void;
  onAutoPlayToggle: () => void;
  onLevaToggle: () => void;
  onLyricsToggle: () => void;
  showToast: (message: string) => void;
  spotifyControls?: SpotifyControls & {
    togglePlay: () => Promise<void>;
    nextTrack: () => Promise<void>;
    previousTrack: () => Promise<void>;
  };
  onSpotifyLogin?: () => void;
  onSpotifyLogout?: () => void;
}

export const Controls = ({
  audioEnabled,
  autoPlay,
  isLevaHidden,
  showLyrics,
  onAudioToggle,
  onAutoPlayToggle,
  onLevaToggle,
  onLyricsToggle,
  showToast,
  spotifyControls,
  onSpotifyLogin,
  onSpotifyLogout,
}: ControlsProps) => {
  return (
    <>
      {/* Spotify Controls - Bottom Left */}
      <div className="controls-wrapper">
        {(spotifyControls?.isConnected || onSpotifyLogin) && (
          <div
            className="fixed bottom-4 left-4 flex gap-2"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {spotifyControls?.isConnected ? (
              <div className="flex gap-2">
                <div className="group relative">
                  <div className="bg-black/40 text-white/60 p-2 rounded-lg shadow-lg flex items-center gap-2">
                    {spotifyControls.currentTrack?.album?.images?.[0]?.url ? (
                      <img
                        src={spotifyControls.currentTrack.album.images[0].url}
                        alt="Album artwork"
                        className="w-5 h-5 object-cover rounded"
                      />
                    ) : (
                      <PiSpotifyLogoBold className="w-5 h-5" />
                    )}
                    <span className="text-sm truncate max-w-[200px]">
                      {spotifyControls.currentTrack?.name ?? "Not playing"}{" "}
                      {spotifyControls.currentTrack?.artists?.[0]?.name
                        ? `- ${spotifyControls.currentTrack.artists[0].name}`
                        : ""}
                    </span>
                  </div>

                  <div className="absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      onClick={spotifyControls.previousTrack}
                      className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
                      title="Previous track"
                    >
                      <PiSkipBackBold className="w-5 h-5" />
                    </button>
                    <button
                      onClick={spotifyControls.togglePlay}
                      className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
                      title={spotifyControls.isPlaying ? "Pause" : "Play"}
                    >
                      {spotifyControls.isPlaying ? (
                        <PiPauseBold className="w-5 h-5" />
                      ) : (
                        <PiPlayBold className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={spotifyControls.nextTrack}
                      className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
                      title="Next track"
                    >
                      <PiSkipForwardBold className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        onLyricsToggle();
                        showToast(`Lyrics ${!showLyrics ? "shown" : "hidden"}`);
                      }}
                      className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
                      title={showLyrics ? "Hide lyrics" : "Show lyrics"}
                    >
                      <PiTextTBold
                        className={`w-5 h-5 ${showLyrics ? "text-white" : ""}`}
                      />
                    </button>
                    {onSpotifyLogout && (
                      <button
                        onClick={() => {
                          onSpotifyLogout();
                          if (spotifyControls.error) {
                            showToast(spotifyControls.error);
                          }
                        }}
                        className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors"
                        title="Disconnect Spotify"
                      >
                        <PiSignOutBold className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              onSpotifyLogin && (
                <button
                  onClick={() => {
                    onSpotifyLogin();
                    if (spotifyControls?.error) {
                      showToast(spotifyControls.error);
                    }
                  }}
                  className="bg-black/40 hover:bg-black text-white/40 hover:text-white p-2 rounded-lg shadow-lg transition-colors flex items-center gap-2"
                  title="Connect Spotify"
                >
                  <PiSpotifyLogoBold className="w-5 h-5" />
                </button>
              )
            )}
          </div>
        )}

        {/* Other Controls - Bottom Right */}
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
              <PiDiceFiveBold className="w-5 h-5" />
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
            className="leva-container absolute bottom-12 right-4 w-72 max-w-[calc(100vw-24px)] max-h-[calc(100vh-100px)] overflow-y-auto z-50"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <Leva hidden={isLevaHidden} titleBar={false} fill={true} />
          </div>
        </div>
      </div>

      {/* Lyrics Display - Outside of dimming wrapper */}
      {spotifyControls?.currentTrack && showLyrics && (
        <div className="mb-4">
          <LyricsDisplay controls={spotifyControls} />
        </div>
      )}
    </>
  );
};
