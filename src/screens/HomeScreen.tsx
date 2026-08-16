import { View, Text, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Bell, Search } from 'lucide-react-native';
import { HOME_CARDS, HERO_IMAGE } from '@/theme';
import { FadeIn } from '@/components/FadeIn';
import type { Screen } from '@/types';

interface HomeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.greetingRow}>
        <View><Text style={styles.greetingLabel}>Good morning</Text><Text style={styles.greetingName}>Traveler 👋</Text></View>
        <View style={styles.iconRow}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}><Search size={20} color="#374151" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}><Bell size={20} color="#374151" /><View style={styles.notificationDot} /></TouchableOpacity>
        </View>
      </View>
      <FadeIn scale delay={50}>
        <View style={styles.heroWrap}>
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>FEATURED</Text></View>
            <Text style={styles.heroTitle}>Your next adventure awaits</Text>
            <Text style={styles.heroSubtitle}>Explore breathtaking destinations worldwide</Text>
          </View>
        </View>
      </FadeIn>
      <View style={styles.cardsSection}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.cardsGrid}>
          {HOME_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <FadeIn key={card.id} delay={100 + i * 60} distance={16}>
                <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={() => onNavigate(card.screen)}>
                  <View style={[styles.cardIcon, { backgroundColor: card.gradient[0] }]}><Icon size={24} color="#fff" strokeWidth={2.2} /></View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>{card.subtitle}</Text>
                </TouchableOpacity>
              </FadeIn>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 100, backgroundColor: '#F8FAFC' },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  greetingLabel: { fontSize: 14, color: '#6B7280' },
  greetingName: { fontSize: 24, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9F43', borderWidth: 2, borderColor: '#fff' },
  heroWrap: { marginHorizontal: 20, height: 192, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%', backgroundColor: 'rgba(15,23,42,0.6)' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cardsSection: { paddingHorizontal: 20, gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47.5%', flexGrow: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardIcon: { width: 48, height: 48, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
});
