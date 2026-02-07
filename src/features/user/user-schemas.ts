import { z } from "zod"

export const updatePreferencesSchema = z.object({
  skillLevel: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
  preferredCategories: z
    .array(z.number().int().positive())
    .optional(),
  learningGoals: z
    .array(z.string().max(200))
    .max(10)
    .optional(),
  timeCommitment: z
    .enum(["casual", "regular", "dedicated", "intensive"])
    .optional(),
  theme: z
    .enum(["cyberpunk", "modern-light", "modern-dark", "high-contrast"])
    .optional(),
  viewMode: z.enum(["grid", "list", "compact"]).optional(),
  emailNotifications: z.boolean().optional(),
})

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>
