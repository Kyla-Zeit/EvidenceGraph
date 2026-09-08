import hashlib
from typing import List, Dict, Any

def chunk_text(text: str, max_chunk_chars: int = 400, overlap: int = 50) -> List[Dict[str, Any]]:
    if not text:
        return []

    chunks = []
    lines = text.split("\n")
    current_text = ""
    current_start = 0
    chunk_idx = 0

    for line in lines:
        if len(current_text) + len(line) > max_chunk_chars and current_text:
            cleaned = current_text.strip()
            sha256 = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
            chunks.append({
                "chunk_index": chunk_idx,
                "start_offset": current_start,
                "end_offset": current_start + len(cleaned),
                "text": cleaned,
                "text_hash": sha256
            })
            chunk_idx += 1
            current_start += len(cleaned)
            current_text = line + "\n"
        else:
            current_text += line + "\n"

    if current_text.strip():
        cleaned = current_text.strip()
        sha256 = hashlib.sha256(cleaned.encode("utf-8")).hexdigest()
        chunks.append({
            "chunk_index": chunk_idx,
            "start_offset": current_start,
            "end_offset": current_start + len(cleaned),
            "text": cleaned,
            "text_hash": sha256
        })

    return chunks
