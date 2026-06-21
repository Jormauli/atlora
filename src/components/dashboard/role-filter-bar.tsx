"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import type { RoleFilter } from "@/lib/dashboard/card-view-model";
import { localizedContentViewLabel } from "@/lib/language";

export function RoleFilterBar({
  roles,
  selectedRoles,
  onToggle
}: {
  roles: RoleFilter[];
  selectedRoles: string[];
  onToggle: (roleId: string) => void;
}) {
  const { copy } = useLanguage();
  return (
    <section className="mt-6 border-b border-[#29302d] pb-5">
      <div className="mb-3 text-sm font-medium text-[#c9c2b6]">{copy.newMaterial.viewLabel}</div>
      <div className="scrollbar-none flex gap-4 overflow-x-auto pb-1">
        {roles.map((role) => {
          const label = localizedContentViewLabel(role.label, copy);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onToggle(role.id)}
              className="group flex min-w-[74px] flex-col items-center gap-2 rounded-md p-1 text-xs text-[#c9c2b6] hover:bg-white/[0.05]"
            >
              <span className={roleCircleClass(role.tone, selectedRoles.includes(role.id))}>
                {selectedRoles.includes(role.id) ? <Check className="h-5 w-5" /> : label.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[86px] truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function roleCircleClass(tone: string, active: boolean) {
  const classes: Record<string, string> = {
    slate: "border-[#51605a] bg-[#202723] text-[#d4dccf]",
    emerald: "border-[#6d8662] bg-[#1d2a20] text-[#d9e7c6]",
    amber: "border-[#8a744b] bg-[#2d2518] text-[#ead7a5]",
    indigo: "border-[#6f769a] bg-[#202234] text-[#d7dcff]",
    stone: "border-[#5f5a51] bg-[#25241f] text-[#ded4c2]",
    sky: "border-[#557485] bg-[#1b2930] text-[#c9e8f4]",
    rose: "border-[#87606a] bg-[#2b1f23] text-[#f2cfd8]"
  };
  return `flex h-14 w-14 items-center justify-center rounded-full border text-sm font-medium transition ${classes[tone] ?? classes.slate} ${
    active ? "ring-2 ring-[#d9e7c6] ring-offset-2 ring-offset-[#101412]" : ""
  }`;
}
