import React, { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { EvidenceItemDto, EvidenceType } from "../types";
import { Link } from "react-router-dom";
import {
  FileArchive,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  Mail,
  Image,
  Database,
  PhoneCall,
  MessageSquare,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { Badge } from "../components/common/Badge";

export const EvidencePage: React.FC = () => {
  const { activeCase } = useCase();
  const [evidence, setEvidence] = useState<EvidenceItemDto[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeCase) {
      setIsLoading(true);
      api
        .getEvidenceList(activeCase.id)
        .then(setEvidence)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [activeCase]);

  const filtered = evidence.filter((e) => {
    const matchesSearch =
      e.evidenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.sha256.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "ALL" || e.evidenceType === typeFilter;
    return matchesSearch && matchesType;
  });

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case "Email":
        return <Mail className="w-4 h-4 text-sky-400" />;
      case "Image":
        return <Image className="w-4 h-4 text-emerald-400" />;
      case "CallRecord":
        return <PhoneCall className="w-4 h-4 text-amber-400" />;
      case "MessageExport":
        return <MessageSquare className="w-4 h-4 text-purple-400" />;
      case "TransactionRecord":
        return <DollarSign className="w-4 h-4 text-green-400" />;
      case "Dataset":
        return <Database className="w-4 h-4 text-cyan-400" />;
      case "Report":
      case "Document":
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <FileArchive className="w-5 h-5 text-sky-400" />
            <span>Digital Evidence Archive</span>
          </h1>
          <p className="text-xs text-slate-400">
            Authoritative, write-once evidence store with cryptographic SHA-256 integrity provenance.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span className="text-slate-400">Total Items:</span>
            <span className="text-slate-100 font-bold">{evidence.length}</span>
          </div>
          <div className="bg-emerald-950/60 border border-emerald-800 px-3 py-1.5 rounded-lg text-emerald-300 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Write-Once Verified</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by EV-#, title, hash, content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-400 uppercase font-semibold text-[10px]">Filter Type:</span>
          {["ALL", "Email", "MessageExport", "CallRecord", "TransactionRecord", "Document", "Image", "Dataset"].map(
            (t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-colors ${
                  typeFilter === t
                    ? "bg-sky-600 text-white font-semibold"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>
      </div>

      {/* Evidence Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-4">Identifier</th>
                <th className="py-3 px-4">Title & Evidence Record</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading digital evidence repository...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No evidence items found matching filters.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800/80">
                        {e.evidenceNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-md font-sans">
                      <div className="font-semibold text-slate-200 truncate group-hover:text-sky-300">
                        {e.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{e.originalFilename}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {getEvidenceIcon(e.evidenceType)}
                        <span className="text-slate-300 text-[11px] font-sans">{e.evidenceType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px] font-mono max-w-xs truncate" title={e.sha256}>
                      {e.sha256.slice(0, 16)}...{e.sha256.slice(-8)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px] whitespace-nowrap">
                      {(e.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {e.isQuarantined ? (
                        <Badge variant="danger">Quarantined</Badge>
                      ) : (
                        <Badge variant="confirmed">Hash Verified</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                      <Link
                        to={`/evidence/${e.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-sky-600 text-slate-200 hover:text-white transition-colors text-xs font-medium"
                      >
                        <span>Examine</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
