import { z } from "zod";

//
// -------------------------------------------------
// Platform Settings
// -------------------------------------------------
export const platformSettingsSchema = z.object({
  superAdminEmail: z.string().email(),
  supportEmail: z.string().email(),

  maintenanceMode: z.boolean().default(false),
});