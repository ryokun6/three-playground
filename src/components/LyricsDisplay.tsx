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
import {
  loadDefaultJapaneseParser,
  loadDefaultSimplifiedChineseParser,
} from "budoux";

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
        ? "0 0 20px rgba(255,255,255,0.6)"
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
  const japaneseParser = useMemo(() => loadDefaultJapaneseParser(), []);
  const chineseParser = useMemo(() => loadDefaultSimplifiedChineseParser(), []);

  const isChineseText = (text: string) => {
    // Check for Chinese characters (includes both simplified and traditional)
    const chineseRegex = /[\u4E00-\u9FFF]/;
    // Check for Japanese-specific characters (hiragana and katakana)
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
    return chineseRegex.test(text) && !japaneseRegex.test(text);
  };

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
        return "Charter, Lyon, 'Hiragino Mincho ProN', 'Nanum Myeongjo', 'YuMincho', serif";
      case LyricsFont.Rounded:
        return "'Yuanti TC', 'Yuanti SC', 'Tsukushi A Round Gothic', 'BM Jua', sans-serif";
      default:
        return "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Sans CNS', 'PingFang TC', 'PingFang SC', 'Segoe UI Variable', Segoe UI, system-ui";
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

    // Convert Simplified Chinese to Traditional if specified
    if (chineseVariant === ChineseVariant.Traditional) {
      processed = chineseConverter(processed);
    }

    // Convert Korean text to romanized form if specified
    if (koreanDisplay === KoreanDisplay.Romanized) {
      // Check if text contains Korean characters
      if (/[\u3131-\u314e\u314f-\u3163\uac00-\ud7a3]/.test(processed)) {
        processed = romanize(processed);
      }
    }

    // If text contains CJK characters, parse into segments and wrap in spans
    if (/[\u3000-\u9fff]/.test(processed)) {
      const parser = isChineseText(processed) ? chineseParser : japaneseParser;
      return parser.parse(processed).join("\u200b");
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
      className="fixed inset-x-0 mx-auto bottom-16 w-[95%] overflow-hidden flex flex-col items-center justify-end gap-4 pointer-events-none z-30 pb-12 pt-12"
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
              }}
              className="px-4 md:px-12 text-[clamp(2rem,4vw,5rem)] leading-[1] whitespace-pre-wrap break-words max-w-full text-white"
              style={{
                fontFamily: getFontFamily(font),
                textAlign: getTextAlign(index),
                fontWeight: font === LyricsFont.Rounded ? "bold" : 600,
                width: "100%",
                fontSize: `calc(clamp(2rem,4vw,5rem) * ${fontSize})`,
                paddingLeft:
                  alignment === LyricsAlignment.Alternating && index === 0
                    ? "5%"
                    : undefined,
                paddingRight:
                  alignment === LyricsAlignment.Alternating && index === 1
                    ? "5%"
                    : undefined,
                wordBreak: "keep-all",
                overflowWrap: "anywhere",
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
