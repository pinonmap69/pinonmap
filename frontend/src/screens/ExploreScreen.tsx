import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, Platform, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Compass, MapPin, Heart, Search } from 'lucide-react-native';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { listPlaces, type Place } from '@/lib/places';
import { listLikedPlaceIds, toggleLike } from '@/lib/social';
import { statusColor } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

const PAGE = 24;
// Deterministic pseudo-random tile heights for the masonry look.
const HEIGHTS = [150, 200, 240, 180, 220, 170, 260, 190];

export function ExploreScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [places, setPlaces] = useState<Place[]>([]);
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [end, setEnd] = useState(false);

  // Refs (not state) guard pagination so rapid scroll events never double-fetch or read stale counts.
  const offsetRef = useRef(0);
  const busyRef = useRef(false);
  const endRef = useRef(false);

  const load = useCallback(async (offset: number, replace = false) => {
    const data = await listPlaces({ limit: PAGE, offset });
    offsetRef.current = offset + data.length;
    setPlaces((prev) => {
      if (replace) return data;
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...data.filter((p) => !seen.has(p.id))];
    });
    endRef.current = data.length < PAGE;
    setEnd(endRef.current);
  }, []);

  const loadMore = useCallback(async () => {
    if (busyRef.current || endRef.current) return;
    busyRef.current = true;
    setLoadingMore(true);
    try { await load(offsetRef.current); } catch {} finally { busyRef.current = false; setLoadingMore(false); }
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        await load(0, true);
        if (profile?.id) setLikedSet(await listLikedPlaceIds(profile.id));
      } catch { /* offline */ } finally { setLoading(false); }
    })();
  }, [load, profile?.id]);

  const onLike = async (placeId: string) => {
    if (!profile?.id) return;
    const liked = likedSet.has(placeId);
    const next = new Set(likedSet);
    if (liked) next.delete(placeId); else next.add(placeId);
    setLikedSet(next);
    try { await toggleLike(profile.id, placeId, liked); } catch { setLikedSet(new Set(likedSet)); }
  };

  const onRefresh = async () => {
    setRefreshing(true); setEnd(false); endRef.current = false;
    try { await load(0, true); } catch {} finally { setRefreshing(false); }
  };

  const viewportH = useRef(0);
  const onScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    viewportH.current = layoutMeasurement.height;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 800) loadMore();
  };
  // If the first page doesn't fill the screen there is nothing to scroll — fetch the next page right away.
  const onContentSizeChange = (_w: number, h: number) => {
    if (viewportH.current && h < viewportH.current + 200) loadMore();
  };

  const columns: Place[][] = [[], []];
  places.forEach((p, i) => columns[i % 2].push(p));

  return (
    <View style={styles.container} testID="explore-screen">
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{t('inspirationFeed')}</Text>
          <Text style={styles.subtitle}>{t('exploreSubtitle')}</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => navigate('search')} testID="explore-search-btn"><Search size={20} color="#374151" /></TouchableOpacity>
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
          onLayout={(e) => { viewportH.current = e.nativeEvent.layout.height; }}
          onContentSizeChange={onContentSizeChange}
          scrollEventThrottle={100}
          testID="explore-feed" 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2D7FF9" />}
        >
          <View style={styles.masonry}>
            {columns.map((col, ci) => (
              <View key={ci} style={styles.col}>
                {col.map((p, i) => {
                  const h = HEIGHTS[(ci * 4 + i) % HEIGHTS.length];
                  return (
                    <TouchableOpacity key={p.id} style={styles.card} onPress={() => navigate('placeDetail', { placeId: p.id })} testID={`explore-card-${p.id}`}>
                      {p.cover_url ? (
                        <Image source={{ uri: p.cover_url }} style={[styles.cardImg, { height: h }]} />
                      ) : (
                        <View style={[styles.cardImg, styles.cardPlaceholder, { height: h }]}><MapPin size={22} color="#94A3B8" /></View>
                      )}
                      <View style={[styles.statusPill, { backgroundColor: statusColor(p.status) }]} />
                      <TouchableOpacity style={styles.likeBtn} onPress={() => onLike(p.id)} testID={`explore-like-${p.id}`}>
                        <Heart size={16} color={likedSet.has(p.id) ? '#EF4444' : '#fff'} fill={likedSet.has(p.id) ? '#EF4444' : 'rgba(0,0,0,0.25)'} />
                      </TouchableOpacity>
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
          {!loadingMore && !end && places.length > 0 && (
            <TouchableOpacity style={styles.loadMore} onPress={loadMore} testID="load-more-btn">
              <Text style={styles.loadMoreText}>{t('loadMore')}</Text>
            </TouchableOpacity>
          )}
          {end && places.length > 0 && <Text style={styles.endText} testID="feed-end">{t('endOfFeed')}</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#F8FAFC' },
  head: { paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
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
  likeBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(15,23,42,0.35)', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardMeta: { fontSize: 12, color: '#6B7280' },
  loadMore: { alignSelf: 'center', marginTop: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 },
  endText: { textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 20 },
  loadMoreText: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
});
