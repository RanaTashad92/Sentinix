import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { theme, verdictColor, Verdict } from '../constants/theme';
import RiskGauge from './RiskGauge';
import StructuralFeatureCharts from './StructuralFeatureCharts';
import ModelLineChart from './ModelLineChart';
import { ScanResult as ScanResultType } from '../hooks/useScanner';

interface Props {
    result: ScanResultType;
    onReset: () => void;
}

function SecurityCheckRow({
    title,
    status,
    detail,
    isGood,
}: {
    title: string;
    status: string;
    detail: string;
    isGood: boolean;
}) {
    return (
        <View style={styles.checkRow}>
            <View style={[styles.statusDot, { backgroundColor: isGood ? '#10B981' : '#F43F5E' }]} />
            <View style={styles.checkMid}>
                <Text style={styles.checkTitle}>{title}</Text>
                <Text style={styles.checkDetail}>{detail}</Text>
            </View>
            <View style={[styles.statusBadge, { borderColor: isGood ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)', backgroundColor: isGood ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)' }]}>
                <Text style={[styles.statusBadgeText, { color: isGood ? '#10B981' : '#F43F5E' }]}>
                    {status}
                </Text>
            </View>
        </View>
    );
}

function ExplanationItem({ text, index }: { text: string; index: number }) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(12);

    useEffect(() => {
        opacity.value = withDelay(index * 100, withTiming(1, { duration: 350 }));
        translateY.value = withDelay(index * 100, withTiming(0, {
            duration: 350, easing: Easing.out(Easing.cubic)
        }));
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View style={[styles.explanationRow, animStyle]}>
            <View style={styles.explanationDot} />
            <Text style={styles.explanationText}>{text}</Text>
        </Animated.View>
    );
}

export default function ScanResult({ result, onReset }: Props) {
    const verdict = result.verdict as Verdict;
    const color = verdictColor(verdict);

    const cardOpacity = useSharedValue(0);
    const cardTranslate = useSharedValue(24);

    useEffect(() => {
        cardOpacity.value = withTiming(1, { duration: 400 });
        cardTranslate.value = withTiming(0, {
            duration: 400, easing: Easing.out(Easing.cubic)
        });
    }, []);

    const cardStyle = useAnimatedStyle(() => ({
        opacity: cardOpacity.value,
        transform: [{ translateY: cardTranslate.value }],
    }));

    async function copyURL() {
        await Clipboard.setStringAsync(result.url);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const vtText = result.virustotal_total > 0
        ? `${result.virustotal_detections} of ${result.virustotal_total} engines flagged`
        : 'No flags found';

    const getHeadline = () => {
        if (verdict === 'SAFE') return 'This link looks safe ✓';
        if (verdict === 'SUSPICIOUS') return 'Be careful — this looks suspicious';
        return 'Warning — likely a phishing link';
    };

    const xgbScore = result.xgb_score ?? result.model_comparison?.xgb_score ?? result.ml_score;
    const rfScore = result.rf_score ?? result.model_comparison?.rf_score ?? result.ml_score;

    return (
        <Animated.View style={cardStyle}>
            {/* Verdict Hero Card */}
            <View style={[styles.verdictCard, { borderColor: `${color}40` }]}>

                {/* Status Headline Banner */}
                <View style={[styles.bannerHeader, { backgroundColor: `${color}18` }]}>
                    <Text style={[styles.bannerText, { color }]}>{getHeadline()}</Text>
                </View>

                {/* Gauge Visual */}
                <View style={styles.gaugeRow}>
                    <RiskGauge score={result.risk_score} verdict={verdict} size={180} />
                </View>

                {/* URL Display */}
                <Pressable onPress={copyURL} style={styles.urlBox}>
                    <View style={styles.urlTopRow}>
                        <Text style={styles.urlLabel}>Scanned URL</Text>
                        <Text style={styles.copyHint}>Tap to copy</Text>
                    </View>
                    <Text style={styles.urlText} numberOfLines={2}>{result.url}</Text>
                </Pressable>

                {/* Security Verification Breakdown */}
                <View style={styles.checksContainer}>
                    <Text style={styles.checksSectionTitle}>Security checks</Text>
                    <SecurityCheckRow
                        title="AI Model Analysis"
                        status={`${(result.ml_score * 100).toFixed(0)}% risk`}
                        detail="22 URL patterns checked across two models"
                        isGood={result.ml_score < 0.4}
                    />
                    <SecurityCheckRow
                        title="VirusTotal Threat Intelligence"
                        status={result.virustotal_detections > 0 ? `${result.virustotal_detections} Flags` : 'Clean'}
                        detail={vtText}
                        isGood={result.virustotal_detections === 0}
                    />
                    <SecurityCheckRow
                        title="Google Safe Browsing"
                        status={result.safe_browsing_flagged ? 'Flagged' : 'Passed'}
                        detail={result.safe_browsing_flagged ? 'Listed in threat database' : 'No threat listings'}
                        isGood={!result.safe_browsing_flagged}
                    />
                </View>
            </View>

            {/* DUAL ML MODEL COMPARISON LINE GRAPH */}
            <ModelLineChart
                xgbScore={xgbScore}
                rfScore={rfScore}
                ensembleScore={result.risk_score}
                verdictColor={color}
            />

            {/* RICH STRUCTURAL FEATURE METRICS & VISUAL GRAPHS */}
            <StructuralFeatureCharts features={result.features} />

            {/* Explanation Details */}
            {result.explanation.length > 0 && (
                <View style={styles.explainCard}>
                    <Text style={styles.explainTitle}>Why we flagged this</Text>
                    {result.explanation.map((e, i) => (
                        <ExplanationItem key={i} text={e} index={i} />
                    ))}
                </View>
            )}

            {/* Reset / Scan Next Link */}
            <Pressable
                style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.85 }]}
                onPress={onReset}
            >
                <LinearGradient
                    colors={['#6366F1', '#4F46E5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.resetGradient}
                >
                    <Text style={styles.resetText}>Check another link</Text>
                </LinearGradient>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    verdictCard: {
        backgroundColor: '#111827',
        borderRadius: 24,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 14,
    },
    bannerHeader: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    gaugeRow: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    urlBox: {
        marginHorizontal: 16,
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        marginBottom: 16,
    },
    urlTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    urlLabel: {
        color: '#9CA3AF',
        fontSize: 11,
        fontWeight: '600',
    },
    copyHint: {
        color: '#818CF8',
        fontSize: 11,
        fontWeight: '600',
    },
    urlText: {
        color: '#F9FAFB',
        fontSize: 13,
        fontFamily: theme.fonts.mono,
        lineHeight: 18,
    },
    checksContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 8,
    },
    checksSectionTitle: {
        color: '#D1D5DB',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginBottom: 8,
    },
    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        gap: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    checkMid: {
        flex: 1,
    },
    checkTitle: {
        color: '#F9FAFB',
        fontSize: 12,
        fontWeight: '600',
    },
    checkDetail: {
        color: '#9CA3AF',
        fontSize: 11,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    explainCard: {
        backgroundColor: '#111827',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        padding: 20,
        marginBottom: 14,
    },
    explainTitle: {
        color: '#D1D5DB',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginBottom: 14,
    },
    explanationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        gap: 10,
    },
    explanationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#818CF8',
        marginTop: 6,
        flexShrink: 0,
    },
    explanationText: {
        color: '#D1D5DB',
        fontSize: 13,
        lineHeight: 20,
        flex: 1,
    },
    resetBtn: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 30,
    },
    resetGradient: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    resetText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});