"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/auth-frame";
import { useLanguage } from "@/components/language-provider";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const { copy } = useLanguage();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function submit(formData: FormData) {
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      if (!response.ok) {
        setError(copy.auth.loginFailed);
        return;
      }
      router.push("/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <AuthFrame title={copy.auth.loginTitle} eyebrow={copy.auth.loginEyebrow}>
      <form action={submit} className="space-y-4">
        <Input className="border-[#354039] bg-[#0d120f] text-[#eef1e8] placeholder:text-[#788279] focus:ring-[#a9bf95]" name="email" type="email" placeholder={copy.auth.email} required />
        <Input className="border-[#354039] bg-[#0d120f] text-[#eef1e8] placeholder:text-[#788279] focus:ring-[#a9bf95]" name="password" type="password" placeholder={copy.auth.password} required />
        <div className="min-h-5">{error && <p className="text-sm text-[#e7a09a]">{error}</p>}</div>
        <Button disabled={isSubmitting} className="w-full bg-[#d9e7c6] text-[#172018] hover:bg-[#e6efd8]">
          {isSubmitting ? copy.auth.loggingIn : copy.auth.login}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-[#929c94]">{copy.auth.noAccount} <Link className="text-[#c5d8b1] hover:text-[#e6efd8]" href="/register">{copy.auth.register}</Link></p>
    </AuthFrame>
  );
}
