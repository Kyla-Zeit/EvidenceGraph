import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  FileArchive,
  Users,
  Network,
  Clock,
  Bot,
  CheckSquare,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: "/", label: "Case Dashboard", icon: LayoutDashboard, end: true },
    { to: "/evidence", label: "Evidence Archive", icon: FileArchive },
    { to: "/entities", label: "Entities & Identifiers", icon: Users },
    { to: "/graph", label: "Knowledge Graph", icon: Network },
    { to: "/timeline", label: "Timeline & Conflicts", icon: Clock },
    { to: "/analysis", label: "AI Investigation", icon: Bot },
    { to: "/review", label: "Analysis Review", icon: CheckSquare },
    { to: "/audit", label: "Audit Hash Trail", icon: ShieldAlert },
    { to: "/cases", label: "All Cases", icon: FolderOpen },
    { to: "/limitations", label: "System & AI Ethics", icon: HelpCircle },
  ];

  return (
    <aside className="w-56 bg-slate-900 border-r border-slate-800 flex flex-col justify-between py-4 select-none shrink-0">
      <div className="space-y-1 px-2">
        <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Investigation Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="px-4 py-2 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">Operation Northstar</div>
        <div className="font-mono text-[10px] text-slate-400">EG-2026-0042 • Active</div>
        <div className="text-[9px] text-sky-400/90 pt-1">Evidence First. AI Second.</div>
      </div>
    </aside>
  );
};
