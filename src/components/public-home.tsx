"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Link2, LogIn, ScanText, Telescope } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LocaleLanguageToggle, useLanguage } from "@/components/language-provider";
import { PublicHomeFlowVisual, type PublicHomeFlowVariant } from "@/components/public-home-flow-visual";
import { uiCopy } from "@/lib/language";
import type { SeoLocale } from "@/lib/seo";

const capabilityIcons = [Link2, ScanText, Telescope] as const;
const capabilitySignals = ["bg-[#4f6f8f]", "bg-[#b48745]", "bg-[#9a554b]"] as const;
const flowVariants: PublicHomeFlowVariant[] = ["input", "extract", "card"];
const flowSignals = ["bg-[#4f6f8f]", "bg-[#b48745]", "bg-[#9a554b]"] as const;

export function PublicHome({ locale }: { locale: SeoLocale }) {
  const { setLanguage } = useLanguage();

  useEffect(() => {
    setLanguage(locale);
  }, [locale, setLanguage]);

  const copy = uiCopy[locale];

  return (
    <main className="spectral-surface min-h-screen overflow-hidden bg-[#111111] text-[#f1f1ef]">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between border-b border-[#303030] px-5 sm:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3" aria-label="Atlora">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span>
            <strong className="block text-sm font-semibold text-[#f3f3f1]">Atlora</strong>
            <span className="block text-[10px] text-[#979795]">{copy.product.subtitle}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="hidden text-sm text-[#b4b4b1] hover:text-white sm:inline">{copy.publicHome.login}</Link>
          <LocaleLanguageToggle locale={locale} />
        </div>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center px-5 py-12 sm:px-8 lg:py-16">
        <div className="pointer-events-none absolute right-[-9rem] top-10 hidden h-[34rem] w-[34rem] rounded-full border border-[#303030] lg:block" />
        <div className="pointer-events-none absolute right-[-5.5rem] top-[5.5rem] hidden h-[27rem] w-[27rem] rounded-full border border-[#2b2b2b] lg:block" />
        <div className="pointer-events-none absolute right-[-2rem] top-36 hidden h-[20rem] w-[20rem] rounded-full border border-[#292929] lg:block" />
        <div className="pointer-events-none absolute right-24 top-56 hidden h-28 w-28 rounded-full bg-[#4f6f8f] shadow-[0_0_70px_rgba(79,111,143,0.2)] lg:block">
          <span className="absolute left-6 top-5 h-4 w-4 rounded-full bg-black/15" />
          <span className="absolute bottom-6 right-5 h-7 w-7 rounded-full border border-white/10 bg-black/10" />
        </div>
        <div className="orbit-motion orbit-motion--inner pointer-events-none absolute right-[-2rem] top-36 hidden h-[20rem] w-[20rem] lg:block">
          <span className="absolute left-1/2 top-[-0.3rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#4f6f8f] shadow-[0_0_18px_rgba(79,111,143,0.3)]" />
        </div>
        <div className="orbit-motion orbit-motion--middle pointer-events-none absolute right-[-5.5rem] top-[5.5rem] hidden h-[27rem] w-[27rem] lg:block">
          <span className="absolute left-1/2 top-[-0.5rem] h-4 w-4 -translate-x-1/2 rounded-full bg-[#b48745] shadow-[0_0_24px_rgba(180,135,69,0.25)]" />
        </div>
        <div className="orbit-motion orbit-motion--outer pointer-events-none absolute right-[-9rem] top-10 hidden h-[34rem] w-[34rem] lg:block">
          <span className="absolute left-1/2 top-[-0.3rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#9a554b] shadow-[0_0_18px_rgba(154,85,75,0.24)]" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="flex items-center gap-2 text-xs uppercase text-[#aaa9a5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4f6f8f]" />
            {copy.publicHome.eyebrow}
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold leading-tight text-[#f3f3f1] sm:text-5xl lg:text-[3.4rem]">
            {copy.publicHome.headline}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#aaa9a6] sm:text-lg">
            {copy.publicHome.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex h-11 items-center gap-2 rounded-md border border-[#4f6f8f] bg-[#e7e7e3] px-5 text-sm font-semibold text-[#191919] hover:bg-white">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4f6f8f]" />
              {copy.publicHome.primaryAction}<ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex h-11 items-center gap-2 rounded-md border border-[#3a3a3a] px-5 text-sm font-medium text-[#d8d8d5] hover:bg-white/[0.05]">
              <LogIn className="h-4 w-4" />{copy.publicHome.secondaryAction}
            </Link>
          </div>
        </div>

        <div className="relative z-10 mt-14 grid max-w-3xl gap-px overflow-hidden rounded-md border border-[#303030] bg-[#303030] sm:grid-cols-3 lg:mt-20">
          {copy.publicHome.capabilities.map((capability, index) => {
            const Icon = capabilityIcons[index];
            return (
              <div key={capability.title} className="bg-[#171717] px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <Icon className="h-4 w-4 text-[#b9b9b5]" />
                  <span className={`h-2 w-2 rounded-full ${capabilitySignals[index]}`} />
                </div>
                <p className="text-sm font-medium text-[#e7e7e3]">{capability.title}</p>
                <p className="mt-1 text-xs text-[#92928f]">{capability.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[#2c2c2c] bg-[#121212]/90 px-5 py-20 sm:px-8 lg:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs uppercase text-[#aaa9a5]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b48745]" />
              {copy.publicHome.flow.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-[#f3f3f1] sm:text-4xl">
              {copy.publicHome.flow.title}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#999996] sm:text-base">
              {copy.publicHome.flow.description}
            </p>
          </div>

          <div className="relative mt-12 grid gap-10 lg:grid-cols-3 lg:gap-6">
            <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-5 hidden h-px bg-[#353535] lg:block" />
            {copy.publicHome.flow.steps.map((step, index) => (
              <figure key={step.title} className="relative min-w-0">
                <div className="mb-5 flex items-center gap-3">
                  <span className={`relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-4 border-[#121212] text-xs font-semibold text-white ${flowSignals[index]}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#e9e9e6]">{step.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#8f8f8c]">{step.detail}</p>
                  </div>
                </div>
                <PublicHomeFlowVisual variant={flowVariants[index]} />
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
