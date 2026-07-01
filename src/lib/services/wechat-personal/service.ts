import { prisma } from "@/lib/db/prisma";
import { ingestLink, ingestText } from "@/lib/services/ingestion/service";

export interface PersonalWeChatMessageInput {
  sender?: string;
  text: string;
  receivedAt?: string;
}

export async function handlePersonalWeChatMessage(input: PersonalWeChatMessageInput) {
  const user = await resolvePersonalWeChatUser();
  const url = extractFirstUrl(input.text);
  const sourcePrefix = input.sender ? `来自个人微信 ${input.sender}\n` : "来自个人微信\n";

  if (url) {
    const card = await ingestLink({
      userId: user.id,
      url,
      templateId: "auto",
      defaultPerspective: user.profile?.defaultPerspective
    });
    return { kind: "link" as const, card };
  }

  const card = await ingestText({
    userId: user.id,
    text: `${sourcePrefix}${input.text}`,
    templateId: "auto",
    defaultPerspective: user.profile?.defaultPerspective
  });
  return { kind: "text" as const, card };
}

export function extractFirstUrl(text: string) {
  const matches = Array.from(text.matchAll(/https?:\/\/[^\s"'<>，。！？、]+/gi));
  return matches.at(-1)?.[0] ?? null;
}

async function resolvePersonalWeChatUser() {
  const email = process.env.WECHAT_PERSONAL_DEFAULT_USER_EMAIL;
  if (!email) {
    throw new Error("WECHAT_PERSONAL_DEFAULT_USER_EMAIL is required");
  }
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true }
  });
  if (!user) {
    throw new Error(`Personal WeChat default user not found: ${email}`);
  }
  return user;
}
