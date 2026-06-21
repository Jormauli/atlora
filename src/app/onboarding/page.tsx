"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { LanguageToggle, useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui";
import { contentViews } from "@/lib/content-views";
import { brand } from "@/lib/brand";
import { localizedContentViewLabel } from "@/lib/language";

export default function OnboardingPage() {
  const router = useRouter();
  const { copy } = useLanguage();
  const [primaryUseCases, setPrimaryUseCases] = useState<string[]>([contentViews[0].id]);

  async function save() {
    await fetch("/api/user-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryUseCases })
    });
    router.push("/dashboard");
  }

  return (
    <main className="starfield-surface flex min-h-screen items-center justify-center bg-[#101412] px-4 py-10 text-[#f4f1e8]">
      <section className="w-full max-w-3xl rounded-lg border border-[#344039] bg-[#171d1a] p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[#9ba79d]">{brand.name.en}</div>
          <LanguageToggle />
        </div>
        <h1 className="mt-2 text-2xl font-semibold">{copy.onboarding.title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#b9b1a3]">
          {copy.onboarding.description}
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {contentViews.map((view) => {
            const active = primaryUseCases.includes(view.id);
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => toggleSelection(view.id, primaryUseCases, setPrimaryUseCases)}
                className={`flex items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition ${
                  active
                    ? "border-[#d9e7c6] bg-[#d9e7c6] text-[#172018]"
                    : "border-[#354039] bg-[#101412] text-[#d8d2c6] hover:bg-[#202821]"
                }`}
              >
                <span>{localizedContentViewLabel(view.id, copy)}</span>
                {active ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </div>

        <Button className="mt-6" onClick={save}>{copy.onboarding.enter}</Button>
      </section>
    </main>
  );
}

function toggleSelection(value: string, values: string[], onChange: (values: string[]) => void) {
  if (values.includes(value)) {
    if (values.length === 1) return;
    onChange(values.filter((item) => item !== value));
    return;
  }
  onChange([...values, value]);
}
