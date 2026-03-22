// components/explore/MapPreview.tsx
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, {
  Rect, Circle, Line, Path, Text as SvgText, G,
} from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

interface Props {
  listingLat:    number;
  listingLng:    number;
  listingEmoji:  string;
  listingTitle:  string;
  userLat?:      number;
  userLng?:      number;
}

// Convert lat/lng to SVG coordinates within a 340x200 viewport
// Davao City center: 7.0731, 125.6126
const CENTER_LAT = 7.0731;
const CENTER_LNG = 125.6126;
const SCALE = 2800; // pixels per degree

function toSvg(lat: number, lng: number, w = 340, h = 200) {
  const x = (lng - CENTER_LNG) * SCALE + w / 2;
  const y = (CENTER_LAT - lat) * SCALE + h / 2;
  return { x: Math.round(x), y: Math.round(y) };
}

// Simulated road network (static lines for Davao streets)
const ROADS = [
  { x1: 30,  y1: 100, x2: 310, y2: 100 }, // JP Laurel Ave
  { x1: 170, y1: 20,  x2: 170, y2: 180 }, // Quimpo Blvd
  { x1: 60,  y1: 60,  x2: 280, y2: 140 }, // Diagonal road
  { x1: 30,  y1: 140, x2: 200, y2: 50  }, // Another diagonal
  { x1: 100, y1: 20,  x2: 100, y2: 180 }, // Side street
  { x1: 240, y1: 20,  x2: 240, y2: 180 }, // Side street 2
  { x1: 30,  y1: 70,  x2: 310, y2: 70  }, // Street
  { x1: 30,  y1: 130, x2: 310, y2: 130 }, // Street
];

// Simulated building blocks
const BLOCKS = [
  { x: 110, y: 75,  w: 50, h: 20 },
  { x: 175, y: 45,  w: 60, h: 20 },
  { x: 175, y: 105, w: 60, h: 20 },
  { x: 250, y: 75,  w: 50, h: 20 },
  { x: 35,  y: 45,  w: 60, h: 20 },
  { x: 35,  y: 105, w: 60, h: 20 },
];

export function MapPreview({
  listingLat,
  listingLng,
  listingEmoji,
  listingTitle,
  userLat  = 7.0831,
  userLng  = 125.6026,
}: Props) {
  const W = 340;
  const H = 200;

  const listing = toSvg(listingLat, listingLng, W, H);
  const user    = toSvg(userLat,    userLng,    W, H);

  // Clamp to viewport
  const lx = Math.max(20, Math.min(W - 20, listing.x));
  const ly = Math.max(20, Math.min(H - 20, listing.y));
  const ux = Math.max(20, Math.min(W - 20, user.x));
  const uy = Math.max(20, Math.min(H - 20, user.y));

  // Route midpoint for slight curve
  const mx = (lx + ux) / 2;
  const my = (ly + uy) / 2 - 30;

  return (
    <View style={styles.container}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Map background */}
        <Rect x={0} y={0} width={W} height={H} fill="#F2EFE9" />

        {/* Road network */}
        {ROADS.map((r, i) => (
          <Line
            key={i}
            x1={r.x1} y1={r.y1}
            x2={r.x2} y2={r.y2}
            stroke="#FFFFFF"
            strokeWidth={5}
          />
        ))}
        {ROADS.map((r, i) => (
          <Line
            key={`c${i}`}
            x1={r.x1} y1={r.y1}
            x2={r.x2} y2={r.y2}
            stroke="#E8E4DC"
            strokeWidth={2}
          />
        ))}

        {/* Building blocks */}
        {BLOCKS.map((b, i) => (
          <Rect
            key={i}
            x={b.x} y={b.y}
            width={b.w} height={b.h}
            fill="#DDD9D2"
            rx={2}
          />
        ))}

        {/* Route line from user to listing */}
        <Path
          d={`M ${ux} ${uy} Q ${mx} ${my} ${lx} ${ly}`}
          stroke={Colors.primary}
          strokeWidth={2.5}
          strokeDasharray="6 4"
          fill="none"
          opacity={0.8}
        />

        {/* User location pulse */}
        <Circle cx={ux} cy={uy} r={18} fill={Colors.primary + '20'} />
        <Circle cx={ux} cy={uy} r={11} fill={Colors.primary + '40'} />
        <Circle cx={ux} cy={uy} r={6}  fill={Colors.primary} />
        <Circle cx={ux} cy={uy} r={3}  fill="#FFFFFF" />

        {/* Listing pin */}
        <G>
          {/* Shadow */}
          <Circle cx={lx} cy={ly + 18} r={8} fill="rgba(0,0,0,0.15)" />
          {/* Pin body */}
          <Circle cx={lx} cy={ly} r={18} fill={Colors.white} />
          <Circle cx={lx} cy={ly} r={16} fill={Colors.primary} />
          {/* Pin tail */}
          <Path
            d={`M ${lx - 6} ${ly + 14} L ${lx} ${ly + 22} L ${lx + 6} ${ly + 14}`}
            fill={Colors.primary}
          />
          {/* Emoji in pin */}
          <SvgText
            x={lx}
            y={ly + 5}
            textAnchor="middle"
            fontSize={14}
          >
            {listingEmoji}
          </SvgText>
        </G>

        {/* Labels */}
        <Rect x={ux - 18} y={uy - 30} width={36} height={18} rx={9} fill={Colors.primary} />
        <SvgText x={ux} y={uy - 17} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
          You
        </SvgText>
      </Svg>

      {/* Overlay info bar */}
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Feather name="navigation" size={12} color={Colors.primary} />
          <AppText variant="caption" weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            Get directions
          </AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Feather name="map-pin" size={12} color={Colors.muted} />
          <AppText variant="caption" color={Colors.muted} numberOfLines={1} style={{ marginLeft: 4, flex: 1 }}>
            {listingTitle}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius:  Radius.md,
    overflow:      'hidden',
    borderWidth:   1,
    borderColor:   Colors.border,
    ...Shadow.sm,
  },
  infoBar: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems:    'center',
    flex:          1,
  },
  divider: {
    width:            1,
    height:           16,
    backgroundColor:  Colors.border,
    marginHorizontal: Spacing.sm,
  },
});