import { useEffect, useState, useRef, useCallback } from "react";
import { useSpotifyLyrics } from "./useSpotifyLyrics";

export interface LyricsLine {
  startTimeMs: string;
  words: string;
}

type SpotifyState = {
  isConnected: boolean;
  isPlaying: boolean;
  currentTrack: Spotify.Track | null;
  error: string | null;
  showTrackNotification: boolean;
};

export interface SpotifyControls extends SpotifyState {
  lyrics: {
    lines: LyricsLine[];
    currentLine: number;
    isLoading: boolean;
    error: string | null;
  };
  togglePlay: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setShowTrackNotification: (show: boolean) => void;
}

declare global {
  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

const NOTIFICATION_TIMEOUT = 3000;

export const useSpotifyPlayer = (
  token: string | null,
  onError?: (message: string) => void
) => {
  const [state, setState] = useState<SpotifyState>({
    isConnected: false,
    isPlaying: false,
    currentTrack: null,
    error: null,
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
    state.currentTrack
      ? {
          title: state.currentTrack.name,
          artist: state.currentTrack.artists[0].name,
          album: state.currentTrack.album.name,
        }
      : null
  );

  const updateNotification = useCallback((show: boolean) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setState((prev) => ({ ...prev, showTrackNotification: show }));

    if (show) {
      notificationTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, showTrackNotification: false }));
      }, NOTIFICATION_TIMEOUT);
    }
  }, []);

  const handlePlayerStateChanged = useCallback(
    (state: Spotify.PlaybackState | null) => {
      if (!state) return;

      setState((prev) => {
        const trackChanged =
          prev.currentTrack?.id !== state.track_window.current_track.id;

        if (trackChanged) {
          updateNotification(true);
        }

        return {
          ...prev,
          isPlaying: !state.paused,
          currentTrack: state.track_window.current_track,
          showTrackNotification: trackChanged
            ? true
            : prev.showTrackNotification,
        };
      });
    },
    [updateNotification]
  );

  const fetchSpotifyAPI = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      if (!token) return null;
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.status !== 204 ? response.json() : null;
    },
    [token]
  );

  const initializePlayer = useCallback(
    async (deviceId: string, player: Spotify.Player) => {
      if (!token) return;

      try {
        const currentState = await fetchSpotifyAPI("/me/player");

        await fetchSpotifyAPI("/me/player", {
          method: "PUT",
          body: JSON.stringify({
            device_ids: [deviceId],
            play: true,
          }),
        });

        const state = await player.getCurrentState();
        if (state) handlePlayerStateChanged(state);

        setState((prev) => ({
          ...prev,
          isConnected: true,
          currentTrack: currentState?.item || null,
          isPlaying: true,
        }));
      } catch {
        onError?.("Failed to initialize player");
      }
    },
    [token, handlePlayerStateChanged, onError, fetchSpotifyAPI]
  );

  useEffect(() => {
    if (!playerRef.current || !state.isPlaying) {
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
  }, [state.isPlaying, updateCurrentLine]);

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
        setState((prev) => ({ ...prev, isConnected: false }));
        onError?.("Device went offline");
      });

      const errorEvents: Spotify.ErrorTypes[] = [
        "initialization_error",
        "authentication_error",
        "account_error",
      ];

      errorEvents.forEach((event) => {
        player.addListener(event, ({ message }: { message: string }) => {
          setState((prev) => ({ ...prev, error: message }));
          onError?.(message);
        });
      });

      player.connect();
      player.activateElement();
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
    ...state,
    lyrics: { lines, currentLine, isLoading, error: lyricsError },
    togglePlay: () => playerAction(() => playerRef.current!.togglePlay()),
    nextTrack: () => playerAction(() => playerRef.current!.nextTrack()),
    previousTrack: () => playerAction(() => playerRef.current!.previousTrack()),
    setShowTrackNotification: updateNotification,
  };
};
