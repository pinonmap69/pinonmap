import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Plus, Crosshair, MapPin } from 'lucide-react-native';
import { AppMapView } from '@/components/map/AppMapView';
import type { MapMarker } from '@/components/map/leafletHtml';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { listPlaces } from '@/lib/places';
import { getCurrentPosition } from '@/lib/location';

const DEFAULT_CENTER = { lat: 52.2297, lng: 21.0122 }; // Warszawa

export function MapScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(0);

  const loadPlaces = useCallback(async () => {
    try {
      const data = await listPlaces({ userId: profile?.id, limit: 200 });
      setMarkers(data.map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, title: p.title })));
    } catch {
      setMarkers([]);
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

  const recenter = async () => {
    const pos = await getCurrentPosition();
    if (pos) {
      setCenter({ lat: pos.latitude, lng: pos.longitude });
      setMapKey((k) => k + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mapa podróży</Text>
        <View style={styles.countBadge}><MapPin size={14} color="#2D7FF9" /><Text style={styles.countText}>{markers.length}</Text></View>
      </View>
      <View style={styles.mapWrap}>
        {loading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color="#2D7FF9" /></View>
        ) : (
          <AppMapView
            key={mapKey}
            center={center}
            zoom={12}
            markers={markers}
            showUser
            onMarkerPress={(id) => navigate('placeDetail', { placeId: id })}
            style={styles.map}
          />
        )}
        <TouchableOpacity style={styles.recenterBtn} activeOpacity={0.85} onPress={recenter} testID="map-recenter-btn">
          <Crosshair size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} activeOpacity={0.9} onPress={() => navigate('addPlace', { lat: center.lat, lng: center.lng })} testID="map-add-place-btn">
          <Plus size={24} color="#fff" strokeWidth={2.6} />
          <Text style={styles.fabText}>Dodaj miejsce</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#1F2937' },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  countText: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
  mapWrap: { flex: 1, marginHorizontal: 12, marginBottom: 96, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e8eef3', borderWidth: 1, borderColor: '#E5E7EB' },
  map: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  recenterBtn: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  fab: { position: 'absolute', bottom: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2D7FF9', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  fabText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
