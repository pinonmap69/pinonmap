import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, Trash2, Tag, Calendar, AlertCircle } from 'lucide-react-native';
import { AppMapView } from '@/components/map/AppMapView';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { getPlace, deletePlace, type Place } from '@/lib/places';

export function PlaceDetailScreen() {
  const { params, navigate, goBack } = useNav();
  const { profile } = useAuth();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (params.placeId) setPlace(await getPlace(params.placeId));
      } catch (e: any) {
        setError(e?.message || 'Nie udało się wczytać miejsca.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.placeId]);

  const remove = async () => {
    if (!place) return;
    setDeleting(true);
    try {
      await deletePlace(place.id);
      navigate('map');
    } catch (e: any) {
      setError(e?.message || 'Nie udało się usunąć miejsca.');
      setDeleting(false);
    }
  };

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7FF9" /></View>;
  }
  if (!place) {
    return (
      <View style={styles.loader}>
        <Text style={styles.emptyText}>{error || 'Nie znaleziono miejsca.'}</Text>
        <TouchableOpacity style={styles.backLink} onPress={goBack}><Text style={styles.backLinkText}>Wróć</Text></TouchableOpacity>
      </View>
    );
  }

  const photos = place.place_photos && place.place_photos.length > 0
    ? place.place_photos.map((p) => p.url)
    : place.cover_url ? [place.cover_url] : [];
  const isOwner = profile?.id === place.user_id;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {photos.length > 0 && (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {photos.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.galleryImg} resizeMode="cover" />
          ))}
        </ScrollView>
      )}
      <View style={styles.body}>
        <Text style={styles.title} testID="detail-title">{place.title}</Text>
        <View style={styles.metaRow}>
          {place.category ? (<View style={styles.metaChip}><Tag size={12} color="#2D7FF9" /><Text style={styles.metaChipText}>{place.category}</Text></View>) : null}
          <View style={styles.metaChip}><MapPin size={12} color="#0F766E" /><Text style={styles.metaChipText}>{[place.city, place.country].filter(Boolean).join(', ') || 'Współrzędne'}</Text></View>
          <View style={styles.metaChip}><Calendar size={12} color="#6B7280" /><Text style={styles.metaChipText}>{new Date(place.created_at).toLocaleDateString('pl-PL')}</Text></View>
        </View>
        {place.description ? <Text style={styles.description}>{place.description}</Text> : null}

        <View style={styles.mapWrap}>
          <AppMapView center={{ lat: place.latitude, lng: place.longitude }} zoom={13} markers={[{ id: place.id, lat: place.latitude, lng: place.longitude, title: place.title }]} style={styles.map} />
        </View>
        <View style={styles.coordsRow}>
          <MapPin size={14} color="#6B7280" />
          <Text style={styles.coordsText}>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</Text>
        </View>

        {error && (<View style={styles.errorBox}><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}

        {isOwner && (
          confirm ? (
            <View style={styles.confirmRow}>
              <TouchableOpacity style={[styles.deleteBtn, { flex: 1 }]} onPress={remove} disabled={deleting} testID="detail-confirm-delete">
                {deleting ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.deleteBtnText}>Na pewno usuń</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setConfirm(false)}><Text style={styles.cancelBtnText}>Anuluj</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.deleteBtn} activeOpacity={0.9} onPress={() => setConfirm(true)} testID="detail-delete-btn">
              <Trash2 size={16} color="#EF4444" /><Text style={styles.deleteBtnText}>Usuń miejsce</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingBottom: 60 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8FAFC' },
  emptyText: { fontSize: 15, color: '#6B7280' },
  backLink: { paddingHorizontal: 20, paddingVertical: 10 },
  backLinkText: { color: '#2D7FF9', fontWeight: '600' },
  gallery: { height: 260 },
  galleryImg: { width: 360, height: 260, backgroundColor: '#E5E7EB' },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  description: { fontSize: 15, color: '#374151', lineHeight: 22 },
  mapWrap: { height: 200, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4, backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coordsText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 18, marginTop: 8 },
  deleteBtnText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  confirmRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});
