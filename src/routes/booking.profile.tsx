import { createFileRoute, Link } from "@/lib/router-compat";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";
import { Globe, ExternalLink, Save } from "lucide-react";
import { useData } from "@/context/AppDataProvider";
import { useCurrentTenant } from "@/hooks/use-current-tenant";

export const Route = createFileRoute("/booking/profile")({ component: BookingProfile });

const COMMON_LANGS = ["English", "Afrikaans", "isiZulu", "isiXhosa", "Sesotho", "Setswana", "Sepedi", "Xitsonga", "siSwati", "Tshivenda", "isiNdebele"];

function BookingProfile() {
  const { tenant: tenantData } = useData();
  const tenant = useCurrentTenant();
  const [bio, setBio] = useState("");
  const [langs, setLangs] = useState<string[]>(["English"]);

  useEffect(() => {
    if (!tenant) return;
    setBio(tenant.gpBio || "");
    setLangs(tenant.gpLanguages?.length ? tenant.gpLanguages : ["English"]);
  }, [tenant]);

  const toggle = (l: string) => setLangs((arr) => arr.includes(l) ? arr.filter((x) => x !== l) : [...arr, l]);
  const save = async () => {
    if (!tenant) return;
    await tenantData.updateTenant(tenant.id, { gpBio: bio.trim(), gpLanguages: langs });
    toast.success("Public profile saved");
  };

  if (!tenant) return null;

  const slug = tenant.bookingSlug || tenant.slug;
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${slug}`;

  return (
    <AppShell title="Public profile">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="pulse-card flex items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-blue" /><span className="text-[13px] font-semibold text-navy">Your public booking page</span></div>
            <div className="mt-1 font-mono text-[12.5px] text-muted-foreground truncate">{url}</div>
          </div>
          <Link to={`/book/${slug}`} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-[12.5px] font-medium text-navy hover:bg-surface">
            <ExternalLink className="h-3.5 w-3.5" /> View
          </Link>
        </div>

        <div className="pulse-card p-6">
          <h2 className="text-[15px] font-semibold text-navy">About</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">Shown on your public profile. Briefly describe your practice, experience, and services.</p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={600}
            rows={6}
            placeholder="e.g. Dr Naidoo is a General Practitioner with 12 years of experience..."
            className="mt-3 w-full rounded-md border border-border bg-white p-3 text-[13px] leading-relaxed focus:border-blue focus:outline-none"
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">{bio.length}/600</div>
        </div>

        <div className="pulse-card p-6">
          <h2 className="text-[15px] font-semibold text-navy">Languages spoken</h2>
          <p className="mt-1 text-[12px] text-muted-foreground">Help patients find a GP they can communicate with comfortably.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMMON_LANGS.map((l) => {
              const on = langs.includes(l);
              return (
                <button key={l} type="button" onClick={() => toggle(l)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${on ? "border-blue bg-blue text-white" : "border-border bg-white text-navy hover:bg-surface"}`}>
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={save} className="inline-flex items-center gap-1.5 rounded-md bg-blue px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-blue/90">
            <Save className="h-3.5 w-3.5" /> Save profile
          </button>
        </div>
      </div>
    </AppShell>
  );
}
