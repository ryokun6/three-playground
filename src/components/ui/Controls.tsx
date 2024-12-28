import React from "react";
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
  PiTextAlignCenterBold,
  PiTextAlignJustifyBold,
  PiMicrophoneStageBold,
  PiCaretRightBold,
  PiPlayFill,
  PiPauseFill,
} from "react-icons/pi";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { MobileGestures } from "./MobileGestures";
import { Leva } from "leva";
import { SpotifyControls } from "../../hooks/useSpotifyPlayer";
import { ChineseVariant, KoreanDisplay } from "../../types/scene";

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
  onChineseVariantToggle,
  onKoreanDisplayToggle,
  chineseVariant,
  koreanDisplay,
  ktvMode,
  onKtvToggle,
}: ControlsProps) => {
  const [showSpotifyControls, setShowSpotifyControls] = React.useState(false);

  return (
    <>
      {/* Spotify Controls - Bottom Left */}
      <div className="controls-wrapper">
        {(spotifyControls?.isConnected || onSpotifyLogin) && (
          <div
            className="fixed bottom-4 left-4 flex gap-2 md:flex-row flex-col"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {spotifyControls?.isConnected ? (
              <div
                className={`flex gap-2 transition-opacity duration-300 ${
                  spotifyControls.showTrackNotification
                    ? "opacity-0"
                    : "opacity-100"
                }`}
              >
                <div
                  className="group relative"
                  onMouseEnter={() => setShowSpotifyControls(true)}
                  onMouseLeave={() => setShowSpotifyControls(false)}
                >
                  <div
                    className="text-white/60 p-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSpotifyControls(!showSpotifyControls);
                    }}
                  >
                    {spotifyControls.currentTrack?.album?.images?.[0]?.url ? (
                      <div className="relative w-6 h-6">
                        <img
                          src={spotifyControls.currentTrack.album.images[0].url}
                          alt="Album artwork"
                          className={`absolute w-6 h-6 object-cover rounded cursor-pointer transition-all duration-300 ${
                            !spotifyControls.isPlaying
                              ? "opacity-0 scale-75"
                              : "opacity-100 scale-100 hover:opacity-0"
                          }`}
                        />
                        <div
                          className={`absolute w-6 h-6 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-100 ${
                            !spotifyControls.isPlaying
                              ? "opacity-100 scale-100 bg-white/80 md:bg-white/40 md:hover:bg-white/80 rounded-full"
                              : "opacity-0 scale-75 bg-black/20 rounded"
                          }`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            spotifyControls.togglePlay();
                          }}
                        >
                          {spotifyControls.isPlaying ? (
                            <PiPauseFill className="w-3 h-3 text-white" />
                          ) : (
                            <PiPlayFill className="w-3 h-3 text-black" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <PiSpotifyLogoBold className="w-5 h-5 text-white/30" />
                    )}
                    <span className="text-sm truncate max-w-[220px] flex items-center gap-1">
                      <span
                        className={`${
                          spotifyControls.isPlaying &&
                          spotifyControls.currentTrack?.name
                            ? "text-white/80"
                            : "text-white/30"
                        } truncate max-w-[200px] transition-colors`}
                      >
                        {spotifyControls.currentTrack?.name ??
                          "Play on Particle Simulator"}
                        {spotifyControls.currentTrack?.artists?.[0]?.name && (
                          <span
                            className={`${
                              spotifyControls.isPlaying
                                ? "text-white/50"
                                : "text-white/20"
                            } pl-1 transition-colors`}
                          >
                            {spotifyControls.currentTrack.artists[0].name}
                          </span>
                        )}
                      </span>
                      {spotifyControls.currentTrack && (
                        <PiCaretRightBold
                          className={`w-3 h-3 text-white/20 transition-transform md:opacity-0 ${
                            showSpotifyControls ? "rotate-90" : ""
                          }`}
                        />
                      )}
                    </span>
                  </div>

                  <div
                    className={`absolute left-0 bottom-full transition-all ${
                      showSpotifyControls
                        ? "opacity-100"
                        : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <div className="flex gap-0.5 p-1 bg-black/40 mb-2 rounded-xl shadow-lg h-11 items-center">
                      <button
                        onClick={spotifyControls.previousTrack}
                        className="bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9"
                        title="Previous track"
                      >
                        <PiSkipBackBold className="w-5 h-5" />
                      </button>
                      <button
                        onClick={spotifyControls.togglePlay}
                        className="bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9"
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
                        className="bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9"
                        title="Next track"
                      >
                        <PiSkipForwardBold className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          onLyricsToggle();
                          showToast(
                            `Lyrics ${!showLyrics ? "shown" : "hidden"}`
                          );
                        }}
                        className="bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9"
                        title={showLyrics ? "Hide lyrics" : "Show lyrics"}
                      >
                        <PiMicrophoneStageBold className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const next = onChineseVariantToggle();
                          showToast(`Chinese: ${next}`);
                        }}
                        className={`bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9 inline-flex items-center justify-center text-md font-bold ${
                          !showLyrics ? "opacity-50 pointer-events-none" : ""
                        }`}
                        title={`Toggle Chinese variant`}
                      >
                        <span>
                          {chineseVariant === ChineseVariant.Original
                            ? "简"
                            : "繁"}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          const next = onKoreanDisplayToggle();
                          showToast(`Korean: ${next}`);
                        }}
                        className={`bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9 inline-flex items-center justify-center text-md font-bold${
                          !showLyrics ? "opacity-50 pointer-events-none" : ""
                        }`}
                        title={`Toggle Korean romanization`}
                      >
                        <span>
                          {koreanDisplay === KoreanDisplay.Original
                            ? "한"
                            : "EN"}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          onKtvToggle();
                          showToast(`KTV mode ${!ktvMode ? "on" : "off"}`);
                        }}
                        className={`bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9 ${
                          !showLyrics ? "opacity-50 pointer-events-none" : ""
                        }`}
                        title={`Turn ${ktvMode ? "off" : "on"} KTV mode`}
                      >
                        {ktvMode ? (
                          <PiTextAlignJustifyBold className="w-5 h-5" />
                        ) : (
                          <PiTextAlignCenterBold className="w-5 h-5" />
                        )}
                      </button>
                      {onSpotifyLogout && (
                        <button
                          onClick={() => {
                            onSpotifyLogout();
                            if (spotifyControls.error) {
                              showToast(spotifyControls.error);
                            }
                          }}
                          className="bg-transparent hover:bg-white/5 text-white/40 p-2 rounded-lg transition-colors w-9 h-9"
                          title="Disconnect Spotify"
                        >
                          <PiSignOutBold className="w-5 h-5" />
                        </button>
                      )}
                    </div>
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
          className="fixed bottom-4 right-4 flex gap-2 md:flex-row flex-col"
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
            <PiDiceFiveBold
              className={`w-5 h-5 transition-transform duration-[4000ms] ${
                autoPlay ? "animate-[spin_4s_linear_infinite]" : ""
              }`}
            />
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
