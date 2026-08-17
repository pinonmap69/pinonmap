import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Settings as SettingsIcon, Pencil, LogOut, Globe, MapPin, Award, Trophy, Camera, Calendar } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { getProfileStats, type ProfileStats } from '@/lib/profiles';
import { signOut } from '@/lib/auth';

export function ProfileScreen() {
  const { navigate } = useNav();
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({ pins: 0, cities: 0, countries: 0 });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setStats(await getProfileStats(profile.id));
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await signOut(); } catch { setLoggingOut(false); }
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Podróżnik';
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear();
  const initial = displayName.charAt(0).toUpperCase();

  const STAT_ITEMS = [
    { label: 'Kraje', value: stats.countries, icon: Globe },
    { label: 'Miasta', value: stats.cities, icon: MapPin },
    { label: 'Piny', value: stats.pins, icon: Camera },
    { label: 'Odznaki', value: 0, icon: Trophy },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.cover} />
      <View style={styles.avatarWrap}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        )}
        <View style={styles.avatarBadge}><Award size={14} color="#fff" /></View>
      </View>
      <View style={styles.nameSection}>
        <FadeIn><Text style={styles.name} testID="profile-name">{displayName}</Text></FadeIn>
        <View style={styles.chipRow}>
          <View style={styles.levelChip}><Award size={12} color="#0F766E" /><Text style={styles.levelChipText}>Odkrywca</Text></View>
          <View style={styles.memberChip}><Calendar size={12} color="#4B5563" /><Text style={styles.memberChipText}>Członek od {memberYear}</Text></View>
        </View>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>
      <View style={styles.statsGrid}>
        {STAT_ITEMS.map((s, i) => {
          const Icon = s.icon;
          return (
            <FadeIn key={s.label} delay={i * 50} distance={12}>
              <View style={styles.statCard}>
                <Icon size={20} color="#2D7FF9" />
                <Text style={styles.statValue} testID={`profile-stat-${s.label}`}>{loading ? '—' : s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </FadeIn>
          );
        })}
      </View>
      <View style={styles.buttons}>
        <FadeIn delay={200}><TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={() => navigate('editProfile')} testID="profile-edit-btn"><Pencil size={16} color="#fff" /><Text style={styles.primaryBtnText}>Edytuj profil</Text></TouchableOpacity></FadeIn>
        <FadeIn delay={250}><TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.9} onPress={() => navigate('settings')} testID="profile-settings-btn"><SettingsIcon size={16} color="#1F2937" /><Text style={styles.secondaryBtnText}>Ustawienia</Text></TouchableOpacity></FadeIn>
        <FadeIn delay={300}><TouchableOpacity style={styles.logoutBtn} activeOpacity={0.9} onPress={handleLogout} disabled={loggingOut} testID="profile-logout-btn">{loggingOut ? <ActivityIndicator color="#EF4444" /> : (<><LogOut size={16} color="#EF4444" /><Text style={styles.logoutBtnText}>Wyloguj się</Text></>)}</TouchableOpacity></FadeIn>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingBottom: 120 },
  cover: { height: 128, backgroundColor: '#2D7FF9' },
  avatarWrap: { paddingHorizontal: 20, marginTop: -48 },
  avatar: { width: 96, height: 96, borderRadius: 28, backgroundColor: '#FF9F43', borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  avatarImg: { width: 96, height: 96, borderRadius: 28, borderWidth: 4, borderColor: '#fff', backgroundColor: '#E5E7EB' },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  avatarBadge: { position: 'absolute', bottom: 4, right: 24, width: 28, height: 28, borderRadius: 14, backgroundColor: '#3EC7B8', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  nameSection: { paddingHorizontal: 20, paddingTop: 12 },
  name: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  levelChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#CCFBF1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  levelChipText: { fontSize: 12, fontWeight: '600', color: '#0F766E' },
  memberChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  memberChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  bio: { marginTop: 10, fontSize: 14, color: '#4B5563', lineHeight: 20 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 20, gap: 8 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 18, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1F2937', marginTop: 4 },
  statLabel: { fontSize: 10, fontWeight: '500', color: '#6B7280' },
  buttons: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D7FF9', paddingVertical: 14, borderRadius: 18, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 14, borderRadius: 18 },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 18 },
  logoutBtnText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
});
