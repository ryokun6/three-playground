# Particle Simulator 7

An experiment built with Cursor, Three.js, and React that visualizes music with interactive particles.

## Features

- Particle simulator with 6 built-in shapes (cube, sphere, torus, etc.)
- Spotify integration for real-time music visualization
- Audio reactivity with frequency analysis and beat detection
- Auto Camera with smooth transitions and manual orbit controls
- Advanced environment and post-processing effects
- Performance-focused keyboard shortcuts
- Touch & gesture support for mobile devices
- Customizable UI to tweak all parameters
- Spotify Connect for timesync and playback
- Lyrics display with Chinese variants & Korean romanization


## Setup

1. Clone the repository

```bash
git clone https://github.com/ryokun6/three-playground.git
cd three-playground
```

2. Install dependencies

```bash
bun install
```

3. Set up environment variables
   Create a `.env` file in the root directory with:

```env
# Get these from https://developer.spotify.com/dashboard
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173
```

4. Start the development server

```bash
bun dev
```

## Controls

### Keyboard Shortcuts

- Space: Play/Pause
- Arrow Keys: Navigate camera
- 1-6: Switch particle shapes
- R: Reset camera
- F: Toggle fullscreen
- M: Toggle menu
- L: Toggle lyrics
- C: Toggle auto camera

## License

MIT
