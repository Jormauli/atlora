import { redirect } from "next/navigation";
import { PublicHome } from "@/components/public-home";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <PublicHome />;
}
