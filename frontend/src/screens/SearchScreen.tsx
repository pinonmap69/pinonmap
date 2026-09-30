import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Search, X, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, ChipRow } from '@/components/Chip';
import { PlaceMasonry } from '@/components/PlaceMasonry';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage, type TranslationKey } from '@/providers/LanguageProvider';
import { searchPlaces, placesInBBox, topCategories, CATEGORY_GROUPS, type SearchMode } from '@/lib/search';
import { geocode } from '@/lib/routing';
import { bboxOf, haversineM } from '@/lib/geo';
import type { Place } from '@/lib/places';

const PAGE = 30;
const GEO_RADIUS_KM = 25;

export function SearchScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [mode, setMode] = useState<SearchMode>('name');
  const [category, setCategory] = useState<string | null>(null); // group key | 'forYou' | null
  const [interests, setInterests] = useState<string[]>([]);
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [end, setEnd] = useState(false);
  const busyRef = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => { if (profile?.id) topCategories(profile.id).then(setInterests).catch(() => {}); }, [profile?.id]);

  const categoryLabels = useCallback((): string[] | undefined => {
    if (!category) return undefined;
    const keys = category === 'forYou' ? interests : [category];
    return CATEGORY_GROUPS.filter((g) => keys.includes(g.key)).flatMap((g) => g.labels);
  }, [category, interests]);

  const runSearch = useCallback(async () => {
    setLoading(true); setEnd(false); offsetRef.current = 0;
    try {
      const cats = categoryLabels();
      const text = await searchPlaces({ query: submitted, mode, categories: cats, offset: 0, limit: PAGE });
      let merged = text;
      if (mode === 'location' && submitted.trim()) {
        const geo = await geocode(submitted, language).catch(() => []);
        if (geo[0]) {
          const c = { lat: geo[0].lat, lng: geo[0].lng };
          const near = (await placesInBBox(bboxOf([c], GEO_RADIUS_KM), { categories: cats, limit: 300 }))
            .filter((p) => haversineM(c, { lat: p.latitude, lng: p.longitude }) <= GEO_RADIUS_KM * 1000);
          const seen = new Set(text.map((p) => p.id));
          merged = [...text, ...near.filter((p) => !seen.has(p.id))];
        }
      }
      offsetRef.current = text.length;
      setResults(merged);
      if (text.length < PAGE) setEnd(true);
    } catch { setResults([]); setEnd(true); }
    finally { setLoading(false); }
  }, [submitted, mode, categoryLabels, language]);

  useEffect(() => { runSearch(); }, [runSearch]);

  const loadMore = async () => {
    if (busyRef.current || end || loading) return;
    busyRef.current = true; setLoadingMore(true);
    try {
      const more = await searchPlaces({ query: submitted, mode, categories: categoryLabels(), offset: offsetRef.current, limit: PAGE });
      offsetRef.current += more.length;
      setResults((prev) => { const seen = new Set(prev.map((p) => p.id)); return [...prev, ...more.filter((p) => !seen.has(p.id))]; });
      if (more.length < PAGE) setEnd(true);
    } catch { setEnd(true); }
    finally { busyRef.current = false; setLoadingMore(false); }
  };

  const onScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 500) loadMore();
  };

  return (
    <View style={styles.root} testID="search-screen">
      <View style={styles.top}>
        <View style={styles.inputBox}>
          <Search size={18} color="#9CA3AF" />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => setSubmitted(query)}
            returnKeyType="search"
            placeholder={mode === 'name' ? t('searchPlaceholderName') : t('searchPlaceholderLocation')}
            placeholderTextColor="#9CA3AF"
            testID="search-input"
          />
          {query ? <TouchableOpacity onPress={() => { setQuery(''); setSubmitted(''); }} testID="search-clear" hitSlop={10}><X size={16} color="#6B7280" /></TouchableOpacity> : null}
        </View>
        <TouchableOpacity style={styles.goBtn} onPress={() => setSubmitted(query)} testID="search-submit"><Text style={styles.goText}>{t('search')}</Text></TouchableOpacity>
      </View>
      <ChipRow testID="search-mode-row">
        <Chip label={t('byName')} active={mode === 'name'} onPress={() => setMode('name')} testID="search-mode-name" />
        <Chip label={t('byLocation')} active={mode === 'location'} onPress={() => setMode('location')} testID="search-mode-location" />
      </ChipRow>
      <ChipRow testID="search-category-row">
        <Chip label={t('all')} active={category === null} onPress={() => setCategory(null)} testID="search-cat-all" />
        {interests.length > 0 && <Chip label={t('forYou')} icon={<Sparkles size={14} color={category === 'forYou' ? '#fff' : '#FF9F43'} />} active={category === 'forYou'} onPress={() => setCategory('forYou')} testID="search-cat-foryou" />}
        {CATEGORY_GROUPS.map((g) => <Chip key={g.key} label={t(g.key as TranslationKey)} active={category === g.key} onPress={() => setCategory(g.key)} testID={`search-cat-${g.key}`} />)}
      </ChipRow>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]} onScroll={onScroll} scrollEventThrottle={200} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        {loading ? <ActivityIndicator color="#2D7FF9" style={{ marginTop: 24 }} /> : results.length === 0 ? (
          <Text style={styles.muted} testID="search-empty">{t('noPlacesFound')}</Text>
        ) : (
          <>
            <Text style={styles.count} testID="search-results-count">{results.length}{end ? '' : '+'} {t('results')}</Text>
            <PlaceMasonry places={results} onPress={(p) => navigate('placeDetail', { placeId: p.id })} testPrefix="search-result" />
            {loadingMore && <ActivityIndicator color="#2D7FF9" style={{ marginVertical: 16 }} />}
            {!loadingMore && !end && (
              <TouchableOpacity style={styles.more} onPress={loadMore} testID="search-load-more"><Text style={styles.moreText}>{t('loadMore')}</Text></TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  top: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, height: 48, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15, color: '#1F2937', height: 46 },
  goBtn: { height: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#2D7FF9', alignItems: 'center', justifyContent: 'center' },
  goText: { color: '#fff', fontWeight: '700' },
  scroll: { flex: 1 },
  list: { paddingHorizontal: 12, paddingTop: 4 },
  count: { fontSize: 13, color: '#6B7280', marginBottom: 10, marginLeft: 4 },
  muted: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 24 },
  more: { alignSelf: 'center', marginTop: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 24, height: 44, justifyContent: 'center', borderRadius: 999 },
  moreText: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
});
