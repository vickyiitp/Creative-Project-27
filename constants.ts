export const CANVAS_SIZE = 800;
export const RADAR_RADIUS = 380;
export const RUNWAY_CENTER = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 };
export const RUNWAY_LENGTH = 100;
export const RUNWAY_WIDTH = 12;
export const RUNWAY_HEADING = -Math.PI / 2; // Pointing Up

export const SPAWN_RATE_INITIAL = 2000; // ms
export const MIN_SPAWN_DIST = 450;
export const PLANE_SPEED_MIN = 0.5;
export const PLANE_SPEED_MAX = 1.2;
export const COLLISION_THRESHOLD = 24;
export const LANDING_THRESHOLD = 20;
export const LANDING_ANGLE_TOLERANCE = 0.5; // radians

export const COLORS = {
  bg: '#050505',
  radarGreen: '#33ff33',
  radarDark: '#0f380f',
  plane: '#ccffcc',
  trail: '#33ff33',
  danger: '#ff3333',
  path: '#ffff33',
};