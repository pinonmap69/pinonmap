import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MapPin, Trash2, X } from 'lucide-react-native';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { getBoard, listBoardPlaces, deleteBoard, removePinFromBoard, type Board } from '@/lib/boards';
import { listPlaces, type Place } from '@/lib/places';
import { statusColor } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

const HEIGHTS = [150, 210, 175, 240, 190, 165];

export function BoardDetailScreen() {
  const { params, navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const boardId: string = params.boardId ?? '';
  const isAll = boardId === 'all';
  const [board, setBoard] = useState<Board | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      if (isAll) {
        setPlaces(await listPlaces({ userId: profile?.id, limit: 500 }));
      } else {
        const [b, pins] = await Promise.all([getBoard(boardId), listBoardPlaces(boardId)]);
        setBoard(b);
        setPlaces(pins);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [boardId, isAll, profile?.id]);

  useEffect(() => { load(); }, [load]);

  const isOwner = isAll ? true : !!board && board.user_id === profile?.id;

  const removePin = async (placeId: string) => {
    if (isAll || !board) return;
    setPlaces((prev) => prev.filter((p) => p.id !== placeId));
    try { await removePinFromBoard(board.id, placeId); } catch { load(); }
  };

  const remove = async () => {
    if (isAll || !board) return;
    try { await deleteBoard(board.id); navigate('boards'); } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  const columns: Place[][] = [[], []];
  places.forEach((p, i) => columns[i % 2].push(p));
  const title = isAll ? t('all') : board?.name ?? '';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} testID="board-detail-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{places.length} {t('pins')}{board?.description ? ` · ${board.description}` : ''}</Text>
      </View>

      {places.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyText}>{t('boardEmpty')}</Text></View>
      ) : (
        <View style={styles.masonry}>
          {columns.map((col, ci) => (
            <View key={ci} style={styles.col}>
              {col.map((p, i) => (
                <TouchableOpacity key={p.id} style={styles.card} onPress={() => navigate('placeDetail', { placeId: p.id })} testID={`board-pin-${p.id}`}>
                  {p.cover_url ? <Image source={{ uri: p.cover_url }} style={[styles.cardImg, { height: HEIGHTS[(ci * 3 + i) % HEIGHTS.length] }]} /> : <View style={[styles.cardImg, styles.ph, { height: 160 }]}><MapPin size={22} color="#94A3B8" /></View>}
                  <View style={[styles.statusPill, { backgroundColor: statusColor(p.status) }]} />
                  {!isAll && isOwner && (
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removePin(p.id)} testID={`remove-pin-${p.id}`}><X size={14} color="#fff" /></TouchableOpacity>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>{[p.city, p.country].filter(Boolean).join(', ') || t('coordinates')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      )}

      {!isAll && isOwner && board && (
        <TouchableOpacity style={styles.deleteBtn} onPress={remove} testID="delete-board-btn"><Trash2 size={16} color="#EF4444" /><Text style={styles.deleteBtnText}>{t('deleteBoard')}</Text></TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { padding: 12, paddingBottom: 60 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 8, marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  masonry: { flexDirection: 'row', gap: 12 },
  col: { flex: 1, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden' },
  cardImg: { width: '100%' },
  ph: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  statusPill: { position: 'absolute', top: 10, left: 10, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  removeBtn: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(15,23,42,0.65)', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 12, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  cardMeta: { fontSize: 12, color: '#6B7280' },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 18, marginTop: 20 },
  deleteBtnText: { color: '#EF4444', fontWeight: '700' },
});
