import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Bell, Search, MapPin, Compass, BarChart3, Crown, Plus, Camera } from 'lucide-react-native';
import { HERO_IMAGE } from '@/theme';
import { FadeIn } from '@/components/FadeIn';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { listPlaces, type Place } from '@/lib/places';
import type { Screen } from '@/types';

const QUICK = [
  { id: 'map', title: 'Mapa podróży', subtitle: 'Twoje przypięte miejsca na świecie.', icon: MapPin, screen: 'map' as Screen, color: '#2D7FF9' },
  { id: 'explore', title: 'Inspiracje', subtitle: 'Odkrywaj miejsca innych podróżników.', icon: Compass, screen: 'explore' as Screen, color: '#FF9F43' },
  { id: 'statistics', title: 'Statystyki', subtitle: 'Śledź swoją podróżniczą historię.', icon: BarChart3, screen: 'statistics' as Screen, color: '#3EC7B8' },
  { id: 'premium', title: 'Premium', subtitle: 'Mapy offline i funkcje premium.', icon: Crown, screen: 'premium' as Screen, color: '#1D4ED8' },
];

export function HomeScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await listPlaces({ userId: profile?.id, limit: 8 });
      setPlaces(data);
    } catch {
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const firstName = (profile?.display_name || 'Podróżniku').split(' ')[0];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.greetingRow}>
        <View><Text style={styles.greetingLabel}>Witaj z powrotem</Text><Text style={styles.greetingName} testID="home-greeting-name">{firstName} 👋</Text></View>
        <View style={styles.iconRow}>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn} onPress={() => navigate('explore')}><Search size={20} color="#374151" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.iconBtn}><Bell size={20} color="#374151" /><View style={styles.notificationDot} /></TouchableOpacity>
        </View>
      </View>

      <FadeIn scale delay={50}>
        <TouchableOpacity activeOpacity={0.9} style={styles.heroWrap} onPress={() => navigate('addPlace')} testID="home-hero-add">
          <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>NOWE</Text></View>
            <Text style={styles.heroTitle}>Przypnij nowe miejsce</Text>
            <Text style={styles.heroSubtitle}>Zapisz lokalizację ze zdjęciem i opisem</Text>
          </View>
          <View style={styles.heroFab}><Plus size={22} color="#2D7FF9" strokeWidth={2.6} /></View>
        </TouchableOpacity>
      </FadeIn>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Szybki dostęp</Text>
        <View style={styles.cardsGrid}>
          {QUICK.map((card, i) => {
            const Icon = card.icon;
            return (
              <FadeIn key={card.id} delay={100 + i * 60} distance={16}>
                <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={() => navigate(card.screen)} testID={`home-quick-${card.id}`}>
                  <View style={[styles.cardIcon, { backgroundColor: card.color }]}><Icon size={24} color="#fff" strokeWidth={2.2} /></View>
                  <Text style={styles.cardTitle} numberOfLines={1}>{card.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>{card.subtitle}</Text>
                </TouchableOpacity>
              </FadeIn>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Twoje ostatnie miejsca</Text>
          <TouchableOpacity onPress={() => navigate('map')}><Text style={styles.seeAll}>Zobacz mapę</Text></TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color="#2D7FF9" style={{ marginTop: 20 }} />
        ) : places.length === 0 ? (
          <TouchableOpacity style={styles.emptyCard} activeOpacity={0.9} onPress={() => navigate('addPlace')} testID="home-empty-add">
            <View style={styles.emptyIcon}><Camera size={22} color="#2D7FF9" /></View>
            <Text style={styles.emptyTitle}>Brak zapisanych miejsc</Text>
            <Text style={styles.emptySubtitle}>Dodaj pierwsze miejsce, aby zacząć budować swoją mapę podróży.</Text>
          </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
            {places.map((p) => (
              <TouchableOpacity key={p.id} activeOpacity={0.9} style={styles.recentCard} onPress={() => navigate('placeDetail', { placeId: p.id })} testID={`home-place-${p.id}`}>
                {p.cover_url ? (
                  <Image source={{ uri: p.cover_url }} style={styles.recentImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.recentImage, styles.recentPlaceholder]}><MapPin size={22} color="#94A3B8" /></View>
                )}
                <View style={styles.recentBody}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={styles.recentMeta} numberOfLines={1}>{[p.city, p.country].filter(Boolean).join(', ') || 'Bez lokalizacji'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingTop: Platform.OS === 'ios' ? 56 : 32, paddingBottom: 120 },
  greetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  greetingLabel: { fontSize: 14, color: '#6B7280' },
  greetingName: { fontSize: 24, fontWeight: '800', color: '#1F2937', letterSpacing: -0.5 },
  iconRow: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9F43', borderWidth: 2, borderColor: '#fff' },
  heroWrap: { marginHorizontal: 20, marginTop: 16, height: 192, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', backgroundColor: 'rgba(15,23,42,0.55)' },
  heroContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  heroBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  heroBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  heroFab: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  section: { paddingHorizontal: 20, gap: 16, marginTop: 28 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  seeAll: { fontSize: 13, fontWeight: '600', color: '#2D7FF9' },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47.5%', flexGrow: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 24, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardIcon: { width: 48, height: 48, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  recentRow: { gap: 12, paddingRight: 8 },
  recentCard: { width: 180, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  recentImage: { width: '100%', height: 110 },
  recentPlaceholder: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  recentBody: { padding: 12 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  recentMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', padding: 20, alignItems: 'center', gap: 6 },
  emptyIcon: { width: 48, height: 48, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  emptySubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
});
