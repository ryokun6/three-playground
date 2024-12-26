import { type SpotifyControls } from "../hooks/useSpotifyPlayer";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef } from "react";

interface LyricsDisplayProps {
  controls: SpotifyControls;
}

const LoadingState = () => (
  <div className="text-white/50">Loading lyrics...</div>
);
const ErrorState = ({ message }: { message: string }) => (
  <div className="text-white/50">{message}</div>
);

export const LyricsDisplay = ({ controls }: LyricsDisplayProps) => {
  const {
    lyrics: { lines, currentLine, isLoading, error },
  } = controls;
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (
      currentLine >= 0 &&
      containerRef.current &&
      lineRefs.current[currentLine]
    ) {
      const container = containerRef.current;
      const element = lineRefs.current[currentLine];
      const containerHeight = container.clientHeight;
      const elementTop = element!.offsetTop;
      const elementHeight = element!.clientHeight;

      const targetScroll = elementTop - (containerHeight - elementHeight) / 2;
      container.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [currentLine]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!lines.length) return <ErrorState message="No lyrics available" />;

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 40,
        mass: 1,
      }}
      className="fixed bottom-[5vh] left-1/2 -translate-x-1/2 w-full h-[30vh] overflow-hidden flex flex-col items-center"
      style={{
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent 100%)",
        maskImage:
          "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent 100%)",
      }}
    >
      <AnimatePresence mode="popLayout">
        {lines
          .slice(Math.max(0, currentLine - 1), currentLine + 2)
          .map((line, index) => {
            const position = index - (currentLine > 0 ? 1 : 0); // -1: prev, 0: current, 1: next
            return (
              <motion.div
                key={`${line.startTimeMs}`}
                layoutId={`${line.startTimeMs}`}
                ref={(el) => (lineRefs.current[currentLine + position] = el)}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  filter: "blur(3px)",
                  y: 20,
                }}
                animate={{
                  opacity: position === 0 ? 1 : position === 1 ? 0.5 : 0.1,
                  scale: position === 0 || position === 1 ? 1 : 0.9,
                  filter: `blur(${position === 0 || position === 1 ? 0 : 3}px)`,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  filter: "blur(5px)",
                  y: -20,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 30,
                  mass: 1,
                  opacity: { duration: 0.2 },
                  filter: { duration: 0.2 },
                }}
                className="px-4 text-[clamp(1rem,4vw,5rem)] text-center whitespace-pre-wrap break-words max-w-full text-white font-semibold"
              >
                {line.words}
              </motion.div>
            );
          })}
      </AnimatePresence>
    </motion.div>
  );
};
