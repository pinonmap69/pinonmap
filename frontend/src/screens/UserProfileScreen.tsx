import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { UserPlus, UserCheck, MapPin, Layers } from 'lucide-react-native';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { getProfile, getProfileStats, type Profile, type ProfileStats } from '@/lib/profiles';
import { boardsOverview, type BoardOverview } from '@/lib/boards';
import { isFollowing, toggleFollow, countFollowers, countFollowing } from '@/lib/social';
import { useLanguage } from '@/providers/LanguageProvider';
import { getPublicLevel } from '@/lib/gamification';
import { LevelPill } from '@/components/Gamification';

export function UserProfileScreen() {
  const { params, navigate } = useNav();
  const { profile: me } = useAuth();
  const { t } = useLanguage();
  const userId: string = params.userId ?? '';
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ pins: 0, cities: 0, countries: 0 });
  const [boards, setBoards] = useState<BoardOverview[]>([]);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lvl, setLvl] = useState({ xp: 0, level: 1, badges: 0 });

  const load = useCallback(async () => {
    try {
      const [p, s, b, f1, f2, isF] = await Promise.all([
        getProfile(userId),
        getProfileStats(userId),
        boardsOverview(userId),
        countFollowers(userId),
        countFollowing(userId),
        me?.id ? isFollowing(me.id, userId) : Promise.resolve(false),
      ]);
      getPublicLevel(userId).then(setLvl).catch(() => {});
      setProfileState(p); setStats(s); setBoards(b); setFollowers(f1); setFollowingCount(f2); setFollowing(isF);
    } catch {} finally { setLoading(false); }
  }, [userId, me?.id]);

  useEffect(() => { load(); }, [load]);

  const onFollow = async () => {
    if (!me?.id || busy) return;
    setBusy(true);
    const next = !following;
    setFollowing(next); setFollowers((c) => c + (next ? 1 : -1));
    try { await toggleFollow(me.id, userId, following); }
    catch { setFollowing(!next); setFollowers((c) => c + (next ? -1 : 1)); }
    finally { setBusy(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  const name = profile?.display_name || t('traveler');
  const initial = name.charAt(0).toUpperCase();
  const isMe = me?.id === userId;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} testID="user-profile-screen">
      <View style={styles.top}>
        {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>}
        <Text style={styles.name}>{name}</Text>
        <View style={styles.lvlRow}><LevelPill level={lvl.level} testID="user-level" /><Text style={styles.lvlText}>{lvl.xp} XP · {lvl.badges} {t('badges').toLowerCase()}</Text></View>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statValue}>{stats.pins}</Text><Text style={styles.statLabel}>{t('pins')}</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{followers}</Text><Text style={styles.statLabel}>{t('followers')}</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{followingCount}</Text><Text style={styles.statLabel}>{t('followingLabel')}</Text></View>
        </View>
        {!isMe && (
          <TouchableOpacity style={[styles.followBtn, following && styles.followingBtn]} onPress={onFollow} disabled={busy} testID="follow-btn">
            {following ? <UserCheck size={16} color="#2D7FF9" /> : <UserPlus size={16} color="#fff" />}
            <Text style={[styles.followText, following && styles.followingText]}>{following ? t('following') : t('follow')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>{t('publicBoards')}</Text>
      {boards.length === 0 ? (
        <Text style={styles.hint}>{t('noBoardsYet')}</Text>
      ) : (
        <View style={styles.grid}>
          {boards.map((b) => (
            <TouchableOpacity key={b.id} style={styles.card} onPress={() => navigate('boardDetail', { boardId: b.id, boardName: b.name })} testID={`profile-board-${b.id}`}>
              {b.cover ? <Image source={{ uri: b.cover }} style={styles.cardImg} /> : <View style={[styles.cardImg, styles.ph]}><Layers size={24} color="#94A3B8" /></View>}
              <View style={styles.cardBody}><Text style={styles.cardTitle} numberOfLines={1}>{b.name}</Text><Text style={styles.cardMeta}><MapPin size={11} color="#6B7280" /> {b.count} {t('pins')}</Text></View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  lvlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  lvlText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  top: { alignItems: 'center', gap: 8, marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 28, backgroundColor: '#FF9F43', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 96, height: 96, borderRadius: 28 },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#fff' },
  name: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  bio: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 28, marginTop: 8 },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  followBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2D7FF9', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999, marginTop: 10 },
  followingBtn: { backgroundColor: '#EFF6FF' },
  followText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  followingText: { color: '#2D7FF9' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 12 },
  hint: { fontSize: 14, color: '#6B7280' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  cardImg: { width: '100%', height: 110 },
  ph: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
