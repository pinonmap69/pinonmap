import { View, StyleSheet } from 'react-native';
import { BarChart3 } from 'lucide-react-native';
import { ComingSoon } from '@/components/ComingSoon';
import { STATS_IMAGE } from '@/theme';

export function StatisticsScreen() {
  return (
    <View style={styles.container}>
      <ComingSoon image={STATS_IMAGE} title="Travel Statistics Coming Soon" subtitle="Visualize your travel journey with beautiful charts — miles traveled, countries visited, days on the road, and more." icon={<BarChart3 size={24} color="#2D7FF9" />} />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F8FAFC' } });
