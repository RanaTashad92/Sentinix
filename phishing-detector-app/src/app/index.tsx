import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { useScanner } from '../hooks/useScanner';
import ScanResult from '../components/ScanResult';
import HistoryItem from '../components/HistoryItem';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import AppIcon from '../components/AppIcon';
import { getHistory, clearHistory, ScanRecord } from '../utils/storage';

const { width } = Dimensions.get('window');

function ScannerBeam({ active }: { active: boolean }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (active) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(56, { duration: 900, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false
      );
    } else {
      translateY.value = withTiming(0, { duration: 300 });
    }
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: active ? 1 : 0,
  }));

  return (
    <Animated.View style={[styles.beam, style]}>
      <LinearGradient
        colors={['transparent', theme.colors.accentLight, 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
    </Animated.View>
  );
}

type Tab = 'scan' | 'history';

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <View style={styles.tabBar}>
      {(['scan', 'history'] as Tab[]).map((t) => (
        <Pressable
          key={t}
          style={[styles.tab, active === t && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(t);
          }}
        >
          <Text style={[styles.tabText, active === t && styles.tabTextActive]}>
            {t === 'scan' ? 'URL Scanner' : 'Scan History'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState<Tab>('scan');
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const { scan, result, loading, error, reset } = useScanner();
  const inputRef = useRef<TextInput>(null);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  async function loadHistory() {
    const h = await getHistory();
    setHistory(h);
  }

  async function handleScan() {
    if (!url.trim() || loading) return;
    Keyboard.dismiss();
    btnScale.value = withSequence(
      withSpring(0.95, { damping: 12 }),
      withSpring(1.00, { damping: 12 }),
    );
    await scan(url.trim());
  }

  async function pasteFromClipboard() {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function handleReset() {
    reset();
    setUrl('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <View style={styles.root}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <AppIcon size={26} color1="#818CF8" color2="#4F46E5" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.appName}>Sentinix</Text>
              <View style={styles.activePill}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.appSub}>Your link safety companion</Text>
          </View>
        </View>

        <Pressable onPress={() => setPrivacyOpen(true)} style={styles.privacyBtn}>
          <Text style={styles.privacyBtnText}>Privacy</Text>
        </Pressable>
      </Animated.View>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'scan' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!result && (
            <Animated.View entering={FadeIn.duration(400)}>
              <View style={styles.inputCard}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.inputLabel}>Check a link</Text>
                  <Text style={styles.inputHint}>Paste or type any URL</Text>
                </View>

                <View style={styles.inputWrap}>
                  <ScannerBeam active={loading} />
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={url}
                    onChangeText={setUrl}
                    placeholder="https://example-link.com"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="go"
                    onSubmitEditing={handleScan}
                    selectionColor={theme.colors.accentLight}
                  />
                  {url.length > 0 && (
                    <Pressable style={styles.clearInputBtn} onPress={() => setUrl('')}>
                      <Text style={styles.clearInputText}>✕</Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.actionRow}>
                  <Pressable onPress={pasteFromClipboard} style={styles.pasteBtn}>
                    <Text style={styles.pasteBtnText}>Paste Link</Text>
                  </Pressable>

                  <View style={styles.samplesBox}>
                    <Text style={styles.sampleLabel}>Try:</Text>
                    <Pressable
                      style={styles.samplePill}
                      onPress={() => setUrl('https://google.com')}
                    >
                      <Text style={styles.sampleText}>google.com</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Animated.View style={btnStyle}>
                <Pressable
                  style={({ pressed }) => [
                    styles.scanBtn,
                    (!url.trim() || loading) && styles.scanBtnDisabled,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={handleScan}
                  disabled={!url.trim() || loading}
                >
                  <LinearGradient
                    colors={
                      url.trim() && !loading
                        ? [theme.colors.accent, '#4F46E5']
                        : [theme.colors.bgCardBorder, theme.colors.bgCardBorder]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.scanBtnGrad}
                  >
                    {loading ? (
                      <View style={styles.loadingInner}>
                        <ActivityIndicator color="#FFF" size="small" />
                        <Text style={styles.loadingLabel}>Checking safety…</Text>
                      </View>
                    ) : (
                      <Text style={styles.scanBtnText}>Check this link</Text>
                    )}
                  </LinearGradient>
                </Pressable>
              </Animated.View>

              {error && (
                <Animated.View entering={FadeIn} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>How we protect you</Text>
                <View style={styles.featureGrid}>
                  {[
                    { icon: '🧠', title: 'AI Analysis', desc: 'Two ML models examine 22 URL patterns' },
                    { icon: '🔍', title: 'VirusTotal Scan', desc: 'Cross-checks with 70+ security engines' },
                    { icon: '🛡️', title: 'Google Safe Browsing', desc: 'Real-time threat database lookup' },
                  ].map(({ icon, title, desc }) => (
                    <View key={title} style={styles.featureItem}>
                      <View style={styles.featureBadge}>
                        <Text style={styles.featureBadgeEmoji}>{icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.featureTitle}>{title}</Text>
                        <Text style={styles.featureDesc}>{desc}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {result && (
            <Animated.View entering={FadeInDown.duration(400)}>
              <ScanResult result={result} onReset={handleReset} />
            </Animated.View>
          )}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {history.length === 0 ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.emptyBox}>
              <View style={styles.emptyCircle}>
                <Text style={styles.emptyBadgeText}>📝</Text>
              </View>
              <Text style={styles.emptyText}>No scans yet</Text>
              <Text style={styles.emptySub}>
                Links you check will be saved here on your device.
              </Text>
            </Animated.View>
          ) : (
            <>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Recent checks ({history.length})</Text>
                <Pressable onPress={handleClearHistory} style={styles.clearBtnWrap}>
                  <Text style={styles.clearBtn}>Clear All</Text>
                </Pressable>
              </View>
              {history.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onPress={(r) => {
                    setTab('scan');
                    setUrl(r.url);
                  }}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}

      <PrivacyPolicyModal visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    left: width / 2 - 140,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appName: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.safe,
  },
  activeText: {
    color: theme.colors.safe,
    fontSize: 10,
    fontWeight: '700',
  },
  appSub: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  privacyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  privacyBtnText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  inputHint: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  inputWrap: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  beam: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    top: 0,
    zIndex: 1,
  },
  input: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontFamily: theme.fonts.mono,
  },
  clearInputBtn: {
    padding: 6,
  },
  clearInputText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pasteBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  pasteBtnText: {
    color: theme.colors.accentLight,
    fontSize: 12,
    fontWeight: '700',
  },
  samplesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sampleLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  samplePill: {
    backgroundColor: theme.colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sampleText: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },
  scanBtn: {
    borderRadius: theme.radius.full,
    overflow: 'hidden',
    marginBottom: 16,
  },
  scanBtnDisabled: { opacity: 0.5 },
  scanBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.dangerousLight,
    fontSize: 13,
  },
  featuresSection: {
    marginTop: 6,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  featureGrid: {
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 14,
  },
  featureBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBadgeEmoji: {
    fontSize: 20,
  },
  featureTitle: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  featureDesc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  emptyCircle: {
    width: 56,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyBadgeText: {
    fontSize: 16,
  },
  emptyText: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  emptySub: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  historyTitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  clearBtnWrap: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearBtn: {
    color: theme.colors.dangerousLight,
    fontSize: 12,
    fontWeight: '600',
  },
});