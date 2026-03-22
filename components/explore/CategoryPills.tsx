// components/explore/CategoryPills.tsx
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { CATEGORIES, type Category } from './exploreData';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface Props {
  active:   Category;
  onChange: (c: Category) => void;
}

export function CategoryPills({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map(c => {
        const isActive = active === c.key;
        return (
          <TouchableOpacity
            key={c.key}
            onPress={() => onChange(c.key)}
            activeOpacity={0.75}
            style={[styles.pill, isActive && styles.pillActive]}
          >
            <Feather
              name={c.icon as any}
              size={13}
              color={isActive ? Colors.white : Colors.muted}
            />
            <AppText
              variant="caption"
              weight="bold"
              color={isActive ? Colors.white : Colors.muted}
              style={{ marginLeft: 5 }}
            >
              {c.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingBottom: Spacing.md,
    gap:           8,
  },
  pill: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   7,
    paddingHorizontal: 13,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.white,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor:     Colors.primary,
  },
});