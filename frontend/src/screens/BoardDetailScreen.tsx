import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Share, Image } from 'react-native';
import { Trash2, X, Copy, Route as RouteIcon, Share2, Check, Globe, Lock, Crown, MapPin } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { getBoard, listBoardPlaces, deleteBoard, removePinFromBoard, copyBoard, type Board } from '@/lib/boards';
import { listPlaces, type Place } from '@/lib/places';
import { statusColor } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

const HEIGHTS = [150, 210, 175, 240, 190, 165];
const PAGE = 60;

export function BoardDetailScreen() {
  const { params, navigate } = useNav();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const boardId: string = params.boardId ?? '';
  const isAll = boardId === 'all';
  const [board, setBoard] = useState<Board | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [end, setEnd] = useState(!isAll ? true : false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    try {
      if (isAll) {
        const data = await listPlaces({ userId: profile?.id, limit: PAGE, offset: 0 });
        setPlaces(data); setEnd(data.length < PAGE);
      } else {
        const [b, pins] = await Promise.all([getBoard(boardId), listBoardPlaces(boardId)]);
        setBoard(b);
        setPlaces(pins);
      }
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, [boardId, isAll, profile?.id]);

  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    if (!isAll || end || busyRef.current) return;
    busyRef.current = true; setLoadingMore(true);
    try {
      const more = await listPlaces({ userId: profile?.id, limit: PAGE, offset: places.length });
      setPlaces((prev) => { const seen = new Set(prev.map((p) => p.id)); return [...prev, ...more.filter((p) => !seen.has(p.id))]; });
      if (more.length < PAGE) setEnd(true);
    } catch {} finally { busyRef.current = false; setLoadingMore(false); }
  };

  const onScroll = (e: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 600) loadMore();
  };

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

  const saveWhole = async () => {
    if (!board || !profile?.id) return;
    setCopying(true); setError(null);
    try { setCopied(await copyBoard(board.id, profile.id)); }
    catch (e: any) { setError(e?.message ?? 'Error'); }
    finally { setCopying(false); }
  };

  const share = async () => {
    const url = Linking.createURL(`board/${boardId}`);
    try { await Share.share({ message: `${board?.name ?? t('all')} — Pin on Map\n${url}`, url }); } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#2D7FF9" /></View>;

  const columns: Place[][] = [[], []];
  places.forEach((p, i) => columns[i % 2].push(p));
  const title = isAll ? t('all') : board?.name ?? '';
  const VisIcon = board?.visibility === 'premium' ? Crown : board?.visibility === 'private' ? Lock : Globe;
  const visKey = board?.visibility === 'premium' ? 'visibilityPremium' : board?.visibility === 'private' ? 'visibilityPrivate' : 'visibilityPublic';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} testID="board-detail-screen" onScroll={onScroll} scrollEventThrottle={150}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} testID="board-pin-count">{places.length}{isAll && !end ? '+' : ''} {t('pins')}</Text>
          {board && <View style={styles.visChip} testID="board-visibility"><VisIcon size={11} color="#4B5563" /><Text style={styles.visText}>{t(visKey)}</Text></View>}
        </View>
        {board?.description ? <Text style={styles.desc}>{board.description}</Text> : null}
        {board?.source_board_id ? <Text style={styles.desc}>{t('copiedFrom')}</Text> : null}
      </View>

      <View style={styles.actions}>
        {!isAll && board && !isOwner && (
          <TouchableOpacity style={styles.primaryBtn} onPress={saveWhole} disabled={copying || !!copied} testID="save-whole-board-btn">
            {copying ? <ActivityIndicator color="#fff" /> : <><Copy size={16} color="#fff" /><Text style={styles.primaryText}>{t('saveWholeBoard')}</Text></>}
          </TouchableOpacity>
        )}
        {places.length >= 2 && (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigate('routePlanner', { boardId, boardName: title })} testID="board-plan-route-btn">
            <RouteIcon size={16} color="#2D7FF9" /><Text style={styles.secondaryText}>{t('planRouteFromBoard')}</Text>
          </TouchableOpacity>
        )}
        {!isAll && (
          <TouchableOpacity style={styles.iconBtn} onPress={share} testID="board-share-btn"><Share2 size={18} color="#374151" /></TouchableOpacity>
        )}
      </View>
      {copied && (
        <TouchableOpacity style={styles.okBox} onPress={() => navigate('boardDetail', { boardId: copied.id, boardName: copied.name })} testID="board-copied-msg">
          <Check size={14} color="#0F766E" /><Text style={styles.okText}>{t('boardCopied')} · {t('openBoard')} →</Text>
        </TouchableOpacity>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

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
      {loadingMore && <ActivityIndicator color="#2D7FF9" style={{ marginVertical: 16 }} />}
      {isAll && !end && !loadingMore && (
        <TouchableOpacity style={styles.more} onPress={loadMore} testID="board-load-more"><Text style={styles.moreText}>{t('loadMore')}</Text></TouchableOpacity>
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
  header: { paddingHorizontal: 8, marginBottom: 12, gap: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { fontSize: 13, color: '#6B7280' },
  visChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  visText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  desc: { fontSize: 13, color: '#6B7280' },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 8, marginBottom: 14 },
  primaryBtn: { flex: 1, height: 46, borderRadius: 14, backgroundColor: '#2D7FF9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  secondaryBtn: { flex: 1, height: 46, borderRadius: 14, backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { color: '#2D7FF9', fontWeight: '700', fontSize: 14 },
  iconBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  okBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFBF1', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginHorizontal: 8, marginBottom: 12 },
  okText: { color: '#0F766E', fontWeight: '700', fontSize: 13 },
  error: { color: '#DC2626', marginHorizontal: 8, marginBottom: 10 },
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
  more: { alignSelf: 'center', marginTop: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 24, height: 44, justifyContent: 'center', borderRadius: 999 },
  moreText: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 18, marginTop: 20 },
  deleteBtnText: { color: '#EF4444', fontWeight: '700' },
});
