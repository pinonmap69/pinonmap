import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/providers/LanguageProvider';
import { getProgress, listXpRules, loc, xpForLevel, type XpRule, type Progress } from '@/lib/gamification';
import { TIER_COLORS } from '@/components/Gamification';

/** In-app documentation of XP, level and achievement rules (mirrors docs/GAMIFICATION.md). */
export function XpRulesScreen() {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<XpRule[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listXpRules(), getProgress()]).then(([r, p]) => { setRules(r); setProgress(p); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 24 }]} testID="xp-rules-screen">
      <Text style={styles.intro}>{t('xpRulesIntro')}</Text>
      <View style={styles.card}>
        {rules.map((r) => (
          <View key={r.type} style={styles.row} testID={`xp-rule-${r.type}`}>
            <Text style={styles.label}>{language === 'pl' ? r.label_pl : r.label_en}</Text>
            <Text style={styles.xp}>+{r.xp} XP</Text>
          </View>
        ))}
      </View>

      <Text style={styles.title}>{t('levelsTitle')}</Text>
      <Text style={styles.intro}>{t('levelFormula')}</Text>
      <View style={styles.levels}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((l) => (
          <View key={l} style={styles.levelCell}><Text style={styles.levelNum}>{l}</Text><Text style={styles.levelXp}>{xpForLevel(l)}</Text></View>
        ))}
      </View>

      <Text style={styles.title}>{t('achievementsTitle')}</Text>
      <View style={styles.card}>
        {progress?.achievements.map((a) => (
          <View key={a.code} style={styles.row}>
            <View style={[styles.tier, { backgroundColor: TIER_COLORS[a.tier].ring }]} />
            <Text style={styles.label}>{loc(a, language)} — {language === 'pl' ? a.desc_pl : a.desc_en}</Text>
            <Text style={styles.xp}>+{a.xp}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.title}>{t('missions')}</Text>
      <View style={styles.card}>
        {progress?.missions.map((m) => (
          <View key={m.code} style={styles.row}>
            <Text style={styles.label}>{loc(m, language)} — {language === 'pl' ? m.desc_pl : m.desc_en} ({m.period === 'weekly' ? t('weekly') : t('oneTime')})</Text>
            <Text style={styles.xp}>+{m.xp}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.intro}>{t('rewardsNote')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  intro: { fontSize: 13, color: '#4B5563', lineHeight: 19 },
  title: { fontSize: 17, fontWeight: '800', color: '#1F2937', marginTop: 10 },
  card: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  label: { flex: 1, fontSize: 13, color: '#1F2937' },
  xp: { fontSize: 13, fontWeight: '800', color: '#10B981' },
  tier: { width: 10, height: 10, borderRadius: 5 },
  levels: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelCell: { width: '18%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  levelNum: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
  levelXp: { fontSize: 11, color: '#6B7280' },
});
