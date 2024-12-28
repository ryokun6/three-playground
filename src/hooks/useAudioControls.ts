import { useControls, folder } from "leva";
import { useCallback, useRef, useEffect } from "react";
import { checkBeat } from "../utils/audio";

interface UseAudioControlsProps {
  onBeat: () => void;
}

interface AudioControls {
  enabled: boolean;
  reactivity: number;
  gain: number;
  autoPlay: boolean;
  beatThreshold: number;
  minBeatInterval: number;
  smoothing: number;
  minDecibels: number;
  maxDecibels: number;
}

export const useAudioControls = ({ onBeat }: UseAudioControlsProps) => {
  const lastBeatTime = useRef(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [audioControls, set] = useControls("Audio", () => ({
    enabled: {
      value: false,
      label: "audioEnabled",
    },
    reactivity: {
      value: 4.5,
      min: 0,
      max: 5,
      step: 0.1,
      label: "reactivity",
    },
    gain: {
      value: 2.0,
      min: 0,
      max: 5,
      step: 0.1,
      label: "gain",
    },
    autoPlaySettings: folder(
      {
        autoPlay: {
          value: true,
          label: "autoPlay",
        },
        beatThreshold: {
          value: 0.15,
          min: 0.01,
          max: 1,
          step: 0.01,
          label: "beatThreshold",
        },
        minBeatInterval: {
          value: 1600,
          min: 100,
          max: 5000,
          step: 100,
          label: "minInterval",
        },
      },
      { render: (get) => get("Audio.enabled") }
    ),
    advanced: folder(
      {
        smoothing: {
          value: 0.6,
          min: 0,
          max: 0.99,
          step: 0.01,
          label: "smoothing",
        },
        minDecibels: {
          value: -90,
          min: -100,
          max: 0,
          step: 1,
          label: "minVol",
        },
        maxDecibels: {
          value: -10,
          min: -100,
          max: 0,
          step: 1,
          label: "maxVol",
        },
      },
      { collapsed: true, render: (get) => get("Audio.enabled") }
    ),
  }));

  const setAudioControls = useCallback(
    (values: Partial<AudioControls>) => {
      set(values);
    },
    [set]
  );

  // Add beat detection effect
  useEffect(() => {
    if (!audioControls.enabled || !audioControls.autoPlay) return;

    const checkBeatInterval = () => {
      const currentTime = Date.now();
      if (currentTime - lastBeatTime.current >= audioControls.minBeatInterval) {
        if (
          checkBeat(
            analyserRef.current,
            dataArrayRef.current,
            audioControls.beatThreshold
          )
        ) {
          onBeat();
          lastBeatTime.current = currentTime;
        }
      }
    };

    const intervalId = setInterval(checkBeatInterval, 50); // Check for beats every 50ms
    return () => clearInterval(intervalId);
  }, [
    audioControls.enabled,
    audioControls.autoPlay,
    audioControls.beatThreshold,
    audioControls.minBeatInterval,
    onBeat,
  ]);

  return {
    audioControls,
    setAudioControls,
    analyserRef,
    dataArrayRef,
  };
};
