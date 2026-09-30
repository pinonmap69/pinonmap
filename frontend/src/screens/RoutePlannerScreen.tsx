import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Plus, X, Shuffle, Save, LayoutGrid, Route as RouteIcon, MapPin, Check, Share2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppMapView } from '@/components/map/AppMapView';
import type { MapMarker } from '@/components/map/leafletHtml';
import { MapLayerButton } from '@/components/MapLayerButton';
import { Chip, ChipRow } from '@/components/Chip';
import { RoutePointInput } from '@/components/RoutePointInput';
import { LocationDeniedBanner } from '@/components/LocationDeniedBanner';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { routingProvider, type TravelMode, type RouteResult } from '@/lib/routing';
import { bboxOf, distanceToPolyline, simplify, nearestNeighbourOrder, formatKm, formatDuration, type LatLng } from '@/lib/geo';
import { placesInBBox, myPlaceIds, CATEGORY_GROUPS } from '@/lib/search';
import { getRoute, saveRoute, setRouteVisibility, type RouteStop } from '@/lib/routes';
import { ShareSheet } from '@/components/ShareSheet';
import { listBoardPlaces, createBoardWithPlaces } from '@/lib/boards';
import { listPlaces, type Place } from '@/lib/places';
import { getPositionWithStatus } from '@/lib/location';
import { statusColor } from '@/lib/status';
import type { TranslationKey } from '@/providers/LanguageProvider';

type Candidate = Place & { distanceM: number; along: number };
const RADII = [2, 5, 10, 20, 50];
const MODES: { id: TravelMode; key: TranslationKey }[] = [{ id: 'car', key: 'modeCar' }, { id: 'bike', key: 'modeBike' }, { id: 'foot', key: 'modeFoot' }];
const START_COLOR = '#3EC7B8';
const END_COLOR = '#EF4444';
const toStop = (p: Place): RouteStop => ({ title: p.title, lat: p.latitude, lng: p.longitude, place_id: p.id, cover_url: p.cover_url });

