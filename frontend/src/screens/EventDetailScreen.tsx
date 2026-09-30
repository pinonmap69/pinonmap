import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Share } from 'react-native';
import { Calendar, MapPin, Users, BadgeCheck, Trash2, Share2, Radio, Crosshair } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { getEvent, myAttendance, joinEvent, leaveEvent, checkIn, deleteEvent, attendeeCount, eventState, type PomEvent } from '@/lib/events';
import { getPositionWithStatus } from '@/lib/location';
import { formatKm } from '@/lib/geo';
import { AppMapView } from '@/components/map/AppMapView';
import { LocationDeniedBanner } from '@/components/LocationDeniedBanner';
import { formatEventDate } from './EventsScreen';

export function EventDetailScreen() {
  const { params, navigate, goBack } = useNav();
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<PomEvent | null>(null);
  const [att, setAtt] = useState({ joined: false, checkedIn: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [denied, setDenied] = useState<{ canAskAgain: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const e = await getEvent(params.eventId);
      setEvent(e);
      if (e && profile?.id) setAtt(await myAttendance(e.id, profile.id));
    } catch {} finally { setLoading(false); }
  }, [params.eventId, profile?.id]);
  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;
  if (!event) return <View style={styles.center}><Text style={styles.muted}>404</Text></View>;

  const st = eventState(event);
  const isOwner = event.user_id === profile?.id;

  const toggleJoin = async () => {
    if (!profile?.id) return;
    setBusy(true);
    try {
      if (att.joined) await leaveEvent(event.id, profile.id); else await joinEvent(event.id, profile.id);
      await load();
    } catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Error' }); }
    finally { setBusy(false); }
  };

  const doCheckIn = async () => {
    setBusy(true); setMsg(null);
    try {
      const pos = await getPositionWithStatus();
      if (!pos.coords) { if (pos.denied) setDenied({ canAskAgain: pos.canAskAgain }); return; }
      setDenied(null);
      const r = await checkIn(event.id, pos.coords.latitude, pos.coords.longitude);
      if (r.ok) { setMsg({ ok: true, text: `${t('checkedIn')} · +40 XP` }); await load(); }
      else if (r.reason === 'too_far') setMsg({ ok: false, text: `${t('checkinTooFar')} ${formatKm(r.distance_m ?? 0)} (max ${formatKm(event.checkin_radius_m)})` });
      else setMsg({ ok: false, text: t('checkinNotActive') });
    } catch (e: any) { setMsg({ ok: false, text: e?.message ?? 'Error' }); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    try { await deleteEvent(event.id); goBack(); } catch {}
  };

  const share = () => {
    const url = Linking.createURL(`event/${event.id}`);
    Share.share({ message: `${event.title} — ${formatEventDate(event, language)}\n${url}`, url }).catch(() => {});
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} testID="event-detail-screen">
      <View style={styles.mapWrap}>
        <AppMapView center={{ lat: event.latitude, lng: event.longitude }} zoom={14}
          markers={[{ id: event.id, lat: event.latitude, lng: event.longitude, title: event.title, color: '#F97316' }]}
          shape={{ type: 'circle', lat: event.latitude, lng: event.longitude, radiusM: event.checkin_radius_m }} style={styles.map} />
      </View>
      {st === 'live' && <View style={styles.live}><Radio size={12} color="#fff" /><Text style={styles.liveText}>{t('live')}</Text></View>}
      <Text style={styles.title} testID="event-title">{event.title}</Text>
      <View style={styles.row}><Calendar size={16} color="#F97316" /><Text style={styles.info}>{formatEventDate(event, language)}</Text></View>
      <View style={styles.row}><MapPin size={16} color="#F97316" /><Text style={styles.info}>{event.address || `${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)}`}</Text></View>
      <View style={styles.row}><Users size={16} color="#F97316" /><Text style={styles.info} testID="event-attendees">{attendeeCount(event)} {t('attendees')}</Text></View>
      <View style={styles.row}><Crosshair size={16} color="#F97316" /><Text style={styles.info}>{t('checkinRadius')}: {formatKm(event.checkin_radius_m)}</Text></View>
      {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

      {msg && <View style={[styles.msg, { backgroundColor: msg.ok ? '#CCFBF1' : '#FEE2E2' }]} testID="event-msg"><Text style={{ color: msg.ok ? '#0F766E' : '#B91C1C', fontWeight: '700' }}>{msg.text}</Text></View>}
      {denied && <LocationDeniedBanner canAskAgain={denied.canAskAgain} onRetry={doCheckIn} />}

      {st !== 'past' && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, att.joined ? styles.btnGhost : styles.btnPrimary]} onPress={toggleJoin} disabled={busy} testID="event-join-btn">
            <Text style={[styles.btnText, att.joined && { color: '#1F2937' }]}>{att.joined ? t('leave') : t('join')}</Text>
          </TouchableOpacity>
          {att.checkedIn ? (
            <View style={[styles.btn, styles.btnDone]} testID="event-checked-in"><BadgeCheck size={16} color="#0F766E" /><Text style={[styles.btnText, { color: '#0F766E' }]}>{t('checkedIn')}</Text></View>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.btnCheck, st !== 'live' && { opacity: 0.5 }]} onPress={doCheckIn} disabled={busy} testID="event-checkin-btn">
              {busy ? <ActivityIndicator color="#fff" /> : <><BadgeCheck size={16} color="#fff" /><Text style={styles.btnText}>{t('checkIn')}</Text></>}
            </TouchableOpacity>
          )}
        </View>
      )}
      {att.joined && !att.checkedIn && <Text style={styles.joinedText}>{t('joined')}</Text>}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconBtn} onPress={share} testID="event-share-btn"><Share2 size={18} color="#374151" /><Text style={styles.iconText}>{t('share')}</Text></TouchableOpacity>
        {!isOwner && <TouchableOpacity style={styles.iconBtn} onPress={() => navigate('userProfile', { userId: event.user_id })} testID="event-author-btn"><Users size={18} color="#374151" /><Text style={styles.iconText}>{t('profile')}</Text></TouchableOpacity>}
        {isOwner && <TouchableOpacity style={styles.iconBtn} onPress={remove} testID="event-delete-btn"><Trash2 size={18} color="#EF4444" /><Text style={[styles.iconText, { color: '#EF4444' }]}>{t('deleteEvent')}</Text></TouchableOpacity>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  mapWrap: { height: 220, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  liveText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  title: { fontSize: 24, fontWeight: '900', color: '#1F2937' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  info: { fontSize: 14, color: '#374151', flexShrink: 1 },
  desc: { fontSize: 14, color: '#4B5563', lineHeight: 20, marginTop: 4 },
  msg: { borderRadius: 12, padding: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btn: { flex: 1, height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnPrimary: { backgroundColor: '#2D7FF9' },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  btnCheck: { backgroundColor: '#F97316' },
  btnDone: { backgroundColor: '#CCFBF1' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  joinedText: { fontSize: 13, color: '#0F766E', fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  iconText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  muted: { color: '#6B7280' },
});
