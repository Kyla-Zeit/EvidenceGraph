import React from "react";
import { HelpCircle, ShieldAlert, Scale, Cpu, FileCheck } from "lucide-react";

export const LimitationsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto font-sans text-xs">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-sky-400" />
          <span>System Boundaries, Limitations & Investigative Ethics</span>
        </h1>
        <p className="text-xs text-slate-400">
          Core principles governing AI assistance, digital evidence handling, and legal compliance.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm">
            <Cpu className="w-4 h-4" />
            <h2>1. Evidence First. AI Second.</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            EvidenceGraph treats artificial intelligence strictly as an analytical accelerator and retrieval aid.
            AI models are never permitted to alter authoritative evidentiary records in PostgreSQL, fabricate ungrounded claims,
            or assert legal culpability. Every AI statement is accompanied by deterministic chunk citations.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Scale className="w-4 h-4" />
            <h2>2. Graph Centrality vs Legal Culpability</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Network graph metrics (degree centrality, betweenness, clustering) quantify topological prominence within ingested documents.
            A high degree score indicates frequent mentions across records (e.g. an organization or service provider), never guilt or wrongdoing.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <FileCheck className="w-4 h-4" />
            <h2>3. Cryptographic Provenance & Admissibility</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Write-once storage in MinIO coupled with continuous SHA-256/SHA-512 verification ensures physical byte integrity.
            The tamper-evident audit hash-chain logs every upload, extraction, and investigator action in an unbroken chronological ledger.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
            <h2>4. 100% Synthetic Demonstration Data</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            All names, telephone numbers, emails, domains, cryptocurrency wallets, and scenario records in Operation Northstar
            are strictly fictional and created for portfolio demonstration purposes using documentation namespaces (RFC 5737, .test TLDs).
          </p>
        </div>
      </div>
    </div>
  );
};
