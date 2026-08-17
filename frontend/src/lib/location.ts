import * as Location from 'expo-location';

export interface Coords {
  latitude: number;
  longitude: number;
}

export interface GeoInfo {
  city?: string;
  country?: string;
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentPosition(): Promise<Coords | null> {
  try {
    const granted = await requestLocationPermission();
    if (!granted) return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    return null;
  }
}

export async function reverseGeocode(coords: Coords): Promise<GeoInfo> {
  try {
    const results = await Location.reverseGeocodeAsync(coords);
    const r = results?.[0];
    if (!r) return {};
    return {
      city: r.city || r.subregion || r.region || undefined,
      country: r.country || undefined,
    };
  } catch {
    return {};
  }
}
