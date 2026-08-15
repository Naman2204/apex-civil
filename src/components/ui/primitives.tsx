import React from "react";

/* ------------------------------------------------------------------ */
/* Tone map — one vocabulary across the app                            */
/* ------------------------------------------------------------------ */
export type Tone = "accent" | "blue" | "emerald" | "amber" | "rose" | "slate";

export const TONE_TEXT: Record<Tone, string> = {
  accent: "text-accent-bright",
  blue: "text-app-blue",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  rose: "text-rose-400",
  slate: "text-app-muted",
};

export const TONE_SOFT_BG: Record<Tone, string> = {
  accent: "bg-accent-soft/60",
  blue: "bg-app-blue-soft/60",
  emerald: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  rose: "bg-rose-500/10",
  slate: "bg-app-card2",
};

export const TONE_BAR: Record<Tone, string> = {
  accent: "bg-accent",
  blue: "bg-app-blue",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  slate: "bg-app-border2",
};

/* ------------------------------------------------------------------ */
/* PageHeader — consistent page heading block                          */
/* ------------------------------------------------------------------ */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  tone = "accent",
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
      <div className="min-w-0">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-app-border bg-app-card text-app-faint uppercase tracking-[0.18em] text-[10px] font-bold mb-4">
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-app-text leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-app-muted mt-2 max-w-2xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* GlassCard — the standard card surface                               */
/* ------------------------------------------------------------------ */
export function GlassCard({
  className = "",
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-app-card border border-app-border rounded-2xl ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHeader                                                       */
/* ------------------------------------------------------------------ */
export function SectionHeader({
  number,
  title,
  subtitle,
  action,
}: {
  number?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div className="flex items-baseline gap-3 min-w-0">
        {number && (
          <span className="text-[11px] font-black text-accent-bright tracking-widest shrink-0">
            {number}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-app-text tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-app-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                            */
/* ------------------------------------------------------------------ */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "accent",
  className = "",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <GlassCard className={`p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-app-muted">
          {label}
        </span>
        {Icon && (
          <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${TONE_SOFT_BG[tone]} ${TONE_TEXT[tone]}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-app-text leading-none">
        {value}
      </div>
      {sub && <div className="text-xs text-app-faint leading-snug">{sub}</div>}
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressBar                                                         */
/* ------------------------------------------------------------------ */
export function ProgressBar({
  value,
  tone = "accent",
  className = "",
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-1.5 w-full rounded-full bg-app-deep overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full ${TONE_BAR[tone]} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */
export function Badge({
  children,
  tone = "slate",
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${TONE_SOFT_BG[tone]} ${TONE_TEXT[tone]} border border-transparent ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                          */
/* ------------------------------------------------------------------ */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  tone = "accent",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message?: string;
  action?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <GlassCard className="py-16 px-6 text-center flex flex-col items-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${TONE_SOFT_BG[tone]} ${TONE_TEXT[tone]}`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-app-text mb-2">{title}</h3>
      {message && <p className="text-sm text-app-muted max-w-md mb-7 leading-relaxed">{message}</p>}
      {action}
    </GlassCard>
  );
}

/* ------------------------------------------------------------------ */
/* Btn — primary / secondary / ghost / danger                          */
/* ------------------------------------------------------------------ */
export function Btn({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] px-5 py-2.5";
  const variants: Record<string, string> = {
    primary:
      "bg-accent text-white hover:bg-accent-bright shadow-lg shadow-accent/25 hover:-translate-y-px",
    secondary:
      "bg-app-card2 text-app-text border border-app-border hover:border-app-border2 hover:bg-app-card",
    ghost: "text-app-muted hover:text-app-text hover:bg-app-card2",
    danger: "bg-rose-500/10 text-rose-400 border border-rose-500/25 hover:bg-rose-500/20",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Segmented — compact segmented control                               */
/* ------------------------------------------------------------------ */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex bg-app-deep border border-app-border rounded-xl p-1 gap-1 w-full">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg font-bold transition-all ${
            size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"
          } ${
            value === o.value
              ? "bg-app-card text-accent-bright shadow-sm border border-app-border2"
              : "text-app-muted hover:text-app-text"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
