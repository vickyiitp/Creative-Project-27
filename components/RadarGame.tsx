import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CANVAS_SIZE, 
  COLORS, 
  RADAR_RADIUS, 
  RUNWAY_CENTER, 
  RUNWAY_HEADING, 
  RUNWAY_LENGTH, 
  RUNWAY_WIDTH,
  SPAWN_RATE_INITIAL,
  PLANE_SPEED_MIN,
  PLANE_SPEED_MAX,
  COLLISION_THRESHOLD,
  LANDING_THRESHOLD,
  LANDING_ANGLE_TOLERANCE
} from '../constants';
import { Plane, GameState, PlaneStatus, Vector2 } from '../types';
import { add, sub, mult, dist, angleToVector, vectorToAngle, randomRange, generateCallsign } from '../utils/math';
import { RetroUI } from './RetroUI';

export const RadarGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State Refs (Mutable for game loop)
  const planesRef = useRef<Plane[]>([]);
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const sweepAngleRef = useRef<number>(0);
  const draggingPlaneIdRef = useRef<string | null>(null);
  const tempPathRef = useRef<Vector2[]>([]);
  const animationFrameRef = useRef<number>(0);
  const windTimerRef = useRef<number>(0);

  // React State for UI
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    planesLanded: 0,
    planesCrashed: 0,
    gameOver: false,
    paused: false,
    wind: { direction: Math.PI / 4, speed: 1.0 },
    level: 1
  });

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const spawnPlane = () => {
    const angle = Math.random() * Math.PI * 2;
    // Spawn just outside radar radius
    const distFromCenter = RADAR_RADIUS + 10;
    const position = add(RUNWAY_CENTER, mult(angleToVector(angle), distFromCenter));
    
    // Initial heading towards center
    const toCenter = sub(RUNWAY_CENTER, position);
    const heading = vectorToAngle(toCenter) + randomRange(-0.5, 0.5);

    const newPlane: Plane = {
      id: Math.random().toString(36).substr(2, 9),
      callsign: generateCallsign(),
      position,
      velocity: mult(angleToVector(heading), randomRange(PLANE_SPEED_MIN, PLANE_SPEED_MAX)),
      speed: randomRange(PLANE_SPEED_MIN, PLANE_SPEED_MAX),
      heading,
      targetPath: [],
      status: PlaneStatus.FLYING,
      history: [],
      radius: 8,
      fuel: 100
    };
    planesRef.current.push(newPlane);
  };

  const checkCollisions = () => {
    const planes = planesRef.current.filter(p => p.status === PlaneStatus.FLYING);
    const crashIds = new Set<string>();

    for (let i = 0; i < planes.length; i++) {
      for (let j = i + 1; j < planes.length; j++) {
        const p1 = planes[i];
        const p2 = planes[j];
        const d = dist(p1.position, p2.position);
        if (d < COLLISION_THRESHOLD) {
          crashIds.add(p1.id);
          crashIds.add(p2.id);
        }
      }
    }

    if (crashIds.size > 0) {
      planesRef.current = planesRef.current.map(p => 
        crashIds.has(p.id) ? { ...p, status: PlaneStatus.CRASHED } : p
      );
      updateGameState({ 
        gameOver: true, 
        planesCrashed: gameState.planesCrashed + crashIds.size 
      });
      return true;
    }
    return false;
  };

  const checkLanding = (plane: Plane) => {
    const distToRunway = dist(plane.position, RUNWAY_CENTER);
    if (distToRunway < LANDING_THRESHOLD) {
      const approachAngle = Math.atan2(
        Math.sin(plane.heading - RUNWAY_HEADING),
        Math.cos(plane.heading - RUNWAY_HEADING)
      );

      if (Math.abs(approachAngle) < LANDING_ANGLE_TOLERANCE || Math.abs(approachAngle) > Math.PI - LANDING_ANGLE_TOLERANCE) {
         return true;
      }
    }
    return false;
  };

  const gameLoop = useCallback((timestamp: number) => {
    if (!gameStarted) return;
    
    if (gameState.paused || gameState.gameOver) {
       draw(); // Keep drawing
       animationFrameRef.current = requestAnimationFrame(gameLoop);
       return;
    }

    const dt = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Wind Logic
    windTimerRef.current += dt;
    if (windTimerRef.current > 15000) { // Change wind every 15s
      windTimerRef.current = 0;
      const newWind = {
        direction: Math.random() * Math.PI * 2,
        speed: randomRange(0.5, 3.0)
      };
      updateGameState({ wind: newWind });
    }

    // Spawning Logic
    spawnTimerRef.current += dt;
    const currentSpawnRate = Math.max(800, SPAWN_RATE_INITIAL - (gameState.score * 5));
    if (spawnTimerRef.current > currentSpawnRate && planesRef.current.length < 12) {
      spawnPlane();
      spawnTimerRef.current = 0;
    }

    // Update Planes
    planesRef.current.forEach(plane => {
      if (plane.status !== PlaneStatus.FLYING) return;

      if (plane.targetPath.length > 0) {
        const target = plane.targetPath[0];
        const distToTarget = dist(plane.position, target);
        
        if (distToTarget < 15) {
          plane.targetPath.shift();
        } else {
          const toTarget = sub(target, plane.position);
          const targetHeading = vectorToAngle(toTarget);
          
          let deltaAngle = targetHeading - plane.heading;
          while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
          while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
          
          plane.heading += deltaAngle * 0.08; // Smooth turn
        }
      }

      const thrustVector = mult(angleToVector(plane.heading), plane.speed);
      const windVector = mult(angleToVector(gameState.wind.direction), gameState.wind.speed * 0.15);
      
      const moveVector = add(thrustVector, windVector);
      plane.position = add(plane.position, moveVector);

      if (dist(plane.position, RUNWAY_CENTER) > RADAR_RADIUS + 120) {
         plane.status = PlaneStatus.CRASHED; // Lost comms
         updateGameState({ planesCrashed: gameState.planesCrashed + 1, gameOver: true });
      }

      if (Math.random() > 0.8) {
        plane.history.push({ ...plane.position });
        if (plane.history.length > 8) plane.history.shift();
      }

      if (checkLanding(plane)) {
        plane.status = PlaneStatus.LANDED;
        updateGameState({ 
          score: gameState.score + 100, 
          planesLanded: gameState.planesLanded + 1 
        });
      }
    });

    planesRef.current = planesRef.current.filter(p => p.status !== PlaneStatus.LANDED);
    const crashed = checkCollisions();
    sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (Math.PI * 2);

    draw();

    if (!crashed) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStarted, gameState.paused, gameState.gameOver, updateGameState]); // Dependencies for useCallback

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid (Faint Green)
    ctx.strokeStyle = 'rgba(20, 50, 20, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < CANVAS_SIZE; i += 100) {
      ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_SIZE);
      ctx.moveTo(0, i); ctx.lineTo(CANVAS_SIZE, i);
    }
    ctx.stroke();

    // Radar Circles (Glowing)
    ctx.strokeStyle = COLORS.radarDark;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(RUNWAY_CENTER.x, RUNWAY_CENTER.y, RADAR_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner Rings
    ctx.strokeStyle = 'rgba(51, 255, 51, 0.1)';
    ctx.beginPath();
    ctx.arc(RUNWAY_CENTER.x, RUNWAY_CENTER.y, RADAR_RADIUS * 0.66, 0, Math.PI * 2);
    ctx.arc(RUNWAY_CENTER.x, RUNWAY_CENTER.y, RADAR_RADIUS * 0.33, 0, Math.PI * 2);
    ctx.stroke();

    // Runway
    ctx.save();
    ctx.translate(RUNWAY_CENTER.x, RUNWAY_CENTER.y);
    ctx.rotate(RUNWAY_HEADING);
    ctx.fillStyle = '#222';
    ctx.fillRect(-RUNWAY_WIDTH / 2, -RUNWAY_LENGTH / 2, RUNWAY_WIDTH, RUNWAY_LENGTH);
    ctx.fillStyle = '#33ff33';
    ctx.shadowColor = '#33ff33';
    ctx.shadowBlur = 10;
    ctx.fillRect(-RUNWAY_WIDTH / 2, RUNWAY_LENGTH / 2 - 4, RUNWAY_WIDTH, 4); // Threshold
    ctx.shadowBlur = 0;
    ctx.restore();

    // Planes
    planesRef.current.forEach(plane => {
      // Trail
      ctx.fillStyle = COLORS.trail;
      plane.history.forEach((pos, idx) => {
        ctx.globalAlpha = (idx / plane.history.length) * 0.3;
        ctx.fillRect(pos.x, pos.y, 2, 2);
      });
      ctx.globalAlpha = 1.0;

      // Planned Path
      if (plane.targetPath.length > 0) {
        ctx.strokeStyle = COLORS.path;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(plane.position.x, plane.position.y);
        plane.targetPath.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillStyle = COLORS.path;
        plane.targetPath.forEach(pt => ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4));
      }

      // Icon
      ctx.save();
      ctx.translate(plane.position.x, plane.position.y);
      
      // Proximity Alert
      const nearestDist = planesRef.current
        .filter(p => p.id !== plane.id && p.status === PlaneStatus.FLYING)
        .reduce((min, p) => Math.min(min, dist(plane.position, p.position)), 9999);
      
      if (nearestDist < COLLISION_THRESHOLD * 2.5 && plane.status === PlaneStatus.FLYING) {
        ctx.strokeStyle = COLORS.danger;
        ctx.lineWidth = 1;
        ctx.shadowColor = COLORS.danger;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 15 + Math.sin(Date.now() / 150) * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.rotate(plane.heading);
      
      if (plane.status === PlaneStatus.CRASHED) {
         ctx.strokeStyle = COLORS.danger;
         ctx.lineWidth = 2;
         ctx.shadowColor = COLORS.danger;
         ctx.shadowBlur = 20;
         ctx.beginPath();
         ctx.moveTo(-8, -8); ctx.lineTo(8, 8);
         ctx.moveTo(8, -8); ctx.lineTo(-8, 8);
         ctx.stroke();
         ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = COLORS.plane;
        ctx.shadowColor = COLORS.plane;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-6, 6);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-6, -6);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Label
      if (plane.status === PlaneStatus.FLYING) {
        ctx.fillStyle = COLORS.plane;
        ctx.font = '14px "VT323", monospace';
        ctx.fillText(plane.callsign, plane.position.x + 14, plane.position.y - 14);
      }
    });

    // Drag Line
    if (draggingPlaneIdRef.current && tempPathRef.current.length > 0) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 5;
      ctx.beginPath();
      const plane = planesRef.current.find(p => p.id === draggingPlaneIdRef.current);
      if (plane) {
        ctx.moveTo(plane.position.x, plane.position.y);
        tempPathRef.current.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
    }

    // Sweep with Glow
    const sweepGradient = ctx.createConicGradient(sweepAngleRef.current, RUNWAY_CENTER.x, RUNWAY_CENTER.y);
    sweepGradient.addColorStop(0, 'rgba(51, 255, 51, 0)');
    sweepGradient.addColorStop(0.85, 'rgba(51, 255, 51, 0)');
    sweepGradient.addColorStop(1, 'rgba(51, 255, 51, 0.2)');
    
    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.arc(RUNWAY_CENTER.x, RUNWAY_CENTER.y, RADAR_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Sweep Line
    ctx.save();
    ctx.strokeStyle = 'rgba(51, 255, 51, 0.8)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#33ff33';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(RUNWAY_CENTER.x, RUNWAY_CENTER.y);
    const tip = add(RUNWAY_CENTER, mult(angleToVector(sweepAngleRef.current), RADAR_RADIUS));
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.restore();
  };

  const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!gameStarted || gameState.gameOver || gameState.paused) return;
    const pos = getMousePos(e);
    
    const clickedPlane = planesRef.current.find(p => dist(p.position, pos) < 40 && p.status === PlaneStatus.FLYING);
    if (clickedPlane) {
      draggingPlaneIdRef.current = clickedPlane.id;
      tempPathRef.current = [];
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggingPlaneIdRef.current) return;
    const pos = getMousePos(e);
    
    if (tempPathRef.current.length === 0 || dist(pos, tempPathRef.current[tempPathRef.current.length - 1]) > 20) {
      tempPathRef.current.push(pos);
    }
  };

  const handleMouseUp = () => {
    if (draggingPlaneIdRef.current) {
      const plane = planesRef.current.find(p => p.id === draggingPlaneIdRef.current);
      if (plane && tempPathRef.current.length > 0) {
        plane.targetPath = [...tempPathRef.current];
      }
      draggingPlaneIdRef.current = null;
      tempPathRef.current = [];
    }
  };

  const handleStart = () => {
    setGameStarted(true);
    lastTimeRef.current = performance.now();
  };

  const handleRestart = () => {
    planesRef.current = [];
    setGameState({
      score: 0,
      planesLanded: 0,
      planesCrashed: 0,
      gameOver: false,
      paused: false,
      wind: { direction: Math.PI / 4, speed: 1.0 },
      level: 1
    });
    setGameStarted(true);
    lastTimeRef.current = performance.now();
  };

  useEffect(() => {
    if (gameStarted) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameLoop, gameStarted]);

  useEffect(() => {
      // Clean initial draw
      draw();
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden scanlines">
      <RetroUI 
        gameState={gameState} 
        gameStarted={gameStarted}
        onStart={handleStart}
        onRestart={handleRestart}
        onTogglePause={() => updateGameState({ paused: !gameState.paused })}
      />
      
      <div className="relative border-4 border-[#1a1a1a] rounded-full shadow-[0_0_50px_rgba(0,255,0,0.1)] overflow-hidden bg-[#050505] transition-all duration-1000">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{ touchAction: 'none' }}
          className="w-[800px] h-[800px] max-w-[95vmin] max-h-[95vmin] cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
        
        {/* Compass */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-green-900/50 font-bold select-none">N</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-green-900/50 font-bold select-none">S</div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-green-900/50 font-bold select-none">W</div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-900/50 font-bold select-none">E</div>
      </div>
    </div>
  );
};