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

export interface PositionResult {
  coords: Coords | null;
  denied: boolean;
  canAskAgain: boolean;
}

/** Like getCurrentPosition but reports permission state so screens can offer "Open settings". */
export async function getPositionWithStatus(): Promise<PositionResult> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted' && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { coords: null, denied: true, canAskAgain: perm.canAskAgain };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }, denied: false, canAskAgain: true };
  } catch {
    return { coords: null, denied: false, canAskAgain: true };
  }
}
