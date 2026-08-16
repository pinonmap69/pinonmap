import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Moon, Globe, Bell, Shield, FileText, Mail, LogOut, ChevronRight } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';
import type { Screen } from '@/types';

interface SettingsScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: '#DBEAFE' }]}><Moon size={20} color="#2563EB" /></View><Text style={styles.rowLabel}>Dark Mode</Text><TouchableOpacity activeOpacity={0.8} onPress={() => setDarkMode((d) => !d)} style={[styles.toggle, darkMode ? styles.toggleOn : null]}><View style={[styles.toggleKnob, darkMode ? styles.toggleKnobOn : null]} /></TouchableOpacity></View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} activeOpacity={0.7}><View style={[styles.rowIcon, { backgroundColor: '#CCFBF1' }]}><Globe size={20} color="#0F766E" /></View><Text style={styles.rowLabel}>Language</Text><View style={styles.rowRight}><Text style={styles.rowRightText}>English</Text><ChevronRight size={16} color="#D1D5DB" /></View></TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: '#FFEDD5' }]}><Bell size={20} color="#C2410C" /></View><Text style={styles.rowLabel}>Notifications</Text><TouchableOpacity activeOpacity={0.8} onPress={() => setNotifications((n) => !n)} style={[styles.toggle, notifications ? styles.toggleOn : null]}><View style={[styles.toggleKnob, notifications ? styles.toggleKnobOn : null]} /></TouchableOpacity></View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>LEGAL & SUPPORT</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => onNavigate('privacy')}><View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}><Shield size={20} color="#4B5563" /></View><Text style={styles.rowLabel}>Privacy Policy</Text><ChevronRight size={16} color="#D1D5DB" /></TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => onNavigate('terms')}><View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}><FileText size={20} color="#4B5563" /></View><Text style={styles.rowLabel}>Terms of Service</Text><ChevronRight size={16} color="#D1D5DB" /></TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} activeOpacity={0.7}><View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}><Mail size={20} color="#4B5563" /></View><Text style={styles.rowLabel}>Contact</Text><ChevronRight size={16} color="#D1D5DB" /></TouchableOpacity>
        </View>
      </View>
      <FadeIn delay={200}><TouchableOpacity style={styles.logoutBtn} activeOpacity={0.9}><LogOut size={16} color="#EF4444" /><Text style={styles.logoutBtnText}>Logout</Text></TouchableOpacity></FadeIn>
      <Text style={styles.version}>Pin on Map v1.0.0 — Stage 1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingHorizontal: 20, paddingBottom: 100, backgroundColor: '#F8FAFC', gap: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  section: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, paddingHorizontal: 4 },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowIcon: { width: 40, height: 40, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowRightText: { fontSize: 14, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F9FAFB', marginHorizontal: 16 },
  toggle: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', padding: 2 },
  toggleOn: { backgroundColor: '#2D7FF9' },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  toggleKnobOn: { transform: [{ translateX: 20 }] },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 18 },
  logoutBtnText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#9CA3AF' },
});
