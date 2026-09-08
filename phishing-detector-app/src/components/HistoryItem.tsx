import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme, verdictColor, Verdict } from '../constants/theme';
import { ScanRecord } from '../utils/storage';

interface Props {
    item: ScanRecord;
    onPress: (item: ScanRecord) => void;
}

export default function HistoryItem({ item, onPress }: Props) {
    const color = verdictColor(item.verdict as Verdict);
    const date = new Date(item.scannedAt);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const getHost = (url: string) => {
        try {
            const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
            return parsed.hostname;
        } catch {
            return url;
        }
    };

    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.8, backgroundColor: theme.colors.bgCardHover }]}
            onPress={() => onPress(item)}
        >
            {/* Status Indicator Dot */}
            <View style={[styles.statusDot, { backgroundColor: color }]} />

            {/* URL Info */}
            <View style={styles.mid}>
                <Text style={styles.hostText} numberOfLines={1}>{getHost(item.url)}</Text>
                <Text style={styles.fullUrl} numberOfLines={1}>{item.url}</Text>
                <Text style={styles.date}>{dateStr} at {timeStr}</Text>
            </View>

            {/* Verdict Pill */}
            <View style={[styles.verdictBadge, { backgroundColor: `${color}18`, borderColor: `${color}50` }]}>
                <Text style={[styles.verdictText, { color }]}>
                    {item.verdict}
                </Text>
                <Text style={[styles.scoreText, { color }]}>
                    {(item.riskScore * 100).toFixed(0)}%
                </Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.bgCard,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        flexShrink: 0,
    },
    mid: {
        flex: 1,
    },
    hostText: {
        color: theme.colors.textPrimary,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    fullUrl: {
        color: theme.colors.textSecondary,
        fontSize: 11,
        fontFamily: theme.fonts.mono,
        marginBottom: 4,
    },
    date: {
        color: theme.colors.textMuted,
        fontSize: 10,
    },
    verdictBadge: {
        borderWidth: 1,
        borderRadius: theme.radius.md,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignItems: 'center',
        minWidth: 70,
    },
    verdictText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    scoreText: {
        fontSize: 11,
        fontWeight: '800',
        marginTop: 1,
    },
});