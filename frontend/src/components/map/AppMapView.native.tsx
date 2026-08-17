import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { buildLeafletHtml, type LeafletOptions } from './leafletHtml';

export interface MapViewProps extends LeafletOptions {
  style?: ViewStyle;
  onMarkerPress?: (id: string) => void;
  onMapPress?: (lat: number, lng: number) => void;
}

export function AppMapView({ style, onMarkerPress, onMapPress, ...opts }: MapViewProps) {
  const html = buildLeafletHtml(opts);
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={[styles.web, style]}
      javaScriptEnabled
      domStorageEnabled
      onMessage={(event) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'markerPress' && onMarkerPress) onMarkerPress(data.id);
          if (data.type === 'mapPress' && onMapPress) onMapPress(data.lat, data.lng);
        } catch {}
      }}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#e8eef3' },
});
