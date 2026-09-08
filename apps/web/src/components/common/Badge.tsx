import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "confirmed" | "extracted" | "suggested" | "warning" | "danger" | "neutral";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = "default", className = "" }) => {
  const variantStyles = {
    default: "bg-sky-950 border-sky-800 text-sky-300",
    confirmed: "bg-emerald-950 border-emerald-800 text-emerald-300",
    extracted: "bg-amber-950 border-amber-800 text-amber-300",
    suggested: "bg-purple-950 border-purple-800 text-purple-300",
    warning: "bg-amber-950 border-amber-700 text-amber-200",
    danger: "bg-rose-950 border-rose-800 text-rose-300",
    neutral: "bg-slate-800 border-slate-700 text-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
