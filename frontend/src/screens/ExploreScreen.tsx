import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Platform, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Compass, MapPin } from 'lucide-react-native';
import { useNav } from '@/navigation/nav';
import { listPlaces, type Place } from '@/lib/places';
import { statusColor } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

const PAGE = 20;
// Deterministic pseudo-random tile heights for the masonry look.
const HEIGHTS = [150, 200, 240, 180, 220, 170, 260, 190];

export function ExploreScreen() {
  const { navigate } = useNav();
  const { t } = useLanguage();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [end, setEnd] = useState(false);

  const load = useCallback(async (offset: number, replace = false) => {
    const data = await listPlaces({ limit: PAGE, offset });
    setPlaces((prev) => (replace ? data : [...prev, ...data]));
    if (data.length < PAGE) setEnd(true);
  }, []);

  useEffect(() => {
    (async () => { try { await load(0, true); } catch { /* offline */ } finally { setLoading(false); } })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true); setEnd(false);
    try { await load(0, true); } catch {} finally { setRefreshing(false); }
  };

  const onScroll = async (e: any) => {
    if (loadingMore || end) return;
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 400) {
      setLoadingMore(true);
      try { await load(places.length); } catch {} finally { setLoadingMore(false); }
    }
  };

  const columns: Place[][] = [[], []];
  places.forEach((p, i) => columns[i % 2].push(p));

  return (
    <View style={styles.container} data-testid="explore-screen">
      <View style={styles.head}>
        <Text style={styles.title}>{t('inspirationFeed')}</Text>
        <Text style={styles.subtitle}>{t('exploreSubtitle')}</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>
      ) : places.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}><Compass size={26} color="#2D7FF9" /></View>
          <Text style={styles.emptyText}>{t('exploreEmpty')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.feed}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={200}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7FF9" />}
        >
          <View style={styles.masonry}>
            {columns.map((col, ci) => (
              <View key={ci} style={styles.col}>
                {col.map((p, i) => {
                  const h = HEIGHTS[(ci * 4 + i) % HEIGHTS.length];
                  return (
                    <TouchableOpacity key={p.id} style={styles.card} onPress={() => navigate('placeDetail', { placeId: p.id })} data-testid={`explore-card-${p.id}`}>
                      {p.cover_url ? (
                        <Image source={{ uri: p.cover_url }} style={[styles.cardImg, { height: h }]} />
                      ) : (
                        <View style={[styles.cardImg, styles.cardPlaceholder, { height: h }]}><MapPin size={22} color="#94A3B8" /></View>
                      )}
                      <View style={[styles.statusPill, { backgroundColor: statusColor(p.status) }]} />
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                        <Text style={styles.cardMeta} numberOfLines={1}>{[p.city, p.country].filter(Boolean).join(', ') || t('coordinates')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          {loadingMore && <ActivityIndicator color="#2D7FF9" style={{ marginVertical: 20 }} />}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#F8FAFC' },
  head: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, color: '#6B7280' },
  feed: { paddingHorizontal: 12, paddingBottom: 120 },
  masonry: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  cardImg: { width: '100%' },
  cardPlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  statusPill: { position: 'absolute', top: 10, left: 10, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  cardBody: { padding: 12, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardMeta: { fontSize: 12, color: '#6B7280' },
});
