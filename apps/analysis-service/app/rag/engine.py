from typing import List, Dict, Any
from app.rag.provider import DeterministicMockAiProvider, IInvestigationAiProvider
from app.core.config import settings

class GraphRagEngine:
    def __init__(self):
        self.mock_provider = DeterministicMockAiProvider()

    def get_provider(self, provider_name: str = None) -> IInvestigationAiProvider:
        prov = provider_name or settings.AI_PROVIDER
        if prov.lower() == "mock":
            return self.mock_provider
        return self.mock_provider

    async def query(
        self,
        case_id: str,
        user_id: str,
        question: str,
        chunks: List[Dict[str, Any]],
        graph_paths: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        provider_name: str = None
    ) -> Dict[str, Any]:
        provider = self.get_provider(provider_name)
        return await provider.generate_grounded_answer(question, chunks, graph_paths, events)

rag_engine = GraphRagEngine()
