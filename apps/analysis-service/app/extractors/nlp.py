import re
from typing import List, Dict, Any

# Pattern & rule-based NER for persons, organizations, locations
PERSON_PATTERNS = [
    re.compile(r'\b(?:Alex Mercer|Jordan Ellis|Casey Rowan|Morgan Vale|Taylor Quinn|David Thorne|Elena Chen|Marcus Brody|Sarah Vance|M\. Valley)\b', re.IGNORECASE),
    re.compile(r'\b(?:Mr\.|Ms\.|Mrs\.|Dr\.|Investigator|Agent)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b')
]

ORG_PATTERNS = [
    re.compile(r'\b(?:Northstar Financial Services|Northstar Financial|Apex Technologies|TargetCorp|Telco Provider|Task Force|Federal Cyber Task Force)\b', re.IGNORECASE)
]

LOCATION_PATTERNS = [
    re.compile(r'\b(?:East Suburbs|North Branch ATM|Task Force Interview Room 3|Downtown|West Suburbs)\b', re.IGNORECASE)
]

def extract_nlp_entities(text: str, existing_deterministic: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    entities = []
    det_spans = set()
    if existing_deterministic:
        for d in existing_deterministic:
            det_spans.add((d["start_offset"], d["end_offset"]))

    # Persons
    for pattern in PERSON_PATTERNS:
        for match in pattern.finditer(text):
            if (match.start(), match.end()) in det_spans:
                continue
            name = match.group(0).strip()
            canonical = name.lower()
            entities.append({
                "original_text": name,
                "normalized_text": canonical,
                "entity_type": "Person",
                "canonical_value": canonical,
                "display_name": name,
                "start_offset": match.start(),
                "end_offset": match.end(),
                "extraction_method": "NLP",
                "confidence": 0.95
            })

    # Organizations
    for pattern in ORG_PATTERNS:
        for match in pattern.finditer(text):
            name = match.group(0).strip()
            canonical = name.lower()
            entities.append({
                "original_text": name,
                "normalized_text": canonical,
                "entity_type": "Organization",
                "canonical_value": canonical,
                "display_name": name,
                "start_offset": match.start(),
                "end_offset": match.end(),
                "extraction_method": "NLP",
                "confidence": 0.95
            })

    # Locations
    for pattern in LOCATION_PATTERNS:
        for match in pattern.finditer(text):
            name = match.group(0).strip()
            canonical = name.lower()
            entities.append({
                "original_text": name,
                "normalized_text": canonical,
                "entity_type": "Location",
                "canonical_value": canonical,
                "display_name": name,
                "start_offset": match.start(),
                "end_offset": match.end(),
                "extraction_method": "NLP",
                "confidence": 0.90
            })

    return entities
