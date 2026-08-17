import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
}

export function ScreenHeader({ title, onBack, right, transparent }: ScreenHeaderProps) {
  return (
    <View style={[styles.container, transparent ? { backgroundColor: 'transparent' } : { backgroundColor: 'rgba(255,255,255,0.95)', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }]}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={22} color="#374151" />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, transparent ? { color: '#fff' } : { color: '#1F2937' }]} numberOfLines={1}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
});
