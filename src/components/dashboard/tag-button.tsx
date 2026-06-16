import type { ReactNode } from "react";

export function TagButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 shrink-0 rounded border px-3 text-xs ${
        active
          ? "border-[#d9e7c6] bg-[#d9e7c6] text-[#172018]"
          : "border-[#354039] bg-[#171d1a] text-[#c9c2b6] hover:bg-[#202821]"
      }`}
    >
      {children}
    </button>
  );
}
