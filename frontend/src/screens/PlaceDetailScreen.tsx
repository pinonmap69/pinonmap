import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, Trash2, Tag, Calendar, AlertCircle } from 'lucide-react-native';
import { AppMapView } from '@/components/map/AppMapView';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { getPlace, deletePlace, updatePlaceStatus, type Place } from '@/lib/places';
import { PLACE_STATUSES, STATUS_COLORS, STATUS_TKEY, statusColor, type PlaceStatus } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

export function PlaceDetailScreen() {
  const { params, navigate, goBack } = useNav();
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    (async () => {
      try { if (params.placeId) setPlace(await getPlace(params.placeId)); }
      catch (e: any) { setError(e?.message || 'Unable to load place.'); }
      finally { setLoading(false); }
    })();
  }, [params.placeId]);

  const changeStatus = async (status: PlaceStatus) => {
    if (!place || status === place.status) return;
    setSavingStatus(true);
    const prev = place.status;
    setPlace({ ...place, status });
    try { await updatePlaceStatus(place.id, status); }
    catch (e: any) { setPlace({ ...place, status: prev }); setError(e?.message || 'Unable to update status.'); }
    finally { setSavingStatus(false); }
  };

  const remove = async () => {
    if (!place) return;
    setDeleting(true);
    try { await deletePlace(place.id); navigate('map'); }
    catch (e: any) { setError(e?.message || 'Unable to delete place.'); setDeleting(false); }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7FF9" /></View>;
  if (!place) return (
    <View style={styles.loader}>
      <Text style={styles.emptyText}>{error || t('placeNotFound')}</Text>
      <TouchableOpacity onPress={goBack}><Text style={styles.backLinkText}>{t('back')}</Text></TouchableOpacity>
    </View>
  );

  const photos = place.place_photos?.length ? place.place_photos.map((p) => p.url) : place.cover_url ? [place.cover_url] : [];
  const isOwner = profile?.id === place.user_id;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} data-testid="place-detail-screen">
      {photos.length > 0 && (
        <ScrollView horizontal pagingEnabled style={styles.gallery}>
          {photos.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.galleryImg} />)}
        </ScrollView>
      )}
      <View style={styles.body}>
        <Text style={styles.title} data-testid="place-title">{place.title}</Text>
        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: statusColor(place.status) + '22' }]} data-testid="place-status-badge">
            <View style={[styles.statusDot, { backgroundColor: statusColor(place.status) }]} />
            <Text style={[styles.metaChipText, { color: statusColor(place.status) }]}>{t(STATUS_TKEY[place.status])}</Text>
          </View>
          {place.category && (<View style={styles.metaChip}><Tag size={12} color="#2D7FF9" /><Text style={styles.metaChipText}>{place.category}</Text></View>)}
          <View style={styles.metaChip}><MapPin size={12} color="#0F766E" /><Text style={styles.metaChipText}>{[place.city, place.country].filter(Boolean).join(', ') || t('coordinates')}</Text></View>
          <View style={styles.metaChip}><Calendar size={12} color="#6B7280" /><Text style={styles.metaChipText}>{new Date(place.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'pl-PL')}</Text></View>
        </View>

        {place.description ? <Text style={styles.description}>{place.description}</Text> : null}

        {isOwner && (
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>{t('statusLabel')}</Text>
            <View style={styles.statusRow}>
              {PLACE_STATUSES.map((s) => {
                const active = place.status === s;
                return (
                  <TouchableOpacity key={s} disabled={savingStatus} style={[styles.statusChip, active && { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }]} onPress={() => changeStatus(s)} data-testid={`detail-status-${s}`}>
                    <View style={[styles.statusDot, { backgroundColor: active ? '#fff' : STATUS_COLORS[s] }]} />
                    <Text style={[styles.statusChipText, active && { color: '#fff' }]}>{t(STATUS_TKEY[s])}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.mapWrap}>
          <AppMapView center={{ lat: place.latitude, lng: place.longitude }} zoom={13} markers={[{ id: place.id, lat: place.latitude, lng: place.longitude, title: place.title, color: statusColor(place.status) }]} style={styles.map} />
        </View>
        <Text style={styles.coordsText}>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</Text>

        {error && (<View style={styles.errorBox}><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}

        {isOwner && (confirm ? (
          <View style={styles.confirmRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={remove} disabled={deleting} data-testid="confirm-delete-btn">{deleting ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.deleteBtnText}>{t('sureDelete')}</Text>}</TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirm(false)}><Text style={styles.cancelBtnText}>{t('cancel')}</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirm(true)} data-testid="delete-place-btn"><Trash2 size={16} color="#EF4444" /><Text style={styles.deleteBtnText}>{t('deletePlace')}</Text></TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingBottom: 60 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8FAFC' },
  emptyText: { fontSize: 15, color: '#6B7280' },
  backLinkText: { color: '#2D7FF9', fontWeight: '600' },
  gallery: { height: 260 },
  galleryImg: { width: 360, height: 260 },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', padding: 10, borderRadius: 999 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  description: { fontSize: 15, color: '#374151', lineHeight: 22 },
  statusSection: { gap: 8, marginTop: 4 },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  statusChipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  mapWrap: { height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  coordsText: { fontSize: 13, color: '#6B7280' },
  errorBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 14 },
  errorText: { flex: 1, color: '#DC2626' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 18, flex: 1 },
  deleteBtnText: { color: '#EF4444', fontWeight: '700' },
  confirmRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: '#fff', flex: 1 },
  cancelBtnText: { color: '#6B7280', fontWeight: '600' },
});
