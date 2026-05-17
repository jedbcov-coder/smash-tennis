import { COLOR_SCHEME } from './colorScheme';

const { neon } = COLOR_SCHEME;

export const GRADIENTS = {
  sky: `linear-gradient(to bottom, ${neon.background}, ${neon.backgroundSoft})`,
  uiBackground: `radial-gradient(circle at top left, rgba(34, 211, 238, 0.28), transparent 34%), radial-gradient(circle at bottom right, rgba(232, 121, 249, 0.24), transparent 36%), linear-gradient(135deg, ${neon.background}, ${neon.backgroundSoft} 45%, #16091f)`,
  panel: `linear-gradient(135deg, rgba(34, 211, 238, 0.18), rgba(232, 121, 249, 0.14) 48%, rgba(251, 146, 60, 0.16))`,
  button: `linear-gradient(90deg, ${neon.cyan}, ${neon.magentaHot}, ${neon.orange})`,
  energy: `linear-gradient(90deg, ${neon.cyan}, ${neon.magentaHot}, ${neon.orange}, ${neon.gold})`,
  danger: `linear-gradient(90deg, ${neon.dangerHot}, ${neon.orangeHot})`,
  crtScanline: 'linear-gradient(rgba(18,16,16,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(34,211,238,0.08), rgba(232,121,249,0.05), rgba(251,146,60,0.07))'
};
