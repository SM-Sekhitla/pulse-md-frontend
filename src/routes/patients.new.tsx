import { createFileRoute, Link, useNavigate } from "@/lib/router-compat";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft, Banknote, CreditCard } from "lucide-react";
import { medicalAidSchemes } from "@/lib/store";
import { useData } from "@/context/AppDataProvider";

export const Route = createFileRoute("/patients/new")({
  component: NewPatient,
});

function NewPatient() {
  const navigate = useNavigate();

  const { patient, } = useData();
  
  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [billingType, setBillingType] = useState<"private" | "medical_aid">("private");
  const schemes = medicalAidSchemes().filter((scheme) => scheme.isActive && scheme.acceptedByPractice);
  const [schemeId, setSchemeId] = useState(schemes[0]?.id ?? "");
  const [planName, setPlanName] = useState("");
  const [customPlanName, setCustomPlanName] = useState("");
  const [memberNo, setMemberNo] = useState("");
  const [isMainMember, setIsMainMember] = useState(true);
  const [mainMemberName, setMainMemberName] = useState("");
  const [mainMemberNumber, setMainMemberNumber] = useState("");
  const [dependantCode, setDependantCode] = useState("00");
  const [relationshipToMain, setRelationshipToMain] = useState<"self" | "spouse" | "child" | "parent" | "other">("self");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScheme = schemes.find((scheme) => scheme.id === schemeId);
  const availablePlans = selectedScheme?.plans ?? [];
  const selectedPlan = planName === "__other" ? customPlanName : planName;

  const submit = async(e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim()) { setError("First and last name are required."); return; }
    if (!dob) { setError("Date of birth is required."); return; }
    if (!phone.trim()) { setError("Mobile number is required."); return; }
    if (billingType === "medical_aid" && !selectedScheme) { setError("Medical aid scheme is required."); return; }
    if (billingType === "medical_aid" && !memberNo.trim()) { setError("Medical aid number is required."); return; }
    if (billingType === "medical_aid" && !selectedPlan.trim()) { setError("Medical aid plan is required."); return; }
    if (billingType === "medical_aid" && !isMainMember && !mainMemberName.trim()) { setError("Main member name is required for dependants."); return; }
    if (!consent) { setError("POPIA consent is required."); return; }

    await patient.createPatient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      gender,
      idNumber: idNumber.trim(),
      phone: phone.trim(),
      email: email.trim(),
      medicalAid: billingType === "medical_aid" ? selectedScheme?.name ?? "" : "Private",
      billingType,
      medicalAidSchemeId: billingType === "medical_aid" ? selectedScheme?.id : undefined,
      medicalAidSchemeName: billingType === "medical_aid" ? selectedScheme?.name : undefined,
      medicalAidPlan: billingType === "medical_aid" ? selectedPlan.trim() : "",
      medicalAidNumber: memberNo.trim(),
      isMainMember,
      mainMemberName: isMainMember ? "" : mainMemberName.trim(),
      mainMemberNumber: isMainMember ? "" : mainMemberNumber.trim(),
      dependantCode: billingType === "medical_aid" ? dependantCode.trim() : "",
      relationshipToMain: isMainMember ? "self" : relationshipToMain,
      allergies: [],
      chronic: [],
      active: true
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
        <Section
          title="Billing & medical aid"
          sub="How does this patient pay for consultations?"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <BillingTile
              active={billingType === "private"}
              icon={Banknote}
              iconClassName="bg-[#DCFCE7] text-success"
              title="Private patient"
              sub="Cash or card. Patient pays directly."
              onClick={() => setBillingType("private")}
            />
            <BillingTile
              active={billingType === "medical_aid"}
              icon={CreditCard}
              iconClassName="bg-blue-tint text-blue"
              title="Medical aid member"
              sub="Claim through a registered scheme."
              onClick={() => setBillingType("medical_aid")}
            />
          </div>
          <div className={`overflow-hidden transition-all duration-200 ${billingType === "medical_aid" ? "mt-4 max-h-[720px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="rounded-xl border border-[#B8CAFF] bg-[#EEF4FF] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#1D4ED8]">
                Medical aid details
              </div>
              <Grid>
                <Field label="Scheme*">
                  <select value={schemeId} onChange={(e) => { setSchemeId(e.target.value); setPlanName(""); }} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
                    {schemes.map((scheme) => (
                      <option key={scheme.id} value={scheme.id}>{scheme.name} - {scheme.administrator}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Plan / option*">
                  {availablePlans.length > 0 ? (
                    <select value={planName} onChange={(e) => setPlanName(e.target.value)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
                      <option value="">Select plan...</option>
                      {availablePlans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                      <option value="__other">Other (type below)</option>
                    </select>
                  ) : (
                    <Inp value={customPlanName} onChange={(e) => setCustomPlanName(e.target.value)} placeholder="Plan name" />
                  )}
                  {planName === "__other" && (
                    <Inp value={customPlanName} onChange={(e) => setCustomPlanName(e.target.value)} placeholder="Type plan name" className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue" />
                  )}
                </Field>
                <Field label="Medical aid number*"><Inp value={memberNo} onChange={(e) => setMemberNo(e.target.value)} placeholder="Member number" /></Field>
                <Field label="Main member?">
                  <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-white px-3 text-[13px] text-navy">
                    <input type="checkbox" checked={isMainMember} onChange={(e) => { setIsMainMember(e.target.checked); setRelationshipToMain(e.target.checked ? "self" : "spouse"); }} className="h-4 w-4 accent-blue" />
                    This patient is the main member
                  </label>
                </Field>
                {!isMainMember && (
                  <>
                    <Field label="Main member full name*"><Inp value={mainMemberName} onChange={(e) => setMainMemberName(e.target.value)} /></Field>
                    <Field label="Main member number"><Inp value={mainMemberNumber} onChange={(e) => setMainMemberNumber(e.target.value)} /></Field>
                    <Field label="Dependant code"><Inp value={dependantCode} onChange={(e) => setDependantCode(e.target.value.slice(0, 2))} placeholder="e.g. 01" /></Field>
                    <Field label="Relationship to main member">
                      <select value={relationshipToMain} onChange={(e) => setRelationshipToMain(e.target.value as typeof relationshipToMain)} className="block w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-blue">
                        <option value="spouse">Spouse</option>
                        <option value="child">Child</option>
                        <option value="parent">Parent</option>
                        <option value="other">Other dependant</option>
                      </select>
                    </Field>
                  </>
                )}
              </Grid>
            </div>
          </div>
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

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="pulse-card p-6">
      <div className="text-[14px] font-semibold text-navy">{title}</div>
      {sub && <div className="mt-1 text-[12.5px] text-muted-foreground">{sub}</div>}
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

function BillingTile({
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
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${active ? "border-blue bg-blue-tint" : "border-border bg-white hover:border-blue"}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClassName}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-[14px] font-semibold text-navy">{title}</div>
      <div className="mt-1 text-[12.5px] text-muted-foreground">{sub}</div>
    </button>
  );
}
