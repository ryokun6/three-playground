import ReactPlayer from "react-player/youtube";
import { SpotifyControls } from "../hooks/useSpotifyPlayer";

interface YouTubeVideoProps {
  controls: SpotifyControls & { progress?: number; videoId?: string | null };
}

export const YouTubeVideo = ({ controls }: YouTubeVideoProps) => {
  if (!controls.videoId) return null;

  return (
    <div className="absolute inset-0 bg-black opacity-70 flex items-center justify-center">
      <ReactPlayer
        url={`https://www.youtube.com/watch?v=${controls.videoId}`}
        width="100%"
        height="120%"
        playing={controls.isPlaying}
        controls={false}
        muted={true}
        config={{
          playerVars: {
            modestbranding: 1,
            disablekb: 1,
            start: controls.progress ? Math.floor(controls.progress / 1000) : 0,
            iv_load_policy: 3,
            playsinline: 1,
          },
        }}
      />
    </div>
  );
};
