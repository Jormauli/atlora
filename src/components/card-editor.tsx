"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { brand } from "@/lib/brand";
import type { SerializableCard } from "@/lib/types";

export function CardEditor({ card, draft = false }: { card: SerializableCard; draft?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: card.title,
    summary: card.summary,
    keyPoints: card.keyPoints.join("\n"),
    rolePerspectives: card.rolePerspectives.join("\n"),
    tags: card.tags.join(", "),
    category: card.category
  });
  async function save() {
    await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        summary: form.summary,
        keyPoints: lines(form.keyPoints),
        rolePerspectives: lines(form.rolePerspectives),
        tags: form.tags.split(",").map((x) => x.trim()).filter(Boolean),
        category: form.category
      })
    });
    if (draft) {
      await fetch(`/api/cards/${card.id}/save`, { method: "POST" });
      router.push(`/cards/${card.id}`);
    } else {
      router.refresh();
    }
  }
  async function remove() {
    await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
    router.push("/dashboard");
  }
  return (
    <section className="mt-6 space-y-4 rounded-lg border bg-white p-5">
      <Field label="标题"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
      <Field label="总结"><Textarea rows={5} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
      <Field label="3 个核心观点+论据"><Textarea rows={8} value={form.keyPoints} onChange={(e) => setForm({ ...form, keyPoints: e.target.value })} /></Field>
      <Field label="标签"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></Field>
      <Field label="根据角色的启示"><Textarea rows={7} value={form.rolePerspectives} onChange={(e) => setForm({ ...form, rolePerspectives: e.target.value })} /></Field>
      <Field label="分类"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
      {card.sourceUrl ? (
        <div className="rounded-md border bg-slate-50 p-3 text-sm">
          <div className="font-medium">原文链接</div>
          <a className="mt-1 block break-all text-accent" href={card.sourceUrl} target="_blank" rel="noreferrer">
            {card.sourceUrl}
          </a>
        </div>
      ) : null}
      <div className="flex gap-3">
        <Button onClick={save}>{draft ? `保存到${brand.navigation.library}` : "保存修改"}</Button>
        <button onClick={remove} className="rounded-md border px-4 py-2 text-sm text-red-600">删除</button>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2 text-sm"><span className="font-medium">{label}</span>{children}</label>;
}

function lines(value: string) {
  return value.split("\n").map((x) => x.trim()).filter(Boolean);
}
