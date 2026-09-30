import { Text, TouchableOpacity, StyleSheet, ScrollView, View } from 'react-native';
import type { ReactNode } from 'react';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
  icon?: ReactNode;
}

export function Chip({ label, active, onPress, testID, icon }: ChipProps) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} testID={testID} activeOpacity={0.8}>
      {icon}
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Single-line horizontally scrolling chip row (never wraps). */
export function ChipRow({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View style={styles.row} testID={testID}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 52, justifyContent: 'center' },
  rowContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: { flexShrink: 0, height: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  text: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  textActive: { color: '#fff' },
});
