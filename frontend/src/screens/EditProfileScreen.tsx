import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Camera, Check, AlertCircle, User } from 'lucide-react-native';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { updateProfile } from '@/lib/profiles';
import { pickAndUpload } from '@/lib/storage';

export function EditProfileScreen() {
  const { goBack } = useNav();
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeAvatar = async () => {
    if (!profile?.id) return;
    setError(null);
    setUploading(true);
    try {
      const url = await pickAndUpload('avatars', profile.id, { square: true });
      if (url) setAvatarUrl(url);
    } catch (e: any) {
      setError(e?.message || 'Nie udało się przesłać zdjęcia.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!profile?.id) return;
    if (!displayName.trim()) return setError('Nazwa nie może być pusta.');
    setSaving(true);
    try {
      await updateProfile(profile.id, {
        display_name: displayName.trim(),
        bio: bio.trim() || null as any,
        avatar_url: avatarUrl,
      });
      await refreshProfile();
      goBack();
    } catch (e: any) {
      setError(e?.message || 'Nie udało się zapisać profilu.');
      setSaving(false);
    }
  };

  const initial = (displayName || 'T').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.avatarSection}>
        <TouchableOpacity activeOpacity={0.9} onPress={changeAvatar} testID="editprofile-avatar-btn">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          )}
          <View style={styles.avatarEdit}>{uploading ? <ActivityIndicator color="#fff" size="small" /> : <Camera size={18} color="#fff" />}</View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Dotknij, aby zmienić zdjęcie</Text>
      </View>

      <Text style={styles.label}>Nazwa wyświetlana</Text>
      <View style={styles.inputWrap}>
        <User size={20} color="#9CA3AF" style={{ marginLeft: 14 }} />
        <TextInput style={styles.input} placeholder="Twoja nazwa" placeholderTextColor="#9CA3AF" value={displayName} onChangeText={setDisplayName} testID="editprofile-name-input" />
      </View>

      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.inputPlain, styles.textarea]} placeholder="Napisz coś o sobie..." placeholderTextColor="#9CA3AF" value={bio} onChangeText={setBio} multiline testID="editprofile-bio-input" />

      {error && (<View style={styles.errorBox}><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} activeOpacity={0.9} onPress={save} disabled={saving} testID="editprofile-save-btn">
        {saving ? <ActivityIndicator color="#fff" /> : (<><Check size={18} color="#fff" /><Text style={styles.saveBtnText}>Zapisz zmiany</Text></>)}
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelBtn} onPress={goBack}><Text style={styles.cancelBtnText}>Anuluj</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 60, gap: 8 },
  avatarSection: { alignItems: 'center', marginBottom: 12, gap: 8 },
  avatar: { width: 110, height: 110, borderRadius: 32, backgroundColor: '#FF9F43', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 110, height: 110, borderRadius: 32, backgroundColor: '#E5E7EB' },
  avatarText: { fontSize: 40, fontWeight: '800', color: '#fff' },
  avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#2D7FF9', borderWidth: 3, borderColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  avatarHint: { fontSize: 13, color: '#6B7280' },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginTop: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, height: 56 },
  input: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 16, color: '#1F2937', outlineStyle: 'none' } as any,
  inputPlain: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1F2937', outlineStyle: 'none' } as any,
  textarea: { height: 100, textAlignVertical: 'top' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12, marginTop: 8 },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, marginTop: 20, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
});
