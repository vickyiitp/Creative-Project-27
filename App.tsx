import React from 'react';
import { RadarGame } from './components/RadarGame';
import { GameErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <div className="w-full h-[100dvh] bg-black text-green-500 overflow-hidden">
      <GameErrorBoundary>
        <RadarGame />
      </GameErrorBoundary>
    </div>
  );
}

export default App;