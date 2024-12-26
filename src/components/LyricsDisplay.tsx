import { type SpotifyControls } from "../hooks/useSpotifyPlayer";
import { motion, AnimatePresence } from "motion/react";
import { useRef, useMemo } from "react";

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
    y: 10,
    textShadow: "0 0 0px rgba(255,255,255,0)",
  },
  animate: {
    opacity: position === 0 ? 1 : position === 1 ? 0.5 : 0.1,
    scale: position === 0 || position === 1 ? 1 : 0.9,
    filter: `blur(${position === 0 || position === 1 ? 0 : 3}px)`,
    y: position === 0 ? 0 : position === 1 ? 0 : 0,
    textShadow:
      position === 0
        ? "0 0 20px rgba(255,255,255,0.8)"
        : "0 0 0px rgba(255,255,255,0)",
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(5px)",
    y: -10,
    textShadow: "0 0 0px rgba(255,255,255,0)",
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
      className="fixed inset-x-0 mx-auto bottom-[6vh] w-[90%] h-[30vh] overflow-hidden flex flex-col items-center gap-4 pointer-events-none"
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
                textShadow: {
                  duration:
                    position === 0 && index < visibleLines.length - 1
                      ? (parseInt(visibleLines[index + 1].startTimeMs) -
                          parseInt(line.startTimeMs)) /
                        1000
                      : 2,
                  ease: "easeInOut",
                },
              }}
              className="px-4 text-[clamp(1rem,4vw,5rem)] leading-[1] text-center whitespace-pre-wrap break-words max-w-full text-white font-semibold"
            >
              {line.words}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};