export function RoutePlannerScreen() {
  const { params, navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [start, setStart] = useState<RouteStop | null>(null);
  const [end, setEnd] = useState<RouteStop | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [mode, setMode] = useState<TravelMode>('car');
  const [radiusKm, setRadiusKm] = useState(20);
  const [source, setSource] = useState<'all' | 'mine'>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routing, setRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickTarget, setPickTarget] = useState<'start' | 'end' | null>(null);
  const [focused, setFocused] = useState<Candidate | null>(null);
  const [name, setName] = useState('');
  const [routeId, setRouteId] = useState<string | undefined>(undefined);
  const [viewedId, setViewedId] = useState<string | undefined>(undefined);
  const [visibility, setVisibility] = useState<'public' | 'private' | 'premium'>('private');
  const [shareOpen, setShareOpen] = useState(false);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [denied, setDenied] = useState<{ canAskAgain: boolean } | null>(null);
  const [initializing, setInitializing] = useState(!!(params.routeId || params.boardId));
  const mineRef = useRef<Set<string> | null>(null);
  const reqRef = useRef(0);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 6000); };

  // ---- Initial data: saved route or "route from board" ----
  useEffect(() => {
    (async () => {
      try {
        if (params.routeId) {
          const r = await getRoute(params.routeId);
          if (r) {
            setStart(r.start_point); setEnd(r.end_point); setStops(r.stops ?? []);
            setMode(r.mode ?? 'car'); setRadiusKm(r.radius_km ?? 20); setName(r.name);
            setVisibility(r.visibility ?? 'private');
            // Someone else's (shared) route: view it, saving creates your own copy.
            if (r.user_id === profile?.id) { setRouteId(r.id); setBoardId(r.board_id); } else setViewedId(r.id);
          }
        } else if (params.boardId) {
          const places = params.boardId === 'all'
            ? await listPlaces({ userId: profile?.id, limit: 200 })
            : await listBoardPlaces(params.boardId);
          const ordered = nearestNeighbourOrder(places.map(toStop));
          if (ordered.length >= 2) {
            setStart(ordered[0]); setEnd(ordered[ordered.length - 1]); setStops(ordered.slice(1, -1));
            setName(params.boardName ?? '');
          }
        }
      } catch (e: any) { setError(e?.message ?? t('routeError')); }
      finally { setInitializing(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Route calculation (OSRM) whenever the points change ----
  useEffect(() => {
    if (!start || !end) { setRoute(null); return; }
    const id = ++reqRef.current;
    setRouting(true); setError(null);
    routingProvider().route([start, ...stops, end], mode)
      .then((r) => { if (id === reqRef.current) setRoute({ ...r, geometry: simplify(r.geometry, 600) }); })
      .catch(() => { if (id === reqRef.current) { setRoute(null); setError(t('routeError')); } })
      .finally(() => { if (id === reqRef.current) setRouting(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, end, stops, mode]);

  // ---- Places within radius of the route ----
  const findCandidates = useCallback(async () => {
    if (!route) { setCandidates([]); return; }
    setSearching(true);
    try {
      const cats = category ? CATEGORY_GROUPS.find((g) => g.key === category)?.labels : undefined;
      const raw = await placesInBBox(bboxOf(route.geometry, radiusKm), { categories: cats });
      let pool = raw;
      if (source === 'mine' && profile?.id) {
        if (!mineRef.current) mineRef.current = await myPlaceIds(profile.id);
        pool = raw.filter((p) => p.user_id === profile.id || mineRef.current!.has(p.id));
      }
      const used = new Set([start?.place_id, end?.place_id, ...stops.map((s) => s.place_id)].filter(Boolean));
      const out: Candidate[] = [];
      pool.forEach((p) => {
        if (used.has(p.id)) return;
        const { distanceM, along } = distanceToPolyline({ lat: p.latitude, lng: p.longitude }, route.geometry);
        if (distanceM <= radiusKm * 1000) out.push({ ...p, distanceM, along });
      });
      out.sort((a, b) => a.along - b.along);
      setCandidates(out.slice(0, 300));
    } catch { setCandidates([]); }
    finally { setSearching(false); }
  }, [route, radiusKm, source, category, profile?.id, start, end, stops]);

  useEffect(() => { findCandidates(); }, [findCandidates]);

  const locateMe = async (target: 'start' | 'end') => {
    const r = await getPositionWithStatus();
    if (!r.coords) { if (r.denied) setDenied({ canAskAgain: r.canAskAgain }); return; }
    setDenied(null);
    const p = { title: t('myLocation'), lat: r.coords.latitude, lng: r.coords.longitude };
    if (target === 'start') setStart(p); else setEnd(p);
  };

  const onMapPress = (lat: number, lng: number) => {
    if (!pickTarget) return;
    const p = { title: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng };
    if (pickTarget === 'start') setStart(p); else setEnd(p);
    setPickTarget(null);
  };

  const addStop = (c: Candidate) => {
    const stop = toStop(c);
    setStops((prev) => {
      if (!route) return [...prev, stop];
      const withAlong = [...prev, stop].map((s) => ({ s, a: distanceToPolyline(s, route.geometry).along }));
      return withAlong.sort((x, y) => x.a - y.a).map((x) => x.s);
    });
    setFocused(null);
  };

  const removeStop = (i: number) => setStops((prev) => prev.filter((_, idx) => idx !== i));

  const optimize = () => {
    if (!start || stops.length < 2) return;
    setStops(nearestNeighbourOrder<RouteStop>([start, ...stops]).slice(1));
  };

  const routeName = () => name.trim() || `${start?.title ?? 'A'} → ${end?.title ?? 'B'}`;

  const persist = async (extra: { board_id?: string | null } = {}) => {
    if (!profile?.id || !start || !end) return null;
    const saved = await saveRoute({
      user_id: profile.id, name: routeName(), start_point: start, end_point: end, stops,
      geometry: route ? simplify(route.geometry, 300) : null,
      distance_m: route?.distanceM ?? null, duration_s: route?.durationS ?? null,
      radius_km: radiusKm, mode, visibility: routeId ? visibility : 'private', board_id: extra.board_id ?? boardId,
    }, routeId);
    setRouteId(saved.id);
    return saved;
  };

  const onSave = async () => {
    setSaving(true);
    try { if (await persist()) flash(t('routeSaved')); } catch (e: any) { setError(e?.message ?? 'Error'); }
    finally { setSaving(false); }
  };

  const onSaveAsBoard = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const ids = [start?.place_id, ...stops.map((s) => s.place_id), end?.place_id].filter(Boolean) as string[];
      const b = await createBoardWithPlaces(profile.id, routeName(), ids, 'private');
      setBoardId(b.id);
      await persist({ board_id: b.id });
      flash(t('savedAsBoard'));
    } catch (e: any) { setError(e?.message ?? 'Error'); }
    finally { setSaving(false); }
  };

  const markers: MapMarker[] = useMemo(() => {
    const m: MapMarker[] = [];
    candidates.slice(0, 150).forEach((c) => m.push({ id: `c:${c.id}`, lat: c.latitude, lng: c.longitude, title: c.title, color: statusColor(c.status) }));
    stops.forEach((s, i) => m.push({ id: `s:${i}`, lat: s.lat, lng: s.lng, title: s.title, color: '#2D7FF9', label: String(i + 1) }));
    if (start) m.push({ id: 'start', lat: start.lat, lng: start.lng, title: start.title, color: START_COLOR, label: 'A' });
    if (end) m.push({ id: 'end', lat: end.lat, lng: end.lng, title: end.title, color: END_COLOR, label: 'B' });
    return m;
  }, [candidates, stops, start, end]);

  const center: LatLng = start ?? end ?? { lat: 52.2297, lng: 21.0122 };

  const onMarkerPress = (id: string) => {
    if (id.startsWith('c:')) setFocused(candidates.find((c) => c.id === id.slice(2)) ?? null);
    else if (id.startsWith('s:')) { const s = stops[Number(id.slice(2))]; if (s?.place_id) navigate('placeDetail', { placeId: s.place_id }); }
  };

  if (initializing) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled" testID="route-planner-screen">
      <View style={styles.card}>
        <RoutePointInput label={t('startPoint')} value={start} color={START_COLOR} letter="A" testKey="route-start" picking={pickTarget === 'start'}
          onChange={setStart} onMyLocation={() => locateMe('start')} onPickOnMap={() => setPickTarget(pickTarget === 'start' ? null : 'start')} />
        <RoutePointInput label={t('endPoint')} value={end} color={END_COLOR} letter="B" testKey="route-end" picking={pickTarget === 'end'}
          onChange={setEnd} onMyLocation={() => locateMe('end')} onPickOnMap={() => setPickTarget(pickTarget === 'end' ? null : 'end')} />
        {denied && <LocationDeniedBanner canAskAgain={denied.canAskAgain} onRetry={() => locateMe(start ? 'end' : 'start')} />}
      </View>

      <ChipRow testID="route-mode-row">
        {MODES.map((m) => <Chip key={m.id} label={t(m.key)} active={mode === m.id} onPress={() => setMode(m.id)} testID={`route-mode-${m.id}`} />)}
      </ChipRow>

      <View style={styles.mapWrap}>
        <AppMapView center={center} zoom={11} markers={markers} polyline={route?.geometry ?? []} emitClicks={!!pickTarget}
          onMapPress={onMapPress} onMarkerPress={onMarkerPress} style={styles.map} />
        <MapLayerButton style={styles.layerBtn} />
        {pickTarget && <View style={styles.hint} testID="route-pick-hint"><Text style={styles.hintText}>{t('tapMapToSet')} ({pickTarget === 'start' ? 'A' : 'B'})</Text></View>}
        {routing && <View style={styles.routingBadge}><ActivityIndicator size="small" color="#2D7FF9" /></View>}
        {focused && (
          <View style={styles.focusCard} testID="route-focus-card">
            {focused.cover_url ? <Image source={{ uri: focused.cover_url }} style={styles.focusImg} /> : <View style={[styles.focusImg, styles.ph]}><MapPin size={18} color="#94A3B8" /></View>}
            <View style={{ flex: 1 }}>
              <Text style={styles.focusTitle} numberOfLines={1}>{focused.title}</Text>
              <Text style={styles.focusMeta}>{formatKm(focused.distanceM)}</Text>
            </View>
            <TouchableOpacity style={styles.addBtnSmall} onPress={() => addStop(focused)} testID="route-focus-add"><Plus size={18} color="#fff" /></TouchableOpacity>
            <TouchableOpacity onPress={() => setFocused(null)} testID="route-focus-close" hitSlop={10}><X size={18} color="#6B7280" /></TouchableOpacity>
          </View>
        )}
      </View>

      {route ? (
        <View style={styles.summary} testID="route-summary">
          <RouteIcon size={18} color="#2D7FF9" />
          <Text style={styles.summaryText} testID="route-distance">{formatKm(route.distanceM)}</Text>
          <Text style={styles.summaryDot}>·</Text>
          <Text style={styles.summaryText} testID="route-duration">{formatDuration(route.durationS)}</Text>
          <Text style={styles.summaryDot}>·</Text>
          <Text style={styles.summaryMeta}>{stops.length} {t('stops').toLowerCase()}</Text>
        </View>
      ) : (
        <Text style={styles.muted} testID="route-empty-hint">{error ?? t('setStartEnd')}</Text>
      )}
      {route && error && <Text style={styles.error}>{error}</Text>}

      {stops.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('stops')} ({stops.length})</Text>
            {stops.length > 1 && (
              <TouchableOpacity style={styles.linkBtn} onPress={optimize} testID="route-optimize-btn"><Shuffle size={14} color="#2D7FF9" /><Text style={styles.linkText}>{t('optimizeOrder')}</Text></TouchableOpacity>
            )}
          </View>
          {stops.map((s, i) => (
            <View key={`${s.place_id ?? s.title}-${i}`} style={styles.stopRow} testID={`route-stop-${i}`}>
              <View style={styles.stopNum}><Text style={styles.stopNumText}>{i + 1}</Text></View>
              <Text style={styles.stopTitle} numberOfLines={1}>{s.title}</Text>
              <TouchableOpacity onPress={() => removeStop(i)} testID={`route-stop-remove-${i}`} hitSlop={10}><X size={16} color="#9CA3AF" /></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {route && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('placesAlongRoute')} {searching ? '' : `(${candidates.length})`}</Text>
          <Text style={styles.label}>{t('radiusFromRoute')}</Text>
          <ChipRow testID="route-radius-row">
            {RADII.map((r) => <Chip key={r} label={`${r} km`} active={radiusKm === r} onPress={() => setRadiusKm(r)} testID={`route-radius-${r}`} />)}
          </ChipRow>
          <ChipRow testID="route-source-row">
            <Chip label={t('sourceAll')} active={source === 'all'} onPress={() => setSource('all')} testID="route-source-all" />
            <Chip label={t('sourceMine')} active={source === 'mine'} onPress={() => setSource('mine')} testID="route-source-mine" />
            <Chip label={t('all')} active={category === null} onPress={() => setCategory(null)} testID="route-cat-all" />
            {CATEGORY_GROUPS.map((g) => <Chip key={g.key} label={t(g.key as TranslationKey)} active={category === g.key} onPress={() => setCategory(g.key)} testID={`route-cat-${g.key}`} />)}
          </ChipRow>
          {searching ? <ActivityIndicator color="#2D7FF9" style={{ marginVertical: 16 }} /> : candidates.length === 0 ? (
            <Text style={styles.muted} testID="route-no-candidates">{t('noPlacesFound')}</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.candRow}>
              {candidates.slice(0, 60).map((c) => (
                <View key={c.id} style={styles.cand} testID={`route-candidate-${c.id}`}>
                  <TouchableOpacity onPress={() => navigate('placeDetail', { placeId: c.id })}>
                    {c.cover_url ? <Image source={{ uri: c.cover_url }} style={styles.candImg} /> : <View style={[styles.candImg, styles.ph]}><MapPin size={18} color="#94A3B8" /></View>}
                  </TouchableOpacity>
                  <View style={styles.candBody}>
                    <Text style={styles.candTitle} numberOfLines={1}>{c.title}</Text>
                    <Text style={styles.candMeta}>{formatKm(c.distanceM)}</Text>
                  </View>
                  <TouchableOpacity style={styles.candAdd} onPress={() => addStop(c)} testID={`route-add-${c.id}`}>
                    <Plus size={14} color="#fff" /><Text style={styles.candAddText}>{t('addStop')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {start && end && (
        <View style={styles.section}>
          <Text style={styles.label}>{t('routeName')}</Text>
          <TextInput style={styles.nameInput} value={name} onChangeText={setName} placeholder={`${start.title} → ${end.title}`} placeholderTextColor="#9CA3AF" testID="route-name-input" />
          {msg && <View style={styles.okBox} testID="route-msg"><Check size={14} color="#0F766E" /><Text style={styles.okText}>{msg}</Text></View>}
          <View style={styles.saveRow}>
            <TouchableOpacity style={styles.primaryBtn} onPress={onSave} disabled={saving} testID="route-save-btn">
              {saving ? <ActivityIndicator color="#fff" /> : <>{routeId ? <Check size={16} color="#fff" /> : <Save size={16} color="#fff" />}<Text style={styles.primaryText}>{routeId ? t('routeSaved') : t('saveRoute')}</Text></>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onSaveAsBoard} disabled={saving} testID="route-save-board-btn">
              <LayoutGrid size={16} color="#2D7FF9" /><Text style={styles.secondaryText}>{t('saveAsBoard')}</Text>
            </TouchableOpacity>
          </View>
          {(routeId || viewedId) && (
            <TouchableOpacity style={styles.shareBtn} onPress={() => setShareOpen(true)} testID="route-share-btn">
              <Share2 size={16} color="#374151" /><Text style={styles.shareText}>{t('share')}</Text>
            </TouchableOpacity>
          )}
          {(routeId || viewedId) && (
            <ShareSheet visible={shareOpen} onClose={() => setShareOpen(false)}
              content={{ kind: 'route', id: (routeId ?? viewedId)!, title: routeName(), text: route ? `${formatKm(route.distanceM)} · ${stops.length} ${t('stops').toLowerCase()}` : undefined, imageUrl: stops.find((s) => s.cover_url)?.cover_url, lat: start.lat, lng: start.lng }}
              isPrivate={!!routeId && visibility !== 'public'}
              onMakePublic={routeId ? async () => { await setRouteVisibility(routeId, 'public'); setVisibility('public'); } : undefined} />
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingTop: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  card: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, padding: 14, gap: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  mapWrap: { height: 320, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  layerBtn: { position: 'absolute', top: 12, right: 12 },
  hint: { position: 'absolute', top: 12, left: 56, right: 64, backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  routingBadge: { position: 'absolute', bottom: 12, left: 12, backgroundColor: '#fff', borderRadius: 999, padding: 8 },
  focusCard: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: '#fff', borderRadius: 18, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, elevation: 4 },
  focusImg: { width: 48, height: 48, borderRadius: 12 },
  focusTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  focusMeta: { fontSize: 12, color: '#6B7280' },
  addBtnSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2D7FF9', alignItems: 'center', justifyContent: 'center' },
  ph: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, backgroundColor: '#EFF6FF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12 },
  summaryText: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  summaryDot: { color: '#9CA3AF' },
  summaryMeta: { fontSize: 13, color: '#4B5563', fontWeight: '600' },
  muted: { fontSize: 13, color: '#6B7280', marginHorizontal: 16, marginTop: 12 },
  error: { fontSize: 13, color: '#DC2626', marginHorizontal: 16, marginTop: 8 },
  section: { marginTop: 20, gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1F2937', marginHorizontal: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginHorizontal: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 10 },
  linkText: { fontSize: 13, fontWeight: '700', color: '#2D7FF9' },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, minHeight: 48 },
  stopNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#2D7FF9', alignItems: 'center', justifyContent: 'center' },
  stopNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stopTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' },
  candRow: { paddingHorizontal: 16, gap: 12 },
  cand: { width: 168, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden' },
  candImg: { width: '100%', height: 100 },
  candBody: { paddingHorizontal: 10, paddingTop: 8, gap: 2 },
  candTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  candMeta: { fontSize: 12, color: '#2D7FF9', fontWeight: '700' },
  candAdd: { margin: 10, height: 36, borderRadius: 12, backgroundColor: '#2D7FF9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  candAddText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  nameInput: { marginHorizontal: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, height: 48, paddingHorizontal: 14, fontSize: 15, color: '#1F2937' },
  okBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFBF1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginHorizontal: 16 },
  okText: { color: '#0F766E', fontWeight: '700', fontSize: 13 },
  saveRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 4 },
  primaryBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#2D7FF9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareBtn: { marginHorizontal: 16, height: 48, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  shareText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  secondaryText: { color: '#2D7FF9', fontWeight: '700', fontSize: 15 },
});
