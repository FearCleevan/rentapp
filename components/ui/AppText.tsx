//components/ui/AppText.tsx
import { Text, TextStyle, StyleSheet } from 'react-native';
import { Typography, Colors } from '@/constants/theme';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyLg' | 'caption' | 'label' | 'overline';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  weight?: Weight;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  center?: boolean;
}

const variantStyles: Record<Variant, TextStyle> = {
  display:  { fontSize: 36, lineHeight: 42 },
  h1:       { fontSize: 28, lineHeight: 34 },
  h2:       { fontSize: 22, lineHeight: 28 },
  h3:       { fontSize: 18, lineHeight: 24 },
  bodyLg:   { fontSize: 16, lineHeight: 24 },
  body:     { fontSize: 14, lineHeight: 22 },
  caption:  { fontSize: 12, lineHeight: 18 },
  label:    { fontSize: 13, lineHeight: 18 },
  overline: { fontSize: 11, lineHeight: 16, letterSpacing: 0.8, textTransform: 'uppercase' },
};

const weightMap: Record<Weight, string> = {
  regular:   Typography.fontFamily.regular,
  medium:    Typography.fontFamily.medium,
  semibold:  Typography.fontFamily.semibold,
  bold:      Typography.fontFamily.bold,
  extrabold: Typography.fontFamily.extrabold,
};

export function AppText({
  children,
  variant   = 'body',
  weight    = 'regular',
  color     = Colors.ink,
  style,
  numberOfLines,
  center,
}: Props) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        variantStyles[variant],
        { fontFamily: weightMap[weight], color },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </Text>
  );
}