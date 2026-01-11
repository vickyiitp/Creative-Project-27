export interface Vector2 {
  x: number;
  y: number;
}

export enum PlaneStatus {
  FLYING = 'FLYING',
  LANDING = 'LANDING',
  LANDED = 'LANDED',
  CRASHED = 'CRASHED',
}

export interface Plane {
  id: string;
  callsign: string;
  position: Vector2;
  velocity: Vector2; // Derived from heading/speed + wind
  speed: number;
  heading: number; // in radians
  targetPath: Vector2[];
  status: PlaneStatus;
  history: Vector2[]; // For trails
  radius: number;
  fuel: number;
}

export interface Wind {
  direction: number; // radians
  speed: number;
}

export interface GameState {
  score: number;
  planesLanded: number;
  planesCrashed: number;
  gameOver: boolean;
  paused: boolean;
  wind: Wind;
  level: number;
}