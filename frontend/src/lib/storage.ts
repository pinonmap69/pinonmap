import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

function randomId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type Bucket = 'avatars' | 'place-photos';

async function uploadBase64(bucket: Bucket, userId: string, base64: string, mime: string) {
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${randomId()}.${ext}`;
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(base64), { contentType: mime, cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return pub.publicUrl;
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

/** Launches the camera, uploads the captured image, returns its public URL (or null if cancelled). */
export async function captureAndUpload(
  bucket: Bucket,
  userId: string,
): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Brak zgody na dostęp do aparatu.');

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    base64: true,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset.base64) throw new Error('Nie udało się odczytać danych zdjęcia.');
  const mime = asset.mimeType?.startsWith('image/') ? asset.mimeType : 'image/jpeg';
  return uploadBase64(bucket, userId, asset.base64, mime);
}
