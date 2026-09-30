import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { MapPinOff } from 'lucide-react-native';
import { useLanguage } from '@/providers/LanguageProvider';

/** Shown when location permission is denied: retry (if the OS still allows asking) or open app settings. */
export function LocationDeniedBanner({ canAskAgain, onRetry }: { canAskAgain: boolean; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <View style={styles.box} testID="location-denied-banner">
      <MapPinOff size={18} color="#C2410C" />
      <Text style={styles.text}>{t('locationDenied')}</Text>
      <View style={styles.row}>
        {canAskAgain && (
          <TouchableOpacity style={styles.btn} onPress={onRetry} testID="location-retry-btn"><Text style={styles.btnText}>{t('tryAgain')}</Text></TouchableOpacity>
        )}
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => Linking.openSettings()} testID="location-open-settings-btn">
            <Text style={[styles.btnText, { color: '#fff' }]}>{t('openSettings')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#FFF7ED', borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: '#FED7AA' },
  text: { fontSize: 13, color: '#9A3412' },
  row: { flexDirection: 'row', gap: 8 },
  btn: { height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FED7AA' },
  btnPrimary: { backgroundColor: '#EA580C', borderColor: '#EA580C' },
  btnText: { fontSize: 13, fontWeight: '700', color: '#C2410C' },
});
