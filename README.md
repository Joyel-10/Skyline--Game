# 🏎️ SKYLINE: Street Chronicles

A cinematic 3D racing game built with React + TypeScript + Three.js.

## Features
- Nissan GT-R R34 in Sky Blue with detailed 3D model
- Cinematic intro with Tron-style synth music
- 5 AI opponents with racing behavior
- 3 laps · 2 minute race · max 400 km/h
- Web Audio engine sounds, nitro, tire screech
- Rain particles, neon undercar glow, film grain
- Ghost mode — cars pass through each other
- 3 camera modes: Chase / Hood / Cinematic

## Controls
| Key | Action |
|-----|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake |
| A / ← | Steer Left |
| D / → | Steer Right |
| N | Nitro Boost (400 km/h) |
| Shift | Drift |
| C | Switch Camera |
| Enter | Start Race |

## Setup & Run

### Requirements
- Node.js 18+ 
- npm or yarn

### Steps

1. Extract the zip file
2. Open terminal in the `skyline-racing` folder
3. Install dependencies:
   ```
   npm install
   ```
4. Start the dev server:
   ```
   npm run dev
   ```
5. Open browser at: **http://localhost:5173**

### Build for Production
```
npm run build
npm run preview
```

## Project Structure
```
src/
├── main.tsx               # React entry point
├── App.tsx                # Root component
└── game/
    ├── SkylineRacing.tsx  # Main game component
    ├── AudioEngine.ts     # All sounds via Web Audio API
    ├── buildGTR34.ts      # GT-R R34 3D model
    └── buildWorld.ts      # Road, environment, AI cars
```
