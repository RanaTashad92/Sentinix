import os
import json
import sys
import joblib
import pandas as pd
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Ensure src directory is in sys.path
CURR_DIR = os.path.dirname(os.path.abspath(__file__))
if CURR_DIR not in sys.path:
    sys.path.insert(0, CURR_DIR)

from features import extract_features

# Robust discovery of models directory
def find_models_dir():
    candidates = [
        os.path.join(CURR_DIR, '..', 'models'),
        os.path.join(CURR_DIR, 'models'),
        os.path.join(os.getcwd(), 'models'),
        os.path.join(os.getcwd(), 'src', 'models'),
        '/var/task/models',
        '/vercel/path0/models',
    ]
    for p in candidates:
        abs_p = os.path.abspath(p)
        if os.path.exists(abs_p) and os.path.exists(os.path.join(abs_p, 'xgb_phishing_detector.pkl')):
            return abs_p
    return os.path.abspath(os.path.join(CURR_DIR, '..', 'models'))

MODELS_DIR = find_models_dir()

# Load env variables
load_dotenv(os.path.join(MODELS_DIR, '..', '.env'))

# Load XGBoost & Random Forest ML models safely
xgb_model = None
rf_model = None

xgb_path = os.path.join(MODELS_DIR, 'xgb_phishing_detector.pkl')
if os.path.exists(xgb_path):
    try:
        xgb_model = joblib.load(xgb_path)
    except Exception as e:
        print(f"Error loading XGB model: {e}")

rf_path = os.path.join(MODELS_DIR, 'rf_phishing_detector.pkl')
if os.path.exists(rf_path):
    try:
        rf_model = joblib.load(rf_path)
    except Exception as e:
        print(f"Error loading RF model: {e}")

if rf_model is None:
    rf_model = xgb_model

# Load feature names and metadata safely
FEATURE_NAMES = [
    'url_length', 'domain_length', 'path_length', 'query_length',
    'has_at_symbol', 'has_ip_address', 'has_double_slash', 'has_dash_in_domain',
    'has_port', 'dot_count', 'hyphen_count', 'param_count', 'special_char_ratio',
    'is_https', 'has_suspicious_tld', 'subdomain_depth', 'suspicious_word_count',
    'brand_in_subdomain', 'domain_entropy', 'url_entropy', 'digit_ratio', 'letter_ratio'
]
METADATA = {'best_model': 'XGBoost / HistGB', 'n_features': 22}

fn_path = os.path.join(MODELS_DIR, 'feature_names.json')
if os.path.exists(fn_path):
    try:
        with open(fn_path) as f:
            FEATURE_NAMES = json.load(f)
    except Exception:
        pass

meta_path = os.path.join(MODELS_DIR, 'model_metadata.json')
if os.path.exists(meta_path):
    try:
        with open(meta_path) as f:
            METADATA = json.load(f)
    except Exception:
        pass

# ── API keys from .env ─────────────────────────────────────────
VT_API_KEY = os.getenv('VIRUSTOTAL_API_KEY', '')
GSB_API_KEY = os.getenv('SAFE_BROWSING_API_KEY', '')

# ── FastAPI app ────────────────────────────────────────────────
app = FastAPI(
    title='Sentinix AI Phishing Detector API',
    description='Real-time dual-model phishing detection using XGBoost + Random Forest + Threat Intel',
    version='1.0.0'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)


# ── Request / Response schemas ─────────────────────────────────

class ScanRequest(BaseModel):
    url: str

class ModelComparison(BaseModel):
    xgb_score: float
    rf_score: float
    ensemble_score: float

class ScanResponse(BaseModel):
    url: str
    verdict: str              # SAFE / SUSPICIOUS / DANGEROUS
    risk_score: float         # Final combined ensemble score
    ml_score: float           # Combined ML probability (XGB + RF average)
    xgb_score: float          # XGBoost Model probability
    rf_score: float           # Random Forest Model probability
    virustotal_detections: int
    virustotal_total: int
    safe_browsing_flagged: bool
    threat_types: list
    features: dict            # 22 structural URL features
    explanation: list         # Human-readable reasons
    model_comparison: ModelComparison


# ── Helper: Dual ML prediction ─────────────────────────────────
def ml_predict_dual(url: str) -> tuple[float, float, float, dict]:
    feats = extract_features(url)
    if not feats:
        return 0.5, 0.5, 0.5, {}

    if xgb_model is None and rf_model is None:
        return 0.5, 0.5, 0.5, feats

    feats_df = pd.DataFrame([feats])[FEATURE_NAMES]

    xgb_prob = 0.5
    if xgb_model is not None:
        try:
            xgb_prob = float(xgb_model.predict_proba(feats_df)[0][1])
        except Exception:
            xgb_prob = 0.5

    rf_prob = xgb_prob
    if rf_model is not None and rf_model != xgb_model:
        try:
            rf_prob = float(rf_model.predict_proba(feats_df)[0][1])
        except Exception:
            rf_prob = xgb_prob

    combined_ml_prob = (xgb_prob * 0.5) + (rf_prob * 0.5)
    return xgb_prob, rf_prob, combined_ml_prob, feats


# ── Helper: VirusTotal API ─────────────────────────────────────
async def check_virustotal(url: str) -> tuple[int, int]:
    if not VT_API_KEY:
        return 0, 0

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {'x-apikey': VT_API_KEY}
            resp = await client.post(
                'https://www.virustotal.com/api/v3/urls',
                headers=headers,
                data={'url': url}
            )

            if resp.status_code != 200:
                return 0, 0

            analysis_id = resp.json()['data']['id']
            result_resp = await client.get(
                f'https://www.virustotal.com/api/v3/analyses/{analysis_id}',
                headers=headers
            )

            if result_resp.status_code != 200:
                return 0, 0

            stats = result_resp.json()['data']['attributes']['stats']
            malicious = stats.get('malicious', 0)
            suspicious = stats.get('suspicious', 0)
            total = sum(stats.values())

            return malicious + suspicious, total

    except Exception:
        return 0, 0


