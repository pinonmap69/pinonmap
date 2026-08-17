import { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { buildLeafletHtml, type LeafletOptions } from './leafletHtml';

export interface MapViewProps extends LeafletOptions {
  style?: ViewStyle;
  onMarkerPress?: (id: string) => void;
  onMapPress?: (lat: number, lng: number) => void;
}

export function AppMapView({ style, onMarkerPress, onMapPress, ...opts }: MapViewProps) {
  const html = buildLeafletHtml(opts);
  const handlerRef = useRef({ onMarkerPress, onMapPress });
  handlerRef.current = { onMarkerPress, onMapPress };

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data || !data.type) return;
        if (data.type === 'markerPress' && handlerRef.current.onMarkerPress) {
          handlerRef.current.onMarkerPress(data.id);
        }
        if (data.type === 'mapPress' && handlerRef.current.onMapPress) {
          handlerRef.current.onMapPress(data.lat, data.lng);
        }
      } catch {}
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <View style={[styles.web, style]}>
      {/* @ts-ignore - iframe is a real DOM element on react-native-web */}
      <iframe
        title="map"
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#e8eef3', overflow: 'hidden' },
});
