import Link from "next/link";
import type { ReactNode } from "react";

export function SidebarLink({
  href,
  icon,
  label,
  badge,
  shortcut,
  active
}: {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  shortcut?: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[#b9b1a3] hover:bg-white/[0.06] ${active ? "bg-white/[0.08] text-[#f4f1e8]" : ""}`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined ? <span className="ml-auto rounded bg-[#222a25] px-1.5 text-xs text-[#a9b1a9]">{badge}</span> : null}
      {shortcut ? <span className="ml-auto text-xs text-[#7f897f]">{shortcut}</span> : null}
    </Link>
  );
}
