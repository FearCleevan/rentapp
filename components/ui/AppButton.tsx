import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle, TextStyle, View } from 'react-native';
import { AppText } from './AppText';
import { Colors, Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'teal';
type Size    = 'sm' | 'md' | 'lg';

interface Props {
  label:       string;
  onPress:     () => void;
  variant?:    Variant;
  size?:       Size;
  loading?:    boolean;
  disabled?:   boolean;
  fullWidth?:  boolean;
  icon?:       React.ReactNode;
  iconRight?:  React.ReactNode;
  style?:      ViewStyle;
}

const variantConfig: Record<Variant, { bg: string; text: string; border: string }> = {
  primary:   { bg: Colors.primary,    text: Colors.white,  border: Colors.primary },
  secondary: { bg: Colors.primaryLight, text: Colors.primary, border: Colors.primaryLight },
  ghost:     { bg: 'transparent',     text: Colors.ink,    border: Colors.border },
  danger:    { bg: Colors.error,      text: Colors.white,  border: Colors.error },
  teal:      { bg: Colors.teal,       text: Colors.white,  border: Colors.teal },
};

const sizeConfig: Record<Size, { height: number; px: number; fontSize: number; radius: number }> = {
  sm: { height: 38, px: 16, fontSize: 13, radius: Radius.md },
  md: { height: 48, px: 20, fontSize: 15, radius: Radius.md },
  lg: { height: 56, px: 24, fontSize: 16, radius: Radius.lg },
};

export function AppButton({
  label,
  onPress,
  variant   = 'primary',
  size      = 'lg',
  loading   = false,
  disabled  = false,
  fullWidth = true,
  icon,
  iconRight,
  style,
}: Props) {
  const vc = variantConfig[variant];
  const sc = sizeConfig[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        styles.base,
        {
          backgroundColor: isDisabled ? Colors.border : vc.bg,
          borderColor:     isDisabled ? Colors.border : vc.border,
          height:          sc.height,
          paddingHorizontal: sc.px,
          borderRadius:    sc.radius,
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <View style={styles.row}>
          {icon && <View style={styles.iconLeft}>{icon}</View>}
          <AppText
            weight="bold"
            style={{
              fontSize: sc.fontSize,
              color: isDisabled ? Colors.subtle : vc.text,
              fontFamily: 'PlusJakartaSans_700Bold',
            }}
          >
            {label}
          </AppText>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1.5,
    flexDirection:  'row',
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  iconLeft:  { marginRight: 2 },
  iconRight: { marginLeft:  2 },
});