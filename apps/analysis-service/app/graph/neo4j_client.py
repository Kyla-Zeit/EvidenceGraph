import networkx as nx
from typing import List, Dict, Any, Optional
from neo4j import GraphDatabase
from app.core.config import settings

class Neo4jGraphClient:
    def __init__(self):
        self.driver = None
        self._memory_graphs: Dict[str, nx.Graph] = {}
        try:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
        except Exception:
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def sync_case_graph(self, case_id: str, nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
        # Always maintain NetworkX graph for fast in-memory algorithms & fallback
        g = nx.Graph()
        for n in nodes:
            g.add_node(str(n["id"]), **n)
        for e in edges:
            g.add_edge(str(e["source_id"]), str(e["target_id"]), **e)
        self._memory_graphs[str(case_id)] = g

        if not self.driver:
            return {"success": True, "nodes_projected": len(nodes), "relationships_projected": len(edges), "mode": "in_memory"}

        try:
            with self.driver.session() as session:
                # Clear existing case projection
                session.run("MATCH (n {caseId: $caseId}) DETACH DELETE n", caseId=str(case_id))

                # Batch create nodes
                for n in nodes:
                    session.run(
                        """
                        MERGE (e:Entity {id: $id, caseId: $caseId})
                        SET e.label = $label,
                            e.entityType = $entityType,
                            e.canonicalValue = $canonicalValue,
                            e.displayName = $displayName,
                            e.status = $status,
                            e.confidence = $confidence,
                            e.isConfirmed = $isConfirmed
                        """,
                        id=str(n["id"]),
                        caseId=str(case_id),
                        label=n.get("label", ""),
                        entityType=n.get("entity_type", "Entity"),
                        canonicalValue=n.get("canonical_value", ""),
                        displayName=n.get("display_name", ""),
                        status=n.get("status", "Extracted"),
                        confidence=n.get("confidence", 1.0),
                        isConfirmed=n.get("is_confirmed", False)
                    )

                # Batch create edges
                for e in edges:
                    rel_type = e.get("relationship_type", "ASSOCIATED_WITH").upper().replace(" ", "_")
                    session.run(
                        f"""
                        MATCH (s:Entity {{id: $sourceId, caseId: $caseId}})
                        MATCH (t:Entity {{id: $targetId, caseId: $caseId}})
                        MERGE (s)-[r:{rel_type} {{id: $id, caseId: $caseId}}]->(t)
                        SET r.status = $status,
                            r.confidence = $confidence,
                            r.isConfirmed = $isConfirmed,
                            r.evidenceNumber = $evidenceNumber
                        """,
                        sourceId=str(e["source_id"]),
                        targetId=str(e["target_id"]),
                        caseId=str(case_id),
                        id=str(e["id"]),
                        status=e.get("status", "Extracted"),
                        confidence=e.get("confidence", 1.0),
                        isConfirmed=e.get("is_confirmed", False),
                        evidenceNumber=e.get("evidence_number", "")
                    )

            return {"success": True, "nodes_projected": len(nodes), "relationships_projected": len(edges), "mode": "neo4j"}
        except Exception:
            return {"success": True, "nodes_projected": len(nodes), "relationships_projected": len(edges), "mode": "in_memory_fallback"}

    def find_shortest_path(self, case_id: str, source_id: str, target_id: str, max_depth: int = 5) -> Dict[str, Any]:
        g = self._memory_graphs.get(str(case_id))
        s_id = str(source_id)
        t_id = str(target_id)

        if not g or s_id not in g or t_id not in g:
            return {"found": False, "node_path": [], "edge_path": [], "path_length": 0}

        try:
            path = nx.shortest_path(g, source=s_id, target=t_id)
            if len(path) - 1 > max_depth:
                return {"found": False, "node_path": [], "edge_path": [], "path_length": 0}

            edge_path = []
            for i in range(len(path) - 1):
                edge_data = g.get_edge_data(path[i], path[i+1]) or {}
                edge_path.append(edge_data)

            return {
                "found": True,
                "node_path": path,
                "edge_path": edge_path,
                "path_length": len(path) - 1
            }
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return {"found": False, "node_path": [], "edge_path": [], "path_length": 0}

    def compute_analytics(self, case_id: str) -> Dict[str, Any]:
        g = self._memory_graphs.get(str(case_id))
        if not g or g.number_of_nodes() == 0:
            return {"node_count": 0, "edge_count": 0, "density": 0.0, "bridge_entities": [], "top_central_entities": []}

        degrees = dict(g.degree())
        top_nodes = sorted(degrees.items(), key=lambda x: x[1], reverse=True)[:10]

        top_central = []
        for node_id, deg in top_nodes:
            attrs = g.nodes[node_id]
            top_central.append({
                "entity_id": node_id,
                "display_name": attrs.get("display_name", node_id),
                "entity_type": attrs.get("entity_type", "Entity"),
                "degree": deg
            })

        bridges = []
        if g.number_of_nodes() > 2:
            try:
                betweenness = nx.betweenness_centrality(g)
                top_between = sorted(betweenness.items(), key=lambda x: x[1], reverse=True)[:5]
                for node_id, score in top_between:
                    attrs = g.nodes[node_id]
                    bridges.append({
                        "entity_id": node_id,
                        "display_name": attrs.get("display_name", node_id),
                        "entity_type": attrs.get("entity_type", "Entity"),
                        "betweenness": round(score, 4)
                    })
            except Exception:
                pass

        return {
            "node_count": g.number_of_nodes(),
            "edge_count": g.number_of_edges(),
            "density": round(nx.density(g), 4),
            "bridge_entities": bridges,
            "top_central_entities": top_central
        }

graph_client = Neo4jGraphClient()
