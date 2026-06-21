import { getCurrentUser } from "@/lib/auth/session";
import { AppShellClient } from "./app-shell-client";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return <AppShellClient userLabel={user?.nickname ?? user?.email}>{children}</AppShellClient>;
}
