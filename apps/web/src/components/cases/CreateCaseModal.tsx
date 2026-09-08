import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCase } from "../../context/CaseContext";
import { api } from "../../api/client";
import { CasePriority, CreateCaseRequest, InvestigationCaseDto } from "../../types";
import { Badge } from "../common/Badge";
import {
  X,
  PlusCircle,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  FolderOpen,
} from "lucide-react";

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated?: (newCase: InvestigationCaseDto) => void;
}

const CLASSIFICATION_OPTIONS = [
  "Cybercrime / Fraud",
  "Financial Crime",
  "Organized Crime",
  "Missing Persons",
  "Digital Forensics",
  "Intelligence",
  "Other",
];

const PRIORITY_OPTIONS: CasePriority[] = ["Low", "Medium", "High", "Critical"];

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
}) => {
  const navigate = useNavigate();
  const { refreshCases, setActiveCase } = useCase();

  // Form fields
  const [caseNumber, setCaseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<CasePriority>("Medium");
  const [classification, setClassification] = useState("Cybercrime / Fraud");
  const [customClassification, setCustomClassification] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdCase, setCreatedCase] = useState<InvestigationCaseDto | null>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCaseNumber("");
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setClassification("Cybercrime / Fraud");
      setCustomClassification("");
      setJurisdiction("");
      setTagsInput("");
      setErrorMessage(null);
      setCreatedCase(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // Parsed tags for real-time preview and submission
  const parsedTags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedCaseNumber = caseNumber.trim();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const finalClassification =
      classification === "Other" && customClassification.trim()
        ? customClassification.trim()
        : classification.trim();
    const trimmedJurisdiction = jurisdiction.trim();

    // Validate required fields
    if (!trimmedCaseNumber) {
      setErrorMessage("Case Number is required.");
      return;
    }
    if (!trimmedTitle) {
      setErrorMessage("Case Title is required.");
      return;
    }
    if (!trimmedDescription) {
      setErrorMessage("Description is required.");
      return;
    }
    if (!priority) {
      setErrorMessage("Priority is required.");
      return;
    }
    if (!finalClassification) {
      setErrorMessage("Classification is required.");
      return;
    }
    if (!trimmedJurisdiction) {
      setErrorMessage("Jurisdiction is required.");
      return;
    }

    const payload: CreateCaseRequest = {
      caseNumber: trimmedCaseNumber,
      title: trimmedTitle,
      description: trimmedDescription,
      priority,
      classification: finalClassification,
      jurisdiction: trimmedJurisdiction,
      tags: parsedTags,
    };

    setIsSubmitting(true);

    try {
      const response = await api.createCase(payload);
      await refreshCases();
      setCreatedCase(response);
      if (onCaseCreated) {
        onCaseCreated(response);
      }
    } catch (err: any) {
      const msg =
        err?.message ||
        "Unable to create case. Please verify the case information and try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCase = () => {
    if (createdCase) {
      setActiveCase(createdCase);
    }
    onClose();
    navigate("/");
  };

  const handleStayOnAllCases = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="modal-headline"
                className="text-sm font-bold text-slate-100 tracking-tight"
              >
                Create New Investigation Case Workspace
              </h2>
              <p className="text-[11px] text-slate-400">
                Initialize an isolated evidence boundary with cryptographic audit trail.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success View */}
        {createdCase ? (
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 flex items-start space-x-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-300">
                  Case Created Successfully
                </h3>
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-slate-100">
                    {createdCase.title}
                  </span>{" "}
                  was created successfully and initialized with an authoritative PostgreSQL
                  master record and SHA-256 audit entry.
                </p>
              </div>
            </div>

            {/* Created Case Summary Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold">
                    {createdCase.caseNumber}
                  </span>
                  <Badge variant="confirmed">{createdCase.status}</Badge>
                  <Badge variant="warning">{createdCase.priority}</Badge>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {createdCase.totalEvidenceCount ?? 0} Evidence Items
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-200">
                  {createdCase.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {createdCase.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-slate-400">
                <div>
                  Classification:{" "}
                  <span className="text-slate-200">{createdCase.classification}</span>
                </div>
                <div>
                  Jurisdiction:{" "}
                  <span className="text-slate-200">{createdCase.jurisdiction}</span>
                </div>
              </div>

              {createdCase.tags && createdCase.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {createdCase.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleStayOnAllCases}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Stay on All Cases
              </button>

              <button
                type="button"
                onClick={handleOpenCase}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center space-x-1.5 shadow-lg shadow-sky-600/20 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Open Case</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Case Creation Form */
          <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {/* Case Number & Case Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Case Number <span className="text-sky-400">*</span>
                </label>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="EG-2026-0051"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-50"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Case Title <span className="text-sky-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Operation Glasshouse"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-sans disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Description <span className="text-sky-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of investigative scope, suspected entities, target objectives..."
                disabled={isSubmitting}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-sans resize-none disabled:opacity-50"
                required
              />
            </div>

            {/* Priority & Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Priority <span className="text-sky-400">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CasePriority)}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-50"
                  required
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Classification <span className="text-sky-400">*</span>
                </label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-50"
                  required
                >
                  {CLASSIFICATION_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* If classification is 'Other', show custom classification input */}
            {classification === "Other" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Specify Custom Classification <span className="text-sky-400">*</span>
                </label>
                <input
                  type="text"
                  value={customClassification}
                  onChange={(e) => setCustomClassification(e.target.value)}
                  placeholder="e.g. Counter-Espionage / Maritime Security"
                  disabled={isSubmitting}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-sans disabled:opacity-50"
                  required
                />
              </div>
            )}

            {/* Jurisdiction */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Jurisdiction / Agency <span className="text-sky-400">*</span>
              </label>
              <input
                type="text"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="Ontario Cybercrime Unit"
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-sans disabled:opacity-50"
                required
              />
            </div>

            {/* Tags (comma-separated) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Tags <span className="text-slate-500 text-[11px]">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="test, case-creation, cybercrime"
                disabled={isSubmitting}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500 font-mono disabled:opacity-50"
              />

              {/* Tag preview chips */}
              {parsedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parsedTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white flex items-center space-x-1.5 shadow-lg shadow-sky-600/20 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Case...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Case</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
