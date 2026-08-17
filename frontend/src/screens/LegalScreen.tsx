import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { ScreenHeader } from '@/components/ScreenHeader';
import { FadeIn } from '@/components/FadeIn';

interface LegalScreenProps {
  title: string;
  onBack: () => void;
}

const TERMS_SECTIONS = [
  { heading: '1. Acceptance of Terms', body: 'By accessing and using Pin on Map, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our application.' },
  { heading: '2. Use of the Service', body: 'Pin on Map provides a platform for discovering travel destinations and saving memories. You agree to use the service responsibly and in compliance with all applicable laws.' },
  { heading: '3. User Accounts', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.' },
  { heading: '4. Content', body: 'You retain ownership of content you upload. By sharing content on Pin on Map, you grant us a license to display it within the service.' },
  { heading: '5. Limitation of Liability', body: 'Pin on Map is provided on an "as is" basis. We are not liable for any damages arising from the use or inability to use the service.' },
  { heading: '6. Changes to Terms', body: 'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.' },
];

const PRIVACY_SECTIONS = [
  { heading: '1. Information We Collect', body: 'We collect information you provide directly, such as your name, email, and travel memories you choose to save in the app.' },
  { heading: '2. How We Use Your Information', body: 'Your information is used to provide and improve our services, personalize your experience, and communicate with you about your account.' },
  { heading: '3. Data Storage', body: 'Your data is stored securely using industry-standard encryption. Travel memories and photos are associated with your account.' },
  { heading: '4. Sharing of Information', body: 'We do not sell your personal information. We may share data with service providers who help us operate the app, under strict confidentiality agreements.' },
  { heading: '5. Your Rights', body: 'You can access, modify, or delete your personal data at any time through the app settings or by contacting us.' },
  { heading: '6. Data Retention', body: 'We retain your information for as long as your account is active or as needed to provide services and comply with legal obligations.' },
];

export function LegalScreen({ title, onBack }: LegalScreenProps) {
  const sections = title.toLowerCase().includes('terms') ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  return (
    <View style={styles.container}>
      <ScreenHeader title={title} onBack={onBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeIn><View style={styles.heroCard}><Text style={styles.heroTitle}>{title}</Text><Text style={styles.heroDate}>Last updated: August 2026</Text></View></FadeIn>
        <View style={styles.sections}>
          {sections.map((s, i) => (
            <FadeIn key={i} delay={i * 50}><View style={styles.section}><Text style={styles.sectionHeading}>{s.heading}</Text><Text style={styles.sectionBody}>{s.body}</Text></View></FadeIn>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: Platform.OS === 'ios' ? 56 : 28, paddingBottom: 100 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 20 },
  heroCard: { backgroundColor: '#2D7FF9', borderRadius: 28, padding: 20, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  heroDate: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  sections: { gap: 20 },
  section: { gap: 6 },
  sectionHeading: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  sectionBody: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
});
