"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { readJsonSafely } from "@/lib/client/http";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (!response.ok) {
      const body = await readJsonSafely(response);
      setError(body?.error ?? "注册失败，请确认数据库已启动。");
      return;
    }
    router.push("/onboarding");
  }
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border bg-white p-6 shadow-soft">
        <h1 className="mb-6 text-2xl font-semibold">创建账号</h1>
        <form action={submit} className="space-y-4">
          <Input name="nickname" placeholder="昵称，可选" />
          <Input name="email" type="email" placeholder="邮箱" required />
          <Input name="password" type="password" placeholder="至少 8 位密码" required />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full">注册</Button>
        </form>
        <p className="mt-4 text-sm text-muted">已有账号？<Link className="text-blue-600" href="/login">登录</Link></p>
      </section>
    </main>
  );
}
