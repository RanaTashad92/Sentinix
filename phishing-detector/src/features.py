import re
import math
from urllib.parse import urlparse
import tldextract


def shannon_entropy(s: str) -> float:
    if not s:
        return 0.0
    char_freq = {}
    for char in s:
        char_freq[char] = char_freq.get(char, 0) + 1
    n = len(s)
    entropy = 0.0
    for count in char_freq.values():
        p = count / n
        entropy -= p * math.log2(p)
    return round(entropy, 4)


def extract_features(url: str) -> dict:
    try:
        parsed   = urlparse(url)
        ext      = tldextract.extract(url)
        url_lower = url.lower()

        suspicious_tlds = {
            '.tk','.ml','.ga','.cf','.gq','.xyz',
            '.top','.work','.click','.link','.online','.site'
        }
        phishing_keywords = [
            'login','signin','verify','account','update','secure',
            'banking','confirm','password','credential','paypal',
            'amazon','apple','microsoft','ebay','netflix','webscr','support'
        ]
        brands = [
            'paypal','amazon','apple','google','microsoft',
            'netflix','ebay','facebook','instagram','bank'
        ]

        f = {}

        f['url_length']    = len(url)
        f['domain_length'] = len(ext.domain)
        f['path_length']   = len(parsed.path)
        f['query_length']  = len(parsed.query)

        f['has_at_symbol']     = int('@' in url)
        f['has_ip_address']    = int(bool(
            re.search(
                r'(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}'
                r'(?:25[0-5]|2[0-4]\d|[01]?\d\d?)', parsed.netloc
            )
        ))
        f['has_double_slash']   = int('//' in parsed.path)
        f['has_dash_in_domain'] = int('-' in ext.domain)
        f['has_port']           = int(bool(parsed.port))
        f['dot_count']          = url.count('.')
        f['hyphen_count']       = url.count('-')
        f['param_count']        = len(parsed.query.split('&')) if parsed.query else 0
        f['special_char_ratio'] = round(
            len(re.findall(r'[%=&?#@!$]', url)) / max(len(url), 1), 4
        )

        f['is_https']             = int(parsed.scheme == 'https')
        f['has_suspicious_tld']   = int(f'.{ext.suffix}' in suspicious_tlds)
        f['subdomain_depth']      = len(ext.subdomain.split('.')) if ext.subdomain else 0
        f['suspicious_word_count']= sum(1 for w in phishing_keywords if w in url_lower)
        f['brand_in_subdomain']   = int(
            any(b in ext.subdomain.lower() for b in brands)
        ) if ext.subdomain else 0

        f['domain_entropy'] = shannon_entropy(ext.domain)
        f['url_entropy']    = shannon_entropy(url)
        f['digit_ratio']    = round(sum(c.isdigit() for c in url) / max(len(url), 1), 4)
        f['letter_ratio']   = round(sum(c.isalpha() for c in url) / max(len(url), 1), 4)

        return f

    except Exception:
        return {}