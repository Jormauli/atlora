"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

const useCases = ["爆款文章 / 选题素材", "投资理财信息", "AI 工具 / 效率工具", "创业案例 / 商业机会", "学习资料 / 课程笔记", "工作资料 / 待办", "先随便试试"];
const perspectives = ["内容创作者", "创业者 / 产品人", "投资研究", "工具应用", "学习笔记", "综合摘要"];

export default function OnboardingPage() {
  const router = useRouter();
  const [primaryUseCases, setPrimaryUseCases] = useState<string[]>([useCases[0]]);
  const [defaultPerspective, setDefaultPerspective] = useState(perspectives[5]);
  async function save() {
    await fetch("/api/user-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryUseCases, defaultPerspective })
    });
    router.push("/dashboard");
  }
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4">
      <section className="w-full rounded-lg border bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-semibold">先定一下你的默认整理方式</h1>
        <div className="mt-6 space-y-6">
          <MultiChoiceGroup title="你主要想整理哪类信息？" values={primaryUseCases} onChange={setPrimaryUseCases} options={useCases} />
          <ChoiceGroup title="你希望 AI 默认用什么视角分析？" value={defaultPerspective} onChange={setDefaultPerspective} options={perspectives} />
        </div>
        <Button className="mt-6" onClick={save}>开始使用</Button>
      </section>
    </main>
  );
}

function MultiChoiceGroup({ title, options, values, onChange }: { title: string; options: string[]; values: string[]; onChange: (values: string[]) => void }) {
  function toggle(option: string) {
    if (values.includes(option)) {
      if (values.length === 1) return;
      onChange(values.filter((item) => item !== option));
      return;
    }
    onChange([...values, option]);
  }
  return (
    <div>
      <h2 className="mb-3 font-medium">{title}</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => toggle(option)}
            className={`rounded-md border px-3 py-3 text-left text-sm ${values.includes(option) ? "border-blue-600 bg-blue-50" : "bg-white"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceGroup({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <h2 className="mb-3 font-medium">{title}</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-md border px-3 py-3 text-left text-sm ${value === option ? "border-blue-600 bg-blue-50" : "bg-white"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
