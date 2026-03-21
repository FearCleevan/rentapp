import { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, StyleSheet,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { Colors, Radius, Typography } from '@/constants/theme';

interface Props extends TextInputProps {
  label?:       string;
  error?:       string;
  hint?:        string;
  iconLeft?:    React.ReactNode;
  isPassword?:  boolean;
  containerStyle?: ViewStyle;
  required?:    boolean;
}

export function AppInput({
  label,
  error,
  hint,
  iconLeft,
  isPassword = false,
  containerStyle,
  required,
  style,
  ...rest
}: Props) {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const borderColor = error
    ? Colors.error
    : focused
    ? Colors.primary
    : Colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <AppText variant="label" weight="semibold" color={Colors.muted}>
            {label}
          </AppText>
          {required && (
            <AppText variant="label" color={Colors.error}> *</AppText>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          { borderColor, backgroundColor: focused ? Colors.white : Colors.bg },
        ]}
      >
        {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}

        <TextInput
          {...rest}
          style={[
            styles.input,
            { fontFamily: Typography.fontFamily.medium },
            iconLeft ? { paddingLeft: 0 } : null,
            style,
          ]}
          secureTextEntry={isPassword && !showPass}
          onFocus={(e) => { setFocused(true);  rest.onFocus?.(e);  }}
          onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);   }}
          placeholderTextColor={Colors.placeholder}
          selectionColor={Colors.primary}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPass(v => !v)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather
              name={showPass ? 'eye' : 'eye-off'}
              size={18}
              color={Colors.subtle}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.feedbackRow}>
          <Feather name="alert-circle" size={12} color={Colors.error} />
          <AppText variant="caption" color={Colors.error} style={{ marginLeft: 4 }}>
            {error}
          </AppText>
        </View>
      ) : hint ? (
        <AppText variant="caption" color={Colors.subtle} style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  inputContainer: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1.5,
    borderRadius:   Radius.md,
    paddingHorizontal: 14,
    minHeight:      52,
  },
  input: {
    flex:       1,
    fontSize:   15,
    color:      Colors.ink,
    paddingVertical: 12,
  },
  iconLeft: { marginRight: 10 },
  eyeBtn:   { padding: 4 },
  feedbackRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginTop:     2,
  },
  hint: { marginTop: 2 },
});