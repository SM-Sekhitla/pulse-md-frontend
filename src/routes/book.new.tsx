import { createFileRoute, Link, useParams, useNavigate } from "@/lib/router-compat";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Banknote, Calendar as CalendarIcon, Check, ChevronRight, CreditCard, Loader2, MapPin, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  getPublicGPBySlug,
  getPublicAvailability,
  createPublicBooking,
  getPublicMedicalAidSchemes,
} from "@/lib/public-booking-api";
import type { AppointmentType } from "@/types/appointment";
import { SA_PROVINCES, SA_SUBURBS, type SAProvince } from "@/lib/sa-suburbs";
import { PulseLogoOnDark } from "@/components/brand";

export const Route = createFileRoute("/book/$slug/new")({ component: BookingForm });

const APPOINTMENT_TYPES: AppointmentType[] = ["Consultation", "Follow-up", "Telehealth", "Procedure", "Emergency", "Walk-in"];

interface FormState {
  date: string;
  time: string;
  appointmentType: AppointmentType;
  reason: string;
  firstName: string;
  lastName: string;
  idNumber: string;
  dob: string;
  gender: "M" | "F" | "";
  phone: string;
  email: string;
  billingType: "private" | "medical_aid";
  medicalAidSchemeId: string;
  medicalAid: string;
  medicalAidPlan: string;
  medicalAidNumber: string;
  mainMemberName: string;
  province: string;
  suburb: string;
  consent: boolean;
}

const EMPTY: FormState = {
  date: "", time: "", appointmentType: "Consultation", reason: "",
  firstName: "", lastName: "", idNumber: "", dob: "", gender: "",
  phone: "", email: "", billingType: "private", medicalAidSchemeId: "", medicalAid: "", medicalAidPlan: "", medicalAidNumber: "", mainMemberName: "",
  province: "", suburb: "", consent: false,
};

