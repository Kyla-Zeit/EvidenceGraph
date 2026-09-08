import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: "confirmed" | "warning" | "default" | "danger";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = "default",
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 group-hover:text-sky-400 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono text-slate-100">{value}</div>
        {badge && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border ${
              badgeVariant === "warning"
                ? "bg-amber-950 border-amber-800 text-amber-300"
                : badgeVariant === "danger"
                ? "bg-rose-950 border-rose-800 text-rose-300"
                : badgeVariant === "confirmed"
                ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                : "bg-sky-950 border-sky-800 text-sky-300"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && <div className="mt-1 text-[11px] text-slate-400">{subtitle}</div>}
    </div>
  );
};
