// components/ui/CategoryIcon.tsx
// Shared icon component for listing categories.
// Used in Explore, Bookings, Saved, and Host screens.

import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Radius } from '@/constants/theme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export const CATEGORY_CONFIG: Record<string, {
  icon:  FeatherName;
  color: string;
  bg:    string;
}> = {
  parking:      { icon: 'map-pin',   color: '#FF6B35', bg: '#FFF0EB' },
  room:         { icon: 'home',      color: '#0D9E75', bg: '#E8F8F3' },
  vehicle:      { icon: 'truck',     color: '#534AB7', bg: '#EEEDFE' },
  equipment:    { icon: 'camera',    color: '#854F0B', bg: '#FAEEDA' },
  venue:        { icon: 'calendar',  color: '#C0480A', bg: '#FAECE7' },
  event_venue:  { icon: 'calendar',  color: '#C0480A', bg: '#FAECE7' },
  meeting_room: { icon: 'briefcase', color: '#1A6E8C', bg: '#DDE8EC' },
  storage:      { icon: 'package',   color: '#5F5E5A', bg: '#F1EFE8' },
};

interface Props {
  category:   string;
  size?:      number;      // icon size
  tileSize?:  number;      // outer box size
  radius?:    number;      // border radius of tile
  showTile?:  boolean;     // wrap in colored tile
}

export function CategoryIcon({
  category,
  size      = 22,
  tileSize  = 52,
  radius    = 12,
  showTile  = true,
}: Props) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.storage;

  if (!showTile) {
    return <Feather name={cfg.icon} size={size} color={cfg.color} />;
  }

  return (
    <View
      style={[
        styles.tile,
        {
          width:           tileSize,
          height:          tileSize,
          borderRadius:    radius,
          backgroundColor: cfg.bg,
        },
      ]}
    >
      <Feather name={cfg.icon} size={size} color={cfg.color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
});
