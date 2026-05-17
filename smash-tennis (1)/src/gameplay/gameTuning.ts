export const COURT_WIDTH = 10.97;
export const COURT_LENGTH = 23.77;
export const NET_HEIGHT = 0.914;
export const MAX_RALLY_SPEED_MULTIPLIER = 1.5;
export const BASE_BALL_SPEED = 1;
export const COURT_RENDERING = {
  surroundingWidth: 30,
  surroundingLength: 40,
  lineWidth: 0.1,
  serviceLineZ: 6.4,
  centerMarkLength: 0.8,
  netPostPadding: 0.914,
  netDepth: 0.05,
  netTopBandHeight: 0.08,
  netTopBandDepth: 0.08,
  netPostHeight: 1.07
};
export const DOUBLES_COURT_WIDTH = 10.97;
export const SINGLES_COURT_WIDTH = 8.23;
export const SERVE_BOX_LENGTH = 6.4;
export const BACK_COURT_LENGTH_OFFSET = 3;
export const OUT_OF_BOUNDS_LIMITS = { x: 10, y: 10, z: 15, playerBackZ: 15, aiBackZ: -15 };
export const SHOT_TARGETS = {
  SERVE_DEUCE: { x: 2, z: -5 },
  SERVE_AD: { x: -2, z: -5 },
  DEEP: { x: 0, z: -9 },
  aiMinZ: -3,
  aiZRange: 6,
  playerMinZ: 3,
  playerZRange: 6,
  rallyXRange: 8,
  aiServeZ: -5,
  playerServeZ: 5,
  serveAdTargetX: -3,
  serveDeuceTargetX: 3,
  serveRandomXRange: 2
};
export const ERROR_MARGINS = {
  width: 0.5,
  length: 0.5
};
export const AI_BASELINE_POSITION = { x: 0, z: -10, wobbleAmount: 2 };
export const AI_MISS_DRAMA = {
  lungeSpeedMultiplier: 1.5,
  nearMissDistance: 1,
  swingDurationMs: 300,
  desperationZoneZ: -5,
  lateSwingDistance: 2
};
export const OVERHEAD_SMASH_CONFIG = {
  timingWindow: 0.8,
  netDistanceThreshold: 7.0,
  smashDownwardVelocity: -7.5,
  smashSpeedMultiplier: 2.8,
  cameraShakeDuration: 0.25,
  retriggerCooldown: 2,
  weakReturnSpeedMultiplier: 0.4,
  maxSmashHeight: 9.0,
  smashHeightThreshold: 2.2,
  playerBackWindow: 1.5,
  playerForwardWindow: 4.5,
  lateralWindow: 3.5,
  assistedPositionStrength: 0.2,
  assistedMaxStep: 0.8,
  autoAlignmentStrength: 0.25,
  failWeakReturnRadius: 2.5,
  slowdownAmount: 0.25,
  cameraShakeIntensity: 0.35
};
export const PLAYER_BASELINE_POSITION = { z: 10 };
export const SERVE_POSITIONS = {
  PLAYER_DEUCE: { x: 2, z: 12 },
  PLAYER_AD: { x: -2, z: 12 },
  AI_DEUCE: { x: -2, z: -12 },
  AI_AD: { x: 2, z: -12 },
  ballXOffset: 0.5,
  ballZOffset: 1.0,
  ballHeight: 2.0,
  aiZ: -12,
  aiDeuceX: -2,
  aiAdX: 2,
  aiDelaySeconds: 1
};
export const PLAYER_MOVEMENT_LIMITS = {
  x: 10,
  minZ: 0,
  maxZ: 15,
  minX: -5.5,
  maxX: 5.5,
  serveZ: 12,
  deuceServeX: 2,
  adServeX: -2,
  smashAssistMinX: -4,
  smashAssistMaxX: 4
};
export const TUNING = {};
