import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Route as RouteIcon, Trash2, ChevronRight, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { listRoutes, deleteRoute, type SavedRoute } from '@/lib/routes';
import { formatKm, formatDuration } from '@/lib/geo';

export function RoutesScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try { setRoutes(await listRoutes(profile.id)); setError(null); }
    catch (e: any) { setError(e?.message ?? 'Error'); }
    finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    setRoutes((r) => r.filter((x) => x.id !== id));
    try { await deleteRoute(id); } catch { load(); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} testID="routes-screen">
      <TouchableOpacity style={styles.newBtn} onPress={() => navigate('routePlanner')} testID="routes-new-btn">
        <Plus size={18} color="#fff" /><Text style={styles.newText}>{t('planTrip')}</Text>
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
      {routes.length === 0 ? <Text style={styles.muted} testID="routes-empty">{t('noRoutes')}</Text> : routes.map((r) => (
        <TouchableOpacity key={r.id} style={styles.row} onPress={() => navigate('routePlanner', { routeId: r.id })} testID={`route-item-${r.id}`}>
          <View style={styles.icon}><RouteIcon size={20} color="#2D7FF9" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{r.name}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {[r.distance_m ? formatKm(r.distance_m) : null, r.duration_s ? formatDuration(r.duration_s) : null, `${r.stops?.length ?? 0} ${t('stops').toLowerCase()}`].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => remove(r.id)} style={styles.del} testID={`route-delete-${r.id}`}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
          <ChevronRight size={16} color="#D1D5DB" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  newBtn: { height: 52, borderRadius: 16, backgroundColor: '#2D7FF9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 },
  newText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  meta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  del: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  muted: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 24 },
  error: { fontSize: 13, color: '#DC2626' },
});
