import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanRecord {
    id: string;
    url: string;
    verdict: string;
    riskScore: number;
    mlScore: number;
    vtDetections: number;
    vtTotal: number;
    gsbFlagged: boolean;
    explanation: string[];
    scannedAt: string;
}

const KEY = 'scan_history';
const MAX = 50;

export async function saveToHistory(record: ScanRecord): Promise<void> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        const history: ScanRecord[] = raw ? JSON.parse(raw) : [];
        // newest first, keep max 50
        const updated = [record, ...history].slice(0, MAX);
        await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    } catch { }
}

export async function getHistory(): Promise<ScanRecord[]> {
    try {
        const raw = await AsyncStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export async function clearHistory(): Promise<void> {
    try {
        await AsyncStorage.removeItem(KEY);
    } catch { }
}