import { useEffect, useState } from "react";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin;
const SCOPES = [
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-email",
  "user-read-private",
];

export const useSpotifyAuth = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if returning from Spotify auth
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");
    const expiresIn = params.get("expires_in");

    if (accessToken) {
      // Save token with expiry
      const expiryTime = Date.now() + Number(expiresIn) * 1000;
      localStorage.setItem("spotify_token", accessToken);
      localStorage.setItem("spotify_token_expiry", String(expiryTime));
      setToken(accessToken);

      // Remove hash from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Check localStorage
    const storedToken = localStorage.getItem("spotify_token");
    const storedTokenExpiry = localStorage.getItem("spotify_token_expiry");

    if (
      storedToken &&
      storedTokenExpiry &&
      Number(storedTokenExpiry) > Date.now()
    ) {
      setToken(storedToken);
      return;
    }

    // Clear expired token
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expiry");
  }, []);

  const login = () => {
    const state = Math.random().toString(36).substring(7);
    const authUrl = new URL("https://accounts.spotify.com/authorize");

    authUrl.searchParams.append("client_id", CLIENT_ID);
    authUrl.searchParams.append("response_type", "token");
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("scope", SCOPES.join(" "));
    authUrl.searchParams.append("state", state);
    authUrl.searchParams.append("show_dialog", "true"); // Force showing the auth dialog

    window.location.href = authUrl.toString();
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_token_expiry");
  };

  return { token, login, logout };
};
