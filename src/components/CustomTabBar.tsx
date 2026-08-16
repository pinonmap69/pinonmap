import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { TABS } from '@/theme';
import type { Screen } from '@/types';

interface CustomTabBarProps {
  activeTab: Screen;
  onTab: (tab: Screen) => void;
}

export function CustomTabBar({ activeTab, onTab }: CustomTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity key={tab.id} onPress={() => onTab(tab.id)} activeOpacity={0.7} style={styles.tabButton} accessibilityLabel={tab.label}>
              <View style={[styles.iconWrap, isActive ? styles.iconWrapActive : null]}>
                <Icon size={20} color={isActive ? '#fff' : '#9CA3AF'} strokeWidth={isActive ? 2.5 : 2} />
              </View>
              <Text style={[styles.label, isActive ? styles.labelActive : null]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: Platform.OS === 'ios' ? 28 : 12 },
  container: { marginHorizontal: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.97)', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 30, elevation: 10 },
  tabButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  iconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: '#2D7FF9', shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  label: { fontSize: 10, fontWeight: '600', color: '#9CA3AF' },
  labelActive: { color: '#2D7FF9' },
});
