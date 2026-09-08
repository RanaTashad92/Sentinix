// ─── Sentinix Anti-Bot Client Verification ───────────────────
// This module generates cryptographic verification headers that must
// accompany every /scan API request. The backend validates these to
// ensure requests originate from the genuine Sentinix app — not from
// bots, scrapers, or unauthorized third-party clients.

const BOT_PROTECTION_SECRET = 'Sentinix_AntiBot_Protection_2026_SecureKey';

// ── Rate Limiter (client-side) ───────────────────────────────
// Prevents automated rapid-fire scanning even from within the app.
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestTimestamps: number[] = [];

export function checkRateLimit(): boolean {
    const now = Date.now();
    // Evict stale timestamps outside the window
    while (requestTimestamps.length > 0 && now - requestTimestamps[0] > RATE_LIMIT_WINDOW_MS) {
        requestTimestamps.shift();
    }
    if (requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
        return false; // Rate limited
    }
    requestTimestamps.push(now);
    return true;
}

/**
 * Generates anti-bot verification headers for API requests.
 *
 * How it works:
 * 1. A timestamp is captured at the moment of the request.
 * 2. A raw payload is built: `SECRET:timestamp:normalizedUrl`.
 * 3. Two FNV-1a hashes are computed over the payload (dual-hash for extra entropy).
 * 4. The hex-encoded hashes are joined as the `X-Sentinix-Signature` header.
 * 5. The backend reproduces this exact computation and rejects mismatches.
 *
 * This ensures only clients that know the shared secret can produce valid signatures.
 */
export function generateAntiBotHeaders(url: string): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const normalizedUrl = url.trim().toLowerCase();
    const rawPayload = `${BOT_PROTECTION_SECRET}:${timestamp}:${normalizedUrl}`;

    // FNV-1a dual-hash implementation
    let hash1 = 2166136261;  // FNV offset basis (32-bit)
    let hash2 = 3735878807;  // Secondary offset basis

    for (let i = 0; i < rawPayload.length; i++) {
        const charCode = rawPayload.charCodeAt(i);
        hash1 ^= charCode;
        hash1 = Math.imul(hash1, 16777619);  // FNV prime (32-bit)
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
