import React from 'react';
import { GameState } from '../types';

interface RetroUIProps {
  gameState: GameState;
  gameStarted: boolean;
  onStart: () => void;
  onRestart: () => void;
  onTogglePause: () => void;
}

export const RetroUI: React.FC<RetroUIProps> = ({ gameState, gameStarted, onStart, onRestart, onTogglePause }) => {
  if (!gameStarted) {
    return (
      <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/95 backdrop-blur-md pointer-events-auto overflow-hidden">
        {/* Scanning Line Background */}
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none"></div>
        <div className="absolute inset-0 animate-pulse pointer-events-none bg-gradient-to-b from-transparent via-green-900/5 to-transparent h-full w-full"></div>
        
        <div className="text-center relative z-10 border-y-2 border-green-900/50 py-12 px-6 bg-black/50">
           {/* Tech Corners */}
           <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500"></div>
           <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500"></div>
           <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500"></div>
           <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500"></div>

          <div className="mb-6 font-mono text-xs text-green-700 tracking-[0.5em] animate-pulse">SYSTEM STANDBY</div>
          
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-green-300 to-green-800 mb-6 tracking-tighter phosphor-glow drop-shadow-[0_0_10px_rgba(51,255,51,0.5)]">
            FLIGHT<br/>VECTOR
          </h1>
          
          <div className="flex flex-col items-center gap-2 mb-10 font-mono text-green-500/60 text-sm">
            <span>> CHECKING PERIPHERALS... OK</span>
            <span>> CALIBRATING RADAR... OK</span>
            <span>> ESTABLISHING LINK... OK</span>
          </div>

          <button 
            onClick={onStart}
            className="group relative px-10 py-4 bg-green-900/20 border border-green-500 text-green-400 font-bold text-xl tracking-[0.2em] hover:bg-green-500 hover:text-black transition-all duration-300 overflow-hidden clip-path-button"
            style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
          >
            <span className="relative z-10 flex items-center gap-3">
              INITIALIZE <i className="fas fa-power-off text-sm group-hover:rotate-90 transition-transform"></i>
            </span>
            <div className="absolute inset-0 bg-green-400/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
          </button>
          
          <div className="mt-8 text-[10px] text-green-900 font-mono uppercase tracking-widest">
            VICKY KUMAR // DEVIL LABS // v1.0.4
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none p-4 md:p-6 flex flex-col justify-between z-20 select-none">
      {/* Top HUD */}
      <div className="flex justify-between items-start text-xl tracking-wider font-mono">
        {/* Score Panel */}
        <div className="relative bg-black/80 border-l-2 border-green-500 p-4 rounded-r-sm backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] group">
          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500"></div>
          <div className="text-green-500 text-[10px] tracking-widest mb-1 opacity-70">FLIGHT DATA</div>
          <div className="text-3xl text-white font-bold phosphor-glow tabular-nums">{gameState.score.toString().padStart(6, '0')}</div>
          <div className="text-xs text-green-600 mt-2 flex gap-4 font-bold border-t border-green-900/50 pt-1">
            <span className="flex items-center gap-1"><i className="fas fa-plane-arrival"></i> {gameState.planesLanded}</span>
            <span className="flex items-center gap-1 text-red-900"><i className="fas fa-plane-slash"></i> {gameState.planesCrashed}</span>
          </div>
        </div>
        
        {/* Wind Panel */}
        <div className="relative bg-black/80 border-r-2 border-green-500 p-4 rounded-l-sm backdrop-blur-sm shadow-[0_0_15px_rgba(0,0,0,0.5)] flex flex-col items-end">
           <div className="absolute top-0 right-0 w-2 h-2 bg-green-500"></div>
           <div className="text-green-500 text-[10px] tracking-widest mb-1 opacity-70">ATMOSPHERICS</div>
           <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="text-xl text-white font-bold tabular-nums">{gameState.wind.speed.toFixed(1)} <span className="text-xs text-green-600">KTS</span></div>
                <div className="text-[10px] text-green-700">VAR: {(gameState.wind.direction * (180/Math.PI)).toFixed(0)}°</div>
             </div>
             <div className="relative w-12 h-12 border border-green-800 rounded-full flex items-center justify-center bg-green-900/20 shadow-[0_0_10px_rgba(51,255,51,0.1)]">
              <div 
                className="w-full h-0.5 bg-green-400 absolute transition-transform duration-1000 ease-in-out shadow-[0_0_5px_#33ff33]"
                style={{ transform: `rotate(${gameState.wind.direction}rad)` }}
              />
              <div 
                 className="w-2 h-2 border-t-2 border-r-2 border-green-400 absolute right-0 transition-transform duration-1000 ease-in-out"
                 style={{ 
                   transform: `rotate(${gameState.wind.direction + Math.PI / 4}rad) translate(-2px, 0)` 
                 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Screen */}
      {gameState.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/90 backdrop-blur-sm z-50">
          <div className="bg-black/80 border border-red-600 p-10 text-center max-w-lg shadow-[0_0_100px_rgba(220,38,38,0.4)] animate-fade-in-up relative overflow-hidden">
            {/* Red Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.1)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
            
            <div className="inline-block px-4 py-1 border border-red-900 bg-red-900/20 text-red-500 text-xs tracking-[0.4em] mb-6 font-bold">CRITICAL FAILURE</div>
            
            <h1 className="text-6xl md:text-7xl text-red-600 mb-2 font-black tracking-widest glitch-text drop-shadow-[0_0_10px_red]">COLLISION</h1>
            <p className="text-red-400/60 mb-8 font-mono tracking-widest text-sm">AIRSPACE INTEGRITY COMPROMISED</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8 text-sm font-mono text-gray-400 border-y border-red-900/30 py-6">
              <div className="text-right pr-6 border-r border-red-900/30">
                <div className="text-[10px] text-red-800 uppercase">Final Score</div>
                <div className="text-3xl text-white font-bold">{gameState.score}</div>
              </div>
              <div className="text-left pl-6">
                <div className="text-[10px] text-red-800 uppercase">Operations</div>
                <div className="text-3xl text-white font-bold">{gameState.planesLanded}</div>
              </div>
            </div>

            <button 
              onClick={onRestart}
              className="w-full bg-red-600 hover:bg-red-500 text-black font-bold px-8 py-4 text-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)]"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              SYSTEM REBOOT
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="flex justify-between items-end pointer-events-auto font-mono z-20">
         <button 
           onClick={onTogglePause}
           className={`border px-6 py-2 text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_15px_rgba(51,255,51,0.3)] ${
             gameState.paused 
               ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500 animate-pulse' 
               : 'bg-green-900/20 border-green-700 text-green-400 hover:bg-green-500 hover:text-black'
           }`}
           style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
         >
           <i className={`fas ${gameState.paused ? 'fa-play' : 'fa-pause'} mr-2`}></i>
           {gameState.paused ? 'RESUME SIGNAL' : 'FREEZE'}
         </button>
         
         <div className="text-[10px] text-green-800 flex flex-col items-end opacity-60">
           <span className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div> LIVE FEED</span>
           <span>SECURE CONNECTION</span>
         </div>
      </div>
    </div>
  );
};