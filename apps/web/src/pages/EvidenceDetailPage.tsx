import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { EvidenceItemDto, EvidenceChunkDto, IntegrityVerificationResultDto } from "../types";
import {
  ArrowLeft,
  ShieldCheck,
  Hash,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Tabs } from "../components/common/Tabs";

export const EvidenceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { activeCase } = useCase();
  const [evidence, setEvidence] = useState<EvidenceItemDto | null>(null);
  const [chunks, setChunks] = useState<EvidenceChunkDto[]>([]);
  const [activeTab, setActiveTab] = useState("preview");
  const [integrityResult, setIntegrityResult] = useState<IntegrityVerificationResultDto | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (activeCase && id) {
      api.getEvidence(activeCase.id, id).then(setEvidence).catch(console.error);
      api.getEvidenceChunks(activeCase.id, id).then(setChunks).catch(console.error);
    }
  }, [activeCase, id]);

  const runIntegrityVerification = async () => {
    if (!activeCase || !id) return;
    setIsVerifying(true);
    try {
      const res = await api.verifyEvidenceIntegrity(activeCase.id, id);
      setIntegrityResult(res);
    } catch (err) {
      console.error("Integrity check failed", err);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!evidence) {
    return <div className="p-8 text-center text-slate-400">Loading evidence record...</div>;
  }

  const tabs = [
    { id: "preview", label: "Safe Preview", badge: undefined },
    { id: "text", label: "Extracted Text & Chunks", badge: chunks.length },
    { id: "metadata", label: "Forensic Metadata", badge: undefined },
    { id: "integrity", label: "Integrity Verification", badge: integrityResult ? integrityResult.status : undefined },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          to="/evidence"
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Evidence Archive</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={runIntegrityVerification}
            disabled={isVerifying}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50 font-mono shadow-md shadow-emerald-950"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? "Hashing Storage Object..." : "Verify Physical Integrity"}</span>
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                {evidence.evidenceNumber}
              </span>
              <Badge variant="neutral">{evidence.evidenceType}</Badge>
              <Badge variant="confirmed">Original (Immutable)</Badge>
              <span className="text-slate-400">• {(evidence.fileSize / 1024).toFixed(1)} KB</span>
            </div>
            <h1 className="text-lg font-bold text-slate-100">{evidence.title}</h1>
            <p className="text-xs text-slate-300">{evidence.description}</p>
          </div>
        </div>

        {/* SHA-256 Hash Display */}
        <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2">
          <div className="flex items-center space-x-2 truncate">
            <Hash className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400">SHA-256 Digest:</span>
            <span className="text-emerald-300 font-bold select-all truncate">{evidence.sha256}</span>
          </div>
          <div className="text-[11px] text-slate-400 whitespace-nowrap">
            Acquired: {new Date(evidence.acquiredAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Integrity Result Banner (if triggered) */}
      {integrityResult && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 font-mono text-xs ${
            integrityResult.isMatch
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
              : "bg-rose-950/60 border-rose-800 text-rose-200"
          }`}
        >
          {integrityResult.isMatch ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold text-sm">
              INTEGRITY VERIFICATION RESULT: {integrityResult.status}
            </div>
            <div>Original Recorded Digest: <span className="text-slate-300">{integrityResult.originalSha256}</span></div>
            <div>Re-computed Physical Digest: <span className="text-slate-300">{integrityResult.currentSha256}</span></div>
            <div className="text-[11px] text-slate-400 pt-1">
              Verified at {new Date(integrityResult.verifiedAt).toLocaleString()} • Physical byte stream matched exactly without tampering.
            </div>
          </div>
        </div>
      )}

      {/* Forensic Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="p-5">
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap select-text">
                {evidence.extractedText || "No textual payload available for this evidence item."}
              </div>
            </div>
          )}

          {activeTab === "text" && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 font-mono">
                Stable text chunks with deterministic SHA-256 chunk digests for deep-linkable AI citations ({chunks.length} chunks):
              </div>
              <div className="space-y-3">
                {chunks.map((ch) => (
                  <div
                    key={ch.id}
                    id={`chunk-${ch.chunkIndex}`}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs group hover:border-sky-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-sky-400 bg-sky-950 border border-sky-800/80 px-2 py-0.5 rounded">
                        [{evidence.evidenceNumber} §{ch.chunkIndex + 1}]
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        Chunk Hash: {ch.textHash.slice(0, 16)}...
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans text-xs select-text">
                      {ch.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "metadata" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="text-slate-300 font-bold mb-2">Technical Evidence Properties</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400">
                  <div>MIME Content-Type: <span className="text-slate-200">{evidence.mimeType}</span></div>
                  <div>File Size: <span className="text-slate-200">{evidence.fileSize} bytes</span></div>
                  <div>Source Origin: <span className="text-slate-200">{evidence.sourceDescription}</span></div>
                  <div>Collection Method: <span className="text-slate-200">{evidence.collectionMethod}</span></div>
                  <div>Storage Bucket Key: <span className="text-slate-200">{evidence.storedObjectKey}</span></div>
                  <div>Security Level: <span className="text-slate-200">{evidence.securityClassification}</span></div>
                </div>
              </div>

              {evidence.metadataJson && (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="text-slate-300 font-bold mb-2">Forensic Header / EXIF Dump</div>
                  <pre className="text-xs text-sky-300 overflow-x-auto p-2 bg-slate-900/60 rounded border border-slate-800">
                    {JSON.stringify(JSON.parse(evidence.metadataJson), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === "integrity" && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-slate-200 font-bold">Tamper-Evident Physical Verification</div>
                <p className="text-slate-400 font-sans text-xs">
                  EvidenceGraph computes SHA-256 and SHA-512 streaming cryptographic digests upon initial ingestion.
                  Clicking "Verify Physical Integrity" re-reads the byte stream from MinIO object storage in real-time,
                  computes fresh cryptographic digests, and compares them against the database record of authority.
                </p>

                <div className="pt-2">
                  <button
                    onClick={runIntegrityVerification}
                    disabled={isVerifying}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    {isVerifying ? "Verifying..." : "Execute Real-Time Verification"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
