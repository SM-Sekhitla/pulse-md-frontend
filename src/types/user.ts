// export type User = {
//   id: string;
//   email: string;
//   role: "superadmin" | "manager" | "booking-staff";
//   username: string;
//   status?: string;
//   createdAt?: string;
// };


import { z } from "zod";
import {
  userSchema,
  userCreateSchema,
  userUpdateSchema,
  userOutSchema,
  userOutWithPasswordSchema,
  roleUpdateSchema,
  changePasswordSchema,
  emailRequestSchema,
  otpVerifySchema,
  resetPasswordSchema,
} from "@/schema/user";

//
// -------------------------------------------------
// Core Types
// -------------------------------------------------
export type User = z.infer<typeof userSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;

//
// -------------------------------------------------
// Output Types
// -------------------------------------------------
export type UserOut = z.infer<typeof userOutSchema>;
export type UserOutWithPassword = z.infer<typeof userOutWithPasswordSchema>;

//
// -------------------------------------------------
// Role
// -------------------------------------------------
export type RoleUpdate = z.infer<typeof roleUpdateSchema>;

//
// -------------------------------------------------
// Auth Types
// -------------------------------------------------
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>;
export type EmailRequest = z.infer<typeof emailRequestSchema>;
export type OTPVerifyRequest = z.infer<typeof otpVerifySchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;