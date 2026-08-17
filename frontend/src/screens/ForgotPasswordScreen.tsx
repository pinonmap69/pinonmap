import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { ChevronLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';
import { resetPassword } from '@/lib/auth';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export function ForgotPasswordScreen({ onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError(null);
    if (!email.trim()) return setError('Podaj adres e-mail.');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Nie udało się wysłać linku.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}><TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Wróć" testID="forgot-back-btn"><ChevronLeft size={22} color="#374151" /></TouchableOpacity></View>
      <View style={styles.body}>
        {sent ? (
          <FadeIn>
            <View style={styles.confirmIcon}><CheckCircle2 size={40} color="#22C55E" /></View>
            <Text style={styles.title}>Link wysłany</Text>
            <Text style={styles.subtitle}>Jeśli konto istnieje, wysłaliśmy link do zresetowania hasła na {email}.</Text>
          </FadeIn>
        ) : (
          <>
            <FadeIn><Text style={styles.title}>Nie pamiętasz hasła?</Text><Text style={styles.subtitle}>Podaj e-mail, a wyślemy link do zresetowania hasła.</Text></FadeIn>
            <FadeIn delay={100}>
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>E-mail</Text>
                  <View style={styles.inputWrap}><Mail size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="ty@przyklad.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} testID="forgot-email-input" /></View>
                </View>
                {error && (<View style={styles.errorBox}><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}
                <TouchableOpacity style={[styles.primaryBtn, loading && styles.btnDisabled]} activeOpacity={0.9} onPress={submit} disabled={loading} testID="forgot-submit-btn">
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Wyślij link resetujący</Text>}
                </TouchableOpacity>
              </View>
            </FadeIn>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingTop: Platform.OS === 'ios' ? 56 : 28, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  confirmIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  subtitle: { marginTop: 8, fontSize: 15, color: '#6B7280', lineHeight: 22 },
  form: { marginTop: 32, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, height: 56 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 16, color: '#1F2937', outlineStyle: 'none' } as any,
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12 },
  errorText: { flex: 1, fontSize: 13, color: '#DC2626', fontWeight: '500' },
  primaryBtn: { backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
