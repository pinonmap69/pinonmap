import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { X, Link2, Share2, Lock, Check, MessageCircle, Send, Mail, Camera, Music2, Globe, Smartphone } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/providers/LanguageProvider';
import { visibleTargets, shareTo, systemShare, copyLink, shareUrl, type ShareContent, type ShareResult } from '@/lib/share';

const ICONS: Record<string, LucideIcon> = {
  whatsapp: MessageCircle, messenger: Send, facebook: Globe, instagram: Camera, tiktok: Music2,
  telegram: Send, x: Share2, sms: Smartphone, email: Mail,
};

interface Props {
  visible: boolean;
  onClose: () => void;
  content: ShareContent;
  /** Private content isn't visible to recipients — offer to make it public first. */
  isPrivate?: boolean;
  onMakePublic?: () => Promise<void>;
}

export function ShareSheet({ visible, onClose, content, isPrivate, onMakePublic }: Props) {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<ShareResult | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [madePublic, setMadePublic] = useState(false);
  const locked = !!isPrivate && !madePublic;

  const run = async (fn: () => Promise<ShareResult>) => {
    setStatus(null);
    const r = await fn();
    if (r === 'copied' || r === 'unavailable') setStatus(r);
  };

  const makePublic = async () => {
    if (!onMakePublic) return;
    setPublishing(true);
    try { await onMakePublic(); setMadePublic(true); } catch {} finally { setPublishing(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]} testID="share-sheet">
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('share')}</Text>
              <Text style={styles.sub} numberOfLines={1}>{content.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} testID="share-close" hitSlop={10}><X size={22} color="#6B7280" /></TouchableOpacity>
          </View>

          {locked ? (
            <View style={styles.privateBox} testID="share-private-box">
              <Lock size={18} color="#B45309" />
              <Text style={styles.privateText}>{t('sharePrivateNote')}</Text>
              {onMakePublic && (
                <TouchableOpacity style={styles.publicBtn} onPress={makePublic} disabled={publishing} testID="share-make-public">
                  {publishing ? <ActivityIndicator color="#fff" /> : <Text style={styles.publicBtnText}>{t('makePublicShare')}</Text>}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targets}>
                {visibleTargets().map((tg) => {
                  const Icon = ICONS[tg.id] ?? Share2;
                  return (
                    <TouchableOpacity key={tg.id} style={styles.target} onPress={() => run(() => shareTo(tg, content))} testID={`share-target-${tg.id}`}>
                      <View style={[styles.targetIcon, { backgroundColor: tg.color }]}><Icon size={22} color="#fff" /></View>
                      <Text style={styles.targetLabel} numberOfLines={1}>{tg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {Platform.OS !== 'web' && <Text style={styles.hint}>{t('sharePhotoHint')}</Text>}
              <View style={styles.linkBox}>
                <Text style={styles.linkText} numberOfLines={1} testID="share-link-text">{shareUrl(content.kind, content.id)}</Text>
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.action} onPress={() => run(async () => { await copyLink(content); return 'copied'; })} testID="share-copy-link">
                  <Link2 size={18} color="#2D7FF9" /><Text style={styles.actionText}>{t('copyLink')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.action, styles.actionPrimary]} onPress={() => run(() => systemShare(content))} testID="share-system">
                  <Share2 size={18} color="#fff" /><Text style={[styles.actionText, { color: '#fff' }]}>{t('moreOptions')}</Text>
                </TouchableOpacity>
              </View>
              {status && (
                <View style={styles.status} testID="share-status">
                  <Check size={14} color="#0F766E" />
                  <Text style={styles.statusText}>{status === 'unavailable' ? t('appNotInstalledCopied') : t('linkCopied')}</Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/** Small helper: state + element for screens. */
export function useShareSheet() {
  const [open, setOpen] = useState(false);
  return { open, show: () => setOpen(true), hide: () => setOpen(false) };
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  targets: { paddingHorizontal: 16, gap: 6 },
  target: { width: 72, alignItems: 'center', gap: 6 },
  targetIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  targetLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
  hint: { fontSize: 11, color: '#9CA3AF', paddingHorizontal: 20 },
  linkBox: { marginHorizontal: 20, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  linkText: { fontSize: 12, color: '#4B5563' },
  row: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  action: { flex: 1, height: 48, borderRadius: 14, backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionPrimary: { backgroundColor: '#2D7FF9' },
  actionText: { fontSize: 14, fontWeight: '700', color: '#2D7FF9' },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, backgroundColor: '#CCFBF1', borderRadius: 12, padding: 10 },
  statusText: { color: '#0F766E', fontWeight: '700', fontSize: 13, flexShrink: 1 },
  privateBox: { marginHorizontal: 20, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 14, gap: 10, borderWidth: 1, borderColor: '#FDE68A' },
  privateText: { fontSize: 13, color: '#92400E' },
  publicBtn: { height: 44, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  publicBtnText: { color: '#fff', fontWeight: '800' },
});
