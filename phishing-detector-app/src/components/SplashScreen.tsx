import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import AppIcon from './AppIcon';
import { useEffect } from 'react';

interface Props {
    onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: Props) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.85);
    const progressWidth = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(1, { duration: 500 });
        scale.value = withSpring(1, { damping: 14, stiffness: 90 });

        progressWidth.value = withTiming(100, {
            duration: 1400,
            easing: Easing.inOut(Easing.ease),
        });

        const timer = setTimeout(() => {
            if (onFinish) onFinish();
        }, 1600);

        return () => clearTimeout(timer);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.centerContent, animStyle]}>
                <View style={styles.logoBadge}>
                    <AppIcon size={40} color1="#818CF8" color2="#4F46E5" />
                </View>

                <Text style={styles.title}>Sentinix</Text>
                <Text style={styles.subtitle}>AI Threat Defense & URL Verification</Text>
            </Animated.View>

            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]}>
                    <LinearGradient
                        colors={[theme.colors.accent, theme.colors.safe]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerContent: {
        alignItems: 'center',
    },
    logoBadge: {
        width: 76,
        height: 76,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 22,
        backgroundColor: 'rgba(99, 102, 241, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        elevation: 8,
        shadowColor: theme.colors.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 6,
    },
    subtitle: {
        color: theme.colors.textMuted,
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.3,
    },
    progressTrack: {
        position: 'absolute',
        bottom: 60,
        width: 120,
        height: 3,
        backgroundColor: theme.colors.bgCardBorder,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
});
