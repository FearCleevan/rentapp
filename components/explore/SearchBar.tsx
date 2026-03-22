// components/explore/SearchBar.tsx
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props {
  value:        string;
  onChange:     (v: string) => void;
  onFilterPress: () => void;
}

export function SearchBar({ value, onChange, onFilterPress }: Props) {
  return (
    <View style={styles.bar}>
      <Feather name="search" size={16} color={Colors.subtle} />
      <TextInput
        style={styles.input}
        placeholder="Search parking, rooms, vehicles…"
        placeholderTextColor={Colors.subtle}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChange('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="x" size={15} color={Colors.subtle} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.filterBtn}
        onPress={onFilterPress}
        activeOpacity={0.85}
      >
        <Feather name="sliders" size={14} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.bg,
    borderRadius:      Radius.md,
    paddingHorizontal: 14,
    paddingVertical:   2,
    marginBottom:      Spacing.md,
    borderWidth:       1.5,
    borderColor:       Colors.border,
  },
  input: {
    flex:            1,
    fontSize:        14,
    color:           Colors.ink,
    marginLeft:      8,
    paddingVertical: 10,
    fontFamily:      'PlusJakartaSans_400Regular',
  },
  filterBtn: {
    width:           34,
    height:          34,
    borderRadius:    8,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      8,
  },
});