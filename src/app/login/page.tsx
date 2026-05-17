"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(formData: FormData) {
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    if (!response.ok) {
      setError("邮箱或密码错误");
      return;
    }
    router.push("/dashboard");
  }
  return (
    <AuthFrame title="欢迎回来">
      <form action={submit} className="space-y-4">
        <Input name="email" type="email" placeholder="邮箱" required />
        <Input name="password" type="password" placeholder="密码" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full">登录</Button>
      </form>
      <p className="mt-4 text-sm text-muted">还没有账号？<Link className="text-blue-600" href="/register">注册</Link></p>
    </AuthFrame>
  );
}

function AuthFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border bg-white p-6 shadow-soft">
        <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
        {children}
      </section>
    </main>
  );
}
