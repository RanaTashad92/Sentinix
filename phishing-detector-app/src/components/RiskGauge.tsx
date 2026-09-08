import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    withRepeat,
    withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme, Verdict, verdictColor, verdictGlow } from '../constants/theme';

interface Props {
    score: number;
    verdict: Verdict;
    size?: number;
}

export default function RiskGauge({ score, verdict, size = 190 }: Props) {
    const progress = useSharedValue(0);
    const pulse = useSharedValue(1);
    const color = verdictColor(verdict);
    const glow = verdictGlow(verdict);

    useEffect(() => {
        progress.value = withTiming(score, {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
        });

        if (verdict === 'DANGEROUS') {
            pulse.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 600 }),
                    withTiming(1.00, { duration: 600 })
                ),
                -1,
                false
            );
        } else {
            pulse.value = withTiming(1, { duration: 300 });
        }
    }, [score, verdict]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    const pct = Math.round(score * 100);
    const outerRadius = size / 2;
    const innerSize = size - 24;

    return (
        <Animated.View style={[styles.container, pulseStyle, { width: size, height: size }]}>
            <View
                style={[
                    styles.glowBg,
                    {
                        width: size + 20,
                        height: size + 20,
                        borderRadius: (size + 20) / 2,
                        backgroundColor: glow,
                    },
                ]}
            />

            <LinearGradient
                colors={[color, `${color}40`, theme.colors.bgCardBorder]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.outerRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: outerRadius,
                        borderColor: `${color}60`,
                    },
                ]}
            >
                <View
                    style={[
                        styles.innerCircle,
                        {
                            width: innerSize,
                            height: innerSize,
                            borderRadius: innerSize / 2,
                        },
                    ]}
                >
                    <Text style={[styles.pct, { color }]}>{pct}%</Text>
                    <Text style={styles.riskLabel}>Risk level</Text>
                    <View style={[styles.verdictBadge, { backgroundColor: `${color}20`, borderColor: `${color}60` }]}>
                        <Text style={[styles.verdictText, { color }]}>{verdict ?? '—'}</Text>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    glowBg: {
        position: 'absolute',
        opacity: 0.8,
    },
    outerRing: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    innerCircle: {
        backgroundColor: theme.colors.bgCard,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    pct: {
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1,
    },
    riskLabel: {
        fontSize: 9,
        color: theme.colors.textMuted,
        letterSpacing: 2.5,
        marginTop: 2,
        fontWeight: '600',
    },
    verdictBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: theme.radius.full,
        borderWidth: 1,
    },
    verdictText: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
});