import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Platform } from 'react-native';
import { Camera, Image as ImageIcon, MapPin, AlertCircle, Check } from 'lucide-react-native';
import { AppMapView } from '@/components/map/AppMapView';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { pickAndUpload, captureAndUpload } from '@/lib/storage';
import { createPlace } from '@/lib/places';
import { getCurrentPosition, reverseGeocode } from '@/lib/location';

const CATEGORIES = ['Natura', 'Restauracja', 'Zabytek', 'Plaża', 'Hotel', 'Miasto', 'Inne'];
const DEFAULT_CENTER = { lat: 52.2297, lng: 21.0122 };

export function AddPlaceScreen() {
  const { navigate, goBack, params } = useNav();
  const { profile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Natura');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState({
    lat: params.lat ?? DEFAULT_CENTER.lat,
    lng: params.lng ?? DEFAULT_CENTER.lng,
  });
  const [mapKey, setMapKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.lat == null) {
      getCurrentPosition().then((pos) => {
        if (pos) {
          setCoords({ lat: pos.latitude, lng: pos.longitude });
          setMapKey((k) => k + 1);
        }
      });
    }
  }, [params.lat]);

  const handlePick = async (mode: 'gallery' | 'camera') => {
    if (!profile?.id) return;
    setError(null);
    setUploading(true);
    try {
      const url = mode === 'gallery'
        ? await pickAndUpload('place-photos', profile.id)
        : await captureAndUpload('place-photos', profile.id);
      if (url) setPhotoUrl(url);
    } catch (e: any) {
      setError(e?.message || 'Nie udało się przesłać zdjęcia.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!profile?.id) return;
    if (!title.trim()) return setError('Podaj nazwę miejsca.');
    if (!photoUrl) return setError('Dodaj co najmniej jedno zdjęcie.');
    setSaving(true);
    try {
      const geo = await reverseGeocode({ latitude: coords.lat, longitude: coords.lng });
      await createPlace({
        user_id: profile.id,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        city: geo.city,
        country: geo.country,
        latitude: coords.lat,
        longitude: coords.lng,
        cover_url: photoUrl,
        photoUrls: [photoUrl],
      });
      navigate('map');
    } catch (e: any) {
      setError(e?.message || 'Nie udało się zapisać miejsca.');
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      {/* Photo */}
      <Text style={styles.label}>Zdjęcie</Text>
      {photoUrl ? (
        <View style={styles.photoWrap}>
          <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
          <TouchableOpacity style={styles.photoChange} onPress={() => handlePick('gallery')} testID="addplace-change-photo"><Text style={styles.photoChangeText}>Zmień</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.photoActions}>
          <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={() => handlePick('gallery')} disabled={uploading} testID="addplace-pick-gallery">
            {uploading ? <ActivityIndicator color="#2D7FF9" /> : (<><ImageIcon size={22} color="#2D7FF9" /><Text style={styles.photoBtnText}>Z galerii</Text></>)}
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} activeOpacity={0.85} onPress={() => handlePick('camera')} disabled={uploading} testID="addplace-pick-camera">
            <Camera size={22} color="#2D7FF9" /><Text style={styles.photoBtnText}>Aparat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Title */}
      <Text style={styles.label}>Nazwa miejsca</Text>
      <TextInput style={styles.input} placeholder="np. Widok na Tatry" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} testID="addplace-title-input" />

      {/* Description */}
      <Text style={styles.label}>Opis</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="Opisz to miejsce..." placeholderTextColor="#9CA3AF" value={description} onChangeText={setDescription} multiline testID="addplace-description-input" />

      {/* Category */}
      <Text style={styles.label}>Kategoria</Text>
      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} style={[styles.chip, category === c && styles.chipActive]} onPress={() => setCategory(c)} testID={`addplace-cat-${c}`}>
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Location */}
      <Text style={styles.label}>Lokalizacja (dotknij mapę, aby ustawić pin)</Text>
      <View style={styles.mapWrap}>
        <AppMapView
          key={mapKey}
          center={coords}
          zoom={13}
          pickMode
          onMapPress={(lat, lng) => setCoords({ lat, lng })}
          style={styles.map}
        />
      </View>
      <View style={styles.coordsRow}>
        <MapPin size={14} color="#6B7280" />
        <Text style={styles.coordsText} testID="addplace-coords">{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>
      </View>

      {error && (<View style={styles.errorBox}><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} activeOpacity={0.9} onPress={save} disabled={saving} testID="addplace-save-btn">
        {saving ? <ActivityIndicator color="#fff" /> : (<><Check size={18} color="#fff" /><Text style={styles.saveBtnText}>Zapisz miejsce</Text></>)}
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={goBack}><Text style={styles.cancelBtnText}>Anuluj</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 60, gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 12 },
  photoActions: { flexDirection: 'row', gap: 12 },
  photoBtn: { flex: 1, height: 96, borderRadius: 18, borderWidth: 1.5, borderColor: '#BFDBFE', borderStyle: 'dashed', backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoBtnText: { fontSize: 13, fontWeight: '600', color: '#2D7FF9' },
  photoWrap: { borderRadius: 20, overflow: 'hidden', height: 200, backgroundColor: '#E5E7EB' },
  photo: { width: '100%', height: '100%' },
  photoChange: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(15,23,42,0.75)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  photoChangeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1F2937', outlineStyle: 'none' } as any,
  textarea: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#2D7FF9', borderColor: '#2D7FF9' },
  chipText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#fff' },
  mapWrap: { height: 220, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  coordsText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12, marginTop: 8 },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, marginTop: 20, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});
