import { createFileRoute, Link, useParams } from "@/lib/router-compat";
import { useMemo } from "react";
import {
  Building2,
  MapPin,
  Languages,
  ArrowLeft,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  getPublicGPBySlug,
  getPublicAvailability,
  nextAvailableSlot,
} from "@/lib/public-booking-api";
import { PulseLogoOnDark } from "@/components/brand";
import { format, parseISO, isToday } from "date-fns";

export const Route = createFileRoute("/book/$slug")({ component: GPProfile });

function GPProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading } = useQuery({
    queryKey: ["public-booking", "tenant", slug],
    queryFn: () => getPublicGPBySlug(slug),
  });
  const { data: days = [] } = useQuery({
    queryKey: ["public-booking", "availability", slug],
    queryFn: () => getPublicAvailability(slug, 14),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <div className="rounded-3xl border border-border bg-white p-10 shadow-sm">
            <h2 className="text-[22px] font-semibold text-navy">Loading GP profile...</h2>
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PublicHeader />

        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <div className="rounded-3xl border border-border bg-white p-10 shadow-sm">
            <h2 className="text-[22px] font-semibold text-navy">GP not found</h2>
            <p className="mt-2 text-[13px] text-muted-foreground">
              This GP is not available for public booking right now.
            </p>

            <Link
              to="/book"
              className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-blue px-5 py-3 text-[13px] font-semibold text-white hover:bg-blue/90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to search
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { tenant, gp } = item;
  const initials = `${gp.firstName?.[0] || ""}${gp.lastName?.[0] || ""}`.toUpperCase();
  const next = nextAvailableSlot(days);

  const languages =
    tenant.gpLanguages && tenant.gpLanguages.length > 0 ? tenant.gpLanguages : ["English"];

  const bio =
    tenant.gpBio ||
    `${gp.title} ${gp.firstName} ${gp.lastName} is a General Practitioner at ${tenant.name}, providing primary healthcare services to families and individuals in ${
      tenant.province || "South Africa"
    }.`;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[url('/images/booking-hero.jpg')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-navy/95 to-blue/75" />

        <PublicHeader />

        <main className="relative z-10 mx-auto max-w-6xl px-6 pb-12 pt-8">
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5  px-4 py-2 text-[12.5px] font-medium text-white/85 backdrop-blur hover:bg-white/15"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to all GPs
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/15 text-[26px] font-bold text-white shadow-lg">
                    {initials || "GP"}
                  </div>

                  <div className="min-w-0 flex-1">

                    <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                      {gp.title} {gp.firstName} {gp.lastName}
                    </h1>

                    <div className="mt-2 flex items-center gap-2 text-[14px] text-white/70"> 
                      General Practitioner
                    </div>

                     <div className="mt-3 space-y-1 text-[13px] text-white/80">
                    <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-white" /> {tenant.name}</div>
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-white" /> {tenant.address || tenant.province || "South Africa"}</div>
                    <div className="flex items-center gap-1.5"><Languages className="h-3.5 w-3.5 text-white" /> {languages.join(", ")}</div>
                  </div>
                  </div>

                  <Link
                  to={`/book/${tenant.bookingSlug || tenant.slug}/new`}
                    className="shrink-0 rounded-xl bg-blue px-5 py-3 text-[13px] font-semibold text-white shadow-lg shadow-blue/30 transition hover:bg-blue/90"
                  >
                    Book appointment
                  </Link>
                </div>

                <p className="mt-6 border-t border-white/10 pt-5 text-[14px] leading-7 text-white/75">
                  {bio}
                </p>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-white/55">
                  Next available
                </div>

                <div className="mt-3 text-[22px] font-semibold leading-snug text-white">
                  {next ? `${format(parseISO(next.date), "EEE d MMM")} at ${next.time}` : "No slots available"}
                </div>

                <Link
                to={next ? `/book/${tenant.bookingSlug || tenant.slug}/new?date=${next.date}&time=${next.time}` : `/book/${tenant.bookingSlug || tenant.slug}/new`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-blue px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-blue/90"
                >
                  Book this slot
                </Link>
              </div>
            </aside>
          </div>
        </main>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-[18px] font-semibold text-navy">
                    Availability — next 14 days
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    Select from available appointment days.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-white border border-border" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-muted" />
                    Unavailable
                  </span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {days.map((d) => {
                  const date = parseISO(d.date);
                  const open = d.slots.length > 0;

                  const slug = tenant.bookingSlug || tenant.slug;
                  const inner = (
                    <>
                      <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                        {format(date, "EEE")}
                      </div>

                      <div className="mt-1 text-[20px] font-semibold text-navy">
                        {format(date, "d")}
                      </div>

                      <div className={`mt-1 text-[11px] ${open ? "text-success" : "text-muted-foreground"}`}>
                        {open ? `${d.slots.length} slots` : "—"}
                      </div>
                     </>
                  );
                  const cls = `rounded-md border p-2 text-center transition-colors ${open ? "border-border bg-white hover:border-blue" : "border-transparent bg-muted text-muted-foreground"} ${isToday(date) ? "ring-2 ring-blue/40" : ""}`;
                  return open ? (
                    <Link key={d.date} to={`/book/${slug}/new?date=${d.date}`} className={cls}>{inner}</Link>
                  ) : (
                    <div key={d.date} className={cls}>{inner}</div>
                  );
                })}
              </div>
            </div>
          </div>

          <aside>
            <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
              <div className="text-[15px] font-semibold text-navy">Practice details</div>

              <div className="mt-4 space-y-3 text-[13px] text-muted-foreground">
                <div className="flex gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
                  <div>{tenant.name}</div>
                </div>

                {tenant.address && (
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
                    <div>{tenant.address}</div>
                  </div>
                )}

                {tenant.province && (
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
                    <div>{tenant.province}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Languages className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
                  <div>{languages.join(", ")}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <PulseLogoOnDark size={38} />
        </Link>

        <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white/90 backdrop-blur">
          Online Bookings
        </div>
      </div>
    </header>
  );
}
