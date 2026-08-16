import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ChevronLeft, User, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: () => void;
}

export function RegisterScreen({ onBack, onRegister }: RegisterScreenProps) {
  const [showPass, setShowPass] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.topBar}><TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backBtn} accessibilityLabel="Back"><ChevronLeft size={22} color="#374151" /></TouchableOpacity></View>
      <View style={styles.body}>
        <FadeIn><Text style={styles.title}>Create account</Text><Text style={styles.subtitle}>Start your travel story today.</Text></FadeIn>
        <FadeIn delay={100}>
          <View style={styles.form}>
            <View style={styles.field}><Text style={styles.label}>Name</Text><View style={styles.inputWrap}><User size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Your name" placeholderTextColor="#9CA3AF" /></View></View>
            <View style={styles.field}><Text style={styles.label}>Email</Text><View style={styles.inputWrap}><Mail size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" /></View></View>
            <View style={styles.field}><Text style={styles.label}>Password</Text><View style={styles.inputWrap}><Lock size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry={!showPass} /><TouchableOpacity onPress={() => setShowPass((s) => !s)} style={styles.eyeBtn}>{showPass ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}</TouchableOpacity></View></View>
            <View style={styles.field}><Text style={styles.label}>Confirm Password</Text><View style={styles.inputWrap}><Lock size={20} color="#9CA3AF" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#9CA3AF" secureTextEntry={!showPass} /></View></View>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={onRegister}><Text style={styles.primaryBtnText}>Create Account</Text></TouchableOpacity>
          </View>
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: { paddingTop: Platform.OS === 'ios' ? 56 : 28, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  subtitle: { marginTop: 8, fontSize: 15, color: '#6B7280' },
  form: { marginTop: 32, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 18, height: 56 },
  inputIcon: { marginLeft: 16 },
  input: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 16, color: '#1F2937' },
  eyeBtn: { paddingHorizontal: 16, height: '100%', alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginTop: 8, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
