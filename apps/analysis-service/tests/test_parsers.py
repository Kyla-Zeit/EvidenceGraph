import pytest
from app.extractors.parsers import parse_eml, parse_csv_dataset
from app.extractors.chunker import chunk_text

def test_parse_eml_headers():
    eml_raw = b"""From: admin@northstar-example.test
To: victim@targetcorp-demo.test
Subject: Invoice Notice #9042
Date: Mon, 2 Mar 2026 10:14:00 +0000
Message-ID: <abc-123@northstar-example.test>
Received: from mail.northstar-example.test [198.51.100.42]

Please remit $4,500 to wallet 0x71CB71F38492A000.
"""
    result = parse_eml(eml_raw)
    assert result["headers"]["from"] == "admin@northstar-example.test"
    assert result["headers"]["subject"] == "Invoice Notice #9042"
    assert "Please remit" in result["body"]

def test_parse_csv():
    csv_data = "timestamp,source,destination\n2026-03-04T12:00:00Z,+1-555-0192,+1-555-0184\n"
    rows = parse_csv_dataset(csv_data)
    assert len(rows) == 1
    assert rows[0]["source"] == "+1-555-0192"

def test_chunk_text():
    text = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5"
    chunks = chunk_text(text, max_chunk_chars=20)
    assert len(chunks) >= 2
    assert chunks[0]["text_hash"] is not None
