import { LyricLine } from "../types/lyrics";

const SKIP_PREFIXES = [
  "作词",
  "作曲",
  "編曲",
  "制作",
  "発行",
  "出品",
  "監制",
  "策划",
  "统筹",
  "録音",
  "混音",
  "母带",
  "和声",
  "词",
  "曲",
  "OP",
  "SP",
] as const;

export const parseLRC = (
  lrcText: string,
  title: string,
  artist: string
): LyricLine[] => {
  const skipList = [
    ...SKIP_PREFIXES,
    `${title} - ${artist}`,
    `${artist} - ${title}`,
  ];

  return lrcText
    .split("\n")
    .map((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.+)/);
      if (!match) return null;

      const [, min, sec, ms, text] = match;
      const trimmedText = text.trim();

      if (skipList.some((prefix) => trimmedText.startsWith(prefix))) {
        return null;
      }

      const timeMs = (
        parseInt(min) * 60000 +
        parseInt(sec) * 1000 +
        parseInt(ms.padEnd(3, "0"))
      ).toString();

      return {
        startTimeMs: timeMs,
        words: trimmedText,
      };
    })
    .filter((line): line is LyricLine => line !== null);
};
