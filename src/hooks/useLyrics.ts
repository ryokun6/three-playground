import { useState, useEffect, useRef } from "react";
import { Track, LyricLine } from "../types/lyrics";
import { fetchTrackLyrics } from "../services/lyricsApi";

export const useLyrics = (track: Track | null) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevTrackRef = useRef<string>("");

  useEffect(() => {
    if (!track?.title || !track?.artist) {
      setLyrics([]);
      setCurrentLine(0);
      return;
    }

    const trackKey = `${track.title}-${track.artist}-${track.album || ""}`;
    if (prevTrackRef.current === trackKey) return;
    prevTrackRef.current = trackKey;

    const loadLyrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const lines = await fetchTrackLyrics(track);
        setLyrics(lines);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch lyrics");
        console.error("Lyrics fetch error:", err);
        setLyrics([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLyrics();
  }, [track]);

  const updateCurrentLine = (currentTimeMs: number) => {
    const newLineIndex = lyrics.findIndex((line, index) => {
      const startTime = parseInt(line.startTimeMs);
      const endTime =
        index < lyrics.length - 1
          ? parseInt(lyrics[index + 1].startTimeMs)
          : Infinity;

      return currentTimeMs >= startTime && currentTimeMs < endTime;
    });

    if (newLineIndex !== -1 && newLineIndex !== currentLine) {
      setCurrentLine(newLineIndex);
    }
  };

  return {
    lyrics,
    currentLine,
    isLoading,
    error,
    updateCurrentLine,
  };
};
