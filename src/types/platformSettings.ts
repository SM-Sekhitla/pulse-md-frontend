import { z } from "zod";
import { platformSettingsSchema } from "@/schema/platformSettings";

//
// -------------------------------------------------
// Core Type
// -------------------------------------------------
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;