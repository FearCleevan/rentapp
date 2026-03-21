export const Colors = {
  primary:      '#FF6B35',
  primaryLight: '#FFF0EB',
  primaryDark:  '#E05520',

  teal:         '#0D9E75',
  tealLight:    '#E1F5EE',
  tealDark:     '#085041',

  amber:        '#F59E0B',
  amberLight:   '#FFFBEB',

  surface:      '#FFFFFF',
  bg:           '#F7F5F2',
  bgCard:       '#FDFCFB',

  ink:          '#1A1A1A',
  muted:        '#666666',
  subtle:       '#999999',
  placeholder:  '#BBBBBB',
  border:       '#EBEBEB',
  borderStrong: '#D0D0D0',

  error:        '#EF4444',
  errorLight:   '#FEF2F2',
  success:      '#10B981',
  successLight: '#ECFDF5',
  warning:      '#F59E0B',
  warningLight: '#FFFBEB',

  white:        '#FFFFFF',
  black:        '#000000',
  transparent:  'transparent',
} as const;

export const Typography = {
  fontFamily: {
    regular:    'PlusJakartaSans_400Regular',
    medium:     'PlusJakartaSans_500Medium',
    semibold:   'PlusJakartaSans_600SemiBold',
    bold:       'PlusJakartaSans_700Bold',
    extrabold:  'PlusJakartaSans_800ExtraBold',
  },
  size: {
    xs:   11,
    sm:   12,
    base: 14,
    md:   15,
    lg:   16,
    xl:   18,
    '2xl': 20,
    '3xl': 22,
    '4xl': 26,
    '5xl': 30,
    '6xl': 36,
  },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const Radius = {
  xs:   6,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// React Native Paper theme
export const PaperTheme = {
  colors: {
    primary:          Colors.primary,
    onPrimary:        Colors.white,
    primaryContainer: Colors.primaryLight,
    secondary:        Colors.teal,
    onSecondary:      Colors.white,
    background:       Colors.bg,
    surface:          Colors.surface,
    onSurface:        Colors.ink,
    error:            Colors.error,
    outline:          Colors.border,
  },
};