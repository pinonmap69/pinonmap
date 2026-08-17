import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Moon, Globe, Bell, Shield, FileText, Mail, LogOut, ChevronRight } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';
import { useNav } from '@/navigation/nav';
import { signOut } from '@/lib/auth';

export function SettingsScreen() {
  const { navigate } = useNav();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Ustawienia</Text>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PREFERENCJE</Text>
        <View style={styles.card}>
          <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: '#DBEAFE' }]}><Moon size={20} color="#2563EB" /></View><Text style={styles.rowLabel}>Tryb ciemny</Text><TouchableOpacity activeOpacity={0.8} onPress={() => setDarkMode((d) => !d)} style={[styles.toggle, darkMode ? styles.toggleOn : null]} testID="settings-darkmode-toggle"><View style={[styles.toggleKnob, darkMode ? styles.toggleKnobOn : null]} /></TouchableOpacity></View>
          <View style={styles.divider} />
          <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: '#CCFBF1' }]}><Globe size={20} color="#0F766E" /></View><Text style={styles.rowLabel}>Język</Text><View style={styles.rowRight}><Text style={styles.rowRightText}>Polski</Text><ChevronRight size={16} color="#D1D5DB" /></View></View>
          <View style={styles.divider} />
          <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: '#FFEDD5' }]}><Bell size={20} color="#C2410C" /></View><Text style={styles.rowLabel}>Powiadomienia</Text><TouchableOpacity activeOpacity={0.8} onPress={() => setNotifications((n) => !n)} style={[styles.toggle, notifications ? styles.toggleOn : null]} testID="settings-notifications-toggle"><View style={[styles.toggleKnob, notifications ? styles.toggleKnobOn : null]} /></TouchableOpacity></View>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PRAWNE I POMOC</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigate('privacy')} testID="settings-privacy-btn"><View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}><Shield size={20} color="#4B5563" /></View><Text style={styles.rowLabel}>Polityka prywatności</Text><ChevronRight size={16} color="#D1D5DB" /></TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => navigate('terms')} testID="settings-terms-btn"><View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}><FileText size={20} color="#4B5563" /></View><Text style={styles.rowLabel}>Regulamin</Text><ChevronRight size={16} color="#D1D5DB" /></TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: '#F3F4F6' }]}><Mail size={20} color="#4B5563" /></View><Text style={styles.rowLabel}>Kontakt</Text><ChevronRight size={16} color="#D1D5DB" /></View>
        </View>
      </View>
      <FadeIn delay={200}>
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.9} onPress={handleLogout} disabled={loggingOut} testID="settings-logout-btn">
          {loggingOut ? <ActivityIndicator color="#EF4444" /> : (<><LogOut size={16} color="#EF4444" /><Text style={styles.logoutBtnText}>Wyloguj się</Text></>)}
        </TouchableOpacity>
      </FadeIn>
      <Text style={styles.version}>Pin on Map v1.0.0 — Etap 1 & 2</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingHorizontal: 20, paddingBottom: 120, gap: 20 },
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
