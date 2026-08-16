import { View, Text, Image, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import { FadeIn } from './FadeIn';

interface ComingSoonProps {
  image: string;
  title: string;
  subtitle: string;
  icon?: ReactNode;
}

export function ComingSoon({ image, title, subtitle, icon }: ComingSoonProps) {
  return (
    <View style={styles.container}>
      <FadeIn scale>
        <View style={styles.imageWrap}>
          <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          {icon && <View style={styles.iconBadge}>{icon}</View>}
        </View>
      </FadeIn>
      <FadeIn delay={100}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
      </FadeIn>
      <FadeIn delay={150}><Text style={styles.title}>{title}</Text></FadeIn>
      <FadeIn delay={200}><Text style={styles.subtitle}>{subtitle}</Text></FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  imageWrap: { width: '100%', height: 240, borderRadius: 28, overflow: 'hidden', marginBottom: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', backgroundColor: 'rgba(0,0,0,0.35)' },
  iconBadge: { position: 'absolute', bottom: 16, left: 16, width: 48, height: 48, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFEDD5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 14 },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF9F43' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#C2410C' },
  title: { fontSize: 24, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, maxWidth: 280 },
});
