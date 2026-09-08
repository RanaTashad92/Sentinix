# Sentinix — AI-Powered Phishing URL Detection

A real-time phishing URL detection system built with machine learning and deployed as a cross-platform mobile application. It extracts 22 structural features directly from URL strings and passes them through a three-layer defense pipeline: dual ML classifiers, VirusTotal threat intelligence, and Google Safe Browsing verification.

Built as an independent research project after graduating from Bahria University Lahore (BSc Computer Science, 2025). A full research paper accompanies this project — see the link below.

---

## What it does

You paste a URL into the app. Within a couple of seconds it tells you whether that link is SAFE, SUSPICIOUS, or DANGEROUS, and explains exactly why. No page is rendered, no request is sent to the target host — the analysis runs entirely on the URL string itself, which means it is fast, safe, and works on any link before you click it.

---

## How the detection works

**Layer 1 — Dual ML classifiers**

Two models run in parallel on 22 structural URL features:

- Random Forest: AUC-ROC 0.9828, F1 0.9346
- XGBoost: AUC-ROC 0.9516, F1 0.8726
- Combined ensemble accuracy: 97.8%

Both models were trained on 785,794 SMOTE-balanced samples (from 507,195 raw URLs).

**Layer 2 — VirusTotal**

The URL is checked against 70+ antivirus and security engines via the VirusTotal v3 API. Any detections raise the risk score proportionally.

**Layer 3 — Google Safe Browsing**

A parallel check against Google's threat database covering MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE, and POTENTIALLY_HARMFUL_APPLICATION. A match forces the score to at least 0.95 (DANGEROUS).

**Verdict thresholds**

| Score | Verdict |
|-------|---------|
| 0.00 – 0.39 | SAFE |
| 0.40 – 0.69 | SUSPICIOUS |
| 0.70 – 1.00 | DANGEROUS |

---

## The 22 URL features

Features are extracted in under 2ms with no network requests to the target host.

| # | Feature | Type |
|---|---------|------|
| 1 | url_length | Integer |
| 2 | domain_length | Integer |
| 3 | path_length | Integer |
| 4 | query_length | Integer |
| 5 | has_at_symbol | Binary |
| 6 | has_ip_address | Binary |
| 7 | has_double_slash | Binary |
| 8 | has_dash_in_domain | Binary |
| 9 | has_port | Binary |
| 10 | dot_count | Integer |
| 11 | hyphen_count | Integer |
| 12 | param_count | Integer |
| 13 | special_char_ratio | Float |
| 14 | is_https | Binary |
| 15 | has_suspicious_tld | Binary |
| 16 | subdomain_depth | Integer |
| 17 | suspicious_word_count | Integer |
| 18 | brand_in_subdomain | Binary |
| 19 | domain_entropy | Float |
| 20 | url_entropy | Float |
| 21 | digit_ratio | Float |
| 22 | letter_ratio | Float |

---

## Tech stack

**Machine learning pipeline**
- Python 3.12
- scikit-learn (Random Forest)
- XGBoost
- imbalanced-learn (SMOTE)
- pandas, numpy
- joblib (model serialization)

**Backend API**
- FastAPI
- uvicorn / Mangum (serverless adapter)
- httpx (async requests to VirusTotal and Google Safe Browsing)
- tldextract
- Deployed on Vercel

**Mobile application**
- React Native 0.86.3
- Expo SDK 57
- TypeScript 6.0
- Expo Router 57
- React Native Reanimated 4.5.1
- React Native SVG 15.15.4
- Axios 1.20
- AsyncStorage (local scan history)
- Expo Haptics (tactile feedback)

---

## Project structure

```
Sentinix/
├── phishing-detector/          # Backend (FastAPI)
│   ├── api/
│   │   └── index.py            # Main API — scan endpoint, anti-bot middleware
│   ├── src/
│   │   ├── features.py         # 22-feature URL extractor
│   │   └── model.py            # Model loading and prediction
│   ├── models/                 # Trained .pkl files (see note below)
│   │   ├── rf_phishing_detector.pkl
│   │   ├── xgb_phishing_detector.pkl
│   │   ├── feature_names.json
│   │   └── model_metadata.json
│   ├── notebooks/
│   │   ├── 01_data_exploration.ipynb
│   │   ├── 02_feature_engineering.ipynb
│   │   └── 03_model_training.ipynb
│   └── requirements.txt
│
├── phishing-detector-app/      # Mobile app (React Native / Expo)
│   ├── src/
│   │   ├── app/
│   │   │   ├── index.tsx       # HomeScreen
│   │   │   └── _layout.tsx     # Root layout with splash screen
│   │   ├── components/
│   │   │   ├── RiskGauge.tsx
│   │   │   ├── ModelLineChart.tsx
│   │   │   ├── StructuralFeatureCharts.tsx
│   │   │   ├── HistoryItem.tsx
│   │   │   ├── SplashScreen.tsx
│   │   │   ├── AppIcon.tsx
│   │   │   └── PrivacyPolicyModal.tsx
│   │   ├── hooks/
│   │   │   └── useScanner.ts
│   │   ├── utils/
│   │   │   ├── antiBot.ts      # FNV-1a dual-hash request signing
│   │   │   └── storage.ts      # AsyncStorage scan history
│   │   └── constants/
│   │       └── theme.ts
│   ├── app.json
│   └── package.json
│
├── screenshots/                # App screenshots for README
├── data/                       # Training graphs and charts
└── README.md
```

