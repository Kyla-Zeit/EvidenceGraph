from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import health, extract, resolution, graph, timeline, rag

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="EvidenceGraph Python Analysis Service: Extraction, Graph Projection, Entity Resolution & GraphRAG"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(extract.router, prefix=settings.API_V1_STR, tags=["Extraction"])
app.include_router(resolution.router, prefix=settings.API_V1_STR, tags=["Entity Resolution"])
app.include_router(graph.router, prefix=settings.API_V1_STR, tags=["Graph Analytics"])
app.include_router(timeline.router, prefix=settings.API_V1_STR, tags=["Timeline Engine"])
app.include_router(rag.router, prefix=settings.API_V1_STR, tags=["GraphRAG & AI"])
