import { z } from "zod";
import { contentViews } from "@/lib/content-views";

const contentViewIds = contentViews.map((view) => view.id) as string[];

export const profileSchema = z.object({
  primaryUseCases: z.array(z.string().min(1)).min(1),
  defaultPerspective: z.string().optional()
}).transform((profile) => ({
  primaryUseCases: profile.primaryUseCases.filter((value) => contentViewIds.includes(value)),
  defaultPerspective: profile.defaultPerspective
})).refine((profile) => profile.primaryUseCases.length > 0, {
  message: "至少选择一个内容视角",
  path: ["primaryUseCases"]
});
