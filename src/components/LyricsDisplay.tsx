import { type SpotifyControls } from "../hooks/useSpotifyPlayer";
import { useEffect, useRef } from "react";

interface LyricLine {
  startTimeMs: string;
  words: string;
}

interface LyricsDisplayProps {
  controls: SpotifyControls;
}

export const LyricsDisplay = ({ controls }: LyricsDisplayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    lyrics: { lines, currentLine, isLoading, error },
  } = controls;

  useEffect(() => {
    if (containerRef.current && currentLine !== null) {
      const lineElements =
        containerRef.current.querySelectorAll("[data-lyric-line]");
      const currentElement = lineElements[currentLine] as HTMLElement;
      if (currentElement) {
        currentElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentLine]);

  if (isLoading) {
    return <div className="text-white/50">Loading lyrics...</div>;
  }

  if (error) {
    return <div className="text-white/50">{error}</div>;
  }

  if (!lines.length) {
    return <div className="text-white/50">No lyrics available</div>;
  }

  return (
    <div className="fixed bottom-40 left-1/2 -translate-x-1/2 w-full max-w-xl">
      <div className="relative h-32">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto scrollbar-hide relative [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <div className="flex flex-col items-center gap-2 py-12">
            {lines.map((line: LyricLine, index: number) => (
              <div
                key={`${line.startTimeMs}-${index}`}
                data-lyric-line
                className={`transition-all duration-300 px-4 text-2xl text-center whitespace-pre-wrap break-words max-w-full ${
                  index === currentLine
                    ? "text-white scale-110 font-bold"
                    : "text-white/30"
                }`}
              >
                {line.words}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
