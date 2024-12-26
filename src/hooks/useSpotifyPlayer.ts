import { useEffect, useState, useRef, useCallback } from "react";
import { useSpotifyLyrics } from "./useSpotifyLyrics";

export interface SpotifyControls {
  isConnected: boolean;
  isPlaying: boolean;
  currentTrack: Spotify.Track | null;
  error: string | null;
  lyrics: {
    lines: { startTimeMs: string; words: string }[];
    currentLine: number;
    isLoading: boolean;
    error: string | null;
  };
  showTrackNotification: boolean;
}

declare global {
  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export const useSpotifyPlayer = (
  token: string | null,
  onError?: (message: string) => void
) => {
  const [controls, setControls] = useState<SpotifyControls>({
    isConnected: false,
    isPlaying: false,
    currentTrack: null,
    error: null,
    lyrics: { lines: [], currentLine: 0, isLoading: false, error: null },
    showTrackNotification: false,
  });
  const playerRef = useRef<Spotify.Player | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    lyrics: lines,
    currentLine,
    isLoading,
    error: lyricsError,
    updateCurrentLine,
  } = useSpotifyLyrics(
    controls.currentTrack
      ? {
          title: controls.currentTrack.name,
          artist: controls.currentTrack.artists[0].name,
          album: controls.currentTrack.album.name,
        }
      : null
  );

  // Track playback progress for lyrics sync
  useEffect(() => {
    if (!playerRef.current || !controls.isPlaying) {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    progressIntervalRef.current = window.setInterval(async () => {
      const state = await playerRef.current?.getCurrentState();
      if (state?.position !== undefined) {
        updateCurrentLine(state.position);
      }
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
      }
    };
  }, [controls.isPlaying, updateCurrentLine]);

  const handlePlayerStateChanged = useCallback(
    (state: Spotify.PlaybackState | null) => {
      if (!state) return;

      setControls((prev) => {
        const trackChanged =
          prev.currentTrack?.id !== state.track_window.current_track.id;

        if (trackChanged) {
          if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
          }
          notificationTimeoutRef.current = setTimeout(() => {
            setControls((prev) => ({ ...prev, showTrackNotification: false }));
          }, 3000);
        }

        return {
          ...prev,
          isPlaying: !state.paused,
          currentTrack: state.track_window.current_track,
          ...(trackChanged && {
            showTrackNotification: true,
            lyrics: {
              lines: [],
              currentLine: 0,
              isLoading: false,
              error: null,
            },
          }),
        };
      });
    },
    []
  );

  const initializePlayer = useCallback(
    async (deviceId: string, player: Spotify.Player) => {
      if (!token) return;

      try {
        const response = await fetch("https://api.spotify.com/v1/me/player", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const isPlaying =
          response.ok && response.status !== 204
            ? (await response.json()).is_playing
            : false;

        await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ device_ids: [deviceId], play: isPlaying }),
        });

        if (isPlaying) await player.resume();

        const state = await player.getCurrentState();
        if (state) handlePlayerStateChanged(state);

        setControls((prev) => ({ ...prev, isConnected: true }));
      } catch {
        onError?.("Failed to initialize player");
      }
    },
    [token, handlePlayerStateChanged, onError]
  );

  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Particle Simulator",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      player.addListener("ready", ({ device_id }) =>
        initializePlayer(device_id, player)
      );
      player.addListener("player_state_changed", handlePlayerStateChanged);
      player.addListener("not_ready", () => {
        setControls((prev) => ({ ...prev, isConnected: false }));
        onError?.("Device went offline");
      });

      type SpotifyErrorEvent =
        | "initialization_error"
        | "authentication_error"
        | "account_error";
      const errorEvents: SpotifyErrorEvent[] = [
        "initialization_error",
        "authentication_error",
        "account_error",
      ];

      errorEvents.forEach((event) => {
        player.addListener(event, ({ message }: { message: string }) => {
          setControls((prev) => ({ ...prev, error: message }));
          onError?.(message);
        });
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      playerRef.current?.disconnect();
      script.remove();
    };
  }, [token, initializePlayer, handlePlayerStateChanged, onError]);

  const playerAction = useCallback(
    async (action: () => Promise<void>) => {
      try {
        if (!playerRef.current) return;
        await action();
      } catch {
        onError?.("Failed to perform action");
      }
    },
    [onError]
  );

  return {
    ...controls,
    lyrics: { lines, currentLine, isLoading, error: lyricsError },
    togglePlay: () => playerAction(() => playerRef.current!.togglePlay()),
    nextTrack: () => playerAction(() => playerRef.current!.nextTrack()),
    previousTrack: () => playerAction(() => playerRef.current!.previousTrack()),
    isPlaying: controls.isPlaying,
  };
};
