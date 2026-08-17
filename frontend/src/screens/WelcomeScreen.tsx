import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Compass } from 'lucide-react-native';
import { WELCOME_IMAGE } from '@/theme';
import { FadeIn } from '@/components/FadeIn';
import type { Screen } from '@/types';

interface WelcomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <Image source={{ uri: WELCOME_IMAGE }} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <FadeIn>
          <View style={styles.logoRow}>
            <View style={styles.logoWrap}><Compass size={20} color="#fff" strokeWidth={2.5} /></View>
            <Text style={styles.logoText}>Pin on Map</Text>
          </View>
        </FadeIn>
        <View style={styles.spacer} />
        <FadeIn delay={100}><Text style={styles.headline}>Odkrywaj niezwykłe miejsca{'\n'}na całym świecie.</Text></FadeIn>
        <FadeIn delay={150}><Text style={styles.subtitle}>Zapisuj wspomnienia.{'\n'}Dziel się przygodami.{'\n'}Odkrywajcie razem.</Text></FadeIn>
        <FadeIn delay={250}>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={() => onNavigate('register')} testID="welcome-register-btn"><Text style={styles.primaryBtnText}>Utwórz konto</Text></TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.9} onPress={() => onNavigate('login')} testID="welcome-login-btn"><Text style={styles.secondaryBtnText}>Zaloguj się</Text></TouchableOpacity>
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => onNavigate('privacy')}><Text style={styles.link}>Polityka prywatności</Text></TouchableOpacity>
              <Text style={styles.linkDot}>•</Text>
              <TouchableOpacity onPress={() => onNavigate('terms')}><Text style={styles.link}>Regulamin</Text></TouchableOpacity>
            </View>
          </View>
        </FadeIn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  bgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.5)' },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24, marginTop: Platform.OS === 'ios' ? 56 : 40 },
  logoWrap: { width: 40, height: 40, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  spacer: { flex: 1 },
  headline: { fontSize: 30, fontWeight: '800', color: '#fff', lineHeight: 38, letterSpacing: -0.5 },
  subtitle: { marginTop: 12, fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 24 },
  buttonGroup: { marginTop: 32, gap: 12 },
  primaryBtn: { backgroundColor: '#2D7FF9', paddingVertical: 16, borderRadius: 18, alignItems: 'center', shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  secondaryBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 16, borderRadius: 18, alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  linksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 8 },
  link: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.6)', textDecorationLine: 'underline' },
  linkDot: { fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});
