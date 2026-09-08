import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useCase } from "../../context/CaseContext";
import { Shield, FolderKanban, LogOut, CheckCircle2, UserCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeCase, cases, setActiveCase } = useCase();

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-sky-400 font-bold tracking-wider">
          <Shield className="w-5 h-5 text-sky-400" />
          <span className="text-slate-100 text-base font-semibold">EVIDENCE<span className="text-sky-400">GRAPH</span></span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-mono">v1.0-DEMO</span>
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* Case Switcher */}
        <div className="flex items-center space-x-2">
          <FolderKanban className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active Case:</span>
          <select
            value={activeCase?.id || ""}
            onChange={(e) => {
              const selected = cases.find((c) => c.id === e.target.value);
              if (selected) setActiveCase(selected);
            }}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.caseNumber}] {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>INTEGRITY AUDITED</span>
        </div>

        {user && (
          <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-left">
                <div className="text-slate-200 font-medium leading-none">{user.displayName}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.role} ({user.badgeOrEmployeeNumber})</div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
