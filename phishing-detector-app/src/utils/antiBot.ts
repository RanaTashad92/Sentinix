const BOT_PROTECTION_SECRET = 'Sentinix_AntiBot_Protection_2026_SecureKey';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestTimestamps: number[] = [];

export function checkRateLimit(): boolean {
    const now = Date.now();
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
        requestTimestamps.shift();
    }
    if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
        return false;
    }
    requestTimestamps.push(now);
    return true;
}

export function generateAntiBotHeaders(url: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const normalizedUrl = url.trim().toLowerCase();
    const rawPayload = `${BOT_PROTECTION_SECRET}:${timestamp}:${normalizedUrl}`;

    let hash1 = 2166136261;
    let hash2 = 3735878807;

    for (let i = 0; i < rawPayload.length; i++) {
        const charCode = rawPayload.charCodeAt(i);
        hash1 ^= charCode;
        hash1 = Math.imul(hash1, 16777619);
        hash2 ^= charCode;
        hash2 = Math.imul(hash2, 1099511628211);
    }

    const signature = `${(hash1 >>> 0).toString(16)}-${(hash2 >>> 0).toString(16)}`;

    return {
        'X-Sentinix-Client': 'Sentinix-Mobile-App/1.0',
        'X-Sentinix-Timestamp': timestamp,
        'X-Sentinix-Signature': signature,
    };
}
