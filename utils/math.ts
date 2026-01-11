import { Vector2 } from '../types';

export const add = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x + v2.x, y: v1.y + v2.y });
export const sub = (v1: Vector2, v2: Vector2): Vector2 => ({ x: v1.x - v2.x, y: v1.y - v2.y });
export const mult = (v: Vector2, n: number): Vector2 => ({ x: v.x * n, y: v.y * n });

export const dist = (v1: Vector2, v2: Vector2): number => {
  const dx = v1.x - v2.x;
  const dy = v1.y - v2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const normalize = (v: Vector2): Vector2 => {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y);
  return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag };
};

export const angleToVector = (angle: number): Vector2 => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
});

export const vectorToAngle = (v: Vector2): number => Math.atan2(v.y, v.x);

export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateCallsign = () => {
  const airlines = ['UA', 'AA', 'DL', 'SW', 'BA', 'LH', 'AF'];
  const airline = airlines[Math.floor(Math.random() * airlines.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  return `${airline}${num}`;
};