import { useEffect, useState, useRef } from "react";
import SpotifyWebApi from "spotify-web-api-node";

const spotifyApi = new SpotifyWebApi();

export interface SpotifyControls {
  isConnected: boolean;
  isPlaying: boolean;
  currentTrack: Spotify.Track | null;
  player: Spotify.Player | null;
  error: string | null;
}

export const useSpotifyPlayer = (
  token: string | null,
  onError?: (message: string) => void
) => {
  const [controls, setControls] = useState<SpotifyControls>({
    isConnected: false,
    isPlaying: false,
    currentTrack: null,
    player: null,
    error: null,
  });
  const playerRef = useRef<Spotify.Player | null>(null);

  useEffect(() => {
    if (!token) return;

    spotifyApi.setAccessToken(token);
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: "Three.js Visualizer",
        getOAuthToken: (cb) => cb(token),
        volume: 0.5,
      });

      player.addListener("ready", async ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
        playerRef.current = player;
        setControls((prev) => ({ ...prev, isConnected: true, player }));

        // Try to activate this device
        try {
          await fetch("https://api.spotify.com/v1/me/player", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              device_ids: [device_id],
              play: false,
            }),
          });
        } catch (error) {
          console.error("Failed to activate device:", error);
          onError?.(
            "Failed to activate device. Try playing from another Spotify app first."
          );
        }
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) return;

        setControls((prev) => ({
          ...prev,
          isPlaying: !state.paused,
          currentTrack: state.track_window.current_track,
        }));
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
        setControls((prev) => ({ ...prev, isConnected: false }));
        onError?.("Device went offline. Try refreshing the page.");
      });

      player.addListener("initialization_error", ({ message }) => {
        console.error("Failed to initialize:", message);
        setControls((prev) => ({ ...prev, error: message }));
        onError?.(`Failed to initialize: ${message}`);
      });

      player.addListener("authentication_error", ({ message }) => {
        console.error("Failed to authenticate:", message);
        setControls((prev) => ({ ...prev, error: message }));
        // Clear invalid token
        localStorage.removeItem("spotify_token");
        localStorage.removeItem("spotify_token_expiry");
        onError?.(
          `Authentication failed: ${message}. Please try logging in again.`
        );
      });

      player.addListener("account_error", ({ message }) => {
        console.error("Failed to validate Spotify account:", message);
        setControls((prev) => ({ ...prev, error: message }));
        onError?.(
          `Account error: ${message}. Make sure you have Spotify Premium.`
        );
      });

      player.connect();
    };

    return () => {
      playerRef.current?.disconnect();
    };
  }, [token, onError]);

  const togglePlay = async () => {
    if (!controls.player) return;
    try {
      await controls.player.togglePlay();
    } catch (error) {
      console.error("Failed to toggle play:", error);
      onError?.("Failed to toggle play. Try refreshing the page.");
    }
  };

  const nextTrack = async () => {
    if (!controls.player) return;
    try {
      await controls.player.nextTrack();
    } catch (error) {
      console.error("Failed to skip track:", error);
      onError?.("Failed to skip track. Try refreshing the page.");
    }
  };

  const previousTrack = async () => {
    if (!controls.player) return;
    try {
      await controls.player.previousTrack();
    } catch (error) {
      console.error("Failed to go to previous track:", error);
      onError?.("Failed to go to previous track. Try refreshing the page.");
    }
  };

  return {
    ...controls,
    togglePlay,
    nextTrack,
    previousTrack,
  };
};
