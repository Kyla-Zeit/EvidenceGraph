from rapidfuzz import fuzz
from typing import List, Dict, Any

def suggest_entity_duplicates(entities: List[Dict[str, Any]], threshold: float = 65.0) -> List[Dict[str, Any]]:
    suggestions = []
    n = len(entities)

    for i in range(n):
        for j in range(i + 1, n):
            e1 = entities[i]
            e2 = entities[j]

            # Compare within same entity type (or compatible types)
            if e1.get("entity_type") != e2.get("entity_type"):
                continue

            name1 = e1.get("display_name", "").strip()
            name2 = e2.get("display_name", "").strip()

            if not name1 or not name2:
                continue

            ratio = fuzz.ratio(name1.lower(), name2.lower())
            token_sort = fuzz.token_sort_ratio(name1.lower(), name2.lower())
            score = max(ratio, token_sort)

            if score >= threshold:
                positive_factors = []
                negative_factors = []

                if score >= 90:
                    positive_factors.append("High string similarity match (>90%)")
                else:
                    positive_factors.append(f"Moderate string similarity ({score:.1f}%)")

                # Shared identifiers
                shared_ids = set(e1.get("shared_identifiers", [])) & set(e2.get("shared_identifiers", []))
                if shared_ids:
                    positive_factors.append(f"Shared linked identifiers: {', '.join(shared_ids)}")
                else:
                    negative_factors.append("No common direct telephone or email identifiers verified")

                # Recommendation
                if score >= 85 and shared_ids:
                    recommended = "Merge"
                elif score < 75:
                    recommended = "Review Later"
                else:
                    recommended = "Review Later"

                suggestions.append({
                    "entity_a_id": e1.get("id"),
                    "entity_b_id": e2.get("id"),
                    "similarity_score": round(score / 100.0, 2),
                    "matching_factors": positive_factors + [f"- {nf}" for nf in negative_factors],
                    "recommended_action": recommended
                })

    return sorted(suggestions, key=lambda s: s["similarity_score"], reverse=True)