function BookingForm() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: item, isLoading } = useQuery({
    queryKey: ["public-booking", "tenant", slug],
    queryFn: () => getPublicGPBySlug(slug),
  });
  const { data: days = [] } = useQuery({
    queryKey: ["public-booking", "availability", slug],
    queryFn: () => getPublicAvailability(slug, 14),
  });
  const { data: schemes = [] } = useQuery({
    queryKey: ["public-booking", "medical-aid-schemes", slug],
    queryFn: () => getPublicMedicalAidSchemes(slug),
  });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => ({
    ...EMPTY,
    date: params.get("date") || "",
    time: params.get("time") || "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [topMsg, setTopMsg] = useState<{ kind: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (topMsg) {
      const t = setTimeout(() => setTopMsg(null), 4500);
      return () => clearTimeout(t);
    }
  }, [topMsg]);

  const selectedScheme = schemes.find((scheme) => scheme.id === form.medicalAidSchemeId);
  const selectedDay = days.find((d) => d.date === form.date);
  const suburbs = form.province ? SA_SUBURBS[form.province as SAProvince] || [] : [];

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const stepValid = (s: number): string | null => {
    if (s === 1) {
      if (!form.date) return "Please choose a date.";
      if (!form.time) return "Please pick a time slot.";
    }
    if (s === 2) {
      if (!form.appointmentType) return "Choose a visit type.";
      if (!form.reason.trim()) return "Briefly describe the reason for your visit.";
    }
    if (s === 3) {
      if (!form.firstName.trim() || !form.lastName.trim()) return "Enter your full name.";
      if (!/^\d{13}$/.test(form.idNumber)) return "Enter a valid 13-digit SA ID number.";
      if (!form.dob) return "Enter your date of birth.";
      if (!form.gender) return "Select gender.";
      if (!/^\+?\d[\d\s]{8,}$/.test(form.phone)) return "Enter a valid mobile number.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
      if (!form.province) return "Select your province.";
      if (form.billingType === "medical_aid") {
        if (!selectedScheme) return "Select your medical aid scheme.";
        if (!form.medicalAidPlan.trim()) return "Enter your medical aid plan.";
        if (!form.medicalAidNumber.trim()) return "Enter your member number.";
      }
    }
    if (s === 4) {
      if (!form.consent) return "Please accept the consent to continue.";
    }
    return null;
  };

  const next = () => {
    const err = stepValid(step);
    if (err) { setTopMsg({ kind: "error", text: err }); return; }
    setTopMsg(null);
    setStep((x) => Math.min(4, x + 1));
  };

  const back = () => {
    setTopMsg(null);
    setStep((x) => Math.max(1, x - 1));
  };

  const submit = async () => {
    const err = stepValid(4);
    if (err) { setTopMsg({ kind: "error", text: err }); return; }
    setSubmitting(true);
    try {
      const result = await createPublicBooking(slug, {
        date: form.date,
        time: form.time,
        appointmentType: form.appointmentType,
        reason: form.reason,
        patient: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          idNumber: form.idNumber,
          dob: form.dob,
          gender: form.gender as "M" | "F",
          phone: form.phone,
          email: form.email,
          billingType: form.billingType,
          medicalAid: selectedScheme?.name,
          medicalAidSchemeId: selectedScheme?.id,
          medicalAidSchemeName: selectedScheme?.name,
          medicalAidPlan: form.medicalAidPlan || undefined,
          medicalAidNumber: form.medicalAidNumber || undefined,
          isMainMember: !form.mainMemberName.trim(),
          mainMemberName: form.mainMemberName || undefined,
          province: form.province,
          suburb: form.suburb || undefined,
        },
        consent: form.consent,
      });
      toast.success("Booking confirmed");
      navigate(`/book/confirmation/${result.confirmationToken}`);
    } catch (e) {
      setSubmitting(false);
      setTopMsg({ kind: "error", text: e instanceof Error ? e.message : "Failed to create booking." });
    }
  };

  if (isLoading) {
    return (
      <Shell title="Book an appointment">
        <div className="rounded-xl border border-border bg-white p-10 text-center">
          <div className="text-[15px] font-semibold text-navy">Loading booking page...</div>
        </div>
      </Shell>
    );
  }

  if (!item) {
    return (
      <Shell title="Book an appointment">
        <div className="rounded-xl border border-border bg-white p-10 text-center">
          <div className="text-[15px] font-semibold text-navy">This GP isn't available for booking.</div>
          <Link to="/book" className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to search</Link>
        </div>
      </Shell>
    );
  }

  const { tenant, gp } = item;

  return (
    <Shell title="Book an appointment">
      <div className="mb-4">
        <Link to={`/book/${slug}`} className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-navy">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {gp.title} {gp.lastName}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-white p-6">
          {topMsg && (
            <div className={`mb-4 rounded-md border px-3 py-2 text-[12.5px] ${topMsg.kind === "error" ? "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]" : "border-blue/30 bg-blue/5 text-blue"}`}>
              {topMsg.text}
            </div>
          )}

          <Stepper step={step} />

          {step === 1 && (
            <section className="mt-6 space-y-5">
              <Heading title="Choose a date and time" desc="Pick from the GP's next 14 days of availability." />
              <div>
                <Label>Date</Label>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {days.map((d) => {
                    const dt = parseISO(d.date);
                    const open = d.slots.length > 0;
                    const selected = form.date === d.date;
                    return (
                      <button
                        type="button"
                        key={d.date}
                        disabled={!open}
                        onClick={() => { set("date", d.date); set("time", ""); }}
                        className={`rounded-md border p-2 text-center transition-colors ${
                          selected ? "border-blue bg-blue text-white" :
                          open ? "border-border bg-white hover:border-blue text-navy" :
                          "border-transparent bg-muted text-muted-foreground cursor-not-allowed"
                        } ${isToday(dt) && !selected ? "ring-2 ring-blue/30" : ""}`}
                      >
                        <div className="text-[10.5px] uppercase tracking-wide opacity-80">{format(dt, "EEE")}</div>
                        <div className="text-[15px] font-semibold">{format(dt, "d")}</div>
                        <div className="text-[10.5px] opacity-80">{open ? `${d.slots.length}` : "—"}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {selectedDay && (
                <div>
                  <Label>Time slot ({selectedDay.slots.length} available on {format(parseISO(selectedDay.date), "EEE d MMM")})</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {selectedDay.slots.map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => set("time", t)}
                        className={`rounded-md border px-2 py-1.5 text-[12.5px] font-medium ${form.time === t ? "border-blue bg-blue text-white" : "border-border bg-white text-navy hover:border-blue"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="mt-6 space-y-5">
              <Heading title="Reason for visit" desc="Help the GP prepare for your appointment." />
              <div>
                <Label>Visit type</Label>
                <select value={form.appointmentType} onChange={(e) => set("appointmentType", e.target.value as AppointmentType)} className="mt-1 h-10 w-full rounded-md border border-border bg-white px-3 text-[13px] text-navy">
                  {APPOINTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Reason for visit</Label>
                <textarea
                  value={form.reason}
                  onChange={(e) => set("reason", e.target.value)}
                  rows={4}
                  placeholder="e.g. Flu symptoms for the past 3 days, persistent cough"
                  className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] text-navy placeholder:text-muted-foreground"
                />
                <div className="mt-1 text-[11px] text-muted-foreground">This is shared only with your GP.</div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="mt-6 space-y-5">
              <Heading title="Your details" desc="So the GP can identify you and contact you about the booking." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name"><input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className={inp} /></Field>
                <Field label="Last name"><input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className={inp} /></Field>
                <Field label="SA ID number"><input value={form.idNumber} onChange={(e) => set("idNumber", e.target.value.replace(/\D/g, "").slice(0, 13))} placeholder="13 digits" className={inp} inputMode="numeric" /></Field>
                <Field label="Date of birth"><input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} className={inp} /></Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={(e) => set("gender", e.target.value as "M" | "F")} className={inp}>
                    <option value="">Select…</option>
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </select>
                </Field>
                <Field label="Mobile number"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+27 82 555 0123" className={inp} /></Field>
                <Field label="Email" className="sm:col-span-2"><input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inp} /></Field>
                <Field label="Province">
                  <select value={form.province} onChange={(e) => { set("province", e.target.value); set("suburb", ""); }} className={inp}>
                    <option value="">Select…</option>
                    {SA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Suburb">
                  <select value={form.suburb} onChange={(e) => set("suburb", e.target.value)} disabled={!form.province} className={inp}>
                    <option value="">{form.province ? "Select…" : "Pick province first"}</option>
                    {suburbs.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Label>Payment type</Label>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <PaymentTile
                      active={form.billingType === "private"}
                      icon={Banknote}
                      iconClassName="bg-[#DCFCE7] text-success"
                      title="Private patient"
                      sub="Cash or card. Patient pays directly."
                      onClick={() => setForm((current) => ({ ...current, billingType: "private", medicalAidSchemeId: "", medicalAid: "", medicalAidPlan: "", medicalAidNumber: "", mainMemberName: "" }))}
                    />
                    <PaymentTile
                      active={form.billingType === "medical_aid"}
                      icon={CreditCard}
                      iconClassName="bg-blue-tint text-blue"
                      title="Medical aid member"
                      sub="Claim through a registered scheme."
                      onClick={() => setForm((current) => ({ ...current, billingType: "medical_aid", medicalAidSchemeId: current.medicalAidSchemeId || schemes[0]?.id || "" }))}
                    />
                  </div>
                </div>
                {form.billingType === "medical_aid" && (
                  <div className="sm:col-span-2 rounded-xl border border-[#B8CAFF] bg-[#EEF4FF] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#1D4ED8]">Medical aid details</div>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <Field label="Scheme">
                        <select value={form.medicalAidSchemeId} onChange={(e) => {
                          const scheme = schemes.find((item) => item.id === e.target.value);
                          setForm((current) => ({ ...current, medicalAidSchemeId: e.target.value, medicalAid: scheme?.name ?? "", medicalAidPlan: scheme?.plans[0] ?? "" }));
                        }} className={inp}>
                          <option value="">Select...</option>
                          {schemes.map((scheme) => <option key={scheme.id} value={scheme.id}>{scheme.name} - {scheme.administrator}</option>)}
                        </select>
                      </Field>
                      <Field label="Plan / option">
                        {selectedScheme?.plans.length ? (
                          <select value={form.medicalAidPlan} onChange={(e) => set("medicalAidPlan", e.target.value)} className={inp}>
                            <option value="">Select...</option>
                            {selectedScheme.plans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                          </select>
                        ) : (
                          <input value={form.medicalAidPlan} onChange={(e) => set("medicalAidPlan", e.target.value)} className={inp} placeholder="Plan name" />
                        )}
                      </Field>
                      <Field label="Member number">
                        <input value={form.medicalAidNumber} onChange={(e) => set("medicalAidNumber", e.target.value)} className={inp} />
                      </Field>
                      <Field label="Main member's name (if you are a dependant)">
                        <input value={form.mainMemberName} onChange={(e) => set("mainMemberName", e.target.value)} className={inp} />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 4 && (
            <section className="mt-6 space-y-5">
              <Heading title="Review and confirm" desc="Double-check the details below before submitting." />
              <ReviewCard label="Appointment" icon={<CalendarIcon className="h-4 w-4" />}>
                <div className="font-medium text-navy">{form.date && format(parseISO(form.date), "EEEE d MMMM yyyy")} at {form.time}</div>
                <div className="text-muted-foreground">{form.appointmentType} · {tenant.name}</div>
                {form.reason && <div className="mt-1 text-muted-foreground">Reason: {form.reason}</div>}
              </ReviewCard>
              <ReviewCard label="Patient" icon={<UserIcon className="h-4 w-4" />}>
                <div className="font-medium text-navy">{form.firstName} {form.lastName}</div>
                <div className="text-muted-foreground">ID {form.idNumber} · {form.gender === "F" ? "Female" : "Male"} · DOB {form.dob}</div>
                <div className="text-muted-foreground">{form.phone} · {form.email}</div>
                {form.billingType === "medical_aid" && <div className="text-muted-foreground">{selectedScheme?.name} {form.medicalAidNumber && `(#${form.medicalAidNumber})`}</div>}
              </ReviewCard>
              <ReviewCard label="Location" icon={<MapPin className="h-4 w-4" />}>
                <div className="font-medium text-navy">{[form.suburb, form.province].filter(Boolean).join(", ")}</div>
                {tenant.address && <div className="text-muted-foreground">Practice: {tenant.address}</div>}
              </ReviewCard>

              <label className="flex items-start gap-2 rounded-md border border-border bg-surface p-3 text-[12.5px] text-navy/80">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={(e) => set("consent", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-blue"
                />
                <span>
                  I consent to PulseMD and {tenant.name} processing my personal information for the purpose of this booking, in line with POPIA. I understand my contact details will be used to send appointment confirmations and reminders.
                </span>
              </label>
            </section>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <button
              type="button"
              onClick={back}
              disabled={step === 1 || submitting}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            {step < 4 ? (
              <button type="button" onClick={next} className="inline-flex items-center gap-1.5 rounded-md bg-navy px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-navy/90">
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-1.5 rounded-md bg-blue px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue/90 disabled:opacity-60">
                {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Booking…</> : <>Confirm booking <Check className="h-3.5 w-3.5" /></>}
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Booking with</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue/10 text-[14px] font-semibold text-blue">
                {gp.firstName?.[0]}{gp.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-navy truncate">{gp.title} {gp.firstName} {gp.lastName}</div>
                <div className="text-[12px] text-muted-foreground truncate">{tenant.name}</div>
              </div>
            </div>
            {tenant.address && (
              <div className="mt-3 flex items-start gap-1.5 text-[12px] text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {tenant.address}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-white p-5 text-[12.5px]">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Selected slot</div>
            <div className="mt-2 font-semibold text-navy">
              {form.date ? format(parseISO(form.date), "EEE d MMM yyyy") : "No date yet"}
            </div>
            <div className="text-muted-foreground">{form.time || "No time yet"}</div>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

const inp = "h-10 w-full rounded-md border border-border bg-white px-3 text-[13px] text-navy placeholder:text-muted-foreground";

function Heading({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-semibold text-navy">{title}</h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</div>;
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ReviewCard({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 text-[13px]">{children}</div>
    </div>
  );
}

function PaymentTile({
  active,
  icon: Icon,
  iconClassName,
  title,
  sub,
  onClick,
}: {
  active: boolean;
  icon: typeof Banknote;
  iconClassName: string;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left transition-colors ${active ? "border-blue bg-white" : "border-white/60 bg-white/70 hover:border-blue"}`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClassName}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-[14px] font-semibold text-navy">{title}</div>
      <div className="mt-1 text-[12.5px] text-muted-foreground">{sub}</div>
    </button>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["Date & time", "Reason", "Your details", "Review"];
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {labels.map((lab, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={lab} className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${done ? "bg-success text-white" : active ? "bg-navy text-white" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check className="h-3 w-3" /> : n}
            </div>
            <span className={`hidden sm:inline ${active ? "font-semibold text-navy" : done ? "text-navy/70" : "text-muted-foreground"}`}>{lab}</span>
            {n < 4 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </div>
        );
      })}
    </div>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[url('/images/booking-hero.jpg')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-navy/95 to-blue/75" />

        <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <PulseLogoOnDark size={38} />
            </Link>

            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white/90 backdrop-blur">
              {title}
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-10">
          <div className="max-w-3xl">


            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Complete your booking details.
            </h1>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/70">
              Choose your slot, tell the practice why you are visiting, and confirm your
              appointment details.
            </p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
