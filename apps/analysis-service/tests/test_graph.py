import pytest
from app.graph.neo4j_client import graph_client

def test_graph_sync_and_shortest_path():
    case_id = "test-case-100"
    nodes = [
        {"id": "n1", "display_name": "Alex Mercer", "entity_type": "Person"},
        {"id": "n2", "display_name": "+1-555-0192", "entity_type": "PhoneNumber"},
        {"id": "n3", "display_name": "+1-555-0184", "entity_type": "PhoneNumber"},
        {"id": "n4", "display_name": "Jordan Ellis", "entity_type": "Person"}
    ]
    edges = [
        {"id": "e1", "source_id": "n1", "target_id": "n2", "relationship_type": "USED"},
        {"id": "e2", "source_id": "n2", "target_id": "n3", "relationship_type": "CALLED"},
        {"id": "e3", "source_id": "n4", "target_id": "n3", "relationship_type": "USED"}
    ]

    sync_res = graph_client.sync_case_graph(case_id, nodes, edges)
    assert sync_res["success"] is True

    # Find shortest path from Alex Mercer (n1) to Jordan Ellis (n4)
    path_res = graph_client.find_shortest_path(case_id, "n1", "n4")
    assert path_res["found"] is True
    assert path_res["path_length"] == 3
    assert path_res["node_path"] == ["n1", "n2", "n3", "n4"]

    # Check analytics
    analytics = graph_client.compute_analytics(case_id)
    assert analytics["node_count"] == 4
    assert analytics["edge_count"] == 3
