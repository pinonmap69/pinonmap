import { View, Text, StyleSheet, Platform } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { ComingSoon } from '@/components/ComingSoon';
import { MAP_IMAGE } from '@/theme';

export function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Travel Map</Text>
      <ComingSoon image={MAP_IMAGE} title="Interactive Travel Map" subtitle="Available in the next development stage. Pin your visited places, plan future trips, and visualize your journey across the world." icon={<MapPin size={24} color="#2D7FF9" />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#F8FAFC' },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', paddingHorizontal: 20, marginBottom: 8 },
});
