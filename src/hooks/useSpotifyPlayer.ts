import { useEffect, useState, useRef, useCallback } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import { useSpotifyLyrics } from "./useSpotifyLyrics";

// Singleton instance for Spotify API
const spotifyApi = new SpotifyWebApi();

interface SpotifyPlayerLike {
  connect: () => void;
}

interface SpotifyPlaybackStateLike {
  paused: boolean;
  track_window: {
    current_track: Spotify.Track;
  };
  position: number;
}

const isSpotifyPlayer = (player: unknown): player is Spotify.Player => {
  const playerLike = player as SpotifyPlayerLike;
  return Boolean(player && typeof playerLike.connect === "function");
};

const isPlaybackState = (state: unknown): state is Spotify.PlaybackState => {
  const stateLike = state as SpotifyPlaybackStateLike;
  return Boolean(
    state &&
      typeof stateLike.paused === "boolean" &&
      stateLike.track_window &&
      stateLike.track_window.current_track
  );
};

const safeSpotifyCall = async <T>(
  apiCall: () => Promise<T>,
  errorMessage: string
): Promise<T | null> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return null;
  }
};

declare global {
  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

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
    lyrics: {
      lines: [],
      currentLine: 0,
      isLoading: false,
      error: null,
    },
  });
  const playerRef = useRef<Spotify.Player | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

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
      if (isPlaybackState(state)) {
        updateCurrentLine(state.position);
      }
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [playerRef, controls.isPlaying, updateCurrentLine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  const handlePlayerReady = useCallback(
    async ({ device_id }: { device_id: string }, player: Spotify.Player) => {
      console.log("Ready with Device ID", device_id);
      playerRef.current = player;
      setControls((prev) => ({ ...prev, isConnected: true }));

      try {
        const response = await fetch("https://api.spotify.com/v1/me/player", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Failed to get playback state");

        const currentState = await response.json();
        const shouldActivate = !currentState || !currentState.device;

        if (shouldActivate || currentState?.is_playing) {
          await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              device_ids: [device_id],
              play: currentState?.is_playing ?? false,
            }),
          });
        }
      } catch (error) {
        console.error("Playback state handling error:", error);
      }
    },
    [token]
  );

  const handlePlayerStateChanged = useCallback((state: unknown) => {
    if (!isPlaybackState(state)) return;

    setControls((prev) => {
      const trackChanged =
        prev.currentTrack?.id !== state.track_window.current_track.id;
      return {
        ...prev,
        isPlaying: !state.paused,
        currentTrack: state.track_window.current_track,
        ...(trackChanged && {
          lyrics: {
            lines: [],
            currentLine: 0,
            isLoading: false,
            error: null,
          },
        }),
      };
    });
  }, []);

  const handleNotReady = useCallback(
    ({ device_id }: { device_id: string }) => {
      console.log("Device ID has gone offline", device_id);
      setControls((prev) => ({ ...prev, isConnected: false }));
      onError?.("Device went offline. Try refreshing the page.");
    },
    [onError]
  );

  const handleInitError = useCallback(
    ({ message }: { message: string }) => {
      console.error("Failed to initialize:", message);
      setControls((prev) => ({ ...prev, error: message }));
      onError?.(`Failed to initialize: ${message}`);
    },
    [onError]
  );

  const handleAuthError = useCallback(
    ({ message }: { message: string }) => {
      console.error("Failed to authenticate:", message);
      setControls((prev) => ({ ...prev, error: message }));
      localStorage.removeItem("spotify_token");
      localStorage.removeItem("spotify_token_expiry");
      onError?.(
        `Authentication failed: ${message}. Please try logging in again.`
      );
    },
    [onError]
  );

  const handleAccountError = useCallback(
    ({ message }: { message: string }) => {
      console.error("Failed to validate Spotify account:", message);
      setControls((prev) => ({ ...prev, error: message }));
      onError?.(
        `Account error: ${message}. Make sure you have Spotify Premium.`
      );
    },
    [onError]
  );

  useEffect(() => {
    if (!token) return;

    if (
      document.querySelector(
        'script[src="https://sdk.scdn.co/spotify-player.js"]'
      )
    ) {
      return;
    }

    spotifyApi.setAccessToken(token);
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      if (playerRef.current) {
        const player = playerRef.current;
        if (isSpotifyPlayer(player)) {
          player.activateElement();
        }
        return;
      }

      const player = new window.Spotify.Player({
        name: "Particle Simulator",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      if (!isSpotifyPlayer(player)) {
        onError?.("Failed to initialize Spotify player");
        return;
      }

      player.addListener("ready", ({ device_id }) =>
        handlePlayerReady({ device_id }, player)
      );
      player.addListener("player_state_changed", handlePlayerStateChanged);
      player.addListener("not_ready", handleNotReady);
      player.addListener("initialization_error", handleInitError);
      player.addListener("authentication_error", handleAuthError);
      player.addListener("account_error", handleAccountError);

      player.connect();
    };

    return () => {
      playerRef.current?.disconnect();
      script.remove();
      window.onSpotifyWebPlaybackSDKReady = () => {};
    };
  }, [
    token,
    handlePlayerReady,
    handlePlayerStateChanged,
    handleNotReady,
    handleInitError,
    handleAuthError,
    handleAccountError,
    onError,
  ]);

  const togglePlay = useCallback(async () => {
    if (!playerRef.current) return;
    const result = await safeSpotifyCall(
      () => playerRef.current!.togglePlay(),
      "Failed to toggle play"
    );
    if (!result) onError?.("Failed to toggle play. Try refreshing the page.");
  }, [onError]);

  const nextTrack = useCallback(async () => {
    if (!playerRef.current) return;
    const result = await safeSpotifyCall(
      () => playerRef.current!.nextTrack(),
      "Failed to skip track"
    );
    if (!result) onError?.("Failed to skip track. Try refreshing the page.");
  }, [onError]);

  const previousTrack = useCallback(async () => {
    if (!playerRef.current) return;
    const result = await safeSpotifyCall(
      () => playerRef.current!.previousTrack(),
      "Failed to go to previous track"
    );
    if (!result)
      onError?.("Failed to go to previous track. Try refreshing the page.");
  }, [onError]);

  return {
    ...controls,
    lyrics: {
      lines,
      currentLine,
      isLoading,
      error: lyricsError,
    },
    togglePlay,
    nextTrack,
    previousTrack,
  };
};
