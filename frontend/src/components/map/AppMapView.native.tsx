import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { buildLeafletHtml, type LeafletOptions, type MapShape } from './leafletHtml';
import { useMapProvider } from '@/lib/mapProviders';

export interface MapViewProps extends LeafletOptions {
  style?: ViewStyle;
  onMarkerPress?: (id: string) => void;
  onMapPress?: (lat: number, lng: number) => void;
  onAreaDrawn?: (shape: MapShape) => void;
  onViewChange?: (v: { lat: number; lng: number; zoom: number }) => void;
}

export function AppMapView({ style, onMarkerPress, onMapPress, onAreaDrawn, onViewChange, ...opts }: MapViewProps) {
  const provider = useMapProvider();
  const html = buildLeafletHtml({ tileUrl: provider.tileUrl, maxZoom: provider.maxZoom, ...opts });
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
          if (data.type === 'markerPress') onMarkerPress?.(data.id);
          if (data.type === 'mapPress') onMapPress?.(data.lat, data.lng);
          if (data.type === 'areaDrawn') onAreaDrawn?.(data.shape);
          if (data.type === 'view') onViewChange?.({ lat: data.lat, lng: data.lng, zoom: data.zoom });
        } catch {}
      }}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#e8eef3' },
});
