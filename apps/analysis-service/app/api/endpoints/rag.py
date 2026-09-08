from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.rag.engine import rag_engine

router = APIRouter()

class ChunkContext(BaseModel):
    chunk_id: str
    evidence_id: str
    evidence_number: str
    title: str
    text: str
    chunk_index: int
    page_number: Optional[int] = 1

class GraphPathContext(BaseModel):
    source_label: str
    relationship: str
    target_label: str
    evidence_number: Optional[str] = None

class RagQueryRequest(BaseModel):
    case_id: str
    user_id: str
    question: str
    chunks: List[ChunkContext]
    graph_paths: List[GraphPathContext]
    events: List[Dict[str, Any]]
    provider: Optional[str] = None

@router.post("/rag/query")
async def query_rag(req: RagQueryRequest):
    chunks_dict = [c.model_dump() for c in req.chunks]
    paths_dict = [p.model_dump() for p in req.graph_paths]
    return await rag_engine.query(
        case_id=req.case_id,
        user_id=req.user_id,
        question=req.question,
        chunks=chunks_dict,
        graph_paths=paths_dict,
        events=req.events,
        provider_name=req.provider
    )
