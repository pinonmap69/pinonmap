import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Crown, Check, Download, MapPin, Sparkles, BarChart3, Bell } from 'lucide-react-native';
import { FadeIn } from '@/components/FadeIn';
import { PREMIUM_IMAGE } from '@/theme';

const BENEFITS = [
  { icon: Download, title: 'Offline Maps', desc: 'Download maps for any region and travel without internet.' },
  { icon: MapPin, title: 'Unlimited Pins', desc: 'Pin every place you visit with no limits.' },
  { icon: Sparkles, title: 'AI Recommendations', desc: 'Get personalized travel suggestions powered by AI.' },
  { icon: BarChart3, title: 'Advanced Stats', desc: 'Deep insights into your travel patterns and habits.' },
  { icon: Bell, title: 'Priority Alerts', desc: 'Be first to know about new features and destinations.' },
];

export function PremiumScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.heroWrap}>
        <Image source={{ uri: PREMIUM_IMAGE }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}><Crown size={14} color="#fff" /><Text style={styles.heroBadgeText}>PIN ON MAP PREMIUM</Text></View>
          <Text style={styles.heroTitle}>Unlock the full experience</Text>
        </View>
      </View>
      <View style={styles.benefits}>
        {BENEFITS.map((b, i) => {
          const Icon = b.icon;
          return (
            <FadeIn key={b.title} delay={i * 60} distance={14}>
              <View style={styles.benefitCard}>
                <View style={styles.benefitIcon}><Icon size={20} color="#fff" /></View>
                <View style={styles.benefitBody}><Text style={styles.benefitTitle}>{b.title}</Text><Text style={styles.benefitDesc}>{b.desc}</Text></View>
                <Check size={20} color="#22C55E" />
              </View>
            </FadeIn>
          );
        })}
      </View>
      <FadeIn delay={350}>
        <View style={styles.pricingCard}>
          <Text style={styles.pricingLabel}>Starting from</Text>
          <Text style={styles.pricingPrice}>$4.99<Text style={styles.pricingPeriod}>/mo</Text></Text>
          <TouchableOpacity style={styles.pricingBtn} activeOpacity={0.9}><Text style={styles.pricingBtnText}>Start Free Trial</Text></TouchableOpacity>
          <Text style={styles.pricingNote}>Cancel anytime. No payment required yet.</Text>
        </View>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  heroWrap: { height: 200, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%', backgroundColor: 'rgba(15,23,42,0.45)' },
  heroContent: { position: 'absolute', bottom: 16, left: 20, right: 20 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FF9F43', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  heroBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  benefits: { paddingHorizontal: 20, paddingTop: 24, gap: 12 },
  benefitCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  benefitIcon: { width: 44, height: 44, borderRadius: 18, backgroundColor: '#2D7FF9', alignItems: 'center', justifyContent: 'center', shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  benefitBody: { flex: 1 },
  benefitTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  benefitDesc: { fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 16 },
  pricingCard: { margin: 20, marginTop: 24, backgroundColor: '#2D7FF9', borderRadius: 28, padding: 20, alignItems: 'center', shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  pricingLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  pricingPrice: { fontSize: 40, fontWeight: '800', color: '#fff', marginTop: 4 },
  pricingPeriod: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  pricingBtn: { width: '100%', backgroundColor: '#fff', paddingVertical: 14, borderRadius: 18, alignItems: 'center', marginTop: 16 },
  pricingBtnText: { fontSize: 16, fontWeight: '700', color: '#2D7FF9' },
  pricingNote: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 12 },
});
