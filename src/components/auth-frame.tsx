"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle, useLanguage } from "@/components/language-provider";

export function AuthFrame({
  title,
  eyebrow,
  children
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  const { copy } = useLanguage();

  return (
    <main className="starfield-surface min-h-screen bg-[#0b0f0d] px-4 py-6 text-[#eef1e8] sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Atlora">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span>
            <strong className="block text-sm font-semibold text-[#f2f4ed]">Atlora</strong>
            <span className="block text-[10px] text-[#9ca69d]">{copy.product.subtitle}</span>
          </span>
        </Link>
        <LanguageToggle />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center py-10">
        <section className="w-full rounded-lg border border-[#303b33] bg-[#111713] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-xs text-[#929c94] hover:text-[#e2e7df]">
            <ArrowLeft className="h-3.5 w-3.5" />{copy.auth.backHome}
          </Link>
          <p className="text-xs text-[#aebfa0]">{eyebrow}</p>
          <h1 className="mb-7 mt-2 text-2xl font-semibold text-[#f1f3ec]">{title}</h1>
          {children}
        </section>
      </div>
    </main>
  );
}
