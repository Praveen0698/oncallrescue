"use client";

// ═══════════════════════════════════════════════════════════════
// BUTTON — min 44px touch target
// ═══════════════════════════════════════════════════════════════
export function Button({
  children, onClick, variant = "primary", size = "md",
  full = false, disabled = false, className = "", type = "button",
}) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-xl cursor-pointer select-none active:scale-[0.97]";

  const sizes = {
    sm: "px-3.5 py-2.5 text-xs min-h-[40px]",
    md: "px-5 py-3 text-sm min-h-[44px]",
    lg: "px-6 py-3.5 text-base min-h-[48px]",
  };

  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-medium",
    secondary: "bg-white text-ink-900 border border-surface-300 hover:bg-surface-50 hover:border-surface-400",
    success: "bg-success-500 text-white hover:bg-success-600 hover:shadow-medium",
    danger: "bg-brand-600 text-white hover:bg-brand-700",
    ghost: "bg-transparent text-brand-600 hover:bg-brand-50",
    outline: "bg-transparent text-brand-600 border-2 border-brand-600 hover:bg-brand-50",
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${disabled ? "opacity-40 cursor-not-allowed !active:scale-100" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// CARD
// ═══════════════════════════════════════════════════════════════
export function Card({ children, className = "", onClick, hover = false }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-surface-300 rounded-xl p-4 sm:p-5 shadow-soft transition-all duration-200 ${
        hover ? "hover:shadow-medium hover:border-surface-400 cursor-pointer active:scale-[0.99]" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// INPUT — 16px font to prevent iOS zoom, min 44px height
// ═══════════════════════════════════════════════════════════════
export function Input({
  label, type = "text", placeholder, value, onChange,
  required = false, disabled = false, className = "",
  helper, error, icon, maxLength,
}) {
  return (
    <div className={`mb-3.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
          {label}{required && <span className="text-brand-600 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300">{icon}</span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          className={`${type === "date" ? "w-[92%]" : "w-full"} px-3.5 py-3 bg-white border border-surface-300 rounded-xl text-ink-900 font-body placeholder:text-ink-300 transition-all duration-200 min-h-[44px] ${
            icon ? "pl-10" : ""
          } ${error ? "border-brand-600 bg-brand-50" : ""} ${
            disabled ? "opacity-50 cursor-not-allowed bg-surface-100" : ""
          }`}
          style={{ fontSize: "16px" }}
        />
      </div>
      {error && <p className="mt-1 text-xs text-brand-600 font-medium">{error}</p>}
      {helper && !error && <p className="mt-1 text-[11px] text-ink-400">{helper}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SELECT — 16px font, 44px min height
// ═══════════════════════════════════════════════════════════════
export function Select({
  label, value, onChange, options,
  placeholder = "Select...", required = false, className = "",
}) {
  return (
    <div className={`mb-3.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
          {label}{required && <span className="text-brand-600 ml-0.5">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3.5 py-3 bg-white border border-surface-300 rounded-xl text-ink-900 font-body cursor-pointer transition-all duration-200 appearance-none min-h-[44px]"
        style={{
          fontSize: "16px",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238A8A7F' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10l-5 5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
        ))}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TEXTAREA — 16px font
// ═══════════════════════════════════════════════════════════════
export function Textarea({
  label, placeholder, value, onChange,
  rows = 3, className = "", helper,
}) {
  return (
    <div className={`mb-3.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-1.5">{label}</label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full px-3.5 py-3 bg-white border border-surface-300 rounded-xl text-ink-900 font-body placeholder:text-ink-300 transition-all duration-200 resize-y min-h-[44px]"
        style={{ fontSize: "16px" }}
      />
      {helper && <p className="mt-1 text-[11px] text-ink-400">{helper}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// BADGE
// ═══════════════════════════════════════════════════════════════
export function Badge({ children, variant = "brand", className = "" }) {
  const variants = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-50 text-success-500",
    warning: "bg-warning-50 text-warning-500",
    neutral: "bg-surface-200 text-ink-600",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold whitespace-nowrap ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
export function StatCard({ icon, label, value, color = "brand" }) {
  const colors = {
    brand: "text-brand-600 bg-brand-50",
    success: "text-success-500 bg-success-50",
    warning: "text-warning-500 bg-warning-50",
    neutral: "text-ink-600 bg-surface-200",
  };
  return (
    <Card className="text-center !p-3 sm:!p-4">
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${colors[color]} flex items-center justify-center mx-auto mb-2`}>{icon}</div>
      <div className="text-xl sm:text-2xl font-extrabold text-ink-900">{value}</div>
      <div className="text-[10px] sm:text-[11px] font-semibold text-ink-400 uppercase tracking-wider mt-0.5">{label}</div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROGRESS STEPS — responsive text
// ═══════════════════════════════════════════════════════════════
export function ProgressSteps({ steps, current }) {
  return (
    <div className="flex gap-1 mb-5">
      {steps.map((label, i) => (
        <div key={i} className="flex-1 min-w-0">
          <div className={`h-[3px] rounded-full transition-all duration-500 ${i <= current ? "bg-brand-600" : "bg-surface-300"}`} />
          <div className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-widest mt-1.5 text-center truncate ${i <= current ? "text-brand-600" : "text-ink-300"}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CHECKBOX — 44px touch target
// ═══════════════════════════════════════════════════════════════
export function Checkbox({ label, checked, onChange, description, className = "" }) {
  return (
    <label
      className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 min-h-[44px] ${
        checked ? "bg-success-50 border border-success-500" : "bg-surface-50 border border-surface-300"
      } ${className}`}
    >
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200 ${
          checked ? "bg-success-500 border-success-500" : "border-ink-300 bg-transparent"
        }`}
      >
        {checked && <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
      </div>
      <div>
        <div className="text-sm font-semibold text-ink-900">{label}</div>
        {description && <div className="text-xs text-ink-400 mt-0.5">{description}</div>}
      </div>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION HEADER
// ═══════════════════════════════════════════════════════════════
export function SectionHeader({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      {icon && (
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">{icon}</div>
      )}
      <div className="min-w-0">
        <h3 className="text-sm sm:text-base font-bold text-ink-900 truncate">{title}</h3>
        {subtitle && <p className="text-[11px] text-ink-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE
// ═══════════════════════════════════════════════════════════════
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-10 sm:py-12">
      {icon && <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-surface-200 flex items-center justify-center mx-auto mb-4 text-ink-400">{icon}</div>}
      <h3 className="text-base sm:text-lg font-bold text-ink-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-400 mb-4 max-w-xs mx-auto">{description}</p>}
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOADING OVERLAY — for page transitions
// ═══════════════════════════════════════════════════════════════
export function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 z-[100] bg-surface-100/90 flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full loader-spin mb-3" />
      <p className="text-sm font-semibold text-ink-500">{message}</p>
    </div>
  );
}
