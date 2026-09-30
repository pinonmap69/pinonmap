import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Plus, Layers, Globe, Lock, Images } from 'lucide-react-native';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { boardsOverview, createBoard, listPublicBoards, type BoardOverview } from '@/lib/boards';
import { listPlaces } from '@/lib/places';
import { useLanguage } from '@/providers/LanguageProvider';

export function BoardsScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [boards, setBoards] = useState<BoardOverview[]>([]);
  const [publicBoards, setPublicBoards] = useState<BoardOverview[]>([]);
  const [allCount, setAllCount] = useState(0);
  const [allCover, setAllCover] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [mine, mineAll, pub] = await Promise.all([
        boardsOverview(profile.id),
        listPlaces({ userId: profile.id, limit: 1 }),
        listPublicBoards(profile.id, 20),
      ]);
      setBoards(mine);
      setAllCover(mineAll[0]?.cover_url ?? null);
      const all = await listPlaces({ userId: profile.id, limit: 500 });
      setAllCount(all.length);
      setPublicBoards(pub);
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!profile?.id || !name.trim()) return;
    setCreating(true);
    try { await createBoard({ user_id: profile.id, name: name.trim(), visibility: 'public' }); setName(''); await load(); }
    catch {} finally { setCreating(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} testID="boards-screen">
      <View style={styles.createRow}>
        <TextInput style={styles.input} placeholder={t('boardNamePlaceholder')} value={name} onChangeText={setName} testID="new-board-input" />
        <TouchableOpacity style={styles.createBtn} onPress={create} disabled={creating} testID="create-board-btn">
          {creating ? <ActivityIndicator color="#fff" /> : <Plus size={22} color="#fff" />}
        </TouchableOpacity>
      </View>

      <View style={styles.grid}>
        {/* Virtual "All" board */}
        <TouchableOpacity style={styles.card} onPress={() => navigate('boardDetail', { boardId: 'all', boardName: t('all') })} testID="board-card-all">
          {allCover ? <Image source={{ uri: allCover }} style={styles.cardImg} /> : <View style={[styles.cardImg, styles.ph]}><Images size={26} color="#94A3B8" /></View>}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{t('all')}</Text>
            <Text style={styles.cardMeta}>{allCount} {t('pins')}</Text>
          </View>
        </TouchableOpacity>

        {boards.map((b) => (
          <TouchableOpacity key={b.id} style={styles.card} onPress={() => navigate('boardDetail', { boardId: b.id, boardName: b.name })} testID={`board-card-${b.id}`}>
            {b.cover ? <Image source={{ uri: b.cover }} style={styles.cardImg} /> : <View style={[styles.cardImg, styles.ph]}><Layers size={26} color="#94A3B8" /></View>}
            <View style={styles.visBadge}>{b.visibility === 'public' ? <Globe size={11} color="#fff" /> : <Lock size={11} color="#fff" />}</View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={1}>{b.name}</Text>
              <Text style={styles.cardMeta}>{b.count} {t('pins')}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {boards.length === 0 && <Text style={styles.hint}>{t('noBoardsYet')}</Text>}

      {publicBoards.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('discoverBoards')}</Text>
          <View style={styles.grid}>
            {publicBoards.map((b) => (
              <TouchableOpacity key={b.id} style={styles.card} onPress={() => navigate('boardDetail', { boardId: b.id, boardName: b.name })} testID={`public-board-${b.id}`}>
                {b.cover ? <Image source={{ uri: b.cover }} style={styles.cardImg} /> : <View style={[styles.cardImg, styles.ph]}><Layers size={26} color="#94A3B8" /></View>}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{b.name}</Text>
                  <Text style={styles.cardMeta}>{b.count} {t('pins')}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 16, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  createRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 14, height: 52, fontSize: 15, color: '#1F2937' },
  createBtn: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#2D7FF9', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  cardImg: { width: '100%', height: 120 },
  ph: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  visBadge: { position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  cardMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  hint: { fontSize: 14, color: '#6B7280', marginTop: 16, textAlign: 'center' },
  section: { marginTop: 28, gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
});
