import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import type { Place } from '@/lib/places';
import { statusColor } from '@/lib/status';

const HEIGHTS = [150, 210, 175, 240, 190, 165];

interface Props {
  places: Place[];
  onPress: (p: Place) => void;
  testPrefix: string;
  /** Optional small caption under the location line (e.g. "3.2 km"). */
  caption?: (p: Place) => string | undefined;
}

/** Two-column Pinterest-style grid used by boards, search and area results. */
export function PlaceMasonry({ places, onPress, testPrefix, caption }: Props) {
  const columns: Place[][] = [[], []];
  places.forEach((p, i) => columns[i % 2].push(p));
  return (
    <View style={styles.masonry}>
      {columns.map((col, ci) => (
        <View key={ci} style={styles.col}>
          {col.map((p, i) => (
            <TouchableOpacity key={p.id} style={styles.card} onPress={() => onPress(p)} testID={`${testPrefix}-${p.id}`} activeOpacity={0.85}>
              {p.cover_url
                ? <Image source={{ uri: p.cover_url }} style={[styles.img, { height: HEIGHTS[(ci * 3 + i) % HEIGHTS.length] }]} />
                : <View style={[styles.img, styles.ph, { height: 150 }]}><MapPin size={22} color="#94A3B8" /></View>}
              <View style={[styles.dot, { backgroundColor: statusColor(p.status) }]} />
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>{p.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>{[p.city, p.country].filter(Boolean).join(', ') || `${p.latitude.toFixed(3)}, ${p.longitude.toFixed(3)}`}</Text>
                {caption?.(p) ? <Text style={styles.caption}>{caption(p)}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  masonry: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  img: { width: '100%' },
  ph: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 10, left: 10, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  body: { padding: 12, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  meta: { fontSize: 12, color: '#6B7280' },
  caption: { fontSize: 11, fontWeight: '700', color: '#2D7FF9', marginTop: 2 },
});
