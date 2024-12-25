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
