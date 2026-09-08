import React, { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { AuditEventDto, AuditVerificationResultDto } from "../types";
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw } from "lucide-react";

export const AuditPage: React.FC = () => {
  const { activeCase } = useCase();
  const [events, setEvents] = useState<AuditEventDto[]>([]);
  const [verification, setVerification] = useState<AuditVerificationResultDto | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchAudit = () => {
    api.getAuditEvents(activeCase?.id, 100).then(setEvents).catch(console.error);
    api.verifyGlobalAuditChain().then(setVerification).catch(console.error);
  };

  useEffect(() => {
    fetchAudit();
  }, [activeCase]);

  const runVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyGlobalAuditChain();
      setVerification(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>Tamper-Evident Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400">
            Append-only cryptographic SHA-256 hash-chain verifying application actions and evidentiary provenance.
          </p>
        </div>

        <button
          onClick={runVerification}
          disabled={isVerifying}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition-colors font-mono disabled:opacity-50 shadow-md shadow-emerald-950 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isVerifying ? "animate-spin" : ""}`} />
          <span>{isVerifying ? "Verifying Chain..." : "Verify Hash Chain Integrity"}</span>
        </button>
      </div>

      {verification && (
        <div
          className={`p-5 rounded-xl border flex items-start space-x-3.5 font-mono text-xs ${
            verification.isValid
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-200"
              : "bg-rose-950/50 border-rose-800 text-rose-200"
          }`}
        >
          {verification.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1.5 w-full">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">
                GLOBAL AUDIT HASH CHAIN: {verification.status}
              </span>
              <span className="text-[11px] text-slate-400">
                {verification.totalEventsChecked} Events Verified
              </span>
            </div>
            <div className="text-slate-300 font-sans text-xs">{verification.details}</div>
            <div className="pt-2 border-t border-emerald-900/60 flex flex-wrap justify-between text-[10px] text-slate-400 gap-2">
              <div>Genesis Hash: <span className="text-emerald-400">{verification.firstHash.slice(0, 16)}...</span></div>
              <div>Latest Tip Hash: <span className="text-emerald-400">{verification.latestHash.slice(0, 16)}...</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Seq #</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Entry Hash</th>
                <th className="py-3 px-4">Previous Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {events.map((ev) => (
                <tr key={ev.auditId} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-sky-400 font-bold">#{ev.sequenceNumber}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{ev.action}</td>
                  <td className="py-3 px-4 text-slate-400">{ev.resourceType} ({ev.resourceId.slice(0, 8)}...)</td>
                  <td className="py-3 px-4 text-slate-400">{new Date(ev.timestampUtc).toLocaleTimeString()}</td>
                  <td className="py-3 px-4 text-emerald-400" title={ev.entryHash}>{ev.entryHash.slice(0, 12)}...</td>
                  <td className="py-3 px-4 text-slate-500" title={ev.previousHash}>{ev.previousHash.slice(0, 12)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
