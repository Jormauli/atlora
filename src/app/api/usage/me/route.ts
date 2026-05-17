import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getMonthlyOCRQuotaSummary } from "@/lib/services/usage/ocr-quota";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const usage = await prisma.usageLedger.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  const ocrQuota = await getMonthlyOCRQuotaSummary(user.id);
  return NextResponse.json({ usage, ocrQuota });
}
