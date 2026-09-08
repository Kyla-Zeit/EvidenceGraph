import React, { useState } from "react";
import { useCase } from "../context/CaseContext";
import { FolderOpen, ArrowRight, Plus } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { useNavigate } from "react-router-dom";
import { CreateCaseModal } from "../components/cases/CreateCaseModal";

export const CasesPage: React.FC = () => {
  const { cases, activeCase, setActiveCase } = useCase();
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const selectCaseAndGo = (c: any) => {
    setActiveCase(c);
    navigate("/");
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-sky-400" />
            <span>Investigation Case Workspaces</span>
          </h1>

          <p className="text-xs text-slate-400">
            Strictly isolated multi-case boundaries with independent evidence repositories and access controls.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Case</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((c) => {
          const isSelected = activeCase?.id === c.id;

          return (
            <div
              key={c.id}
              className={`p-5 rounded-xl border transition-all space-y-3 bg-slate-900 ${
                isSelected
                  ? "border-sky-500/60 ring-1 ring-sky-500/30"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold">
                      {c.caseNumber}
                    </span>

                    <Badge variant="confirmed">
                      {c.status}
                    </Badge>

                    <Badge variant="warning">
                      {c.priority}
                    </Badge>
                  </div>

                  <h2 className="text-sm font-bold text-slate-100">
                    {c.title}
                  </h2>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 border border-sky-800 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {c.description}
              </p>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="text-[11px] font-mono text-slate-400">
                  <span>
                    {c.totalEvidenceCount ?? 0} Evidence Items
                  </span>
                </div>

                <button
                  onClick={() => selectCaseAndGo(c)}
                  className="bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors font-sans"
                >
                  <span>
                    {isSelected ? "Open Workspace" : "Switch Case"}
                  </span>

                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CreateCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};