---

## Screenshots

| Splash | Home | SAFE Verdict |
|--------|------|-------------|
| ![Splash](screenshots/splash.png) | ![Home](screenshots/home.png) | ![Safe](screenshots/safe_verdict.png) |

| Model Chart | URL Analysis | History | Privacy |
|-------------|-------------|---------|---------|
| ![Model](screenshots/model_chart.png) | ![Analysis](screenshots/url_analysis.png) | ![History](screenshots/history.png) | ![Privacy](screenshots/privacy.png) |

---

## Running locally

### Backend

```bash
cd phishing-detector
pip install -r requirements.txt

# Add your API keys to .env (see .env.example — never commit .env)
cp .env.example .env

uvicorn api.index:app --reload --port 8000
```

The API will be live at `http://localhost:8000`. Test it:

```bash
curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Mobile app

```bash
cd phishing-detector-app
npm install

# Point the API to your local machine
# In src/hooks/useScanner.ts, set:
# const API_BASE = 'http://YOUR_LOCAL_IP:8000'

npx expo start
```

Scan the QR code in Expo Go on your phone, or press `i` for iOS simulator / `a` for Android emulator.

---

## Model files

The trained `.pkl` files are not in this repo because the Random Forest model serializes to ~450 MB. To get the models:

**Option 1 — Train them yourself**

Run the three notebooks in order inside `phishing-detector/notebooks/`. The training data is the [Kaggle Phishing URL Dataset](https://www.kaggle.com/datasets/sid321axn/malicious-urls-dataset). The notebooks handle downloading, SMOTE balancing, training, and saving the `.pkl` files to `phishing-detector/models/`.

**Option 2 — Download pre-trained models**

Pre-trained `.pkl` files will be released as a GitHub Release asset. Check the [Releases](https://github.com/RanaTashad92/Sentinix/releases) tab.

---

## Environment variables

Create a `.env` file inside `phishing-detector/` based on `.env.example`:

```
VIRUSTOTAL_API_KEY=your_key_here
SAFE_BROWSING_API_KEY=your_key_here
```

Get your keys from:
- VirusTotal: https://www.virustotal.com/gui/my-apikey (free tier: 4 requests/minute)
- Google Safe Browsing: https://console.cloud.google.com (enable Safe Browsing API)

The system works without these keys — it falls back to ML-only scoring. The keys just enable Layers 2 and 3.

---

## Anti-bot security

Every scan request from the mobile app carries three cryptographic headers generated by `antiBot.ts`:

```
X-Sentinix-Client: Sentinix-Mobile-App/1.0
X-Sentinix-Timestamp: <unix_timestamp>
X-Sentinix-Signature: <fnv1a_dual_hash>
```

The backend validates the signature, rejects timestamps older than 300 seconds (replay protection), and enforces a server-side rate limit of 20 requests per 60-second window per IP. The client enforces an additional 10 requests per 60-second limit before the request even leaves the device.

---

## Research paper

A full research paper covering the dataset, feature engineering, model evaluation, and system architecture accompanies this project.

📄 **arXiv preprint:** *(link will be added after submission)*

**Citation:**

```
Tarij, T. (2026). Sentinix: A Three-Layer AI-Powered Phishing URL Detection
Framework with Cryptographic Anti-Bot Request Verification.
arXiv preprint. [link]
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

You are free to use, modify, and distribute this code. If you use it in research, a citation to the paper above would be appreciated.

---

## Author

**Tashad Tarij**
BS Computer Science — Bahria University Lahore (2025)
Independent researcher 

[LinkedIn](www.linkedin.com/in/tashad-tarij-5230b02b5) · [Email](tashadrana224@gmail.com)
