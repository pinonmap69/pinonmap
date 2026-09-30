// Map (tile) provider registry. The whole app renders maps through AppMapView -> Leaflet,
// so switching provider here changes every map. New providers (Mapbox, Google tiles with a key,
// self-hosted vector tiles...) are added by appending to MAP_PROVIDERS.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MapProvider {
  id: string;
  name: string;
  tileUrl: string;
  maxZoom: number;
  attribution: string;
}

export const MAP_PROVIDERS: MapProvider[] = [
  { id: 'osm', name: 'OpenStreetMap', tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', maxZoom: 19, attribution: '© OpenStreetMap' },
  { id: 'voyager', name: 'Carto Voyager', tileUrl: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', maxZoom: 20, attribution: '© OpenStreetMap © CARTO' },
  { id: 'topo', name: 'OpenTopoMap', tileUrl: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', maxZoom: 17, attribution: '© OpenTopoMap' },
  { id: 'satellite', name: 'Esri Satellite', tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maxZoom: 19, attribution: '© Esri' },
];

const KEY = 'pom-map-provider';
let current: MapProvider = MAP_PROVIDERS[0];
const listeners = new Set<(p: MapProvider) => void>();
let loaded = false;

async function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  const id = await AsyncStorage.getItem(KEY);
  const found = MAP_PROVIDERS.find((p) => p.id === id);
  if (found && found.id !== current.id) { current = found; listeners.forEach((l) => l(current)); }
}

export function setMapProvider(id: string) {
  const found = MAP_PROVIDERS.find((p) => p.id === id);
  if (!found) return;
  current = found;
  void AsyncStorage.setItem(KEY, id);
  listeners.forEach((l) => l(current));
}

export function useMapProvider(): MapProvider {
  const [p, setP] = useState(current);
  useEffect(() => {
    listeners.add(setP);
    void ensureLoaded();
    return () => { listeners.delete(setP); };
  }, []);
  return p;
}
