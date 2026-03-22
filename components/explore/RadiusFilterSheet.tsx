// components/explore/RadiusFilterSheet.tsx
import {
  View, TouchableOpacity, StyleSheet, Modal,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { RADIUS_OPTIONS, type Category, CATEGORIES } from './exploreData';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

interface Props {
  visible:        boolean;
  radiusKm:       number;
  category:       Category;
  onClose:        () => void;
  onRadiusChange: (r: number) => void;
  onCategoryChange: (c: Category) => void;
  onReset:        () => void;
  onApply:        () => void;
}

export function RadiusFilterSheet({
  visible, radiusKm, category,
  onClose, onRadiusChange, onCategoryChange,
  onReset, onApply,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <AppText variant="h3" weight="extrabold">Filters</AppText>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {/* ── Radius section ── */}
          <AppText
            variant="overline"
            weight="bold"
            color={Colors.subtle}
            style={styles.sectionLabel}
          >
            Search radius
          </AppText>

          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radiusKm === r && styles.radiusBtnActive]}
                onPress={() => onRadiusChange(r)}
                activeOpacity={0.8}
              >
                <AppText
                  variant="label"
                  weight="bold"
                  color={radiusKm === r ? Colors.white : Colors.muted}
                >
                  {r} km
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Visual radius indicator */}
          <View style={styles.radiusVisual}>
            <View style={styles.radiusCircle}>
              <View style={[
                styles.radiusInner,
                { transform: [{ scale: radiusKm / 20 }] },
              ]} />
              <View style={styles.radiusDot} />
              <Feather name="map-pin" size={14} color={Colors.primary} style={styles.radiusPin} />
            </View>
            <AppText variant="caption" color={Colors.muted} center style={{ marginTop: Spacing.sm }}>
              Showing listings within {radiusKm} km of your location
            </AppText>
          </View>

          {/* ── Category section ── */}
          <AppText
            variant="overline"
            weight="bold"
            color={Colors.subtle}
            style={styles.sectionLabel}
          >
            Category
          </AppText>

          <View style={styles.catGrid}>
            {CATEGORIES.map(c => {
              const isActive = category === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catBtn, isActive && styles.catBtnActive]}
                  onPress={() => onCategoryChange(c.key)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={c.icon as any}
                    size={16}
                    color={isActive ? Colors.white : Colors.muted}
                  />
                  <AppText
                    variant="caption"
                    weight="bold"
                    color={isActive ? Colors.white : Colors.muted}
                    style={{ marginTop: 4 }}
                    center
                  >
                    {c.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.resetBtn} onPress={onReset} activeOpacity={0.8}>
              <AppText variant="label" weight="bold" color={Colors.muted}>
                Reset all
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={onApply} activeOpacity={0.85}>
              <AppText variant="label" weight="bold" color={Colors.white}>
                Apply filters
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    padding:         Spacing.xl,
    paddingBottom:   40,
  },
  handle: {
    width:           40,
    height:          4,
    borderRadius:    2,
    backgroundColor: Colors.border,
    alignSelf:       'center',
    marginBottom:    Spacing.lg,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   Spacing.xl,
  },
  sectionLabel: {
    marginBottom: Spacing.sm,
  },

  radiusRow: {
    flexDirection:  'row',
    gap:            8,
    marginBottom:   Spacing.lg,
  },
  radiusBtn: {
    flex:              1,
    paddingVertical:   9,
    alignItems:        'center',
    borderRadius:      Radius.md,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.white,
  },
  radiusBtnActive: {
    backgroundColor: Colors.primary,
    borderColor:     Colors.primary,
  },

  radiusVisual: {
    alignItems:    'center',
    marginBottom:  Spacing.xl,
  },
  radiusCircle: {
    width:           100,
    height:          100,
    borderRadius:    50,
    borderWidth:     2,
    borderColor:     Colors.primary + '40',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: Colors.primaryLight,
  },
  radiusInner: {
    position:        'absolute',
    width:           70,
    height:          70,
    borderRadius:    35,
    backgroundColor: Colors.primary + '20',
    borderWidth:     1.5,
    borderColor:     Colors.primary + '60',
  },
  radiusDot: {
    width:           10,
    height:          10,
    borderRadius:    5,
    backgroundColor: Colors.primary,
  },
  radiusPin: {
    position: 'absolute',
    top:      8,
  },

  catGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            8,
    marginBottom:   Spacing.xl,
  },
  catBtn: {
    width:           '30%',
    paddingVertical:  12,
    alignItems:      'center',
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.white,
  },
  catBtnActive: {
    backgroundColor: Colors.primary,
    borderColor:     Colors.primary,
  },

  actions: {
    flexDirection: 'row',
    gap:           Spacing.sm,
  },
  resetBtn: {
    flex:              1,
    paddingVertical:   14,
    alignItems:        'center',
    borderRadius:      Radius.md,
    borderWidth:       1.5,
    borderColor:       Colors.border,
  },
  applyBtn: {
    flex:              2,
    paddingVertical:   14,
    alignItems:        'center',
    borderRadius:      Radius.md,
    backgroundColor:   Colors.primary,
  },
});