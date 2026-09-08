import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose }: Props) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.contentCard}>
                    {/* Modal Header */}
                    <View style={styles.header}>
                        <View style={styles.titleWrap}>
                            <Text style={styles.headerTitle}>Privacy & Security</Text>
                            <Text style={styles.headerSub}>How Sentinix handles your data</Text>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </Pressable>
                    </View>

                    {/* Scrollable Privacy Content */}
                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Your data stays private</Text>
                            <Text style={styles.bodyText}>
                                Sentinix doesn’t track you. We don’t store, profile, or sell your URLs, IP address, or device info. Links you submit are analyzed in memory and discarded the moment you get your result.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Everything stays on your phone</Text>
                            <Text style={styles.bodyText}>
                                Your scan history lives only on your device. Nothing is synced to the cloud. You can clear it anytime with a single tap.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>How we check threats</Text>
                            <Text style={styles.bodyText}>
                                When we verify a link against VirusTotal and Google Safe Browsing, only the URL is sent — no personal info, no device details, no cookies. All requests use encrypted connections.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>AI runs in isolation</Text>
                            <Text style={styles.bodyText}>
                                Our ML models extract structural patterns from the URL itself — things like entropy, character ratios, and subdomain depth. This analysis is stateless and nothing is saved.
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Standards we follow</Text>
                            <Text style={styles.bodyText}>
                                Designed to adhere to GDPR, CCPA, and OWASP Top 10 Security guidelines for automated URL analysis tools.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer Accept Button */}
                    <Pressable style={styles.doneBtn} onPress={onClose}>
                        <LinearGradient
                            colors={['#6366F1', '#4F46E5']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.doneGrad}
                        >
                            <Text style={styles.doneText}>I Understand & Accept</Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(9, 13, 22, 0.85)',
        justifyContent: 'flex-end',
    },
    contentCard: {
        backgroundColor: '#111827',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        padding: 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    titleWrap: {
        flex: 1,
    },
    headerTitle: {
        color: '#F9FAFB',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    headerSub: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '700',
    },
    scroll: {
        marginBottom: 20,
    },
    section: {
        marginBottom: 18,
    },
    sectionTitle: {
        color: '#818CF8',
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 6,
    },
    bodyText: {
        color: '#D1D5DB',
        fontSize: 12,
        lineHeight: 19,
    },
    doneBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    doneGrad: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    doneText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
