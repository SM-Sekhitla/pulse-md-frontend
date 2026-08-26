import API, { getApiErrorMessage } from "@/utils/api";
import { DEFAULT_MEDICAL_AID_SCHEMES, type MedicalAidScheme } from "@/lib/medical-aid";
import { tenantOutSchema } from "@/schema/tenant";
import { appointmentSchema } from "@/schema/appointment";
import type { Appointment, AppointmentType } from "@/types/appointment";
import type { TenantOut } from "@/types/tenant";
import type { UserOut } from "@/types/user";

export interface PublicGP {
  tenant: TenantOut;
  gp: UserOut;
}

export interface AvailabilityDay {
  date: string;
  slots: string[];
}

export interface PublicBookingPayload {
  date: string;
  time: string;
  appointmentType: AppointmentType;
  reason: string;
  consent: boolean;
  patient: {
    firstName: string;
    lastName: string;
    idNumber: string;
    dob: string;
    gender: "M" | "F";
    phone: string;
    email: string;
    billingType: "private" | "medical_aid";
    medicalAid?: string;
    medicalAidSchemeId?: string;
    medicalAidSchemeName?: string;
    medicalAidPlan?: string;
    medicalAidNumber?: string;
    isMainMember?: boolean;
    mainMemberName?: string;
    province?: string;
    suburb?: string;
  };
}

export interface PublicBookingConfirmation {
  appointment: Appointment;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  tenant: TenantOut;
  gp: UserOut | null;
  reference: string;
  confirmationToken: string;
}

export async function getPublicBookingTenants(): Promise<PublicGP[]> {
  const res = await API.get("/tenants");
  return tenantOutSchema
    .array()
    .parse(res.data)
    .filter((tenant) => tenant.status === "active" && tenant.bookingEnabled && tenant.owner)
    .map((tenant) => ({
      tenant,
      gp: tenant.owner!,
    }));
}

export async function getPublicGPBySlug(slug: string): Promise<PublicGP | null> {
  const practices = await getPublicBookingTenants();
  return (
    practices.find(({ tenant }) => tenant.slug === slug || tenant.bookingSlug === slug) ?? null
  );
}

export async function getPublicAvailability(
  slug: string,
  days = 14,
): Promise<AvailabilityDay[]> {
  const item = await getPublicGPBySlug(slug);
  return item ? availabilityFromTenant(item.tenant, days) : [];
}

export async function getPublicMedicalAidSchemes(
  _slug: string,
): Promise<MedicalAidScheme[]> {
  return DEFAULT_MEDICAL_AID_SCHEMES.filter(
    (scheme) => scheme.isActive && scheme.acceptedByPractice,
  );
}

export async function createPublicBooking(
  slug: string,
  payload: PublicBookingPayload,
): Promise<PublicBookingConfirmation> {
  try {
    const res = await API.post(
      `/public/booking/${encodeURIComponent(slug)}`,
      payload,
      { suppressErrorToast: true },
    );
    return parseConfirmation(res.data);
  } catch (error) {
    throw new Error(getPublicBookingErrorMessage(error));
  }
}

export async function getPublicAppointment(
  id: string,
): Promise<PublicBookingConfirmation | null> {
  try {
    const res = await API.get(`/public/booking/appointments/${id}`);
    return parseConfirmation(res.data);
  } catch {
    return null;
  }
}

export function nextAvailableSlot(days: AvailabilityDay[]) {
  const day = days.find((item) => item.slots.length > 0);
  if (!day) return null;
  return { date: day.date, time: day.slots[0] };
}

function parseConfirmation(value: unknown): PublicBookingConfirmation {
  const item = value as PublicBookingConfirmation;
  return {
    ...item,
    tenant: tenantOutSchema.parse(item.tenant),
    appointment: appointmentSchema.parse(item.appointment),
  };
}

function getPublicBookingErrorMessage(error: unknown): string {
  const status = (error as any)?.response?.status;
  const detail = (error as any)?.response?.data?.detail;
  const message = typeof detail === "string" ? detail : "";

  if (status === 404) {
    return "This practice is not available for public booking right now.";
  }

  if (status === 409) {
    if (message.toLowerCase().includes("time slot")) {
      return "That time slot has just been booked. Please choose another time.";
    }
    return "We could not create this booking because the patient details already exist in a different record. Please contact the practice.";
  }

  if (status === 400 && message && !message.toLowerCase().includes("validation error")) {
    return message;
  }

  if (status === 422) {
    return "Please check the booking details and try again.";
  }

  const fallback = getApiErrorMessage(error);
  if (fallback.toLowerCase().includes("validation error") || fallback.includes("(Request ")) {
    return "We could not create the booking right now. Please try again, or contact the practice.";
  }

  return fallback || "We could not create the booking right now. Please try again.";
}

export function availabilityFromTenant(tenant: TenantOut, days: number): AvailabilityDay[] {
  const today = new Date();
  const now = new Date();
  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    date.setHours(0, 0, 0, 0);

    const key = dayKeys[date.getDay()];
    const shortKey = key.slice(0, 3);
    const configured = tenant.workingHours?.find(
      (item) => item.key.toLowerCase() === key || item.key.toLowerCase() === shortKey,
    );
    const weekday = date.getDay() > 0 && date.getDay() < 6;
    const enabled = configured ? configured.enabled : weekday;
    const start = configured?.start ?? "08:00";
    const end = configured?.end ?? "16:00";
    const slots: string[] = [];

    if (enabled) {
      let cursor = toMinutes(start);
      const closing = toMinutes(end);

      while (cursor + 30 <= closing) {
        const slot = fromMinutes(cursor);
        const slotDate = new Date(date);
        slotDate.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);

        if (slotDate > now) slots.push(slot);
        cursor += 30;
      }
    }

    return {
      date: localDateKey(date),
      slots,
    };
  });
}

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function toMinutes(value: string): number {
  const [hour = "0", minute = "0"] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

function fromMinutes(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
