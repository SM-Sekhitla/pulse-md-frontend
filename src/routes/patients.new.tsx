import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/patients/new")({
  component: NewPatient,
});

function NewPatient() {
  const navigate = useNavigate();
  return (
    <AppShell title="Register patient">
      <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-navy">
        <ArrowLeft className="h-3.5 w-3.5" /> All patients
      </Link>
      <form onSubmit={(e) => { e.preventDefault(); navigate({ to: "/patients" }); }} className="space-y-6">
        <Section title="Personal details">
          <Grid>
            <Field label="Title"><Sel options={["Mr","Mrs","Ms","Dr","Prof"]} /></Field>
            <Field label="First name"><Inp /></Field>
            <Field label="Last name"><Inp /></Field>
            <Field label="Date of birth"><Inp type="date" /></Field>
            <Field label="Gender"><Sel options={["Female","Male","Other"]} /></Field>
            <Field label="ID number"><Inp placeholder="13 digits" /></Field>
          </Grid>
        </Section>
        <Section title="Contact">
          <Grid>
            <Field label="Mobile"><Inp placeholder="+27 …" /></Field>
            <Field label="Email"><Inp type="email" /></Field>
            <Field label="Home address" full><Inp /></Field>
          </Grid>
        </Section>
        <Section title="Medical aid">
          <Grid>
            <Field label="Scheme"><Sel options={["Discovery Health","Bonitas","Momentum Health","Medihelp","Fedhealth","GEMS","Polmed","None"]} /></Field>
            <Field label="Plan name"><Inp /></Field>
            <Field label="Member number"><Inp /></Field>
            <Field label="Dependant code"><Inp defaultValue="00" /></Field>
          </Grid>
        </Section>
        <Section title="Emergency contact">
          <Grid>
            <Field label="Name"><Inp /></Field>
            <Field label="Relationship"><Inp /></Field>
            <Field label="Phone"><Inp /></Field>
          </Grid>
        </Section>
        <Section title="POPIA consent">
          <label className="flex items-start gap-2 text-[13px] text-navy">
            <input type="checkbox" className="mt-1" required />
            <span>I confirm that the patient has provided informed consent for the collection, processing, and storage of personal information in accordance with POPIA.</span>
          </label>
        </Section>
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
function Sel({ options }: { options: string[] }) {
  return <select className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">{options.map(o => <option key={o}>{o}</option>)}</select>;
}
