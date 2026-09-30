import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Search, Crosshair, MapPinned, X } from 'lucide-react-native';
import { geocode, type GeocodeResult } from '@/lib/routing';
import type { RouteStop } from '@/lib/routes';
import { useLanguage } from '@/providers/LanguageProvider';

interface Props {
  label: string;
  value: RouteStop | null;
  color: string;
  letter: string;
  testKey: string;
  picking: boolean;
  onChange: (v: RouteStop | null) => void;
  onMyLocation: () => void;
  onPickOnMap: () => void;
}

export const shortTitle = (s: string) => s.split(',').slice(0, 2).join(',').trim();

/** Start / destination field: geocoding search + "my location" + "pick on map". */
export function RoutePointInput({ label, value, color, letter, testKey, picking, onChange, onMyLocation, onPickOnMap }: Props) {
  const { t, language } = useLanguage();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try { setResults(await geocode(q, language)); } catch { setResults([]); } finally { setBusy(false); }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: color }]}><Text style={styles.badgeText}>{letter}</Text></View>
        {value ? (
          <View style={styles.valueBox} testID={`${testKey}-value`}>
            <Text style={styles.valueText} numberOfLines={1}>{value.title}</Text>
            <TouchableOpacity onPress={() => onChange(null)} testID={`${testKey}-clear`} hitSlop={10}><X size={16} color="#6B7280" /></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              placeholder={`${label} — ${t('searchAddress')}`}
              placeholderTextColor="#9CA3AF"
              value={q}
              onChangeText={setQ}
              onSubmitEditing={run}
              returnKeyType="search"
              testID={`${testKey}-input`}
            />
            <TouchableOpacity onPress={run} testID={`${testKey}-search-btn`} style={styles.iconBtn}>
              {busy ? <ActivityIndicator size="small" color="#2D7FF9" /> : <Search size={18} color="#2D7FF9" />}
            </TouchableOpacity>
          </View>
        )}
      </View>
      {!value && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={onMyLocation} testID={`${testKey}-my-location`}>
            <Crosshair size={14} color="#0F766E" /><Text style={styles.actionText}>{t('myLocation')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.action, picking && styles.actionActive]} onPress={onPickOnMap} testID={`${testKey}-pick-map`}>
            <MapPinned size={14} color={picking ? '#fff' : '#2D7FF9'} /><Text style={[styles.actionText, { color: picking ? '#fff' : '#2D7FF9' }]}>{t('pickOnMap')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {!value && results.length > 0 && (
        <View style={styles.results} testID={`${testKey}-results`}>
          {results.map((r, i) => (
            <TouchableOpacity key={i} style={styles.result} onPress={() => { onChange({ title: shortTitle(r.title), lat: r.lat, lng: r.lng }); setResults([]); setQ(''); }} testID={`${testKey}-result-${i}`}>
              <Text style={styles.resultText} numberOfLines={2}>{r.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, height: 48, paddingLeft: 12 },
  input: { flex: 1, fontSize: 14, color: '#1F2937', height: 46 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  valueBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EFF6FF', borderRadius: 14, height: 48, paddingHorizontal: 12 },
  valueText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937' },
  actions: { flexDirection: 'row', gap: 8, paddingLeft: 38 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  actionActive: { backgroundColor: '#2D7FF9', borderColor: '#2D7FF9' },
  actionText: { fontSize: 12, fontWeight: '700', color: '#0F766E' },
  results: { marginLeft: 38, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  result: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', minHeight: 44, justifyContent: 'center' },
  resultText: { fontSize: 13, color: '#374151' },
});
