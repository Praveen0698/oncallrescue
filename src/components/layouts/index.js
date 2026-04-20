"use client";

import Link from "next/link";
import { Shield } from "lucide-react";

export function PageShell({ children, maxWidth = "max-w-lg" }) {
  return (
    <div className="min-h-screen bg-surface-100 safe-top safe-bottom">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-4 sm:py-6`}>{children}</div>
    </div>
  );
}

export function PageHeader({ title, subtitle, backHref, action }) {
  return (
    <div className="flex items-start justify-between gap-2 mb-5">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {backHref && (
          <Link
            href={backHref}
            className="w-9 h-9 rounded-xl bg-white border border-surface-300 flex items-center justify-center text-ink-400 hover:text-ink-900 hover:border-surface-400 transition-all flex-shrink-0"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-extrabold text-ink-900 truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-ink-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Logo({ size = "md" }) {
  const sizes = {
    sm: { icon: "w-8 h-8 rounded-lg", iconSize: 16, text: "text-lg" },
    md: { icon: "w-12 h-12 rounded-2xl", iconSize: 22, text: "text-2xl" },
    lg: { icon: "w-[72px] h-[72px] rounded-[22px]", iconSize: 28, text: "text-[34px]" },
  };
  const s = sizes[size];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`${s.icon} brand-gradient flex items-center justify-center shadow-heavy mb-4`}
        style={{ boxShadow: "0 8px 32px rgba(200, 55, 45, 0.15)" }}
      >
        <Shield size={s.iconSize} className="text-white" />
      </div>
      <h1 className={`${s.text} font-black tracking-tight text-ink-900`}>
        OnCall<span className="text-brand-600">Rescue</span>
        <span className="text-brand-600 text-[1.2em]">.</span>
      </h1>
    </div>
  );
}

export function BottomNav({ items, active, onChange }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-300 px-2 py-1 flex justify-around items-center z-50 safe-bottom">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all ${
            active === item.key ? "text-brand-600" : "text-ink-400 hover:text-ink-600"
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
