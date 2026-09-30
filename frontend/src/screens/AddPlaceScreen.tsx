import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Camera, Image as ImageIcon, MapPin, AlertCircle, Check, Navigation } from 'lucide-react-native';
import { AppMapView } from '@/components/map/AppMapView';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { pickPlacePhoto, capturePlacePhoto } from '@/lib/storage';
import { createPlace } from '@/lib/places';
import { getCurrentPosition, reverseGeocode } from '@/lib/location';
import { PLACE_STATUSES, STATUS_COLORS, STATUS_TKEY, type PlaceStatus } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

const DEFAULT_CENTER = { lat: 52.2297, lng: 21.0122 };

export function AddPlaceScreen() {
  const { navigate, goBack, params } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const categories = [t('categoryNature'), t('categoryRestaurant'), t('categoryMonument'), t('categoryBeach'), t('categoryHotel'), t('categoryCity'), t('categoryOther')];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [status, setStatus] = useState<PlaceStatus>('want_to_visit');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoGps, setPhotoGps] = useState(false);
  const [coords, setCoords] = useState({ lat: params.lat ?? DEFAULT_CENTER.lat, lng: params.lng ?? DEFAULT_CENTER.lng });
  const [mapKey, setMapKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.lat == null) {
      getCurrentPosition().then((pos) => {
        if (pos) { setCoords({ lat: pos.latitude, lng: pos.longitude }); setMapKey((k) => k + 1); }
      });
    }
  }, [params.lat]);

  const pick = async (mode: 'gallery' | 'camera') => {
    if (!profile?.id) return;
    setUploading(true); setError(null);
    try {
      const res = mode === 'gallery' ? await pickPlacePhoto(profile.id) : await capturePlacePhoto(profile.id);
      if (res) {
        setPhotoUrl(res.url);
        if (res.gps) {
          setCoords({ lat: res.gps.latitude, lng: res.gps.longitude });
          setPhotoGps(true);
          setMapKey((k) => k + 1);
        } else {
          setPhotoGps(false);
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!profile?.id) return;
    if (!title.trim()) return setError(t('titleRequired'));
    if (!photoUrl) return setError(t('addPhotoRequired'));
    setSaving(true);
    try {
      const geo = await reverseGeocode({ latitude: coords.lat, longitude: coords.lng });
      await createPlace({
        user_id: profile.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        status,
        city: geo.city,
        country: geo.country,
        latitude: coords.lat,
        longitude: coords.lng,
        cover_url: photoUrl,
        photoUrls: [photoUrl],
      });
      navigate('map');
    } catch (e: any) {
      setError(e?.message || 'Unable to save place.');
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t('changePhoto')}</Text>
      {photoUrl ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photoUrl }} style={styles.photo} />
          <TouchableOpacity style={styles.photoChange} onPress={() => pick('gallery')} testID="change-photo-btn">
            <Text style={styles.photoChangeText}>{t('changePhoto')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pick('gallery')} disabled={uploading} testID="pick-gallery-btn">
            {uploading ? <ActivityIndicator color="#2D7FF9" /> : (<><ImageIcon size={22} color="#2D7FF9" /><Text style={styles.photoBtnText}>{t('choosePhoto')}</Text></>)}
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={() => pick('camera')} disabled={uploading} testID="capture-camera-btn">
            <Camera size={22} color="#2D7FF9" /><Text style={styles.photoBtnText}>{t('takePhoto')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {photoGps && (
        <View style={styles.gpsNote} testID="photo-gps-note">
          <Navigation size={14} color="#0F766E" />
          <Text style={styles.gpsNoteText}>{t('photoLocationUsed')}</Text>
        </View>
      )}

      <Text style={styles.label}>{t('title')}</Text>
      <TextInput style={styles.input} placeholder={t('placeTitlePlaceholder')} value={title} onChangeText={setTitle} testID="place-title-input" />

      <Text style={styles.label}>{t('description')}</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder={t('descriptionPlaceholder')} value={description} onChangeText={setDescription} multiline testID="place-description-input" />

      <Text style={styles.label}>{t('category')}</Text>
      <View style={styles.chipRow}>
        {categories.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)} testID={`category-chip-${c}`}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('statusLabel')}</Text>
      <View style={styles.chipRow}>
        {PLACE_STATUSES.map((s) => {
          const active = status === s;
          return (
            <TouchableOpacity key={s} style={[styles.statusChip, active && { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }]} onPress={() => setStatus(s)} testID={`status-chip-${s}`}>
              <View style={[styles.statusDot, { backgroundColor: active ? '#fff' : STATUS_COLORS[s] }]} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(STATUS_TKEY[s])}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t('coordinates')}</Text>
      <View style={styles.mapWrap}>
        <AppMapView key={mapKey} center={coords} zoom={13} pickMode onMapPress={(lat, lng) => { setCoords({ lat, lng }); setPhotoGps(false); }} style={styles.map} />
      </View>
      <View style={styles.coordsRow}>
        <MapPin size={14} color="#6B7280" />
        <Text style={styles.coordsText} testID="coords-text">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>
      </View>

      {error && (<View style={styles.errorBox}><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving} testID="save-place-btn">
        {saving ? <ActivityIndicator color="#fff" /> : (<><Check size={18} color="#fff" /><Text style={styles.saveBtnText}>{t('savePlace')}</Text></>)}
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={goBack} testID="cancel-btn"><Text style={styles.cancelBtnText}>{t('cancel')}</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 60, gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 12 },
  photoActions: { flexDirection: 'row', gap: 12 },
  photoBtn: { flex: 1, height: 96, borderRadius: 18, borderWidth: 1.5, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#2D7FF9' },
  photoWrap: { borderRadius: 20, overflow: 'hidden', height: 200 },
  photo: { width: '100%', height: '100%' },
  photoChange: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(15,23,42,0.75)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  photoChangeText: { color: '#fff', fontWeight: '600' },
  gpsNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFBF1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginTop: 8 },
  gpsNoteText: { color: '#0F766E', fontWeight: '600', fontSize: 13 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 14, fontSize: 16, color: '#1F2937' },
  textarea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2D7FF9', borderColor: '#2D7FF9' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#fff' },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  mapWrap: { height: 220, borderRadius: 20, overflow: 'hidden' },
  map: { flex: 1 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coordsText: { fontSize: 13, color: '#6B7280' },
  errorBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 14 },
  errorText: { flex: 1, color: '#DC2626' },
  saveBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { color: '#6B7280', fontWeight: '600' },
});
