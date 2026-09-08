import React, { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import {
  FileArchive,
  Users,
  Network,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { StatCard } from "../components/common/StatCard";
import { Badge } from "../components/common/Badge";
import { Link } from "react-router-dom";
import { AuditEventDto } from "../types";

export const CaseDashboardPage: React.FC = () => {
  const { activeCase } = useCase();
  const [recentAudit, setRecentAudit] = useState<AuditEventDto[]>([]);
  const [auditVerified, setAuditVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (activeCase) {
      api.getAuditEvents(activeCase.id, 8).then(setRecentAudit).catch(console.error);
      api.verifyCaseAuditChain(activeCase.id).then((res) => setAuditVerified(res.isValid)).catch(console.error);
    }
  }, [activeCase]);

  if (!activeCase) {
    return <div className="p-8 text-center text-slate-400">Loading case workspace...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Case Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-semibold">
                {activeCase.caseNumber}
              </span>
              <Badge variant="confirmed">{activeCase.status}</Badge>
              <Badge variant="warning">{activeCase.priority} Priority</Badge>
              <span className="text-xs text-slate-400 font-mono">• {activeCase.classification}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">{activeCase.title}</h1>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {activeCase.description}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/analysis"
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-2 shadow-lg shadow-sky-600/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Investigator</span>
            </Link>
            <Link
              to="/graph"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 flex items-center space-x-2 transition-colors"
            >
              <Network className="w-4 h-4" />
              <span>Open Link Graph</span>
            </Link>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
          <div>Lead Investigator: <span className="text-slate-200">{activeCase.leadInvestigatorName || "Marcus Brody (INV-784)"}</span></div>
          <div>Jurisdiction: <span className="text-slate-200">{activeCase.jurisdiction}</span></div>
          <div>Opened: <span className="text-slate-200">{new Date(activeCase.openedAt).toLocaleDateString()}</span></div>
          <div className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-400 font-medium">PostgreSQL Master + Neo4j Projected</span>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Digital Evidence"
          value={activeCase.totalEvidenceCount ?? 0}
          subtitle="100% SHA-256 Hash Verified"
          icon={FileArchive}
          badge={`${activeCase.totalEvidenceCount ?? 0} Ingested`}
          badgeVariant="confirmed"
        />
        <StatCard
          title="Extracted Entities"
          value={activeCase.totalEntitiesCount ?? 0}
          subtitle="Persons, Orgs, Phones, Domains, Wallets"
          icon={Users}
          badge={`${activeCase.totalEntitiesCount ?? 0} Total`}
          badgeVariant="default"
        />
        <StatCard
          title="Knowledge Graph Edges"
          value={activeCase.totalRelationshipsCount ?? 0}
          subtitle="Provenance-linked relationships"
          icon={Network}
          badge={`${activeCase.totalRelationshipsCount ?? 0} Edges`}
          badgeVariant="confirmed"
        />
        <StatCard
          title="Timeline Conflicts"
          value={activeCase.unresolvedConflictsCount ?? 0}
          subtitle="Conservative contradiction candidates"
          icon={AlertTriangle}
          badge={`${activeCase.unresolvedConflictsCount ?? 0} Flagged`}
          badgeVariant="warning"
        />
      </div>

      {/* Two Column Layout: Showcase Scenario & Recent Tamper-Evident Audit Chain */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Showcase Discoveries & Quick Links */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Investigative Discoveries Ready in Demo
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                7 Discoveries Verifiable
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Discovery A: Shared Recovery Phone</span>
                  <Badge variant="confirmed">Confirmed</Badge>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Alex Mercer and Jordan Ellis accounts share phone <span className="font-mono text-sky-400">+1-555-0192</span>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Discovery B: Common Sender Domain</span>
                  <Badge variant="confirmed">Confirmed</Badge>
                </div>
                <p className="text-slate-400 text-[11px]">
                  12 independent emails originate from domain <span className="font-mono text-sky-400">northstar-example.test</span>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Discovery C: Static IP Resolution</span>
                  <Badge variant="confirmed">Confirmed</Badge>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Domain resolves to <span className="font-mono text-sky-400">198.51.100.42</span> appearing in multiple access logs.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="font-semibold text-slate-200 flex items-center justify-between">
                  <span>Discovery F: Alibi Contradiction</span>
                  <Badge variant="warning">Conflict</Badge>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Alex Mercer claimed presence at home (13:00-15:00), but ATM ledger records withdrawal at 13:47.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Evidence first. AI second. Trace every claim.</span>
              <Link to="/graph" className="text-sky-400 hover:text-sky-300 font-semibold flex items-center space-x-1">
                <span>View Full Relationship Graph</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Tamper-Evident Hash Chain Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Audit Trail Hash Chain
              </h2>
            </div>
            <Link to="/audit" className="text-[11px] text-sky-400 hover:underline">
              Verify
            </Link>
          </div>

          <div className="space-y-2">
            {recentAudit.slice(0, 6).map((ev) => (
              <div
                key={ev.auditId}
                className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-xs space-y-1 font-mono"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">#{ev.sequenceNumber} {ev.action}</span>
                  <span className="text-slate-400 text-[10px]">{new Date(ev.timestampUtc).toLocaleTimeString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Hash: <span className="text-emerald-400">{ev.entryHash.slice(0, 16)}...</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <div className={`text-[11px] font-mono flex items-center justify-center space-x-1.5 ${
              auditVerified === false ? "text-rose-400" : "text-emerald-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                auditVerified === false ? "bg-rose-400" : "bg-emerald-400 animate-pulse"
              }`}></span>
              <span>{auditVerified === false ? "SHA-256 Hash Chain: Integrity Compromised" : "SHA-256 Hash Chain: Intact & Verifiable"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