# ── Helper: Google Safe Browsing ──────────────────────────────
async def check_safe_browsing(url: str) -> tuple[bool, list]:
    if not GSB_API_KEY:
        return False, []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                'client': {
                    'clientId': 'sentinix-app',
                    'clientVersion': '1.0.0'
                },
                'threatInfo': {
                    'threatTypes': [
                        'MALWARE',
                        'SOCIAL_ENGINEERING',
                        'UNWANTED_SOFTWARE',
                        'POTENTIALLY_HARMFUL_APPLICATION'
                    ],
                    'platformTypes': ['ANY_PLATFORM'],
                    'threatEntryTypes': ['URL'],
                    'threatEntries': [{'url': url}]
                }
            }

            resp = await client.post(
                f'https://safebrowsing.googleapis.com/v4/threatMatches:find?key={GSB_API_KEY}',
                json=payload
            )

            if resp.status_code != 200:
                return False, []

            data = resp.json()
            matches = data.get('matches', [])

            if not matches:
                return False, []

            threat_types = list({m['threatType'] for m in matches})
            return True, threat_types

    except Exception:
        return False, []


# ── Helper: Build human-readable explanation ──────────────────
def build_explanation(feats: dict, vt_detections: int, gsb_flagged: bool) -> list:
    reasons = []

    if feats.get('has_ip_address'):
        reasons.append('Uses raw IP address instead of domain name')
    if feats.get('has_at_symbol'):
        reasons.append('Contains @ symbol — high redirect risk')
    if feats.get('has_suspicious_tld'):
        reasons.append('Uses a suspicious top-level domain (.tk, .xyz, etc.)')
    if feats.get('brand_in_subdomain'):
        reasons.append('Known brand name detected in subdomain (spoofing)')
    if feats.get('suspicious_word_count', 0) >= 2:
        reasons.append(f'Contains {feats["suspicious_word_count"]} phishing keywords')
    if feats.get('subdomain_depth', 0) >= 3:
        reasons.append(f'Deeply nested subdomains ({feats["subdomain_depth"]} levels)')
    if feats.get('url_length', 0) > 100:
        reasons.append(f'Unusually long URL ({feats["url_length"]} chars)')
    if feats.get('domain_entropy', 0) > 3.5:
        reasons.append('High domain entropy (appears algorithmically generated)')
    if feats.get('has_double_slash'):
        reasons.append('Double slash in URL path (possible open redirect)')
    if feats.get('has_port'):
        reasons.append('Uses custom non-standard port number')
    if vt_detections > 0:
        reasons.append(f'Flagged by {vt_detections} security engines on VirusTotal')
    if gsb_flagged:
        reasons.append('Blacklisted on Google Safe Browsing database')
    if not reasons:
        reasons.append('No security threat indicators found')

    return reasons


# ── Helper: Ensemble scoring ───────────────────────────────────
def compute_ensemble_score(ml_score: float, vt_detections: int,
                            vt_total: int, gsb_flagged: bool) -> float:
    score = ml_score

    if vt_total > 0 and vt_detections > 0:
        vt_ratio = min(vt_detections / vt_total, 1.0)
        score = max(score, 0.5 + 0.5 * vt_ratio)
    
    if gsb_flagged:
        score = max(score, 0.95)

    return round(min(score, 1.0), 4)


# ── MAIN ENDPOINT ──────────────────────────────────────────────
@app.post('/scan', response_model=ScanResponse)
async def scan_url(request: ScanRequest):
    url = request.url.strip()

    if not url:
        raise HTTPException(status_code=400, detail='URL cannot be empty')
    
    if not url.startswith(('http://', 'https://')):
        url = 'http://' + url

    import asyncio

    xgb_score, rf_score, combined_ml_score, feats = ml_predict_dual(url)

    vt_result, gsb_result = await asyncio.gather(
        check_virustotal(url),
        check_safe_browsing(url)
    )

    vt_detections, vt_total = vt_result
    gsb_flagged, threat_types = gsb_result

    risk_score = compute_ensemble_score(combined_ml_score, vt_detections, vt_total, gsb_flagged)

    if risk_score >= 0.7:
        verdict = 'DANGEROUS'
    elif risk_score >= 0.4:
        verdict = 'SUSPICIOUS'
    else:
        verdict = 'SAFE'

    explanation = build_explanation(feats, vt_detections, gsb_flagged)

    return ScanResponse(
        url=url,
        verdict=verdict,
        risk_score=risk_score,
        ml_score=combined_ml_score,
        xgb_score=xgb_score,
        rf_score=rf_score,
        virustotal_detections=vt_detections,
        virustotal_total=vt_total,
        safe_browsing_flagged=gsb_flagged,
        threat_types=threat_types,
        features=feats,
        explanation=explanation,
        model_comparison=ModelComparison(
            xgb_score=xgb_score,
            rf_score=rf_score,
            ensemble_score=risk_score
        )
    )


@app.get('/')
async def root():
    return {
        'status': 'online',
        'models': ['HistGB / XGBoost Classifier', 'Random Forest Classifier'],
        'features': METADATA.get('n_features', 22),
        'version': '1.0.0'
    }


@app.get('/health')
async def health():
    return {'status': 'healthy'}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('api:app', host='0.0.0.0', port=8000, reload=True)