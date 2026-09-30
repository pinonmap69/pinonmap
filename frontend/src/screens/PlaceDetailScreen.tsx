import { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal, TextInput } from 'react-native';
import { MapPin, Trash2, Tag, Calendar, AlertCircle, Heart, Bookmark, User, X, Plus, Check } from 'lucide-react-native';
import { AppMapView } from '@/components/map/AppMapView';
import { useNav } from '@/navigation/nav';
import { useAuth } from '@/providers/AuthProvider';
import { getPlace, deletePlace, updatePlaceStatus, type Place } from '@/lib/places';
import { boardsOverview, addPinToBoard, createBoard, type BoardOverview } from '@/lib/boards';
import { countLikes, listLikedPlaceIds, toggleLike } from '@/lib/social';
import { PLACE_STATUSES, STATUS_COLORS, STATUS_TKEY, statusColor, type PlaceStatus } from '@/lib/status';
import { useLanguage } from '@/providers/LanguageProvider';

export function PlaceDetailScreen() {
  const { params, navigate, goBack } = useNav();
  const { profile } = useAuth();
  const { language, t } = useLanguage();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  // social
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  // save to board
  const [modal, setModal] = useState(false);
  const [myBoards, setMyBoards] = useState<BoardOverview[]>([]);
  const [newBoard, setNewBoard] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!params.placeId) return;
    try {
      const p = await getPlace(params.placeId);
      setPlace(p);
      if (p) {
        const [cnt, likedSet] = await Promise.all([
          countLikes(p.id),
          profile?.id ? listLikedPlaceIds(profile.id) : Promise.resolve(new Set<string>()),
        ]);
        setLikeCount(cnt);
        setLiked(likedSet.has(p.id));
      }
    } catch (e: any) { setError(e?.message || 'Unable to load place.'); }
    finally { setLoading(false); }
  }, [params.placeId, profile?.id]);

  useEffect(() => { load(); }, [load]);

  const onLike = async () => {
    if (!place || !profile?.id) return;
    const next = !liked;
    setLiked(next); setLikeCount((c) => c + (next ? 1 : -1));
    try { await toggleLike(profile.id, place.id, liked); }
    catch { setLiked(!next); setLikeCount((c) => c + (next ? -1 : 1)); }
  };

  const openBoards = async () => {
    if (!profile?.id) return;
    setModal(true);
    try { setMyBoards(await boardsOverview(profile.id)); } catch {}
  };

  const saveTo = async (boardId: string) => {
    if (!place || !profile?.id) return;
    try { await addPinToBoard(boardId, place.id, profile.id); setModal(false); setSavedMsg(t('savedToBoard')); setTimeout(() => setSavedMsg(null), 2500); }
    catch (e: any) { setError(e?.message || 'Unable to save.'); setModal(false); }
  };

  const createAndSave = async () => {
    if (!place || !profile?.id || !newBoard.trim()) return;
    try { const b = await createBoard({ user_id: profile.id, name: newBoard.trim(), visibility: 'public' }); setNewBoard(''); await saveTo(b.id); }
    catch (e: any) { setError(e?.message || 'Unable to create board.'); }
  };

  const changeStatus = async (status: PlaceStatus) => {
    if (!place || status === place.status) return;
    setSavingStatus(true);
    const prev = place.status;
    setPlace({ ...place, status });
    try { await updatePlaceStatus(place.id, status); }
    catch (e: any) { setPlace({ ...place, status: prev }); setError(e?.message || 'Unable to update status.'); }
    finally { setSavingStatus(false); }
  };

  const remove = async () => {
    if (!place) return;
    setDeleting(true);
    try { await deletePlace(place.id); navigate('map'); }
    catch (e: any) { setError(e?.message || 'Unable to delete place.'); setDeleting(false); }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#2D7FF9" /></View>;
  if (!place) return (
    <View style={styles.loader}>
      <Text style={styles.emptyText}>{error || t('placeNotFound')}</Text>
      <TouchableOpacity onPress={goBack}><Text style={styles.backLinkText}>{t('back')}</Text></TouchableOpacity>
    </View>
  );

  const photos = place.place_photos?.length ? place.place_photos.map((p) => p.url) : place.cover_url ? [place.cover_url] : [];
  const isOwner = profile?.id === place.user_id;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container} testID="place-detail-screen">
      {photos.length > 0 && (
        <ScrollView horizontal pagingEnabled style={styles.gallery}>
          {photos.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.galleryImg} />)}
        </ScrollView>
      )}
      <View style={styles.body}>
        <Text style={styles.title} testID="place-title">{place.title}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, liked && styles.actionBtnActive]} onPress={onLike} testID="like-btn">
            <Heart size={18} color={liked ? '#EF4444' : '#6B7280'} fill={liked ? '#EF4444' : 'transparent'} />
            <Text style={[styles.actionText, liked && { color: '#EF4444' }]} testID="like-count">{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={openBoards} testID="save-to-board-btn">
            <Bookmark size={18} color="#2D7FF9" />
            <Text style={[styles.actionText, { color: '#2D7FF9' }]}>{t('saveToBoard')}</Text>
          </TouchableOpacity>
          {!isOwner && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigate('userProfile', { userId: place.user_id })} testID="view-author-btn">
              <User size={18} color="#6B7280" /><Text style={styles.actionText}>{t('viewAuthor')}</Text>
            </TouchableOpacity>
          )}
        </View>
        {savedMsg && <View style={styles.savedBox}><Check size={14} color="#0F766E" /><Text style={styles.savedText}>{savedMsg}</Text></View>}

        <View style={styles.metaRow}>
          <View style={[styles.metaChip, { backgroundColor: statusColor(place.status) + '22' }]} testID="place-status-badge">
            <View style={[styles.statusDot, { backgroundColor: statusColor(place.status) }]} />
            <Text style={[styles.metaChipText, { color: statusColor(place.status) }]}>{t(STATUS_TKEY[place.status])}</Text>
          </View>
          {place.category && (<View style={styles.metaChip}><Tag size={12} color="#2D7FF9" /><Text style={styles.metaChipText}>{place.category}</Text></View>)}
          <View style={styles.metaChip}><MapPin size={12} color="#0F766E" /><Text style={styles.metaChipText}>{[place.city, place.country].filter(Boolean).join(', ') || t('coordinates')}</Text></View>
          <View style={styles.metaChip}><Calendar size={12} color="#6B7280" /><Text style={styles.metaChipText}>{new Date(place.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'pl-PL')}</Text></View>
        </View>

        {place.description ? <Text style={styles.description}>{place.description}</Text> : null}

        {isOwner && (
          <View style={styles.statusSection}>
            <Text style={styles.statusLabel}>{t('statusLabel')}</Text>
            <View style={styles.statusRow}>
              {PLACE_STATUSES.map((s) => {
                const active = place.status === s;
                return (
                  <TouchableOpacity key={s} disabled={savingStatus} style={[styles.statusChip, active && { backgroundColor: STATUS_COLORS[s], borderColor: STATUS_COLORS[s] }]} onPress={() => changeStatus(s)} testID={`detail-status-${s}`}>
                    <View style={[styles.statusDot, { backgroundColor: active ? '#fff' : STATUS_COLORS[s] }]} />
                    <Text style={[styles.statusChipText, active && { color: '#fff' }]}>{t(STATUS_TKEY[s])}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.mapWrap}>
          <AppMapView center={{ lat: place.latitude, lng: place.longitude }} zoom={13} markers={[{ id: place.id, lat: place.latitude, lng: place.longitude, title: place.title, color: statusColor(place.status) }]} style={styles.map} />
        </View>
        <Text style={styles.coordsText}>{place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}</Text>

        {error && (<View style={styles.errorBox}><AlertCircle size={16} color="#DC2626" /><Text style={styles.errorText}>{error}</Text></View>)}

        {isOwner && (confirm ? (
          <View style={styles.confirmRow}>
            <TouchableOpacity style={styles.deleteBtn} onPress={remove} disabled={deleting} testID="confirm-delete-btn">{deleting ? <ActivityIndicator color="#EF4444" /> : <Text style={styles.deleteBtnText}>{t('sureDelete')}</Text>}</TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirm(false)}><Text style={styles.cancelBtnText}>{t('cancel')}</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setConfirm(true)} testID="delete-place-btn"><Trash2 size={16} color="#EF4444" /><Text style={styles.deleteBtnText}>{t('deletePlace')}</Text></TouchableOpacity>
        ))}
      </View>

      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} testID="board-picker-modal">
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>{t('saveToBoard')}</Text>
              <TouchableOpacity onPress={() => setModal(false)} testID="close-board-modal"><X size={22} color="#6B7280" /></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {myBoards.length === 0 ? <Text style={styles.modalHint}>{t('noBoardsYet')}</Text> : myBoards.map((b) => (
                <TouchableOpacity key={b.id} style={styles.boardRow} onPress={() => saveTo(b.id)} testID={`pick-board-${b.id}`}>
                  <Bookmark size={16} color="#2D7FF9" /><Text style={styles.boardRowText}>{b.name}</Text><Text style={styles.boardRowCount}>{b.count}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.newRow}>
              <TextInput style={styles.newInput} placeholder={t('newBoard')} value={newBoard} onChangeText={setNewBoard} testID="modal-new-board-input" />
              <TouchableOpacity style={styles.newBtn} onPress={createAndSave} testID="modal-create-board-btn"><Plus size={20} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingBottom: 60 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8FAFC' },
  emptyText: { fontSize: 15, color: '#6B7280' },
  backLinkText: { color: '#2D7FF9', fontWeight: '600' },
  gallery: { height: 260 },
  galleryImg: { width: 360, height: 260 },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937' },
  actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB' },
  actionBtnActive: { borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
  actionText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  savedBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#CCFBF1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start' },
  savedText: { color: '#0F766E', fontWeight: '600', fontSize: 13 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', padding: 10, borderRadius: 999 },
  metaChipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  description: { fontSize: 15, color: '#374151', lineHeight: 22 },
  statusSection: { gap: 8, marginTop: 4 },
  statusLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  statusChipText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  mapWrap: { height: 200, borderRadius: 20, overflow: 'hidden', backgroundColor: '#e8eef3' },
  map: { flex: 1 },
  coordsText: { fontSize: 13, color: '#6B7280' },
  errorBox: { flexDirection: 'row', gap: 8, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 14 },
  errorText: { flex: 1, color: '#DC2626' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 18, flex: 1 },
  deleteBtnText: { color: '#EF4444', fontWeight: '700' },
  confirmRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: '#fff', flex: 1 },
  cancelBtnText: { color: '#6B7280', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, gap: 12 },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  modalHint: { fontSize: 14, color: '#6B7280', paddingVertical: 12 },
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  boardRowText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F2937' },
  boardRowCount: { fontSize: 13, color: '#9CA3AF' },
  newRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  newInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 14, height: 48, fontSize: 15 },
  newBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#2D7FF9', alignItems: 'center', justifyContent: 'center' },
});
