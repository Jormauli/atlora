"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Suspense, useEffect } from "react";

let posthogInitialized = false;

function PostHogPageviewTracker({
  user
}: {
  user?: { id: string; email?: string | null; createdAt?: string | null } | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    if (!posthogInitialized) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false,
        autocapture: false,
        disable_session_recording: true
      });
      posthogInitialized = true;
    }
    if (user?.id) {
      posthog.identify(user.id, { email: user.email ?? undefined, createdAt: user.createdAt ?? undefined });
    }
    const query = searchParams?.toString();
    posthog.capture("$pageview", { $current_url: query ? `${pathname}?${query}` : pathname });
  }, [pathname, searchParams, user?.id, user?.email, user?.createdAt]);

  return null;
}

export function PostHogProvider({
  children,
  user
}: {
  children: React.ReactNode;
  user?: { id: string; email?: string | null; createdAt?: string | null } | null;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageviewTracker user={user} />
      </Suspense>
      {children}
    </>
  );
}
