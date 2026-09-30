import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Plus, MapPin, Users, Radio } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { listEvents, attendeeCount, eventState, type PomEvent } from '@/lib/events';
import { AppMapView } from '@/components/map/AppMapView';
import { Chip, ChipRow } from '@/components/Chip';

type Scope = 'upcoming' | 'mine' | 'past';

export function formatEventDate(e: PomEvent, lang: string) {
  const s = new Date(e.starts_at);
  const en = new Date(e.ends_at);
  const locale = lang === 'pl' ? 'pl-PL' : 'en-GB';
  const day = s.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = (d: Date) => d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time(s)}–${time(en)}`;
}

export function EventsScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState<Scope>('upcoming');
  const [events, setEvents] = useState<PomEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setEvents(await listEvents({ scope, userId: profile?.id })); } catch { setEvents([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [scope, profile?.id]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  const markers = useMemo(() => events.map((e) => ({ id: e.id, lat: e.latitude, lng: e.longitude, title: e.title, color: '#F97316' })), [events]);
  const center = events[0] ? { lat: events[0].latitude, lng: events[0].longitude } : { lat: 52.2297, lng: 21.0122 };

  return (
    <View style={styles.root} testID="events-screen">
      <ChipRow testID="events-scope-row">
        <Chip label={t('upcoming')} active={scope === 'upcoming'} onPress={() => setScope('upcoming')} testID="events-scope-upcoming" />
        <Chip label={t('myEvents')} active={scope === 'mine'} onPress={() => setScope('mine')} testID="events-scope-mine" />
        <Chip label={t('pastEvents')} active={scope === 'past'} onPress={() => setScope('past')} testID="events-scope-past" />
      </ChipRow>
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 96 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>
        {events.length > 0 && (
          <View style={styles.mapWrap}>
            <AppMapView center={center} zoom={5} markers={markers} onMarkerPress={(id) => navigate('eventDetail', { eventId: id })} style={styles.map} />
          </View>
        )}
        {loading ? <ActivityIndicator color="#2D7FF9" style={{ marginTop: 24 }} /> : events.length === 0 ? (
          <Text style={styles.muted} testID="events-empty">{t('noEvents')}</Text>
        ) : events.map((e) => {
          const st = eventState(e);
          const d = new Date(e.starts_at);
          return (
            <TouchableOpacity key={e.id} style={styles.card} onPress={() => navigate('eventDetail', { eventId: e.id })} testID={`event-card-${e.id}`}>
              <View style={[styles.dateBox, st === 'past' && { backgroundColor: '#F3F4F6' }]}>
                <Text style={[styles.dateDay, st === 'past' && { color: '#9CA3AF' }]}>{d.getDate()}</Text>
                <Text style={[styles.dateMonth, st === 'past' && { color: '#9CA3AF' }]}>{d.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-GB', { month: 'short' })}</Text>
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                {st === 'live' && <View style={styles.live}><Radio size={11} color="#fff" /><Text style={styles.liveText}>{t('live')}</Text></View>}
                <Text style={styles.title} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.meta} numberOfLines={1}>{formatEventDate(e, language)}</Text>
                <View style={styles.metaRow}>
                  <MapPin size={12} color="#6B7280" /><Text style={styles.meta} numberOfLines={1}>{e.address || `${e.latitude.toFixed(3)}, ${e.longitude.toFixed(3)}`}</Text>
                </View>
              </View>
              <View style={styles.count}><Users size={14} color="#2D7FF9" /><Text style={styles.countText}>{attendeeCount(e)}</Text></View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => navigate('createEvent')} testID="create-event-fab">
        <Plus size={20} color="#fff" /><Text style={styles.fabText}>{t('createEvent')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingHorizontal: 16, gap: 10 },
  mapWrap: { height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: '#e8eef3', marginBottom: 4 },
  map: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 18, padding: 12 },
  dateBox: { width: 54, height: 58, borderRadius: 14, backgroundColor: '#FFEDD5', alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontWeight: '900', color: '#C2410C' },
  dateMonth: { fontSize: 11, fontWeight: '700', color: '#C2410C', textTransform: 'uppercase' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  liveText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  title: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  meta: { fontSize: 12, color: '#6B7280', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { alignItems: 'center', gap: 2 },
  countText: { fontSize: 12, fontWeight: '800', color: '#2D7FF9' },
  muted: { textAlign: 'center', color: '#6B7280', marginTop: 24 },
  fab: { position: 'absolute', right: 16, height: 52, borderRadius: 26, backgroundColor: '#F97316', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
