import React, { useState, useEffect } from "react";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { AiAnalysisRunDto } from "../types";
import { Bot, Sparkles, Send, Activity, X, FileText, ExternalLink } from "lucide-react";
import { Badge } from "../components/common/Badge";
import { Link } from "react-router-dom";

export const AiWorkspacePage: React.FC = () => {
  const { activeCase } = useCase();
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentRun, setCurrentRun] = useState<AiAnalysisRunDto | null>(null);
  const [showTrace, setShowTrace] = useState(false);

  const suggestedQueries = [
    "How are Alex Mercer and Jordan Ellis connected?",
    "Which entities appear in more than one complaint?",
    "Show all evidence associated with northstar-example.test.",
    "Are there potential contradictions in the witness statements?",
    "Which evidence supports a connection between the shared phone number and the Northstar accounts?",
  ];

  useEffect(() => {
    if (activeCase) {
      api.getAiRuns(activeCase.id).then((runs) => {
        if (runs.length > 0 && !currentRun) {
          setCurrentRun(runs[0]);
        }
      }).catch(console.error);
    }
  }, [activeCase]);

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!activeCase || !q.trim()) return;

    setIsLoading(true);
    try {
      const run = await api.runAiQuery(activeCase.id, q);
      setCurrentRun(run);
      setQuestion("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Bot className="w-5 h-5 text-sky-400" />
            <span>Citation-Grounded AI Investigative Assistant</span>
          </h1>
          <p className="text-xs text-slate-400">
            GraphRAG retrieval engine strictly constrained to active case evidence with deep-linkable citations.
          </p>
        </div>

        {currentRun && (
          <button
            onClick={() => setShowTrace(true)}
            className="bg-slate-900 hover:bg-slate-800 text-sky-400 border border-sky-500/30 text-xs font-mono px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
          >
            <Activity className="w-4 h-4" />
            <span>Open AI Trace ({currentRun.latencyMs}ms)</span>
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Showcase Investigative Queries
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedQueries.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleAsk(sq)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-300 text-xs text-left transition-colors font-sans"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-sky-400 shrink-0 ml-2" />
        <input
          type="text"
          placeholder="Ask a question about Operation Northstar evidence..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
        />
        <button
          onClick={() => handleAsk()}
          disabled={isLoading || !question.trim()}
          className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shrink-0"
        >
          <span>{isLoading ? "Retrieving..." : "Analyze"}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {currentRun && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <div className="text-[11px] text-slate-400 font-mono">Investigative Query:</div>
              <h2 className="text-sm font-bold text-slate-100 font-sans">"{currentRun.question}"</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="confirmed">
                Confidence: {currentRun.confidenceCategory}
              </Badge>
              <span className="text-[11px] font-mono text-slate-400">
                {currentRun.modelProvider} ({currentRun.model})
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap select-text space-y-2">
            {currentRun.answerMarkdown}
          </div>

          {currentRun.citations && currentRun.citations.length > 0 && (
            <div className="pt-4 border-t border-slate-800/80 space-y-2 font-mono text-xs">
              <div className="text-slate-400 text-[11px] font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Supporting Evidence Citations ({currentRun.citations.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentRun.citations.map((cit, idx) => (
                  <Link
                    key={idx}
                    to={`/evidence/${cit.evidenceId}`}
                    className="p-2.5 rounded bg-slate-950 border border-slate-800 hover:border-sky-500/60 transition-colors flex items-start justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sky-400 text-xs">{cit.citationKey}</span>
                        <span className="text-[10px] text-slate-400 font-sans truncate">{cit.evidenceNumber}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans line-clamp-2">"{cit.snippet}"</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showTrace && currentRun && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-2xl font-mono text-xs max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-sm">AI Retrieval Trace & Grounding Inspection</h3>
              </div>
              <button onClick={() => setShowTrace(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Latency</div>
                <div className="text-sm font-bold text-emerald-400">{currentRun.latencyMs} ms</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Token Estimate</div>
                <div className="text-sm font-bold text-slate-200">~{currentRun.inputTokenEstimate + currentRun.outputTokenEstimate}</div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                <div className="text-slate-400 text-[10px]">Prompt Version</div>
                <div className="text-sm font-bold text-sky-400">{currentRun.promptTemplateVersion}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-slate-400 font-bold uppercase text-[10px]">Confidence Assessment Factors</div>
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1 font-sans text-xs">
                {currentRun.confidenceFactors?.positive.map((pos, i) => (
                  <div key={i} className="text-emerald-400 flex items-center space-x-1.5">
                    <span>+</span>
                    <span>{pos}</span>
                  </div>
                ))}
                {currentRun.confidenceFactors?.negative.map((neg, i) => (
                  <div key={i} className="text-amber-400 flex items-center space-x-1.5">
                    <span>-</span>
                    <span>{neg}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowTrace(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-xs"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
