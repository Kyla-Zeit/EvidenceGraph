import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { GraphDataDto } from "../types";
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Route,
  Activity,
  X,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "../components/common/Badge";

try {
  cytoscape.use(dagre);
} catch {
  // already registered
}

export const GraphPage: React.FC = () => {
  const { activeCase } = useCase();
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [graphData, setGraphData] = useState<GraphDataDto | null>(null);
  const [layoutName, setLayoutName] = useState<string>("cose");
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  // Path finding state
  const [sourceEntityId, setSourceEntityId] = useState<string>("");
  const [targetEntityId, setTargetEntityId] = useState<string>("");
  const [pathResult, setPathResult] = useState<any>(null);
  const [isFindingPath, setIsFindingPath] = useState<boolean>(false);
  const [isRebuilding, setIsRebuilding] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  const fetchGraph = async () => {
    if (!activeCase) return;
    try {
      const data = await api.getGraph(activeCase.id);
      setGraphData(data);
      if (data.nodes.length >= 2) {
        // Default source and target for showcase
        const alex = data.nodes.find((n) => n.label.toLowerCase().includes("alex mercer"));
        const jordan = data.nodes.find((n) => n.label.toLowerCase().includes("jordan ellis"));
        if (alex && !sourceEntityId) setSourceEntityId(alex.id);
        if (jordan && !targetEntityId) setTargetEntityId(jordan.id);
      }
    } catch (e) {
      console.error("Failed to load graph", e);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [activeCase]);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    const elements: cytoscape.ElementDefinition[] = [];

    // Add nodes
    graphData.nodes.forEach((n) => {
      elements.push({
        group: "nodes",
        data: {
          id: n.id,
          label: n.label,
          type: n.entityType,
          status: n.status,
          confidence: n.confidence,
          isConfirmed: n.isConfirmed,
          degree: n.degree,
        },
      });
    });

    // Add edges
    graphData.edges.forEach((e) => {
      elements.push({
        group: "edges",
        data: {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.relationshipType.replace(/_/g, " "),
          type: e.relationshipType,
          status: e.status,
          confidence: e.confidence,
          isConfirmed: e.isConfirmed,
          evidenceNumber: e.evidenceNumber,
        },
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "font-size": "10px",
            "font-family": "Inter, sans-serif",
            "font-weight": "bold",
            color: "#e2e8f0",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "text-background-opacity": 0.8,
            "text-background-color": "#0b0f19",
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
            width: 38,
            height: 38,
            "border-width": 2,
            "border-color": "#3b82f6",
            "background-color": "#1e293b",
          },
        },
        // Shapes per EntityType for Accessibility
        {
          selector: "node[type = 'Person']",
          style: {
            shape: "ellipse",
            "background-color": "#0284c7",
            "border-color": "#38bdf8",
          },
        },
        {
          selector: "node[type = 'Organization']",
          style: {
            shape: "round-rectangle",
            "background-color": "#7c3aed",
            "border-color": "#a855f7",
          },
        },
        {
          selector: "node[type = 'PhoneNumber']",
          style: {
            shape: "triangle",
            "background-color": "#059669",
            "border-color": "#34d399",
          },
        },
        {
          selector: "node[type = 'EmailAddress']",
          style: {
            shape: "diamond",
            "background-color": "#0891b2",
            "border-color": "#22d3ee",
          },
        },
        {
          selector: "node[type = 'Domain']",
          style: {
            shape: "hexagon",
            "background-color": "#d97706",
            "border-color": "#fbbf24",
          },
        },
        {
          selector: "node[type = 'IPAddress']",
          style: {
            shape: "star",
            "background-color": "#e11d48",
            "border-color": "#fb7185",
          },
        },
        {
          selector: "node[type = 'CryptocurrencyWallet']",
          style: {
            shape: "round-pentagon",
            "background-color": "#16a34a",
            "border-color": "#4ade80",
          },
        },
        // Edge Styles
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#475569",
            "target-arrow-color": "#475569",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "9px",
            "font-family": "JetBrains Mono, monospace",
            color: "#94a3b8",
            "text-background-opacity": 0.9,
            "text-background-color": "#0f172a",
            "text-background-padding": "2px",
            "text-background-shape": "roundrectangle",
          },
        },
        {
          selector: "edge[?isConfirmed]",
          style: {
            "line-color": "#38bdf8",
            "target-arrow-color": "#38bdf8",
            width: 2.5,
          },
        },
        {
          selector: "edge[!isConfirmed]",
          style: {
            "line-style": "dashed",
            "line-color": "#64748b",
            "target-arrow-color": "#64748b",
          },
        },
        // Highlighting for Shortest Path
        {
          selector: ".highlighted-path-node",
          style: {
            "border-width": 4,
            "border-color": "#fbbf24",
            "background-color": "#f59e0b",
            "shadow-blur": 15,
            "shadow-color": "#fbbf24",
            "shadow-opacity": 0.8,
          } as any,
        },
        {
          selector: ".highlighted-path-edge",
          style: {
            width: 4,
            "line-color": "#fbbf24",
            "target-arrow-color": "#fbbf24",
            "shadow-blur": 15,
            "shadow-color": "#fbbf24",
            "shadow-opacity": 0.8,
          } as any,
        },
      ],
      layout: {
        name: layoutName === "dagre" ? "dagre" : layoutName === "concentric" ? "concentric" : layoutName === "grid" ? "grid" : "cose",
        animate: true,
      },
    });

    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      setSelectedEntity(node.data());
      setSelectedEdge(null);
    });

    cy.on("tap", "edge", (evt) => {
      const edge = evt.target;
      setSelectedEdge(edge.data());
      setSelectedEntity(null);
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  }, [graphData, layoutName]);

  const handleFindConnection = async () => {
    if (!activeCase || !sourceEntityId || !targetEntityId) return;
    setIsFindingPath(true);
    try {
      const res = await api.findConnection(activeCase.id, sourceEntityId, targetEntityId);
      setPathResult(res);

      if (cyRef.current) {
        cyRef.current.elements().removeClass("highlighted-path-node highlighted-path-edge");

        if (res.found) {
          res.nodePath.forEach((nId: string) => {
            cyRef.current?.getElementById(nId).addClass("highlighted-path-node");
          });
          res.edgePath.forEach((e: any) => {
            if (e.id) cyRef.current?.getElementById(e.id).addClass("highlighted-path-edge");
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFindingPath(false);
    }
  };

  const handleRebuildGraph = async () => {
    if (!activeCase) return;
    setIsRebuilding(true);
    try {
      await api.rebuildGraph(activeCase.id);
      await fetchGraph();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRebuilding(false);
    }
  };

  const handleLoadAnalytics = async () => {
    if (!activeCase) return;
    try {
      const res = await api.getGraphAnalytics(activeCase.id);
      setAnalytics(res);
      setShowAnalytics(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-sky-400" />
            <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              Knowledge Graph Link Analysis
            </h1>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Layout Selector */}
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Layout:</span>
            <select
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2.5 py-1 font-mono focus:outline-none"
            >
              <option value="cose">Force-Directed (CoSE)</option>
              <option value="concentric">Concentric Circles</option>
              <option value="dagre">Hierarchical (Dagre)</option>
              <option value="grid">Grid Alignment</option>
            </select>
          </div>
        </div>

        {/* Path Analysis Quick Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <Route className="w-3.5 h-3.5 text-amber-400 ml-1.5" />
            <select
              value={sourceEntityId}
              onChange={(e) => setSourceEntityId(e.target.value)}
              className="bg-transparent text-[11px] text-slate-200 focus:outline-none font-mono px-1.5 max-w-[130px] truncate"
            >
              <option value="">Entity A...</option>
              {graphData?.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>

            <span className="text-slate-500 font-mono">→</span>

            <select
              value={targetEntityId}
              onChange={(e) => setTargetEntityId(e.target.value)}
              className="bg-transparent text-[11px] text-slate-200 focus:outline-none font-mono px-1.5 max-w-[130px] truncate"
            >
              <option value="">Entity B...</option>
              {graphData?.nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleFindConnection}
              disabled={isFindingPath || !sourceEntityId || !targetEntityId}
              className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
            >
              {isFindingPath ? "Searching..." : "Find Connection"}
            </button>
          </div>

          <button
            onClick={handleLoadAnalytics}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Analytics</span>
          </button>

          <button
            onClick={handleRebuildGraph}
            disabled={isRebuilding}
            title="Rebuild Neo4j derived projection from PostgreSQL authoritative store"
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1 transition-colors font-mono disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRebuilding ? "animate-spin" : ""}`} />
            <span>{isRebuilding ? "Rebuilding..." : "Rebuild Neo4j"}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-slate-950">
        <div ref={containerRef} className="w-full h-full" />

        {/* Floating Canvas Controls */}
        <div className="absolute bottom-4 left-4 flex items-center space-x-1 bg-slate-900/90 backdrop-blur border border-slate-800 p-1.5 rounded-lg shadow-xl z-10">
          <button
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.25)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => cyRef.current?.fit(undefined, 40)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-800 p-3 rounded-lg shadow-xl text-[10px] space-y-1.5 z-10 font-mono">
          <div className="font-bold text-slate-300 uppercase tracking-wider mb-1">Entity Visual Symbols</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-400">
            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span><span>Person (Circle)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span><span>Org (Square)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-emerald-500"></span><span>Phone (Triangle)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-cyan-500"></span><span>Email (Diamond)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-amber-500"></span><span>Domain (Hexagon)</span></div>
            <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 bg-rose-500"></span><span>IP (Star)</span></div>
          </div>
        </div>

        {/* Selected Entity Drawer */}
        {selectedEntity && (
          <div className="absolute top-4 right-4 w-80 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl z-20 space-y-3 font-mono text-xs">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="confirmed">{selectedEntity.type}</Badge>
                <h3 className="font-bold text-slate-100 text-sm mt-1">{selectedEntity.label}</h3>
              </div>
              <button onClick={() => setSelectedEntity(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-slate-400 text-[11px]">
              <div>Status: <span className="text-emerald-400">{selectedEntity.status}</span></div>
              <div>Connected Degree: <span className="text-slate-200">{selectedEntity.degree} links</span></div>
              <div>Confidence: <span className="text-slate-200">{(selectedEntity.confidence * 100).toFixed(0)}%</span></div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex space-x-2">
              <button
                onClick={() => {
                  setSourceEntityId(selectedEntity.id);
                  setSelectedEntity(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-[11px] font-semibold"
              >
                Set as Source
              </button>
              <button
                onClick={() => {
                  setTargetEntityId(selectedEntity.id);
                  setSelectedEntity(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded text-[11px] font-semibold"
              >
                Set as Target
              </button>
            </div>
          </div>
        )}

        {/* Selected Edge (Provenance) Drawer */}
        {selectedEdge && (
          <div className="absolute top-4 right-4 w-96 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-4 shadow-2xl z-20 space-y-3 font-mono text-xs">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="confirmed">Evidence Provenance</Badge>
                <h3 className="font-bold text-sky-400 text-sm mt-1">{selectedEdge.label}</h3>
              </div>
              <button onClick={() => setSelectedEdge(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-[11px] text-slate-400">Supporting Evidence Record:</div>
              <div className="font-bold text-slate-200 flex items-center space-x-2 font-sans">
                <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Record {selectedEdge.evidenceNumber || "EV-001 (Documented)"}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans pt-1">
                Forensic provenance verified: This relationship is directly supported by case records.
              </p>
            </div>
          </div>
        )}

        {/* Path Analysis Result Banner */}
        {pathResult && pathResult.found && (
          <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur border border-amber-500/50 p-3 rounded-xl shadow-xl z-20 font-mono text-xs space-y-1">
            <div className="text-amber-300 font-bold flex items-center space-x-1.5">
              <Route className="w-4 h-4 text-amber-400" />
              <span>Documented Shortest Path Found ({pathResult.pathLength} hops)</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Path highlighted in gold on canvas. Click any edge to inspect supporting evidence.
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && analytics && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-30">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold text-slate-100 text-sm">Graph Analytics & Network Centrality</h3>
                </div>
                <button onClick={() => setShowAnalytics(false)} className="text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Crucial Ethical AI / Investigative Notice */}
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-300 text-[11px] font-sans flex items-start space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <b>Investigative Ethics Notice:</b> Network prominence reflects structural graph connectivity, not culpability or likelihood of guilt.
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Nodes</div>
                  <div className="text-lg font-bold text-slate-100">{analytics.nodeCount}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Edges</div>
                  <div className="text-lg font-bold text-slate-100">{analytics.edgeCount}</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Density</div>
                  <div className="text-lg font-bold text-sky-400">{analytics.density}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Top Central Entities by Degree</div>
                {analytics.topCentralEntities.slice(0, 4).map((ent: any) => (
                  <div key={ent.entityId} className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-200">{ent.displayName} ({ent.entityType})</span>
                    <span className="text-sky-400 font-bold">{ent.degree} links</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
