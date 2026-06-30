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
    <section className="mt-6 border-b border-[#2f2f2f] pb-5">
      <div className="mb-3 text-sm font-medium text-[#d8d8d5]">{copy.newMaterial.viewLabel}</div>
      <div className="scrollbar-none flex gap-4 overflow-x-auto pb-1">
        {roles.map((role) => {
          const label = localizedContentViewLabel(role.label, copy);
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onToggle(role.id)}
              className="group flex min-w-[82px] flex-col items-center gap-2 rounded-md p-1 text-xs text-[#b4b4b1] hover:bg-white/[0.05]"
            >
              <span className={roleToneClass(role.tone, selectedRoles.includes(role.id))}>
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

function roleToneClass(tone: string, active: boolean) {
  const classes: Record<string, string> = {
    slate: "after:bg-[#8f8f8a]",
    emerald: "after:bg-[#5f8f72]",
    amber: "after:bg-[#b48745]",
    indigo: "after:bg-[#7480b8]",
    stone: "after:bg-[#8f8f8a]",
    sky: "after:bg-[#4f6f8f]",
    rose: "after:bg-[#9a554b]"
  };
  return `relative flex h-12 w-12 items-center justify-center rounded-md border border-[#2f2f2f] bg-[#171717] text-sm font-medium leading-none text-[#f3f3f1] transition after:absolute after:bottom-1 after:h-1 after:w-5 after:rounded-full ${classes[tone] ?? classes.slate} ${
    active ? "ring-2 ring-[#e7e7e3] ring-offset-2 ring-offset-[#111111]" : ""
  }`;
}
