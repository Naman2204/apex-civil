import React from "react";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "strict" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  className?: string;
}

export function StatusBadge({ label, variant, className = "" }: StatusBadgeProps) {
  // Styles based on ApexCivil Spec
  const STYLES: Record<StatusVariant, string> = {
    success: "border-[#43A047]/30 bg-[#43A047]/10 text-[#43A047]", // Easy / Correct
    warning: "border-[#E0A63D]/30 bg-[#E0A63D]/10 text-[#E0A63D]", // Medium / Warning
    danger:  "border-[#E24B4A]/30 bg-[#E24B4A]/10 text-[#E24B4A]", // Hard / Incorrect
    info:    "border-[#8E63F0]/30 bg-[#8E63F0]/10 text-[#8E63F0]", // Practice / Review
    strict:  "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#3B82F6]", // Strict Mode
    neutral: "border-[#565B77] bg-[#3A3F58] text-[#A8ACC4]",       // Not visited / Neutral
  };

  return (
    <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-wide uppercase ${STYLES[variant]} ${className}`}>
      {label}
    </span>
  );
}

// Helper to map difficulty text to a variant
export function getDifficultyVariant(difficulty: string): StatusVariant {
  const d = difficulty.toLowerCase();
  if (d.includes("easy")) return "success";
  if (d.includes("medium") || d.includes("moderate")) return "warning";
  if (d.includes("hard") || d.includes("high")) return "danger";
  return "neutral";
}
