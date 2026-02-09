import { z } from "zod"

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  tier: z.enum(["free", "standard", "premium"]).optional(),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      "Expiration date must be in the future"
    ),
  scopes: z.array(z.string().min(1).max(100)).max(20).optional(),
})

export const updateApiKeyTierSchema = z.object({
  tier: z.enum(["free", "standard", "premium"]),
})

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>
export type UpdateApiKeyTierInput = z.infer<typeof updateApiKeyTierSchema>
