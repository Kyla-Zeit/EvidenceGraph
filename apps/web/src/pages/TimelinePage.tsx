import React, { useEffect, useState } from "react";
import { useCase } from "../context/CaseContext";
import { api } from "../api/client";
import { InvestigativeEventDto, ContradictionCandidateDto } from "../types";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "../components/common/Badge";

export const TimelinePage: React.FC = () => {
  const { activeCase } = useCase();
  const [events, setEvents] = useState<InvestigativeEventDto[]>([]);
  const [contradictions, setContradictions] = useState<ContradictionCandidateDto[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<ContradictionCandidateDto | null>(null);
  const [confirmedOnly, setConfirmedOnly] = useState(false);

  useEffect(() => {
    if (activeCase) {
      api.getEvents(activeCase.id).then(setEvents).catch(console.error);
      api.getContradictions(activeCase.id).then(setContradictions).catch(console.error);
    }
  }, [activeCase]);

  const filteredEvents = events.filter((e) => {
    if (confirmedOnly && !e.confirmed) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>Investigative Timeline & Conflict Analysis</span>
          </h1>
          <p className="text-xs text-slate-400">
            Chronological event reconstruction with strict time precision levels and contradiction candidate detection.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          <label className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedOnly}
              onChange={(e) => setConfirmedOnly(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-0"
            />
            <span className="text-slate-300">Confirmed Events Only</span>
          </label>
        </div>
      </div>

      {contradictions.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-300 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Potential Timeline Conflict Flagged ({contradictions.length} Candidate)</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700 text-amber-200">
              Requires Analyst Review
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {contradictions.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-950/80 border border-amber-900/50 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-200 font-sans text-xs">{c.title}</div>
                  <p className="text-[11px] text-slate-400 font-sans">{c.reason}</p>
                  <div className="text-[10px] text-amber-400/90 font-mono">
                    Time delta: {c.timeDeltaMinutes} mins • Distance: {c.distanceEstimate}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedConflict(c)}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap self-start md:self-auto font-sans transition-colors"
                >
                  Examine Conflict
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
        <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-8">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="relative group">
              <div
                className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-slate-950 ${
                  ev.eventType === "Statement"
                    ? "border-amber-400"
                    : ev.eventType === "Transaction"
                    ? "border-emerald-400"
                    : "border-sky-400"
                }`}
              />

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 group-hover:border-slate-700 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-sky-400 font-bold">
                      {new Date(ev.startTime).toUTCString().replace("GMT", "UTC")}
                    </span>
                    <Badge variant={ev.timePrecision === "Exact" ? "confirmed" : "warning"}>
                      {ev.timePrecision} Time
                    </Badge>
                    <Badge variant="neutral">{ev.eventType}</Badge>
                  </div>

                  {ev.sourceEvidenceNumber && (
                    <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                      Source: {ev.sourceEvidenceNumber}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-200 text-sm font-sans">{ev.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{ev.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedConflict && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-amber-300 font-bold">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-sm font-sans">{selectedConflict.title}</span>
              </div>
              <button onClick={() => setSelectedConflict(null)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-sans">
              <div className="text-slate-300 text-xs">{selectedConflict.reason}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400 text-[11px] font-sans">Record 1 ({selectedConflict.firstEvidenceNumber})</div>
                <div className="text-[11px] text-slate-300 font-sans">{selectedConflict.firstEventTitle}</div>
                <div className="text-[10px] text-slate-500 font-mono">{new Date(selectedConflict.firstEventTime).toUTCString()}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-400 text-[11px] font-sans">Record 2 ({selectedConflict.secondEvidenceNumber})</div>
                <div className="text-[11px] text-slate-300 font-sans">{selectedConflict.secondEventTitle}</div>
                <div className="text-[10px] text-slate-500 font-mono">{new Date(selectedConflict.secondEventTime).toUTCString()}</div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedConflict(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-xs"
              >
                Close Examination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
