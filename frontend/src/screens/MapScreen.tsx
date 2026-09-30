import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Plus, Crosshair, MapPin } from 'lucide-react-native';
import { AppMapView } from '@/components/map/AppMapView';
import type { MapMarker } from '@/components/map/leafletHtml';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { listPlaces, type Place } from '@/lib/places';
import { getCurrentPosition } from '@/lib/location';
import { PLACE_STATUSES, STATUS_COLORS, STATUS_TKEY, statusColor, type PlaceStatus } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

const DEFAULT_CENTER = { lat: 52.2297, lng: 21.0122 };

export function MapScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [places, setPlaces] = useState<Place[]>([]);
  const [filter, setFilter] = useState<PlaceStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(0);

  const loadPlaces = useCallback(async () => {
    try {
      const data = await listPlaces({ userId: profile?.id, limit: 500 });
      setPlaces(data);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    (async () => {
      const pos = await getCurrentPosition();
      if (pos) setCenter({ lat: pos.latitude, lng: pos.longitude });
      await loadPlaces();
      setMapKey((k) => k + 1);
    })();
  }, [loadPlaces]);

  const markers: MapMarker[] = useMemo(() => {
    const filtered = filter === 'all' ? places : places.filter((p) => p.status === filter);
    return filtered.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, title: p.title, color: statusColor(p.status) }));
  }, [places, filter]);

  const recenter = async () => {
    const pos = await getCurrentPosition();
    if (pos) { setCenter({ lat: pos.latitude, lng: pos.longitude }); setMapKey((k) => k + 1); }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: places.length };
    for (const s of PLACE_STATUSES) c[s] = places.filter((p) => p.status === s).length;
    return c;
  }, [places]);

  return (
    <View style={styles.container} testID="map-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{t('travelMap')}</Text>
        <View style={styles.countBadge}><MapPin size={14} color="#2D7FF9" /><Text style={styles.countText} testID="marker-count">{markers.length}</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActiveAll]} onPress={() => setFilter('all')} testID="filter-all">
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>{t('all')} · {counts.all}</Text>
        </TouchableOpacity>
        {PLACE_STATUSES.map((s) => {
          const active = filter === s;
          return (
            <TouchableOpacity key={s} style={[styles.filterChip, active && { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }]} onPress={() => setFilter(s)} testID={`filter-${s}`}>
              <View style={[styles.legendDot, { backgroundColor: active ? '#fff' : STATUS_COLORS[s] }]} />
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{t(STATUS_TKEY[s])} · {counts[s]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color="#2D7FF9" /></View>
        ) : (
          <AppMapView key={mapKey} center={center} zoom={12} markers={markers} showUser onMarkerPress={(id) => navigate('placeDetail', { placeId: id })} style={styles.map} />
        )}
        <TouchableOpacity style={styles.recenterBtn} onPress={recenter} testID="recenter-btn"><Crosshair size={20} color="#374151" /></TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => navigate('addPlace', { lat: center.lat, lng: center.lng })} testID="add-place-fab"><Plus size={24} color="#fff" /><Text style={styles.fabText}>{t('addPlaceAction')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  countText: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
  filters: { maxHeight: 46, marginBottom: 8 },
  filtersContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', height: 36 },
  filterChipActiveAll: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  filterTextActive: { color: '#fff' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  mapWrap: { flex: 1, marginHorizontal: 12, marginBottom: 96, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  recenterBtn: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2D7FF9', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999 },
  fabText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
