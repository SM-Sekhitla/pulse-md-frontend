import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PulseLogo } from "@/components/brand";
import { registerTenant, type Plan } from "@/lib/store";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const STEPS = ["Practice", "Profile", "Hours", "Branding", "Plan"];

function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    practiceName: "Northcliff Family Practice",
    address: "",
    province: "Gauteng",
    hpcsa: "MP0712345",
    vat: "",
    title: "Dr",
    firstName: "Mira",
    lastName: "Naidoo",
    email: "dr.naidoo@northcliff.health",
    phone: "+27 82 555 0123",
    plan: "Growth" as Plan,
  });
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else {
      registerTenant(form);
      navigate({ to: "/pending" });
    }
  };
  const back = () => step > 0 && setStep(step - 1);

  return (
    <div className="min-h-screen bg-surface">
      <div className="border-b border-border bg-white px-8 py-4">
        <div className="mx-auto flex max-w-[920px] items-center justify-between">
          <Link to="/"><PulseLogo /></Link>
          <Link to="/login" className="text-[13px] text-muted-foreground hover:text-navy">Already have an account?</Link>
        </div>
      </div>

      <div className="mx-auto max-w-[920px] px-8 py-10">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold ${
                i < step ? "bg-blue text-white" : i === step ? "bg-navy text-white" : "bg-white border border-border text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <div className={`text-[12.5px] ${i === step ? "font-semibold text-navy" : "text-muted-foreground"}`}>{s}</div>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-blue" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="mt-8 pulse-card p-8">
          {step === 0 && (
            <Section title="Tell us about your practice" sub="We'll use this to set up your tenant and branding.">
              <Grid>
                <Input label="Practice name" value={form.practiceName} onChange={set("practiceName")} />
                <Input label="HPCSA practice number" value={form.hpcsa} onChange={set("hpcsa")} />
                <Input label="Physical address" value={form.address} onChange={set("address")} placeholder="Street, suburb, city" />
                <Input label="Province" value={form.province} onChange={set("province")} />
                <Input label="VAT number (optional)" value={form.vat} onChange={set("vat")} />
              </Grid>
            </Section>
          )}
          {step === 1 && (
            <Section title="GP profile" sub="Primary practitioner for this account.">
              <Grid>
                <Input label="Title" value={form.title} onChange={set("title")} />
                <Input label="First name" value={form.firstName} onChange={set("firstName")} />
                <Input label="Last name" value={form.lastName} onChange={set("lastName")} />
                <Input label="Email" value={form.email} onChange={set("email")} />
                <Input label="Phone" value={form.phone} onChange={set("phone")} />
              </Grid>
            </Section>
          )}
          {step === 2 && <HoursStep />}
          {step === 3 && <BrandingStep />}
          {step === 4 && (
            <Section title="Choose your plan" sub="Start with a 30-day free trial. No credit card required.">
              <div className="mt-2 grid gap-4 md:grid-cols-3">
                {(["Starter", "Growth", "Enterprise"] as Plan[]).map((p) => (
                  <button key={p} type="button" onClick={() => set("plan")(p)}
                    className={`rounded-lg border-2 p-5 text-left ${form.plan === p ? "border-blue bg-blue-tint" : "border-border bg-white"}`}>
                    <div className="text-[13px] font-semibold text-navy">{p}</div>
                    <div className="mt-2 text-[24px] font-bold text-navy">
                      {p === "Starter" ? "R799" : p === "Growth" ? "R1,799" : "Custom"}
                      <span className="text-[12px] font-normal text-muted-foreground">/mo</span>
                    </div>
                  </button>
                ))}
              </div>
            </Section>
          )}

          <div className="mt-8 flex justify-between border-t border-border pt-6">
            <button onClick={back} disabled={step === 0} className="rounded-md px-4 py-2 text-[13px] font-medium text-muted-foreground disabled:opacity-30 hover:text-navy">Back</button>
            <button onClick={next} className="inline-flex items-center gap-1.5 rounded-md bg-blue px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90">
              {step === STEPS.length - 1 ? "Submit application" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[20px] font-semibold text-navy">{title}</h2>
      <p className="mt-1 text-[13.5px] text-muted-foreground">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}
function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-medium text-navy">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-blue" />
    </label>
  );
}
function HoursStep() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <Section title="Working hours" sub="Set when patients can book appointments.">
      <div className="space-y-2">
        {days.map((d, i) => (
          <div key={d} className="flex items-center gap-4 rounded-md border border-border bg-white px-4 py-2.5">
            <label className="flex w-24 items-center gap-2 text-[13px] text-navy">
              <input type="checkbox" defaultChecked={i < 5} className="rounded" /> {d}
            </label>
            <input type="time" defaultValue="08:00" disabled={i >= 5} className="rounded-md border border-border bg-white px-2 py-1.5 text-[13px]" />
            <span className="text-muted-foreground">to</span>
            <input type="time" defaultValue="17:00" disabled={i >= 5} className="rounded-md border border-border bg-white px-2 py-1.5 text-[13px]" />
          </div>
        ))}
      </div>
    </Section>
  );
}
function BrandingStep() {
  const colors = ["#3B7BF8","#6366F1","#9333EA","#EC4899","#E53E3E","#D97706","#16A34A","#0EA5E9","#5DEBD7","#0F766E","#1E293B","#64718A"];
  return (
    <Section title="Branding" sub="Your accent colour appears on buttons, links, and badges.">
      <div className="text-[12.5px] font-medium text-navy">Accent colour</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <button key={c} className={`h-10 w-10 rounded-md border-2 ${i === 0 ? "border-navy" : "border-transparent"}`} style={{ background: c }} />
        ))}
      </div>
    </Section>
  );
}
