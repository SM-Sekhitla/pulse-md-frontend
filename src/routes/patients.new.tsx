import { createFileRoute, Link, useNavigate } from "@/lib/router-compat";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft } from "lucide-react";
import { createPatient } from "@/lib/store";

export const Route = createFileRoute("/patients/new")({
  component: NewPatient,
});

const SCHEMES = ["Discovery Health", "Bonitas", "Momentum Health", "Medihelp", "Fedhealth", "GEMS", "Polmed", "None"];

function NewPatient() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [scheme, setScheme] = useState(SCHEMES[0]);
  const [planName, setPlanName] = useState("");
  const [memberNo, setMemberNo] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) { setError("First and last name are required."); return; }
    if (!dob) { setError("Date of birth is required."); return; }
    if (!phone.trim()) { setError("Mobile number is required."); return; }
    if (!consent) { setError("POPIA consent is required."); return; }
    createPatient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      gender,
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      email: email.trim(),
      medicalAid: scheme,
      medicalAidNumber: memberNo.trim(),
      allergies: [],
      chronic: [],
    });
    navigate({ to: "/patients" });
  };

  return (
    <AppShell title="Register patient">
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-3.5 w-3.5" /> All patients
      </Link>
      <form onSubmit={submit} className="space-y-6">
        <Section title="Personal details">
          <Grid>
            <Field label="Title"><Sel value={title} onChange={setTitle} options={["Mr","Mrs","Ms","Dr","Prof"]} /></Field>
            <Field label="First name"><Inp value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></Field>
            <Field label="Last name"><Inp value={lastName} onChange={(e) => setLastName(e.target.value)} required /></Field>
            <Field label="Date of birth"><Inp type="date" value={dob} onChange={(e) => setDob(e.target.value)} required /></Field>
            <Field label="Gender">
              <select value={gender} onChange={(e) => setGender(e.target.value as "M" | "F")} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </Field>
            <Field label="ID number"><Inp value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="13 digits" /></Field>
          </Grid>
        </Section>
        <Section title="Contact">
          <Grid>
            <Field label="Mobile"><Inp value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27 …" required /></Field>
            <Field label="Email"><Inp type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Field label="Home address" full><Inp value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
          </Grid>
        </Section>
        <Section title="Medical aid">
          <Grid>
            <Field label="Scheme"><Sel value={scheme} onChange={setScheme} options={SCHEMES} /></Field>
            <Field label="Plan name"><Inp value={planName} onChange={(e) => setPlanName(e.target.value)} /></Field>
            <Field label="Member number"><Inp value={memberNo} onChange={(e) => setMemberNo(e.target.value)} /></Field>
            <Field label="Dependant code"><Inp defaultValue="00" /></Field>
          </Grid>
        </Section>
        <Section title="POPIA consent">
          <label className="flex items-start gap-2 text-[13px] text-navy">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            <span>I confirm that the patient has provided informed consent for the collection, processing, and storage of personal information in accordance with POPIA.</span>
          </label>
        </Section>
        {error && <div className="rounded-md bg-[#FEE2E2] px-3 py-2 text-[12.5px] text-[#991B1B]">{error}</div>}
        <div className="flex justify-end gap-2">
          <Link to="/patients" className="rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-navy hover:bg-surface">Cancel</Link>
          <button type="submit" className="rounded-md bg-blue px-5 py-2 text-[13px] font-medium text-white hover:opacity-90">Register patient</button>
        </div>
      </form>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pulse-card p-6">
      <div className="text-[14px] font-semibold text-navy">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) { return <div className="grid gap-4 md:grid-cols-2">{children}</div>; }
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`block ${full ? "md:col-span-2" : ""}`}><span className="text-[12.5px] font-medium text-navy">{label}</span><div className="mt-1.5">{children}</div></label>;
}
function Inp(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />;
}
function Sel({ options, value, onChange }: { options: string[]; value?: string; onChange?: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange?.(e.target.value)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
