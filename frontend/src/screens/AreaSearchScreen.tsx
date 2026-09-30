import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Circle, Square, RefreshCw, LayoutGrid, Check, Crosshair } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppMapView } from '@/components/map/AppMapView';
import type { MapMarker, MapShape } from '@/components/map/leafletHtml';
import { MapLayerButton } from '@/components/MapLayerButton';
import { Chip, ChipRow } from '@/components/Chip';
import { PlaceMasonry } from '@/components/PlaceMasonry';
import { LocationDeniedBanner } from '@/components/LocationDeniedBanner';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage, type TranslationKey } from '@/providers/LanguageProvider';
import { shapeBBox, inShape, haversineM, formatKm, type AreaShape, type LatLng } from '@/lib/geo';
import { placesInBBox, myPlaceIds, CATEGORY_GROUPS } from '@/lib/search';
import { createBoardWithPlaces } from '@/lib/boards';
import { getPositionWithStatus } from '@/lib/location';
import { statusColor } from '@/lib/status';
import type { Place } from '@/lib/places';

const NEARBY_RADII = [1, 5, 10, 25, 50];
const DEFAULT_CENTER = { lat: 52.2297, lng: 21.0122 };

export function AreaSearchScreen() {
  const { params, navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const nearby = !!params.nearby;
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [drawMode, setDrawMode] = useState<'circle' | 'rect' | null>(nearby ? null : 'circle');
  const [shape, setShape] = useState<AreaShape | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [source, setSource] = useState<'all' | 'mine'>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(nearby);
  const [denied, setDenied] = useState<{ canAskAgain: boolean } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const viewRef = useRef<LatLng>(DEFAULT_CENTER);
  const mineRef = useRef<Set<string> | null>(null);

  // Nearby: current position -> circle of `radiusKm`
  const locate = useCallback(async () => {
    setLocating(true);
    const r = await getPositionWithStatus();
    setLocating(false);
    if (!r.coords) { if (r.denied) setDenied({ canAskAgain: r.canAskAgain }); return; }
    setDenied(null);
    const c = { lat: r.coords.latitude, lng: r.coords.longitude };
    setMapCenter(c); viewRef.current = c;
    setShape({ type: 'circle', lat: c.lat, lng: c.lng, radiusM: radiusKm * 1000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (nearby) locate(); }, [nearby, locate]);

  useEffect(() => {
    if (nearby && shape?.type === 'circle') setShape({ ...shape, radiusM: radiusKm * 1000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radiusKm]);

  const search = useCallback(async () => {
    if (!shape) { setResults([]); return; }
    setLoading(true);
    try {
      const cats = category ? CATEGORY_GROUPS.find((g) => g.key === category)?.labels : undefined;
      let rows = (await placesInBBox(shapeBBox(shape), { categories: cats })).filter((p) => inShape({ lat: p.latitude, lng: p.longitude }, shape));
      if (source === 'mine' && profile?.id) {
        if (!mineRef.current) mineRef.current = await myPlaceIds(profile.id);
        rows = rows.filter((p) => p.user_id === profile.id || mineRef.current!.has(p.id));
      }
      if (shape.type === 'circle') {
        const c = { lat: shape.lat, lng: shape.lng };
        rows.sort((a, b) => haversineM(c, { lat: a.latitude, lng: a.longitude }) - haversineM(c, { lat: b.latitude, lng: b.longitude }));
      }
      setResults(rows);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, [shape, source, category, profile?.id]);

  useEffect(() => { search(); }, [search]);

  const startDraw = (m: 'circle' | 'rect') => {
    setMapCenter(viewRef.current);
    setShape(null); setResults([]); setDrawMode(m);
  };

  const onAreaDrawn = (s: MapShape) => {
    setMapCenter(viewRef.current);
    setShape(s as AreaShape); setDrawMode(null);
  };

  const saveAsBoard = async () => {
    if (!profile?.id || !results.length) return;
    setSaving(true);
    try {
      const name = nearby ? t('nearbyTitle') : `${t('areaSearch')} · ${new Date().toLocaleDateString()}`;
      await createBoardWithPlaces(profile.id, name, results.slice(0, 500).map((p) => p.id), 'private');
      setMsg(t('savedAsBoard')); setTimeout(() => setMsg(null), 2800);
    } catch {} finally { setSaving(false); }
  };

  const markers: MapMarker[] = useMemo(
    () => results.slice(0, 300).map((p) => ({ id: p.id, lat: p.latitude, lng: p.longitude, title: p.title, color: statusColor(p.status) })),
    [results],
  );

  const caption = (p: Place) => (shape?.type === 'circle' ? formatKm(haversineM({ lat: shape.lat, lng: shape.lng }, { lat: p.latitude, lng: p.longitude })) : undefined);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} testID={nearby ? 'nearby-screen' : 'area-search-screen'}>
      <Text style={styles.subtitle}>{nearby ? t('nearbySub') : t('areaSearchSub')}</Text>

      {nearby ? (
        <ChipRow testID="nearby-radius-row">
          {NEARBY_RADII.map((r) => <Chip key={r} label={`${r} km`} active={radiusKm === r} onPress={() => setRadiusKm(r)} testID={`nearby-radius-${r}`} />)}
        </ChipRow>
      ) : (
        <View style={styles.modeRow}>
          <TouchableOpacity style={[styles.modeBtn, drawMode === 'circle' && styles.modeBtnActive]} onPress={() => startDraw('circle')} testID="area-mode-circle">
            <Circle size={16} color={drawMode === 'circle' ? '#fff' : '#1F2937'} /><Text style={[styles.modeText, drawMode === 'circle' && styles.modeTextActive]}>{t('circle')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modeBtn, drawMode === 'rect' && styles.modeBtnActive]} onPress={() => startDraw('rect')} testID="area-mode-rect">
            <Square size={16} color={drawMode === 'rect' ? '#fff' : '#1F2937'} /><Text style={[styles.modeText, drawMode === 'rect' && styles.modeTextActive]}>{t('rectangle')}</Text>
          </TouchableOpacity>
          {shape && (
            <TouchableOpacity style={styles.modeBtn} onPress={() => startDraw(shape.type)} testID="area-redraw-btn">
              <RefreshCw size={16} color="#1F2937" /><Text style={styles.modeText}>{t('redraw')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {denied && <View style={styles.pad}><LocationDeniedBanner canAskAgain={denied.canAskAgain} onRetry={locate} /></View>}

      <View style={styles.mapWrap}>
        {locating ? <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View> : (
          <AppMapView center={mapCenter} zoom={nearby ? 12 : 6} markers={markers} shape={shape} drawMode={drawMode} showUser={nearby}
            onAreaDrawn={onAreaDrawn} onViewChange={(v) => { viewRef.current = { lat: v.lat, lng: v.lng }; }}
            onMarkerPress={(id) => navigate('placeDetail', { placeId: id })} style={styles.map} />
        )}
        <MapLayerButton style={styles.layerBtn} />
        {nearby && <TouchableOpacity style={styles.locateBtn} onPress={locate} testID="nearby-locate-btn"><Crosshair size={20} color="#374151" /></TouchableOpacity>}
        {drawMode && <View style={styles.hint} testID="area-draw-hint"><Text style={styles.hintText}>{drawMode === 'circle' ? t('drawHintCircle') : t('drawHintRect')}</Text></View>}
      </View>

      <ChipRow testID="area-filter-row">
        <Chip label={t('sourceAll')} active={source === 'all'} onPress={() => setSource('all')} testID="area-source-all" />
        <Chip label={t('sourceMine')} active={source === 'mine'} onPress={() => setSource('mine')} testID="area-source-mine" />
        <Chip label={t('all')} active={category === null} onPress={() => setCategory(null)} testID="area-cat-all" />
        {CATEGORY_GROUPS.map((g) => <Chip key={g.key} label={t(g.key as TranslationKey)} active={category === g.key} onPress={() => setCategory(g.key)} testID={`area-cat-${g.key}`} />)}
      </ChipRow>

      <View style={styles.resultsHead}>
        <Text style={styles.sectionTitle} testID="area-results-count">{t('placesInArea')} {shape && !loading ? `(${results.length})` : ''}</Text>
        {results.length > 0 && (
          <TouchableOpacity style={styles.saveBtn} onPress={saveAsBoard} disabled={saving} testID="area-save-board-btn">
            {saving ? <ActivityIndicator size="small" color="#2D7FF9" /> : <><LayoutGrid size={14} color="#2D7FF9" /><Text style={styles.saveText}>{t('saveAsBoard')}</Text></>}
          </TouchableOpacity>
        )}
      </View>
      {msg && <View style={styles.okBox} testID="area-msg"><Check size={14} color="#0F766E" /><Text style={styles.okText}>{msg}</Text></View>}

      <View style={styles.pad}>
        {loading ? <ActivityIndicator color="#2D7FF9" style={{ marginTop: 20 }} /> : !shape ? null : results.length === 0 ? (
          <Text style={styles.muted} testID="area-empty">{t('noPlacesFound')}</Text>
        ) : (
          <PlaceMasonry places={results.slice(0, 200)} onPress={(p) => navigate('placeDetail', { placeId: p.id })} testPrefix="area-result" caption={caption} />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingTop: 12 },
  subtitle: { fontSize: 14, color: '#6B7280', marginHorizontal: 16, marginBottom: 4 },
  pad: { paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  modeBtnActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  modeText: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  modeTextActive: { color: '#fff' },
  mapWrap: { height: 340, marginHorizontal: 16, marginTop: 4, borderRadius: 24, overflow: 'hidden', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  layerBtn: { position: 'absolute', top: 12, right: 12 },
  locateBtn: { position: 'absolute', top: 64, right: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: '#1F2937', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  resultsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1F2937', flexShrink: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#EFF6FF' },
  saveText: { fontSize: 12, fontWeight: '700', color: '#2D7FF9' },
  okBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFBF1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginHorizontal: 16, marginBottom: 10 },
  okText: { color: '#0F766E', fontWeight: '700', fontSize: 13 },
  muted: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 20 },
});
