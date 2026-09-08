import { useState } from 'react';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { saveToHistory, ScanRecord } from '../utils/storage';
import { generateAntiBotHeaders, checkRateLimit } from '../utils/antiBot';

// Change this to your Render URL or local machine IP
const API_BASE = 'https://phishing-detector-mu-flame.vercel.app';


export interface ModelComparisonData {
    xgb_score: number;
    rf_score: number;
    ensemble_score: number;
}

export interface ScanResult {
    url: string;
    verdict: 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS';
    risk_score: number;
    ml_score: number;
    xgb_score?: number;
    rf_score?: number;
    virustotal_detections: number;
    virustotal_total: number;
    safe_browsing_flagged: boolean;
    threat_types: string[];
    features: Record<string, number>;
    explanation: string[];
    model_comparison?: ModelComparisonData;
}

export function useScanner() {
    const [result, setResult] = useState<ScanResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function scan(url: string) {
        if (!url.trim()) return;

        // ── Client-side rate limit check ──────────────────────
        if (!checkRateLimit()) {
            setError('Too many scans — please wait a moment before trying again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // ── Generate anti-bot verification headers ────────
            const antiBotHeaders = generateAntiBotHeaders(url.trim());

            const { data } = await axios.post<ScanResult>(
                `${API_BASE}/scan`,
                { url },
                {
                    timeout: 15000,
                    headers: {
                        ...antiBotHeaders,
                    },
                }
            );
            setResult(data);

            // Haptic feedback based on verdict
            if (data.verdict === 'DANGEROUS') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else if (data.verdict === 'SUSPICIOUS') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Save to history
            const record: ScanRecord = {
                id: Date.now().toString(),
                url: data.url,
                verdict: data.verdict,
                riskScore: data.risk_score,
                mlScore: data.ml_score,
                vtDetections: data.virustotal_detections,
                vtTotal: data.virustotal_total,
                gsbFlagged: data.safe_browsing_flagged,
                explanation: data.explanation,
                scannedAt: new Date().toISOString(),
            };
            await saveToHistory(record);

        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || 'Scan failed';
            setError(msg);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    }

    function reset() {
        setResult(null);
        setError(null);
    }

    return { scan, result, loading, error, reset };
}