/// <reference types="vite/client" />

interface Window {
  YT: typeof YT;
  onYouTubeIframeAPIReady: () => void;
}

// YouTube IFrame API types
declare namespace YT {
  class Player {
    constructor(elementOrId: string | HTMLElement, options: PlayerOptions);
    getCurrentTime(): number;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    mute(): void;
  }

  interface PlayerOptions {
    videoId: string;
    playerVars?: {
      autoplay?: 0 | 1;
      controls?: 0 | 1;
      disablekb?: 0 | 1;
      modestbranding?: 0 | 1;
      rel?: 0 | 1;
      playsinline?: 0 | 1;
    };
    events?: {
      onReady?: (event: { target: Player }) => void;
    };
  }
}
