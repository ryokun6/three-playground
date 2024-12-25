// Constants
export const SAMPLE_RATE = 44100; // Standard sample rate
export const MIN_FREQ = 20;
export const MAX_FREQ = 20000;

// Helper function to convert frequency bin index to frequency
export const binToFrequency = (binIndex: number, fftSize: number): number => {
  return (binIndex * SAMPLE_RATE) / (fftSize * 2);
};

// Helper function to get the frequency bin range for audible spectrum
export const getAudibleFrequencyBins = (
  fftSize: number
): { start: number; end: number } => {
  const binWidth = SAMPLE_RATE / (fftSize * 2);
  const startBin = Math.floor(MIN_FREQ / binWidth);
  const endBin = Math.ceil(MAX_FREQ / binWidth);
  return { start: startBin, end: Math.min(endBin, fftSize / 2) };
};

// Modified getWaveformData function to focus on audible range
export const getWaveformData = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null
): number[] => {
  if (!analyser || !dataArray) return Array(1024).fill(128);

  analyser.getByteFrequencyData(dataArray);
  const { start, end } = getAudibleFrequencyBins(analyser.fftSize);

  // Extract only the audible frequency range
  const audibleData = Array.from(dataArray.slice(start, end));

  // Apply logarithmic scaling to better represent human hearing
  return audibleData.map((value, index) => {
    const frequency = binToFrequency(index + start, analyser.fftSize);
    // Logarithmic scaling factor (adjust human hearing perception)
    const logScale =
      Math.log10(frequency / MIN_FREQ) / Math.log10(MAX_FREQ / MIN_FREQ);
    return value * (0.3 + 0.7 * logScale); // Boost lower frequencies slightly
  });
};

// Add beat detection helper function
export const getBeatIntensity = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null
): number => {
  if (!analyser || !dataArray) return 0;
  analyser.getByteFrequencyData(dataArray);

  // Focus on bass frequencies (roughly the first 1/8 of frequency data)
  const bassRange = Math.floor(dataArray.length / 8);
  let bassSum = 0;
  for (let i = 0; i < bassRange; i++) {
    bassSum += dataArray[i];
  }
  const bassAverage = bassSum / bassRange;
  return Math.pow(bassAverage / 255, 2); // Squared for more aggressive response
};

// Add frequency band calculations
export const createFrequencyBands = (
  minFreq: number,
  maxFreq: number,
  bandCount: number
): { start: number; end: number }[] => {
  const bands: { start: number; end: number }[] = [];
  // Use logarithmic scale for frequency bands to better match human hearing
  for (let i = 0; i < bandCount; i++) {
    const start = minFreq * Math.pow(maxFreq / minFreq, i / bandCount);
    const end = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / bandCount);
    bands.push({ start, end });
  }
  return bands;
};

export const getFrequencyBandEnergy = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null,
  bandStart: number,
  bandEnd: number,
  fftSize: number
): number => {
  if (!analyser || !dataArray) return 0;

  const startBin = Math.floor((bandStart * fftSize * 2) / SAMPLE_RATE);
  const endBin = Math.ceil((bandEnd * fftSize * 2) / SAMPLE_RATE);
  let sum = 0;
  let count = 0;

  for (let i = startBin; i < endBin && i < dataArray.length; i++) {
    sum += dataArray[i];
    count++;
  }

  return count > 0 ? sum / (count * 255) : 0;
};

// Get overall audio level
export const getAudioLevel = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null,
  audioGain: number = 1.0
): number => {
  if (!analyser || !dataArray) return 0;

  analyser.getByteFrequencyData(dataArray);
  const average =
    dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
  const normalizedLevel = (average / 128.0) * audioGain;
  return normalizedLevel;
};

export const checkBeat = (
  analyser: AnalyserNode | null,
  dataArray: Uint8Array | null,
  beatThreshold: number
): boolean => {
  if (!analyser || !dataArray) return false;

  // Get bass frequencies (roughly the first 1/8 of frequency data)
  analyser.getByteFrequencyData(dataArray);
  const bassRange = Math.floor(dataArray.length / 8);
  let bassSum = 0;
  for (let i = 0; i < bassRange; i++) {
    bassSum += dataArray[i];
  }
  const bassAverage = bassSum / bassRange;
  const beatIntensity = Math.pow(bassAverage / 255, 2);

  return beatIntensity > beatThreshold;
};

export interface AudioConfig {
  audioGain?: number;
  audioSmoothing?: number;
  audioMinDecibels?: number;
  audioMaxDecibels?: number;
}

export interface AudioSetup {
  audioContext: AudioContext;
  analyser: AnalyserNode;
  dataArray: Uint8Array;
  cleanup: () => void;
}

export const initAudio = async (
  config: AudioConfig = {}
): Promise<AudioSetup> => {
  const audioContext = new AudioContext();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  // Get the audio track from the stream
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    throw new Error("No audio track found in the stream");
  }

  console.log("Audio source:", audioTracks[0].label);

  const source = audioContext.createMediaStreamSource(stream);
  const gainNode = audioContext.createGain();
  const analyser = audioContext.createAnalyser();

  // Configure analyser
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = config.audioSmoothing ?? 0.8;
  analyser.minDecibels = config.audioMinDecibels ?? -90;
  analyser.maxDecibels = config.audioMaxDecibels ?? -10;

  // Configure gain
  gainNode.gain.value = config.audioGain ?? 1.0;

  // Connect nodes
  source.connect(gainNode);
  gainNode.connect(analyser);

  // Initialize data array
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const cleanup = () => {
    stream.getTracks().forEach((track) => track.stop());
    source.disconnect();
    gainNode.disconnect();
    analyser.disconnect();
    audioContext.close();
  };

  return { audioContext, analyser, dataArray, cleanup };
};
