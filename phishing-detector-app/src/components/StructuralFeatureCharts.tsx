import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';

interface Props {
    features: Record<string, number>;
}

function MetricBar({
    label,
    valueStr,
    ratio,
    color,
    benchmarkLabel,
    delay = 0,
}: {
    label: string;
    valueStr: string;
    ratio: number;
    color: string;
    benchmarkLabel?: string;
    delay?: number;
}) {
    const widthVal = useSharedValue(0);

    useEffect(() => {
        const clampedPct = Math.min(Math.max(ratio * 100, 0), 100);
        widthVal.value = withDelay(
            delay,
            withTiming(clampedPct, { duration: 800, easing: Easing.out(Easing.cubic) })
        );
    }, [ratio]);

    const animatedStyle = useAnimatedStyle(() => ({
        width: `${widthVal.value}%`,
    }));

    return (
        <View style={styles.metricWrap}>
            <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{label}</Text>
                <Text style={[styles.metricValue, { color }]}>{valueStr}</Text>
            </View>
            <View style={styles.track}>
                <Animated.View style={[styles.fill, animatedStyle, { backgroundColor: color }]} />
            </View>
            {benchmarkLabel && (
                <Text style={styles.benchmarkText}>{benchmarkLabel}</Text>
            )}
        </View>
    );
}

function MatrixItem({
    label,
    status,
    isDanger,
}: {
    label: string;
    status: string;
    isDanger: boolean;
}) {
    return (
        <View style={[styles.matrixCard, isDanger && styles.matrixCardDanger]}>
            <View style={[styles.matrixDot, { backgroundColor: isDanger ? '#F43F5E' : '#10B981' }]} />
            <View style={styles.matrixContent}>
                <Text style={styles.matrixLabel}>{label}</Text>
                <Text style={[styles.matrixStatus, { color: isDanger ? '#F43F5E' : '#10B981' }]}>
                    {status}
                </Text>
            </View>
        </View>
    );
}

