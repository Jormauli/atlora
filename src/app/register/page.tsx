"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { useLanguage } from "@/components/language-provider";
import { Button, Input } from "@/components/ui";
import { readJsonSafely } from "@/lib/client/http";

export default function RegisterPage() {
  const router = useRouter();
  const { copy } = useLanguage();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function submit(formData: FormData) {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      if (!response.ok) {
        const body = await readJsonSafely(response);
        setError(body?.error ?? copy.auth.registerFailed);
        return;
      }
      router.push("/onboarding");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <AuthFrame title={copy.auth.registerTitle} eyebrow={copy.auth.registerEyebrow}>
      <form action={submit} className="space-y-4">
        <Input className="border-[#354039] bg-[#0d120f] text-[#eef1e8] placeholder:text-[#788279] focus:ring-[#a9bf95]" name="nickname" placeholder={copy.auth.nickname} />
        <Input className="border-[#354039] bg-[#0d120f] text-[#eef1e8] placeholder:text-[#788279] focus:ring-[#a9bf95]" name="email" type="email" placeholder={copy.auth.email} required />
        <Input className="border-[#354039] bg-[#0d120f] text-[#eef1e8] placeholder:text-[#788279] focus:ring-[#a9bf95]" name="password" type="password" placeholder={copy.auth.passwordHint} required />
        <div className="min-h-5">{error && <p className="text-sm text-[#e7a09a]">{error}</p>}</div>
        <Button disabled={isSubmitting} className="w-full bg-[#d9e7c6] text-[#172018] hover:bg-[#e6efd8]">
          {isSubmitting ? copy.auth.registering : copy.auth.register}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[#929c94]">{copy.auth.hasAccount} <Link className="text-[#c5d8b1] hover:text-[#e6efd8]" href="/login">{copy.auth.login}</Link></p>
    </AuthFrame>
  );
}
