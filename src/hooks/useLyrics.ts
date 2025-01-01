import { useState, useEffect, useRef } from "react";

interface LyricLine {
  startTimeMs: string;
  words: string;
}

interface Track {
  title: string;
  artist: string;
  album?: string;
}

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

    const fetchLyrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          title: track.title,
          artist: track.artist,
          ...(track.album ? { album: track.album } : {}),
        });

        const response = await fetch(
          `https://api.lrc.cx/api/v1/lyrics/single?${params}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch lyrics");
        }

        const lrcText = await response.text();
        if (!lrcText) {
          setError("No lyrics available for this track");
          setLyrics([]);
          return;
        }

        const lines = parseLRC(lrcText);
        setLyrics(lines);
      } catch (err) {
        setError("Failed to fetch lyrics");
        console.error("Lyrics fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLyrics();
  }, [track]);

  const parseLRC = (lrcText: string): LyricLine[] => {
    return lrcText
      .split("\n")
      .map((line) => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.+)/);
        if (!match) return null;

        const [, min, sec, ms, text] = match;
        const timeMs = (
          parseInt(min) * 60000 +
          parseInt(sec) * 1000 +
          parseInt(ms.padEnd(3, "0"))
        ).toString();

        return {
          startTimeMs: timeMs,
          words: text.trim(),
        };
      })
      .filter((line): line is LyricLine => line !== null);
  };

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
