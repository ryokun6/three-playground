import { Scene } from './components/Scene'

function App() {
  return (
    <main className="w-screen h-screen bg-black">
      <Scene />
      <div className="fixed top-4 left-4 text-white">
        <h1 className="text-2xl font-bold mb-2">Three.js Particles Playground</h1>
        <p className="text-sm opacity-70">Use mouse to orbit, zoom and pan</p>
      </div>
    </main>
  )
}

export default App
