import { useControls, folder } from "leva";
import {
  LyricsFont,
  LyricsAlignment,
  ChineseVariant,
  KoreanDisplay,
} from "../types/scene";
import { useCallback } from "react";

export const useLyricsControls = () => {
  const [lyricsControls, setLyricsControls] = useControls("Lyrics", () => ({
    display: folder({
      font: {
        value: LyricsFont.Default,
        options: Object.values(LyricsFont),
        label: "font",
      },
      alignment: {
        value: LyricsAlignment.Center,
        options: Object.values(LyricsAlignment),
        label: "alignment",
      },
      fontSize: {
        value: 1,
        min: 0.5,
        max: 2,
        step: 0.1,
        label: "font size",
      },
      ktvMode: {
        value: false,
        label: "ktv mode",
      },
    }),
    language: folder(
      {
        chineseVariant: {
          value: ChineseVariant.Traditional,
          options: Object.values(ChineseVariant),
          label: "chineseVariant",
        },
        koreanDisplay: {
          value: KoreanDisplay.Original,
          options: Object.values(KoreanDisplay),
          label: "koreanDisplay",
        },
      },
      { collapsed: true }
    ),
  }));

  const toggleChineseVariant = useCallback(() => {
    const variants = Object.values(ChineseVariant);
    const currentIndex = variants.indexOf(lyricsControls.chineseVariant);
    const nextIndex = (currentIndex + 1) % variants.length;
    setLyricsControls({ chineseVariant: variants[nextIndex] });
    return variants[nextIndex];
  }, [lyricsControls.chineseVariant, setLyricsControls]);

  const toggleKoreanDisplay = useCallback(() => {
    const displays = Object.values(KoreanDisplay);
    const currentIndex = displays.indexOf(lyricsControls.koreanDisplay);
    const nextIndex = (currentIndex + 1) % displays.length;
    setLyricsControls({ koreanDisplay: displays[nextIndex] });
    return displays[nextIndex];
  }, [lyricsControls.koreanDisplay, setLyricsControls]);

  const toggleKtvMode = useCallback(
    (forcedState?: boolean) => {
      const newKtvMode =
        forcedState !== undefined ? forcedState : !lyricsControls.ktvMode;
      setLyricsControls({
        font: newKtvMode ? LyricsFont.Serif : LyricsFont.Default,
        alignment: newKtvMode
          ? LyricsAlignment.Alternating
          : LyricsAlignment.Center,
        fontSize: newKtvMode ? 1.5 : 1.0,
        ktvMode: newKtvMode,
      });
      return newKtvMode;
    },
    [lyricsControls.ktvMode, setLyricsControls]
  );

  return {
    lyricsControls,
    toggleChineseVariant,
    toggleKoreanDisplay,
    toggleKtvMode,
  };
};
