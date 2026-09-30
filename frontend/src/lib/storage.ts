import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import exifr from 'exifr';
import { supabase } from './supabase';
import type { Coords } from './location';

function randomId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type Bucket = 'avatars' | 'place-photos';

export async function uploadBase64(bucket: Bucket, userId: string, base64: string, mime: string) {
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${randomId()}.${ext}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), { contentType: mime, cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return pub.publicUrl;
}

/** Reads GPS coordinates embedded in a photo's EXIF metadata (works on web + native). */
export async function readGpsFromBase64(base64: string): Promise<Coords | null> {
  try {
    const bytes = new Uint8Array(decode(base64));
    const gps = await exifr.gps(bytes);
    if (gps && Number.isFinite(gps.latitude) && Number.isFinite(gps.longitude)) {
      return { latitude: gps.latitude, longitude: gps.longitude };
    }
  } catch {
    // no EXIF / unreadable — silently ignore
  }
  return null;
}

/** Launches the gallery, uploads the chosen image, returns its public URL (or null if cancelled). */
export async function pickAndUpload(
  bucket: Bucket,
  userId: string,
  opts: { square?: boolean } = {},
): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Brak zgody na dostęp do galerii zdjęć.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !!opts.square,
    aspect: opts.square ? [1, 1] : undefined,
    quality: 0.8,
    base64: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Nie udało się odczytać danych zdjęcia.');
  const mime = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/jpeg';
  return uploadBase64(bucket, userId, asset.base64, mime);
}

export interface PickedPhoto {
  url: string;
  gps: Coords | null;
}

/** Gallery photo for a Place: uploads it AND extracts GPS from its EXIF metadata if present. */
export async function pickPlacePhoto(userId: string): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Brak zgody na dostęp do galerii zdjęć.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    base64: true,
    exif: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Nie udało się odczytać danych zdjęcia.');
  const mime = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/jpeg';
  const gps = await readGpsFromBase64(asset.base64);
  const url = await uploadBase64('place-photos', userId, asset.base64, mime);
  return { url, gps };
}

/** Camera photo for a Place: uploads it (and reads GPS if the device embeds it). */
export async function capturePlacePhoto(userId: string): Promise<PickedPhoto | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Brak zgody na dostęp do aparatu.');

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    base64: true,
    exif: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Nie udało się odczytać danych zdjęcia.');
  const mime = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/jpeg';
  const gps = await readGpsFromBase64(asset.base64);
  const url = await uploadBase64('place-photos', userId, asset.base64, mime);
  return { url, gps };
}
