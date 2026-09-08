import pytest
from app.extractors.deterministic import extract_deterministic_entities, normalize_phone
from app.extractors.nlp import extract_nlp_entities

def test_normalize_phone():
    assert normalize_phone("555-0192") == "+1-555-555-0192"
    assert normalize_phone("+1 555 0192 123") == "+1-555-019-2123"
    assert normalize_phone("(555) 019-2834") == "+1-555-019-2834"

def test_extract_deterministic_entities():
    sample_text = """
    From: admin@northstar-example.test
    Contact: 555-0192
    Server IP: 198.51.100.42
    Website: northstar-example.test
    Payment Wallet: 0x71CB71F38492A000112233445566778899aabbcc
    """
    entities = extract_deterministic_entities(sample_text)
    types = [e["entity_type"] for e in entities]

    assert "EmailAddress" in types
    assert "PhoneNumber" in types
    assert "IPAddress" in types
    assert "Domain" in types
    assert "CryptocurrencyWallet" in types

    email = next(e for e in entities if e["entity_type"] == "EmailAddress")
    assert email["canonical_value"] == "admin@northstar-example.test"
    assert email["confidence"] == 1.0

def test_extract_nlp_entities():
    sample_text = "Alex Mercer and Jordan Ellis coordinated operations for Northstar Financial Services at East Suburbs."
    entities = extract_nlp_entities(sample_text)
    names = [e["display_name"] for e in entities]

    assert "Alex Mercer" in names
    assert "Jordan Ellis" in names
    assert any("Northstar Financial" in n for n in names)
