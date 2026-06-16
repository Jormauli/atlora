"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { contentViews } from "@/lib/content-views";
import { brand } from "@/lib/brand";

export default function OnboardingPage() {
  const router = useRouter();
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
        <div className="text-xs uppercase tracking-[0.18em] text-[#9ba79d]">{brand.name.en}</div>
        <h1 className="mt-2 text-2xl font-semibold">选择你的初始观测视角</h1>
        <p className="mt-2 text-sm leading-6 text-[#b9b1a3]">
          先选你常看的内容类型。之后每次生成卡片时，系统会在这些视角里判断最适合的 1-2 个视角。
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
                <span>{view.label}</span>
                {active ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </div>

        <Button className="mt-6" onClick={save}>进入星域</Button>
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
