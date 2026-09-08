import React, { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { EntityDto, RelationshipDto, ContradictionCandidateDto } from "../types";
import { CheckSquare, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Tabs } from "../components/common/Tabs";

export const ReviewQueuePage: React.FC = () => {
  const { activeCase } = useCase();
  const [entities, setEntities] = useState<EntityDto[]>([]);
  const [relationships, setRelationships] = useState<RelationshipDto[]>([]);
  const [contradictions, setContradictions] = useState<ContradictionCandidateDto[]>([]);
  const [activeTab, setActiveTab] = useState("entities");

  const loadData = () => {
    if (activeCase) {
      api.getEntities(activeCase.id).then(setEntities).catch(console.error);
      api.getRelationships(activeCase.id).then(setRelationships).catch(console.error);
      api.getContradictions(activeCase.id).then(setContradictions).catch(console.error);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCase]);

  const pendingEntities = entities.filter((e) => e.status !== "Confirmed" && e.status !== "Rejected");
  const pendingRels = relationships.filter((r) => !r.analystConfirmed);

  const handleConfirmEntity = async (id: string) => {
    if (!activeCase) return;
    await api.confirmEntity(activeCase.id, id);
    loadData();
  };

  const handleRejectEntity = async (id: string) => {
    if (!activeCase) return;
    await api.rejectEntity(activeCase.id, id);
    loadData();
  };

  const handleConfirmRel = async (id: string) => {
    if (!activeCase) return;
    await api.confirmRelationship(activeCase.id, id);
    loadData();
  };

  const tabs = [
    { id: "entities", label: "Pending Entities", badge: pendingEntities.length },
    { id: "relationships", label: "Extracted Relationships", badge: pendingRels.length },
    { id: "conflicts", label: "Timeline Conflicts", badge: contradictions.length },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <CheckSquare className="w-5 h-5 text-sky-400" />
          <span>Human-in-the-Loop Analysis Review</span>
        </h1>
        <p className="text-xs text-slate-400">
          Triage machine-extracted intelligence, duplicate entity suggestions, and relationship links.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="p-5">
          {activeTab === "entities" && (
            <div className="space-y-3">
              {pendingEntities.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">All entities have been reviewed.</div>
              ) : (
                pendingEntities.map((ent) => (
                  <div
                    key={ent.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 text-sm font-sans">{ent.displayName}</span>
                        <Badge variant="extracted">{ent.entityType}</Badge>
                        <Badge variant="suggested">{ent.status}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans">{ent.description || "Extracted from evidentiary documents."}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 font-sans">
                      <button
                        onClick={() => handleConfirmEntity(ent.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm</span>
                      </button>
                      <button
                        onClick={() => handleRejectEntity(ent.id)}
                        className="bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "relationships" && (
            <div className="space-y-3">
              {pendingRels.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">All relationships confirmed.</div>
              ) : (
                pendingRels.map((rel) => (
                  <div
                    key={rel.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 font-sans font-bold text-slate-200">
                        <span>{rel.sourceEntityName}</span>
                        <span className="text-sky-400 text-xs font-mono">[{rel.relationshipType}]</span>
                        <span>{rel.targetEntityName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Source Evidence: {rel.evidenceNumber || "Case Documents"}
                      </div>
                    </div>

                    <button
                      onClick={() => handleConfirmRel(rel.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1 self-start sm:self-auto font-sans"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Link</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "conflicts" && (
            <div className="space-y-3">
              {contradictions.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-amber-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{c.title}</span>
                    <Badge variant="warning">{c.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-400">{c.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
