import pytest
from app.resolution.matcher import suggest_entity_duplicates

def test_entity_resolution_suggests_fuzzy_match():
    entities = [
        {"id": "1", "entity_type": "Person", "display_name": "Rebecca Maguire", "shared_identifiers": ["+1-555-0192"]},
        {"id": "2", "entity_type": "Person", "display_name": "R. Maguire", "shared_identifiers": ["+1-555-0192"]},
        {"id": "3", "entity_type": "Person", "display_name": "Unrelated Stranger", "shared_identifiers": []}
    ]
    suggestions = suggest_entity_duplicates(entities, threshold=60.0)
    assert len(suggestions) >= 1
    top = suggestions[0]
    assert (top["entity_a_id"] == "1" and top["entity_b_id"] == "2") or (top["entity_a_id"] == "2" and top["entity_b_id"] == "1")
    assert top["similarity_score"] > 0.70
    assert any("Shared linked identifiers" in factor for factor in top["matching_factors"])