export default function StructuralFeatureCharts({ features }: Props) {
    if (!features || Object.keys(features).length === 0) return null;

    const entropy = features.domain_entropy ?? 0;
    const urlLen = features.url_length ?? 0;
    const digitRatio = features.digit_ratio ?? 0;
    const letterRatio = features.letter_ratio ?? 0;
    const specialRatio = features.special_char_ratio ?? 0;

    const entropyColor = entropy > 3.8 ? '#F43F5E' : entropy > 3.0 ? '#F59E0B' : '#10B981';
    const lenColor = urlLen > 80 ? '#F43F5E' : urlLen > 50 ? '#F59E0B' : '#3B82F6';

    const isHttps = Boolean(features.is_https);
    const hasIp = Boolean(features.has_ip_address);
    const hasAt = Boolean(features.has_at_symbol);
    const hasSuspTld = Boolean(features.has_suspicious_tld);
    const brandSpoof = Boolean(features.brand_in_subdomain);
    const subDepth = features.subdomain_depth ?? 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.titleBadge}>
                    <Text style={styles.titleBadgeText}>FEAT</Text>
                </View>
                <View style={styles.titleTextWrap}>
                    <Text style={styles.title}>URL structure analysis</Text>
                    <Text style={styles.subtitle}>22 signals extracted for machine learning</Text>
                </View>
            </View>

            {/* Gauge Metrics Section */}
            <View style={styles.metricsBox}>
                <MetricBar
                    label="Domain Randomness (Entropy)"
                    valueStr={`${entropy.toFixed(2)} / 5.0`}
                    ratio={entropy / 5.0}
                    color={entropyColor}
                    benchmarkLabel={entropy > 3.5 ? 'High entropy: Algorithmically generated' : 'Normal human readable domain'}
                    delay={100}
                />

                <MetricBar
                    label="Total URL Length"
                    valueStr={`${urlLen} chars`}
                    ratio={Math.min(urlLen / 120, 1.0)}
                    color={lenColor}
                    benchmarkLabel={urlLen > 75 ? 'Excessive length used to obscure destination' : 'Standard URL length'}
                    delay={250}
                />
            </View>

            {/* Character Composition Breakdown */}
            <View style={styles.compositionBox}>
                <Text style={styles.compTitle}>Character breakdown</Text>
                <View style={styles.compBarTrack}>
                    <View style={[styles.compSegment, { flex: Math.max(letterRatio, 0.05), backgroundColor: '#3B82F6' }]} />
                    <View style={[styles.compSegment, { flex: Math.max(digitRatio, 0.05), backgroundColor: '#F59E0B' }]} />
                    <View style={[styles.compSegment, { flex: Math.max(specialRatio, 0.05), backgroundColor: '#F43F5E' }]} />
                </View>
                <View style={styles.compLegendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                        <Text style={styles.legendText}>Letters ({(letterRatio * 100).toFixed(0)}%)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.legendText}>Digits ({(digitRatio * 100).toFixed(0)}%)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} />
                        <Text style={styles.legendText}>Special ({(specialRatio * 100).toFixed(0)}%)</Text>
                    </View>
                </View>
            </View>

            {/* Security Signal Matrix */}
            <Text style={styles.matrixTitle}>Security signals</Text>
            <View style={styles.matrixGrid}>
                <MatrixItem
                    label="SSL Encryption"
                    status={isHttps ? 'HTTPS Secure' : 'Insecure HTTP'}
                    isDanger={!isHttps}
                />
                <MatrixItem
                    label="Host Identifier"
                    status={hasIp ? 'Raw IP Used' : 'Domain Name'}
                    isDanger={hasIp}
                />
                <MatrixItem
                    label="Redirect Symbol"
                    status={hasAt ? 'Redirect Risk' : 'None'}
                    isDanger={hasAt}
                />
                <MatrixItem
                    label="TLD Rating"
                    status={hasSuspTld ? 'Suspicious TLD' : 'Standard TLD'}
                    isDanger={hasSuspTld}
                />
                <MatrixItem
                    label="Brand Spoofing"
                    status={brandSpoof ? 'Spoof Flagged' : 'Clean'}
                    isDanger={brandSpoof}
                />
                <MatrixItem
                    label="Subdomain Structure"
                    status={subDepth >= 3 ? `${subDepth} Levels Deep` : 'Normal Depth'}
                    isDanger={subDepth >= 3}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 14,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
        gap: 12,
    },
    titleBadge: {
        width: 42,
        height: 26,
        borderRadius: 6,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.3)',
    },
    titleBadgeText: {
        color: '#818CF8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    titleTextWrap: {
        flex: 1,
    },
    title: {
        color: '#F9FAFB',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 2,
    },
    metricsBox: {
        gap: 16,
        marginBottom: 20,
    },
    metricWrap: {
        gap: 6,
    },
    metricHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricLabel: {
        color: '#D1D5DB',
        fontSize: 12,
        fontWeight: '600',
    },
    metricValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    track: {
        height: 8,
        backgroundColor: '#1F2937',
        borderRadius: 4,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        borderRadius: 4,
    },
    benchmarkText: {
        color: '#9CA3AF',
        fontSize: 11,
        marginTop: 2,
    },
    compositionBox: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 14,
        marginBottom: 20,
    },
    compTitle: {
        color: '#D1D5DB',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginBottom: 10,
    },
    compBarTrack: {
        height: 10,
        borderRadius: 5,
        flexDirection: 'row',
        overflow: 'hidden',
        marginBottom: 10,
    },
    compSegment: {
        height: '100%',
    },
    compLegendRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        color: '#D1D5DB',
        fontSize: 11,
        fontWeight: '600',
    },
    matrixTitle: {
        color: '#D1D5DB',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: -0.2,
        marginBottom: 12,
    },
    matrixGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    matrixCard: {
        width: '48%',
        backgroundColor: '#1F2937',
        borderRadius: 14,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    matrixCardDanger: {
        borderColor: 'rgba(244, 63, 94, 0.3)',
        backgroundColor: 'rgba(244, 63, 94, 0.08)',
    },
    matrixDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    matrixContent: {
        flex: 1,
    },
    matrixLabel: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: '600',
    },
    matrixStatus: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
});
