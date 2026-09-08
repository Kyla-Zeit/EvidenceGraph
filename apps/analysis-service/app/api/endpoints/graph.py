from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.graph.neo4j_client import graph_client

router = APIRouter()

class NodeSync(BaseModel):
    id: str
    label: str
    entity_type: str
    canonical_value: str
    display_name: str
    status: str
    confidence: float
    is_confirmed: bool

class EdgeSync(BaseModel):
    id: str
    source_id: str
    target_id: str
    relationship_type: str
    status: str
    confidence: float
    is_confirmed: bool
    evidence_id: Optional[str] = None
    evidence_number: Optional[str] = None

class RebuildRequest(BaseModel):
    case_id: str
    nodes: List[NodeSync]
    edges: List[EdgeSync]

@router.post("/graph/rebuild")
async def rebuild_graph(req: RebuildRequest):
    nodes_data = [n.model_dump() for n in req.nodes]
    edges_data = [e.model_dump() for e in req.edges]
    result = graph_client.sync_case_graph(req.case_id, nodes_data, edges_data)
    return {
        "success": result["success"],
        "nodes_projected": result["nodes_projected"],
        "relationships_projected": result["relationships_projected"],
        "message": f"Analytical graph synchronized via {result['mode']} store."
    }

@router.get("/graph/cases/{case_id}/path")
async def find_path(case_id: str, source: str = Query(...), target: str = Query(...), maxDepth: int = Query(5)):
    return graph_client.find_shortest_path(case_id, source, target, maxDepth)

@router.get("/graph/cases/{case_id}/analytics")
async def get_analytics(case_id: str):
    return graph_client.compute_analytics(case_id)
