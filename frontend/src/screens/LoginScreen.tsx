import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, ActivityIndicator } from 'react-native';
import { ChevronLeft, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';
import { signIn } from '@/lib/auth';

interface LoginScreenProps {
  onBack: () => void;
  onForgot: () => void;
  onGoRegister: () => void;
}

export function LoginScreen({ onBack, onForgot, onGoRegister }: LoginScreenProps) {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Podaj adres e-mail i hasło.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      // Session change is handled globally by AuthProvider.
    } catch (e: any) {
      const msg = e?.message || 'Nie udało się zalogować.';
      setError(msg.includes('Invalid login') ? 'Nieprawidłowy e-mail lub hasło.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Wróć" testID="login-back-btn"><ChevronLeft size={22} color="#374151" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <FadeIn><Text style={styles.title}>Witaj ponownie</Text><Text style={styles.subtitle}>Zaloguj się, aby kontynuować podróż.</Text></FadeIn>
        <FadeIn delay={100}>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrap}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="ty@przyklad.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} testID="login-email-input" />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Hasło</Text>
              <View style={styles.inputWrap}>
                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry={!showPass} value={password} onChangeText={setPassword} testID="login-password-input" />
                <TouchableOpacity onPress={() => setShowPass((s) => !s)} style={styles.eyeBtn}>{showPass ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}</TouchableOpacity>
              </View>
            </View>
            {error && (
              <View style={styles.errorBox} testID="login-error">
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View style={styles.forgotRow}><TouchableOpacity onPress={onForgot}><Text style={styles.forgotText}>Nie pamiętasz hasła?</Text></TouchableOpacity></View>
            <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} activeOpacity={0.9} onPress={submit} disabled={loading} testID="login-submit-btn">
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Zaloguj się</Text>}
            </TouchableOpacity>
          </View>
        </FadeIn>
        <FadeIn delay={200}>
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Nie masz konta? </Text>
            <TouchableOpacity onPress={onGoRegister} testID="login-go-register"><Text style={styles.registerLink}>Zarejestruj się</Text></TouchableOpacity>
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
  title: { fontSize: 30, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  subtitle: { marginTop: 8, fontSize: 15, color: '#6B7280' },
  form: { marginTop: 32, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, height: 56 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 16, color: '#1F2937', outlineStyle: 'none' } as any,
  eyeBtn: { paddingHorizontal: 16, height: '100%', alignItems: 'center', justifyContent: 'center' },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500' },
  forgotRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  forgotText: { fontSize: 14, fontWeight: '600', color: '#2D7FF9' },
  primaryBtn: { backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  registerText: { fontSize: 14, color: '#6B7280' },
  registerLink: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
});
