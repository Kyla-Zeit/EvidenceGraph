import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("investigator@evidencegraph.local");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    }
  };

  const personas = [
    {
      role: "Investigator",
      name: "Marcus Brody (INV-784)",
      email: "investigator@evidencegraph.local",
      desc: "Full case & evidence authority. Can confirm entities & link relationships.",
      badgeColor: "bg-sky-950 border-sky-800 text-sky-300",
    },
    {
      role: "Senior Analyst",
      name: "Elena Chen (ANA-209)",
      email: "analyst@evidencegraph.local",
      desc: "Performs intelligence extraction, GraphRAG queries, and resolution reviews.",
      badgeColor: "bg-purple-950 border-purple-800 text-purple-300",
    },
    {
      role: "Administrator",
      name: "Sarah Vance (ADM-001)",
      email: "admin@evidencegraph.local",
      desc: "Supervisory oversight, user management, and analytical graph rebuilds.",
      badgeColor: "bg-amber-950 border-amber-800 text-amber-300",
    },
    {
      role: "Legal Reviewer",
      name: "David Thorne (REV-104)",
      email: "reviewer@evidencegraph.local",
      desc: "Read-only evidentiary audit review and chain verification.",
      badgeColor: "bg-slate-800 border-slate-700 text-slate-300",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-2">
            <Shield className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-bold tracking-wider text-slate-100 font-mono">
            EVIDENCE<span className="text-sky-400">GRAPH</span>
          </h1>

          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            AI-Assisted Digital Evidence & Investigative Intelligence Platform
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs p-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Email Address
              </label>

              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Password
              </label>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <span>
                {isLoading ? "Authenticating..." : "Sign In to Case Workspace"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="border-t border-slate-800 pt-4 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Quick Switch Seeded Test Personas
            </div>

            <div className="grid grid-cols-1 gap-2">
              {personas.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => {
                    setEmail(p.email);
                    setPassword("Password123!");
                  }}
                  className={`text-left p-2.5 rounded-lg border transition-all flex items-start justify-between ${
                    email === p.email
                      ? "bg-slate-800/90 border-sky-500/50 ring-1 ring-sky-500/30"
                      : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-slate-200">
                        {p.name}
                      </span>

                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${p.badgeColor}`}
                      >
                        {p.role}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      {p.desc}
                    </div>
                  </div>

                  <UserCheck className="w-4 h-4 text-slate-500 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 font-mono">
          Synthetic Portfolio Demonstration • Fictional Data Only
        </div>
      </div>
    </div>
  );
};