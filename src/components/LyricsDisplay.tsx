import { type SpotifyControls } from "../hooks/useSpotifyPlayer";
import { motion, AnimatePresence } from "motion/react";
import { useRef, useMemo } from "react";
import {
  LyricsFont,
  LyricsAlignment,
  ChineseVariant,
  KoreanDisplay,
} from "../types/scene";
import { Converter } from "opencc-js";
import { convert as romanize } from "hangul-romanization";

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

const getVariants = (position: number, isAlternating: boolean) => ({
  initial: {
    opacity: 0,
    scale: 0.8,
    filter: "blur(3px)",
    y: 10,
    textShadow: "0 0 0px rgba(255,255,255,0)",
  },
  animate: {
    opacity: isAlternating
      ? position === 0
        ? 1
        : 0.5
      : position === 0
      ? 1
      : position === 1
      ? 0.5
      : 0.1,
    scale: isAlternating ? 1 : position === 0 || position === 1 ? 1 : 0.9,
    filter: isAlternating
      ? "blur(0px)"
      : `blur(${position === 0 || position === 1 ? 0 : 3}px)`,
    y: isAlternating ? 0 : position === 0 ? -10 : position === 1 ? -10 : 0,
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
  font: LyricsFont;
  alignment: LyricsAlignment;
  chineseVariant?: ChineseVariant;
  koreanDisplay?: KoreanDisplay;
  fontSize?: number;
}

const LoadingState = () => (
  <div className="text-white/50">Loading lyrics...</div>
);
const ErrorState = ({ message }: { message: string }) => (
  <div className="text-white/50">{message}</div>
);

export const LyricsDisplay = ({
  controls,
  font,
  alignment,
  chineseVariant = ChineseVariant.Original,
  koreanDisplay = KoreanDisplay.Original,
  fontSize = 1,
}: LyricsDisplayProps) => {
  const {
    lyrics: { lines, currentLine, isLoading, error },
  } = controls;
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const chineseConverter = useMemo(
    () => Converter({ from: "cn", to: "hk" }),
    []
  );

  const visibleLines = useMemo(() => {
    if (alignment === LyricsAlignment.Alternating) {
      if (currentLine < 0) return lines.slice(0, 2);
      const isEvenLine = currentLine % 2 === 0;
      return isEvenLine
        ? [lines[currentLine], lines[currentLine + 1]].filter(Boolean)
        : [lines[currentLine + 1], lines[currentLine]].filter(Boolean);
    }
    if (currentLine < 0) return lines.slice(0, 2);
    return lines.slice(Math.max(0, currentLine - 1), currentLine + 2);
  }, [lines, currentLine, alignment]);

  const getFontFamily = (font: LyricsFont) => {
    switch (font) {
      case LyricsFont.Serif:
        return "YuMincho, 'Hiragino Mincho ProN', 'Nanum Myeongjo', serif";
      case LyricsFont.Rounded:
        return "'Arial Rounded MT Bold','YuanTi TC', 'Yuanti SC', 'Hiragino Maru Gothic ProN', 'BM Jua',  system-ui";
      default:
        return "-apple-system, BlinkMacSystemFont, Segoe UI Variable, Segoe UI, system-ui";
    }
  };

  const getTextAlign = (index: number) => {
    if (alignment === LyricsAlignment.Center) return "center";
    if (alignment === LyricsAlignment.Alternating) {
      return index === 0 ? "left" : "right";
    }
    return index % 2 === 0 ? "left" : "right";
  };

  const processText = (text: string) => {
    let processed = text;

    if (chineseVariant === ChineseVariant.Traditional) {
      processed = chineseConverter(processed);
    }

    if (koreanDisplay === KoreanDisplay.Romanized) {
      // Simple heuristic: if text contains Hangul characters
      if (/[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/.test(processed)) {
        processed = romanize(processed);
      }
    }

    return processed;
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!lines.length) return <ErrorState message="No lyrics available" />;

  return (
    <motion.div
      ref={containerRef}
      layout
      transition={ANIMATION_CONFIG.spring}
      className="fixed inset-x-0 mx-auto bottom-16 w-[90%] overflow-hidden flex flex-col items-center gap-4 pointer-events-none z-30 pt-12"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent 100%)",
        height: `calc(30vh * ${Math.sqrt(fontSize)})`,
        minHeight: "250px",
      }}
    >
      <AnimatePresence mode="popLayout">
        {visibleLines.map((line, index) => {
          const position =
            alignment === LyricsAlignment.Alternating
              ? line === lines[currentLine]
                ? 0
                : 1
              : index - (currentLine > 0 ? 1 : 0);
          const variants = getVariants(
            position,
            alignment === LyricsAlignment.Alternating
          );

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
              className="px-4 text-[clamp(2rem,4vw,5rem)] leading-[1] whitespace-pre-wrap break-words max-w-full text-white font-semibold"
              style={{
                fontFamily: getFontFamily(font),
                textAlign: getTextAlign(index),
                width: "100%",
                fontSize: `calc(clamp(2rem,4vw,5rem) * ${fontSize})`,
              }}
            >
              {processText(line.words)}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};
