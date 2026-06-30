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
      className={`flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-[#b4b4b1] hover:bg-white/[0.06] hover:text-white ${active ? "bg-white/[0.08] text-[#f3f3f1]" : ""}`}
    >
      {icon}
      <span className="min-w-0 truncate">{label}</span>
      {badge !== undefined ? <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded bg-[#242424] px-1.5 text-xs leading-5 text-[#b4b4b1]">{badge}</span> : null}
      {shortcut ? <span className="ml-auto text-xs leading-none text-[#8f8f8a]">{shortcut}</span> : null}
    </Link>
  );
}
