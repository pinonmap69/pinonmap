import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Layers, Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MAP_PROVIDERS, setMapProvider, useMapProvider } from '@/lib/mapProviders';
import { useLanguage } from '@/providers/LanguageProvider';

/** Round button opening a bottom sheet to choose the map (tile) provider. */
export function MapLayerButton({ style }: { style?: any }) {
  const [open, setOpen] = useState(false);
  const current = useMapProvider();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    <>
      <TouchableOpacity style={[styles.btn, style]} onPress={() => setOpen(true)} testID="map-layer-btn">
        <Layers size={20} color="#374151" />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]} testID="map-layer-sheet">
            <View style={styles.head}>
              <Text style={styles.title}>{t('mapLayer')}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} testID="map-layer-close"><X size={22} color="#6B7280" /></TouchableOpacity>
            </View>
            {MAP_PROVIDERS.map((p) => (
              <TouchableOpacity key={p.id} style={styles.row} onPress={() => { setMapProvider(p.id); setOpen(false); }} testID={`map-provider-${p.id}`}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{p.name}</Text>
                  <Text style={styles.rowMeta}>{p.attribution}</Text>
                </View>
                {current.id === p.id && <Check size={20} color="#2D7FF9" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', minHeight: 48 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  rowMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
