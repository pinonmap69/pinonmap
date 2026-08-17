import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronLeft, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';
import { signUp } from '@/lib/auth';

interface RegisterScreenProps {
  onBack: () => void;
  onGoLogin: () => void;
}

export function RegisterScreen({ onBack, onGoLogin }: RegisterScreenProps) {
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Podaj swoją nazwę.');
    if (!email.trim()) return setError('Podaj adres e-mail.');
    if (password.length < 6) return setError('Hasło musi mieć co najmniej 6 znaków.');
    if (password !== confirm) return setError('Hasła nie są takie same.');
    setLoading(true);
    try {
      const data = await signUp(email, password, name.trim());
      if (!data.session) {
        setConfirmSent(true);
      }
      // If a session was returned, AuthProvider will switch to the app automatically.
    } catch (e: any) {
      const msg = e?.message || 'Nie udało się utworzyć konta.';
      setError(msg.includes('already registered') ? 'Ten e-mail jest już zarejestrowany.' : msg);
    } finally {
      setLoading(false);
    }
  };

  if (confirmSent) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}><TouchableOpacity onPress={onGoLogin} activeOpacity={0.7} style={styles.backBtn}><ChevronLeft size={22} color="#374151" /></TouchableOpacity></View>
        <View style={styles.confirmBody}>
          <View style={styles.confirmIcon}><CheckCircle2 size={40} color="#22C55E" /></View>
          <Text style={styles.title}>Sprawdź swoją skrzynkę</Text>
          <Text style={styles.subtitle}>Wysłaliśmy link potwierdzający na {email}. Kliknij go, aby aktywować konto, a następnie zaloguj się.</Text>
          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={onGoLogin} testID="register-go-login-btn"><Text style={styles.primaryBtnText}>Przejdź do logowania</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}><TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Wróć" testID="register-back-btn"><ChevronLeft size={22} color="#374151" /></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <FadeIn><Text style={styles.title}>Utwórz konto</Text><Text style={styles.subtitle}>Rozpocznij swoją podróżniczą historię już dziś.</Text></FadeIn>
        <FadeIn delay={100}>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nazwa</Text>
              <View style={styles.inputWrap}><User size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Twoja nazwa" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} testID="register-name-input" /></View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}><Mail size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="ty@przyklad.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} testID="register-email-input" /></View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Hasło</Text>
              <View style={styles.inputWrap}><Lock size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry={!showPass} value={password} onChangeText={setPassword} testID="register-password-input" /><TouchableOpacity onPress={() => setShowPass((s) => !s)} style={styles.eyeBtn}>{showPass ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}</TouchableOpacity></View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Powtórz hasło</Text>
              <View style={styles.inputWrap}><Lock size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry={!showPass} value={confirm} onChangeText={setConfirm} testID="register-confirm-input" /></View>
            </View>
            {error && (<View style={styles.errorBox} testID="register-error"><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}
            <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} activeOpacity={0.9} onPress={submit} disabled={loading} testID="register-submit-btn">
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Utwórz konto</Text>}
            </TouchableOpacity>
          </View>
        </FadeIn>
        <FadeIn delay={200}>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Masz już konto? </Text>
            <TouchableOpacity onPress={onGoLogin} testID="register-go-login"><Text style={styles.registerLink}>Zaloguj się</Text></TouchableOpacity>
          </View>
        </FadeIn>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingTop: Platform.OS === 'ios' ? 56 : 28, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  confirmBody: { flex: 1, paddingHorizontal: 24, paddingTop: 40, alignItems: 'center', gap: 12 },
  confirmIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 30, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { marginTop: 8, fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  form: { marginTop: 28, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, height: 56 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 16, color: '#1F2937', outlineStyle: 'none' } as any,
  eyeBtn: { paddingHorizontal: 16, height: '100%', alignItems: 'center', justifyContent: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500' },
  primaryBtn: { backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 8, minWidth: 200, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  registerText: { fontSize: 14, color: '#6B7280' },
  registerLink: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
});
