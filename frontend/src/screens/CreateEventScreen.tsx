import { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Crosshair } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { createEvent } from '@/lib/events';
import { getPositionWithStatus } from '@/lib/location';
import { AppMapView } from '@/components/map/AppMapView';
import { Chip, ChipRow } from '@/components/Chip';
import { LocationDeniedBanner } from '@/components/LocationDeniedBanner';

const DURATIONS = [1, 2, 3, 4, 6, 8, 24];
const TIMES = Array.from({ length: 36 }, (_, i) => { const m = 6 * 60 + i * 30; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`; });

export function CreateEventScreen() {
  const { navigate, goBack } = useNav();
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState(() => { const h = Math.min(23, new Date().getHours() + 1); return `${String(Math.max(6, h)).padStart(2, '0')}:00`; });
  const [duration, setDuration] = useState(2);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 52.2297, lng: 21.0122 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState<{ canAskAgain: boolean } | null>(null);

  const days = useMemo(() => Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);

  const locate = async () => {
    const r = await getPositionWithStatus();
    if (!r.coords) { if (r.denied) setDenied({ canAskAgain: r.canAskAgain }); return; }
    setDenied(null);
    const p = { lat: r.coords.latitude, lng: r.coords.longitude };
    setMapCenter(p); setPoint(p);
  };
  useEffect(() => { locate(); }, []);

  const submit = async () => {
    if (!profile?.id) return;
    if (!title.trim()) { setError(t('titleRequired')); return; }
    const loc = point ?? mapCenter;
    const start = new Date(days[dayOffset]);
    const [h, m] = time.split(':').map(Number);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + duration * 3600 * 1000);
    setSaving(true); setError(null);
    try {
      const e = await createEvent({
        user_id: profile.id, title: title.trim(), description: description.trim() || null, category: null,
        latitude: loc.lat, longitude: loc.lng, address: address.trim() || null,
        starts_at: start.toISOString(), ends_at: end.toISOString(),
      });
      goBack(); navigate('eventDetail', { eventId: e.id });
    } catch (err: any) { setError(err?.message ?? 'Error'); }
    finally { setSaving(false); }
  };

  const locale = language === 'pl' ? 'pl-PL' : 'en-GB';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" testID="create-event-screen">
        <Text style={styles.label}>{t('eventTitle')}</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder={t('eventTitle')} placeholderTextColor="#9CA3AF" testID="event-title-input" />
        <Text style={styles.label}>{t('eventDescription')}</Text>
        <TextInput style={[styles.input, styles.multi]} value={description} onChangeText={setDescription} multiline placeholder={t('eventDescription')} placeholderTextColor="#9CA3AF" testID="event-description-input" />

        <Text style={styles.label}>{t('eventDate')}</Text>
        <View style={styles.bleed}>
          <ChipRow testID="event-day-row">
            {days.map((d, i) => <Chip key={i} label={d.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })} active={dayOffset === i} onPress={() => setDayOffset(i)} testID={`event-day-${i}`} />)}
          </ChipRow>
        </View>
        <Text style={styles.label}>{t('eventTime')}</Text>
        <View style={styles.bleed}>
          <ChipRow testID="event-time-row">
            {TIMES.map((tm) => <Chip key={tm} label={tm} active={time === tm} onPress={() => setTime(tm)} testID={`event-time-${tm.replace(':', '')}`} />)}
          </ChipRow>
        </View>
        <Text style={styles.label}>{t('eventDuration')}</Text>
        <View style={styles.bleed}>
          <ChipRow testID="event-duration-row">
            {DURATIONS.map((d) => <Chip key={d} label={d === 24 ? t('allDay') : `${d} h`} active={duration === d} onPress={() => setDuration(d)} testID={`event-duration-${d}`} />)}
          </ChipRow>
        </View>

        <View style={styles.locHead}>
          <Text style={styles.label}>{t('eventLocation')}</Text>
          <TouchableOpacity style={styles.locBtn} onPress={locate} testID="event-my-location"><Crosshair size={14} color="#0F766E" /><Text style={styles.locText}>{t('myLocation')}</Text></TouchableOpacity>
        </View>
        {denied && <LocationDeniedBanner canAskAgain={denied.canAskAgain} onRetry={locate} />}
        <View style={styles.mapWrap}>
          <AppMapView center={mapCenter} zoom={13} pickMode onMapPress={(lat, lng) => setPoint({ lat, lng })} style={styles.map} />
        </View>
        <Text style={styles.coords} testID="event-coords">{(point ?? mapCenter).lat.toFixed(5)}, {(point ?? mapCenter).lng.toFixed(5)}</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder={t('eventAddress')} placeholderTextColor="#9CA3AF" testID="event-address-input" />

        {error && <Text style={styles.error} testID="event-error">{error}</Text>}
        <TouchableOpacity style={styles.submit} onPress={submit} disabled={saving} testID="event-submit-btn">
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('createEvent')}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, gap: 8 },
  bleed: { marginHorizontal: -16 },
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, minHeight: 48, paddingHorizontal: 14, fontSize: 15, color: '#1F2937' },
  multi: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  locHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 6 },
  locText: { fontSize: 12, fontWeight: '700', color: '#0F766E' },
  mapWrap: { height: 240, borderRadius: 20, overflow: 'hidden', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  coords: { fontSize: 12, color: '#6B7280' },
  error: { color: '#DC2626', fontWeight: '600' },
  submit: { height: 54, borderRadius: 16, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
