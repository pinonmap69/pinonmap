import { View, Text, StyleSheet, Platform } from 'react-native';
import { Compass } from 'lucide-react-native';
import { ComingSoon } from '@/components/ComingSoon';
import { EXPLORE_IMAGE } from '@/theme';

export function ExploreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore</Text>
      <ComingSoon image={EXPLORE_IMAGE} title="Explore Coming Soon" subtitle="Soon you'll discover trending destinations, hidden gems, and personalized recommendations from fellow travelers around the globe." icon={<Compass size={24} color="#2D7FF9" />} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#F8FAFC' },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937', paddingHorizontal: 20, marginBottom: 8 },
});
