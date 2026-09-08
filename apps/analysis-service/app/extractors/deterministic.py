import re
import ipaddress
from typing import List, Dict, Any

EMAIL_REGEX = re.compile(r'\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b')
PHONE_REGEX = re.compile(r'(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4})\b|\b([0-9]{3})[-.]([0-9]{4})\b')
IPV4_REGEX = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
DOMAIN_REGEX = re.compile(r'\b(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|org|net|test|edu|gov|io|co|local|tech)\b', re.IGNORECASE)
ETH_WALLET_REGEX = re.compile(r'\b0x[a-fA-F0-9]{40}\b')
SHA256_REGEX = re.compile(r'\b[a-fA-F0-9]{64}\b')

def normalize_phone(phone_raw: str) -> str:
    digits = re.sub(r'\D', '', phone_raw)
    if len(digits) == 10:
        return f"+1-{digits[:3]}-{digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits.startswith('1'):
        return f"+1-{digits[1:4]}-{digits[4:7]}-{digits[7:]}"
    elif len(digits) == 7:
        return f"+1-555-{digits[:3]}-{digits[3:]}"
    return phone_raw.strip()

def extract_deterministic_entities(text: str) -> List[Dict[str, Any]]:
    entities = []
    email_spans = []

    # 1. Emails
    for match in EMAIL_REGEX.finditer(text):
        val = match.group(0).lower()
        email_spans.append((match.start(), match.end()))
        entities.append({
            "original_text": match.group(0),
            "normalized_text": val,
            "entity_type": "EmailAddress",
            "canonical_value": val,
            "display_name": val,
            "start_offset": match.start(),
            "end_offset": match.end(),
            "extraction_method": "Deterministic",
            "confidence": 1.0
        })

    # 2. Phone Numbers
    for match in PHONE_REGEX.finditer(text):
        raw = match.group(0)
        norm = normalize_phone(raw)
        entities.append({
            "original_text": raw,
            "normalized_text": norm,
            "entity_type": "PhoneNumber",
            "canonical_value": norm,
            "display_name": norm,
            "start_offset": match.start(),
            "end_offset": match.end(),
            "extraction_method": "Deterministic",
            "confidence": 1.0
        })

    # 3. IP Addresses
    for match in IPV4_REGEX.finditer(text):
        raw = match.group(0)
        try:
            ip = ipaddress.ip_address(raw)
            if not ip.is_loopback:
                entities.append({
                    "original_text": raw,
                    "normalized_text": str(ip),
                    "entity_type": "IPAddress",
                    "canonical_value": str(ip),
                    "display_name": str(ip),
                    "start_offset": match.start(),
                    "end_offset": match.end(),
                    "extraction_method": "Deterministic",
                    "confidence": 1.0
                })
        except ValueError:
            pass

    # 4. Domains (exclude if exact span overlaps with email)
    for match in DOMAIN_REGEX.finditer(text):
        raw = match.group(0).lower()
        is_inside_email = any(s <= match.start() and match.end() <= e for s, e in email_spans)
        if not is_inside_email:
            entities.append({
                "original_text": match.group(0),
                "normalized_text": raw,
                "entity_type": "Domain",
                "canonical_value": raw,
                "display_name": raw,
                "start_offset": match.start(),
                "end_offset": match.end(),
                "extraction_method": "Deterministic",
                "confidence": 1.0
            })

    # 5. Cryptocurrency Wallets
    for match in ETH_WALLET_REGEX.finditer(text):
        val = match.group(0).lower()
        short_name = f"Wallet ({val[:6]}...{val[-4:]})"
        entities.append({
            "original_text": match.group(0),
            "normalized_text": val,
            "entity_type": "CryptocurrencyWallet",
            "canonical_value": val,
            "display_name": short_name,
            "start_offset": match.start(),
            "end_offset": match.end(),
            "extraction_method": "Deterministic",
            "confidence": 1.0
        })

    return entities
