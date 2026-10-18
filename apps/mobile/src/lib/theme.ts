/**
 * Two palettes from the approved mockups: a calm dark navy for the home and
 * tough-day screens, and a light sage for journaling, resources and settings.
 * Every text/background pair meets WCAG AA (4.5:1) contrast.
 */
export const palettes = {
  dark: {
    background: '#0F1B29',
    surface: '#1F3742',
    surfaceAlt: '#2A4F57',
    border: '#22323F',
    text: '#FFFFFF',
    textSecondary: '#C9D3D8',
    textMuted: '#B9C6CC',
    accent: '#7FD1BF',
    primary: '#3A7F72',
    onPrimary: '#FFFFFF',
    danger: '#F4B3A5',
    dangerBorder: '#6E4740',
  },
  light: {
    background: '#F2F4F2',
    surface: '#FFFFFF',
    surfaceAlt: '#E1ECE8',
    border: '#E1E6E3',
    text: '#17262A',
    textSecondary: '#3F4F4B',
    textMuted: '#4D5D5A',
    accent: '#2F7A6C',
    primary: '#2F7A6C',
    onPrimary: '#FFFFFF',
    danger: '#8E2F1C',
    dangerBorder: '#E4B8AE',
  },
} as const;

export type PaletteName = keyof typeof palettes;
export type Palette = (typeof palettes)[PaletteName];

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 10, md: 14, lg: 18, pill: 999 } as const;

export const type = {
  caption: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 16, fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  heading: { fontSize: 20, fontWeight: '700' },
} as const;
