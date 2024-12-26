import { type SpotifyControls } from "../hooks/useSpotifyPlayer";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useRef, useMemo } from "react";

const ANIMATION_CONFIG = {
  spring: {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 1,
  },
  fade: {
    duration: 0.2,
  },
} as const;

const getVariants = (position: number) => ({
  initial: {
    opacity: 0,
    scale: 0.8,
    filter: "blur(3px)",
    y: 20,
  },
  animate: {
    opacity: position === 0 ? 1 : position === 1 ? 0.5 : 0.1,
    scale: position === 0 || position === 1 ? 1 : 0.9,
    filter: `blur(${position === 0 || position === 1 ? 0 : 3}px)`,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(5px)",
    y: -20,
  },
});

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
  const currentLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const element = currentLineRef.current;
    if (!container || !element || currentLine < 0) return;

    container.scrollTo({
      top:
        element.offsetTop -
        container.clientHeight / 2 +
        element.clientHeight / 2,
      behavior: "smooth",
    });
  }, [currentLine]);

  const visibleLines = useMemo(() => {
    if (currentLine < 0) return lines.slice(0, 2);
    return lines.slice(Math.max(0, currentLine - 1), currentLine + 2);
  }, [lines, currentLine]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!lines.length) return <ErrorState message="No lyrics available" />;

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={ANIMATION_CONFIG.spring}
      className="fixed bottom-[5vh] left-1/2 -translate-x-1/2 w-full h-[30vh] overflow-hidden flex flex-col items-center"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent 100%)",
      }}
    >
      <AnimatePresence mode="popLayout">
        {visibleLines.map((line, index) => {
          const position = index - (currentLine > 0 ? 1 : 0);
          const variants = getVariants(position);

          return (
            <motion.div
              key={line.startTimeMs}
              layoutId={`${line.startTimeMs}`}
              ref={position === 0 ? currentLineRef : undefined}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={variants}
              transition={{
                ...ANIMATION_CONFIG.spring,
                opacity: ANIMATION_CONFIG.fade,
                filter: ANIMATION_CONFIG.fade,
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
