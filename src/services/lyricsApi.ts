import { Track, LyricLine } from "../types/lyrics";
import { parseLRC } from "../utils/lrcParser";

const API_BASE = "https://api.lrc.cx/api/v1";

export const fetchTrackLyrics = async (track: Track): Promise<LyricLine[]> => {
  const params = new URLSearchParams({
    title: track.title,
    artist: track.artist,
    ...(track.album ? { album: track.album } : {}),
  });

  const response = await fetch(`${API_BASE}/lyrics/single?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch lyrics");
  }

  const lrcText = await response.text();
  if (!lrcText) {
    throw new Error("No lyrics available for this track");
  }

  return parseLRC(lrcText, track.title, track.artist);
};
