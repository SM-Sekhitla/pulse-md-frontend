import { z } from "zod";
import {
  sickNoteSchema,
  sickNoteCreateSchema,
  sickNoteUpdateSchema,
  sickNoteOutSchema,
} from "@/schema/sicknote";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type SickNote = z.infer<typeof sickNoteSchema>;
export type SickNoteCreate = z.infer<typeof sickNoteCreateSchema>;
export type SickNoteUpdate = z.infer<typeof sickNoteUpdateSchema>;

//
// -------------------------------------------------
// Output
// -------------------------------------------------
export type SickNoteOut = z.infer<typeof sickNoteOutSchema>;