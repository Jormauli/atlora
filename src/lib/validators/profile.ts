import { z } from "zod";

export const profileSchema = z.object({
  primaryUseCases: z.array(z.string().min(1)).min(1),
  defaultPerspective: z.string().min(1)
});
