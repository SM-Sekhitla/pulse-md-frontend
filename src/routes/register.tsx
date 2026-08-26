import { createFileRoute, Link, useNavigate } from "@/lib/router-compat";
import { useMemo, useState, type ReactNode } from "react";
import { PulseLogo } from "@/components/brand";
import type { Plan } from "@/types/tenant";
import {
  ArrowRight,
  Building2,
  Check,
  Clock,
  MapPin,
  Upload,
} from "lucide-react";
import API from "@/utils/api";
import { toast } from "sonner";
import { SA_PROVINCES, SA_SUBURBS, type SAProvince } from "@/lib/sa-suburbs";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const STEPS = ["Practice", "Profile", "Hours", "Branding", "Plan"];
const PLANS = ["Starter", "Growth", "Enterprise"] as Plan[];
const TITLES = ["Dr", "Prof", "Mr", "Ms", "Mrs"];
const DAYS = [
  { key: "mon", label: "Monday", short: "Mon" },
  { key: "tue", label: "Tuesday", short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday", short: "Thu" },
  { key: "fri", label: "Friday", short: "Fri" },
  { key: "sat", label: "Saturday", short: "Sat" },
  { key: "sun", label: "Sunday", short: "Sun" },
] as const;
const PLAN_DETAILS: Record<Plan, { price: string; blurb: string; features: string[] }> = {
  Starter: {
    price: "R799",
    blurb: "For a solo GP getting the basics live.",
    features: ["Online bookings", "Patient records", "Billing basics"],
  },
  Growth: {
    price: "R1,799",
    blurb: "For practices ready to automate the front desk.",
    features: ["Everything in Starter", "Reminders", "Reports"],
  },
  Enterprise: {
    price: "Custom",
    blurb: "For multi-provider or high-volume practices.",
    features: ["Custom modules", "Priority support", "Advanced controls"],
  },
};

type WorkingHour = {
  key: (typeof DAYS)[number]["key"];
  label: string;
  short: string;
  enabled: boolean;
  start: string;
  end: string;
};

const INITIAL_HOURS: WorkingHour[] = DAYS.map((day, index) => ({
  ...day,
  enabled: index < 5,
  start: "08:00",
  end: "17:00",
}));

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    practiceName: "",
    address: "",
    province: "",
    hpcsa: "",
    vat: "",
    title: "Dr",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    plan: "Growth" as Plan,
    companyProfile: "",
    logoName: "",
    logoDataUrl: "",
  });
  const [hours, setHours] = useState<WorkingHour[]>(INITIAL_HOURS);
  const [logoPreview, setLogoPreview] = useState("");
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));
  const [submitting, setSubmitting] = useState(false);

  const addressSuggestions = useMemo(() => {
    const query = form.address.trim().toLowerCase();
    const provinces = form.province
      ? ([form.province] as SAProvince[])
      : SA_PROVINCES;
    return provinces
      .flatMap((province) =>
        SA_SUBURBS[province].map((suburb) => ({
          province,
          suburb,
          address: `${suburb}, ${province}, South Africa`,
        }))
      )
      .filter((item) => {
        if (!query) return true;
        return item.address.toLowerCase().includes(query);
      })
      .slice(0, 7);
  }, [form.address, form.province]);

  const validateStep = () => {
    if (step === 0) {
      if (!form.practiceName.trim()) return "Enter the practice name.";
      if (!form.hpcsa.trim()) return "Enter the HPCSA practice number.";
      if (!form.address.trim()) return "Enter the physical address.";
      if (!form.province) return "Select a province.";
    }
    if (step === 1) {
      if (!form.firstName.trim()) return "Enter the GP's first name.";
      if (!form.lastName.trim()) return "Enter the GP's last name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        return "Enter a valid email address.";
      }
      if (!form.phone.trim()) return "Enter a phone number.";
    }
    if (step === 2) {
      if (!hours.some((day) => day.enabled)) {
        return "Add at least one day patients can book.";
      }
      if (hours.some((day) => day.enabled && day.start >= day.end)) {
        return "Make sure every enabled day has an end time after the start time.";
      }
    }
    if (step === 4 && !form.plan) return "Choose a plan.";
    return "";
  };

  const next = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setSubmitting(true);
      try {
        await API.post("/onboarding", {
          ...form,
          address: form.address.trim(),
          practiceName: form.practiceName.trim(),
          hpcsa: form.hpcsa.trim(),
          vat: form.vat.trim() || null,
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          workingHours: hours,
          branding: {
            companyProfile: form.companyProfile.trim(),
            logoName: form.logoName || null,
            logoDataUrl: form.logoDataUrl || null,
          },
        }, {
          headers: {
            "Idempotency-Key": crypto.randomUUID(),
          },
        });
        navigate({ to: "/pending" });
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Application submission failed.");
      } finally {
        setSubmitting(false);
      }
    }
  };
  const back = () => step > 0 && setStep(step - 1);
  const continueLabel = step === STEPS.length - 1 ? "Submit application" : "Continue";

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-white px-8 py-4">
        <div className="mx-auto flex max-w-[920px] items-center justify-between">
          <Link to="/">
            <PulseLogo />
          </Link>
          <Link
            to="/login"
            className="text-[13px] text-muted-foreground hover:text-navy"
          >
            Already have an account?
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[920px] px-8 py-10">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${
                  i < step
                    ? "bg-blue text-white"
                    : i === step
                      ? "bg-navy text-white"
                      : "bg-white border border-border text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div
                className={`text-[12.5px] ${i === step ? "font-semibold text-navy" : "text-muted-foreground"}`}
              >
                {s}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${i < step ? "bg-blue" : "bg-border"}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pulse-card p-8">
          {step === 0 && (
            <Section
              title="Tell us about your practice"
              sub="This creates the tenant record and public booking location."
            >
              <Grid>
                <Input
                  label="Practice name"
                  value={form.practiceName}
                  onChange={set("practiceName")}
                />
                <Input
                  label="HPCSA practice number"
                  value={form.hpcsa}
                  onChange={set("hpcsa")}
                />
                <AddressInput
                  value={form.address}
                  suggestions={addressSuggestions}
                  showSuggestions={showAddressSuggestions}
                  onFocus={() => setShowAddressSuggestions(true)}
                  onBlur={() => window.setTimeout(() => setShowAddressSuggestions(false), 120)}
                  onChange={(value) => {
                    const inferredProvince = inferProvince(value);
                    setForm((current) => ({
                      ...current,
                      address: value,
                      province: inferredProvince ?? current.province,
                    }));
                    setShowAddressSuggestions(true);
                  }}
                  onSelect={(suggestion) => {
                    setForm((current) => ({
                      ...current,
                      address: suggestion.address,
                      province: suggestion.province,
                    }));
                    setShowAddressSuggestions(false);
                  }}
                />
                <SelectInput
                  label="Province"
                  value={form.province}
                  onChange={set("province")}
                  placeholder="Select province"
                  options={SA_PROVINCES}
                />
                <Input
                  label="VAT number (optional)"
                  value={form.vat}
                  onChange={set("vat")}
                />
              </Grid>
            </Section>
          )}
          {step === 1 && (
            <Section
              title="GP profile"
              sub="Primary practitioner for this account."
            >
              <Grid>
                <SelectInput
                  label="Title"
                  value={form.title}
                  onChange={set("title")}
                  options={TITLES}
                />
                <Input
                  label="First name"
                  value={form.firstName}
                  onChange={set("firstName")}
                />
                <Input
                  label="Last name"
                  value={form.lastName}
                  onChange={set("lastName")}
                />
                <Input
                  label="Email"
                  value={form.email}
                  onChange={set("email")}
                  type="email"
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </Grid>
            </Section>
          )}
          {step === 2 && <HoursStep hours={hours} onChange={setHours} />}
          {step === 3 && (
            <BrandingStep
              companyProfile={form.companyProfile}
              logoName={form.logoName}
              logoPreview={logoPreview}
              onProfileChange={set("companyProfile")}
              onLogoChange={(file) => {
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  setError("Choose a logo smaller than 2 MB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  const dataUrl = String(reader.result || "");
                  setForm((current) => ({
                    ...current,
                    logoName: file.name,
                    logoDataUrl: dataUrl,
                  }));
                  setLogoPreview(dataUrl);
                  setError("");
                };
                reader.readAsDataURL(file);
              }}
            />
          )}
          {step === 4 && (
            <Section
              title="Choose your plan"
              sub="Start with a 30-day free trial. No credit card required."
            >
              <div className="mt-2 grid gap-4 md:grid-cols-3">
                {PLANS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("plan")(p)}
                    className={`rounded-lg border-2 p-5 text-left transition hover:border-blue/70 ${form.plan === p ? "border-blue bg-blue-tint" : "border-border bg-white"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-semibold text-navy">{p}</div>
                      {form.plan === p && (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-[24px] font-bold text-navy">
                      {PLAN_DETAILS[p].price}
                      <span className="text-[12px] font-normal text-muted-foreground">
                        {p === "Enterprise" ? "" : "/mo"}
                      </span>
                    </div>
                    <p className="mt-2 min-h-10 text-[12.5px] text-muted-foreground">
                      {PLAN_DETAILS[p].blurb}
                    </p>
                    <div className="mt-4 space-y-2">
                      {PLAN_DETAILS[p].features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-[12.5px] text-navy">
                          <Check className="h-3.5 w-3.5 text-blue" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {error && (
            <div className="mt-6 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-[13px] text-destructive">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-border pt-6">
            <button
              onClick={back}
              disabled={step === 0}
              className="rounded-md px-4 py-2 text-[13px] font-medium text-muted-foreground disabled:opacity-30 hover:text-navy"
            >
              Back
            </button>
            <button
              onClick={next}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90"
            >
              {submitting ? "Submitting..." : continueLabel}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-[20px] font-semibold text-navy">{title}</h2>
      <p className="mt-1 text-[13.5px] text-muted-foreground">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}
function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type AddressSuggestion = {
  province: SAProvince;
  suburb: string;
  address: string;
};

function AddressInput({
  value,
  suggestions,
  showSuggestions,
  onChange,
  onSelect,
  onFocus,
  onBlur,
}: {
  value: string;
  suggestions: AddressSuggestion[];
  showSuggestions: boolean;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <label className="relative block md:col-span-2">
      <span className="text-[12.5px] font-medium text-navy">Physical address</span>
      <div className="relative mt-1.5">
        <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          value={value}
          placeholder="Start typing suburb, city, or full street address"
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="block w-full rounded-md border border-border bg-white px-9 py-2.5 text-[13.5px] outline-none focus:border-blue"
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-md border border-border bg-white p-1 shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.province}-${suggestion.suburb}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(suggestion)}
              className="flex w-full items-center justify-between gap-4 rounded px-3 py-2 text-left text-[13px] hover:bg-blue-tint"
            >
              <span className="font-medium text-navy">{suggestion.suburb}</span>
              <span className="text-muted-foreground">{suggestion.province}</span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

function HoursStep({
  hours,
  onChange,
}: {
  hours: WorkingHour[];
  onChange: (hours: WorkingHour[]) => void;
}) {
  const applyAll = (start: string, end: string) => {
    onChange(hours.map((day) => ({ ...day, enabled: true, start, end })));
  };
  const applyWeekdays = (start: string, end: string) => {
    onChange(
      hours.map((day, index) => ({
        ...day,
        enabled: index < 5,
        start: index < 5 ? start : day.start,
        end: index < 5 ? end : day.end,
      }))
    );
  };
  const updateDay = (key: WorkingHour["key"], patch: Partial<WorkingHour>) => {
    onChange(hours.map((day) => (day.key === key ? { ...day, ...patch } : day)));
  };

  return (
    <Section
      title="Working hours"
      sub="Set booking availability once, then adjust individual days only where needed."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => applyWeekdays("08:00", "17:00")}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-blue-tint"
        >
          <Clock className="h-4 w-4 text-blue" />
          Apply 08:00-17:00 weekdays
        </button>
        <button
          type="button"
          onClick={() => applyAll("08:00", "13:00")}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-blue-tint"
        >
          <Clock className="h-4 w-4 text-blue" />
          Apply to whole week
        </button>
        <button
          type="button"
          onClick={() => onChange(hours.map((day, index) => ({ ...day, enabled: index < 5 })))}
          className="rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-navy hover:bg-blue-tint"
        >
          Close weekends
        </button>
      </div>
      <div className="space-y-2">
        {hours.map((day) => (
          <div
            key={day.key}
            className={`grid gap-3 rounded-md border px-4 py-3 md:grid-cols-[minmax(150px,1fr)_140px_24px_140px] md:items-center ${
              day.enabled ? "border-border bg-white" : "border-border bg-muted/50"
            }`}
          >
            <label className="flex items-center gap-2 text-[13px] font-medium text-navy">
              <input
                type="checkbox"
                checked={day.enabled}
                onChange={(e) => updateDay(day.key, { enabled: e.target.checked })}
                className="rounded"
              />
              <span className="hidden sm:inline">{day.label}</span>
              <span className="sm:hidden">{day.short}</span>
            </label>
            <input
              type="time"
              value={day.start}
              disabled={!day.enabled}
              onChange={(e) => updateDay(day.key, { start: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-[13px] disabled:bg-muted"
            />
            <span className="hidden text-center text-muted-foreground md:block">to</span>
            <input
              type="time"
              value={day.end}
              disabled={!day.enabled}
              onChange={(e) => updateDay(day.key, { end: e.target.value })}
              className="w-full rounded-md border border-border bg-white px-2 py-1.5 text-[13px] disabled:bg-muted"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}

function BrandingStep({
  companyProfile,
  logoName,
  logoPreview,
  onProfileChange,
  onLogoChange,
}: {
  companyProfile: string;
  logoName: string;
  logoPreview: string;
  onProfileChange: (value: string) => void;
  onLogoChange: (file: File | null) => void;
}) {
  return (
    <Section
      title="Branding"
      sub="Add the practice profile and logo patients will recognise."
    >
      <div className="grid gap-5 md:grid-cols-[220px,1fr]">
        <label className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white p-5 text-center hover:border-blue hover:bg-blue-tint">
          {logoPreview ? (
            <img
              src={logoPreview}
              alt=""
              className="h-24 w-24 rounded-md object-contain"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-md bg-blue-tint text-blue">
              <Upload className="h-7 w-7" />
            </span>
          )}
          <span className="mt-3 text-[13px] font-medium text-navy">
            {logoName || "Upload logo"}
          </span>
          <span className="mt-1 text-[12px] text-muted-foreground">
            PNG or JPG, up to 2 MB
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => onLogoChange(event.target.files?.[0] ?? null)}
          />
        </label>

        <label className="block">
          <span className="text-[12.5px] font-medium text-navy">Company profile</span>
          <textarea
            value={companyProfile}
            onChange={(event) => onProfileChange(event.target.value)}
            placeholder="A short profile of the practice, services, and patient care focus."
            className="mt-1.5 min-h-44 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue"
          />
        </label>
      </div>
      <div className="mt-5 rounded-lg border border-border bg-white p-4">
        <div className="mb-3 flex items-center gap-2 text-[12.5px] font-semibold text-navy">
          <Building2 className="h-4 w-4 text-blue" />
          Booking profile preview
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-blue-tint">
            {logoPreview ? (
              <img src={logoPreview} alt="" className="h-10 w-10 object-contain" />
            ) : (
              <Building2 className="h-5 w-5 text-blue" />
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">
            {companyProfile.trim() ||
              "Your practice profile will appear here once you add it."}
          </p>
        </div>
      </div>
    </Section>
  );
}

function inferProvince(value: string): SAProvince | null {
  const lower = value.toLowerCase();
  const direct = SA_PROVINCES.find((province) => lower.includes(province.toLowerCase()));
  if (direct) return direct;

  for (const province of SA_PROVINCES) {
    if (SA_SUBURBS[province].some((suburb) => lower.includes(suburb.toLowerCase()))) {
      return province;
    }
  }
  return null;
}
