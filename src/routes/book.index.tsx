import { createFileRoute, Link } from "@/lib/router-compat";
import { useMemo, useState } from "react";
import {
  Building2,
  MapPin,
  Search,
  CalendarClock,
  Stethoscope,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  availabilityFromTenant,
  getPublicBookingTenants,
  nextAvailableSlot,
  type PublicGP,
} from "@/lib/public-booking-api";
import { SA_PROVINCES } from "@/lib/sa-suburbs";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  startOfDay,
  addDays,
  endOfDay,
} from "date-fns";
import { PulseLogoOnDark } from "@/components/brand";

export const Route = createFileRoute("/book")({ component: PublicBookingList });

const APPOINTMENT_TYPES = [
  "consultation",
  "follow-up",
  "Procedure",
  "Emergency",
  "Walk-in",
  "Telehealth",
] as const;

type AvailabilityFilter = "any" | "today" | "week";

function PublicBookingList() {
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["public-booking", "tenants"],
    queryFn: getPublicBookingTenants,
  });

  const [province, setProvince] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [avail, setAvail] = useState<AvailabilityFilter>("any");

  const [applied, setApplied] = useState({
    province: "",
    search: "",
    type: "",
    avail: "any" as AvailabilityFilter,
  });

  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    return all.filter(({ tenant, gp }) => {
      if (applied.province && tenant.province !== applied.province) return false;

      if (applied.search) {
        const q = applied.search.toLowerCase();
        const hay = `${gp.title} ${gp.firstName} ${gp.lastName} ${tenant.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

    //   if (applied.type) {
    //     const visitTypes = tenant.appointmentTypes || [];
    //     if (visitTypes.length > 0 && !visitTypes.includes(applied.type)) return false;
    //   }

      if (applied.avail !== "any") {
        const next = nextAvailableSlot(availabilityFromTenant(tenant, 14));
        if (!next) return false;

        const nd = parseISO(next.date);

        if (applied.avail === "today" && !isToday(nd)) return false;

        if (
          applied.avail === "week" &&
          (nd < startOfDay(new Date()) || nd > endOfDay(addDays(new Date(), 7)))
        ) {
          return false;
        }
      }

      return true;
    });
  }, [all, applied]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  const onSearch = () => {
    setApplied({ province, search, type, avail });
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 bg-[url('/images/booking-hero.jpg')] bg-cover bg-center opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-navy/95 to-blue/80" />

        <header className="relative z-10 border-b border-white/10">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-2">
              <PulseLogoOnDark size={38} />
            </Link>

            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[12.5px] font-medium text-white/90 backdrop-blur">
              Online Bookings
            </div>
          </div>
        </header>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-14">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Find a GP and book your appointment in minutes.
            </h1>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/75">
              Search available doctors, compare practices, and reserve a time that works for you.
              Fast, simple, and designed for patients who need care without the back-and-forth.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <HeroStat icon={Stethoscope} label="Qualified GPs" />
              <HeroStat icon={CalendarClock} label="Real availability" />
              <HeroStat icon={Users} label="Patient friendly" />
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-white/15 bg-white/95 p-4 shadow-2xl backdrop-blur">
            <div className="grid gap-3 md:grid-cols-12">
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="h-11 rounded-xl border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-blue md:col-span-3"
              >
                <option value="">All provinces</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <div className="relative md:col-span-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search GP or practice name"
                  className="h-11 w-full rounded-xl border border-border bg-white pl-10 pr-3 text-[13px] text-navy outline-none placeholder:text-muted-foreground focus:border-blue"
                />
              </div>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="h-11 rounded-xl border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-blue md:col-span-2"
              >
                <option value="">Any visit</option>
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                value={avail}
                onChange={(e) => setAvail(e.target.value as AvailabilityFilter)}
                className="h-11 rounded-xl border border-border bg-white px-3 text-[13px] text-navy outline-none focus:border-blue md:col-span-2"
              >
                <option value="any">Any time</option>
                <option value="today">Available today</option>
                <option value="week">Available this week</option>
              </select>

              <button
                onClick={onSearch}
                className="h-11 rounded-xl bg-blue px-5 text-[13px] font-semibold text-white shadow-lg shadow-blue/20 transition hover:bg-blue/90 md:col-span-1"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-semibold text-navy">Available healthcare providers</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Showing {filtered.length} matching result{filtered.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading && (
            <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
              <div className="text-[15px] font-semibold text-navy">
                Loading healthcare providers...
              </div>
            </div>
          )}

          {!isLoading && visible.length === 0 && (
            <div className="rounded-2xl border border-border bg-white p-12 text-center shadow-sm">
              <div className="text-[15px] font-semibold text-navy">
                No GPs found matching your search.
              </div>
              <div className="mt-2 text-[13px] text-muted-foreground">
                Try changing your province, availability, or search term.
              </div>
            </div>
          )}

          {visible.map((item) => (
            <GPCard key={item.tenant.id} item={item} />
          ))}
        </div>

        {filtered.length > perPage && (
          <div className="mt-8 flex items-center justify-center gap-1">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-9 min-w-[36px] rounded-lg border px-2 text-[12.5px] font-semibold ${
                  page === n
                    ? "border-blue bg-blue text-white"
                    : "border-border bg-white text-navy hover:bg-slate-100"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
}: {
  icon: typeof Stethoscope;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="text-[13px] font-medium text-white/90">{label}</div>
    </div>
  );
}

function GPCard({ item }: { item: PublicGP }) {
  const { tenant, gp } = item;
  const initials = `${gp.firstName?.[0] || ""}${gp.lastName?.[0] || ""}`.toUpperCase();
  const next = nextAvailableSlot(availabilityFromTenant(tenant, 14));
  const nextLabel = next ? formatNextLabel(next.date, next.time) : "No availability";
  const slug = tenant.bookingSlug || tenant.slug;

  return (
    <div className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue/50 hover:shadow-lg">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue/10 text-[17px] font-bold text-blue">
          {initials || "GP"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold text-navy">
            {gp.title} {gp.firstName} {gp.lastName}
          </div>

          <div className="mt-1 text-[12.5px] font-medium text-muted-foreground">
            General Practitioner
          </div>

          <div className="mt-3 grid gap-2 text-[12.5px] text-navy/80 md:grid-cols-3">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              {tenant.name}
            </div>

            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {tenant.province || tenant.address || "South Africa"}
            </div>

            <div className="flex items-center gap-1.5 truncate font-medium text-success">
              <CalendarClock className="h-3.5 w-3.5" />
              {nextLabel}
            </div>
          </div>
        </div>

        <Link
          to={`/book/${slug}`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue px-5 py-3 text-[12.5px] font-semibold text-white shadow-sm transition hover:bg-blue/90"
        >
          View availability
        </Link>
      </div>
    </div>
  );
}

function formatNextLabel(date: string, time: string): string {
  const d = parseISO(date);

  if (isToday(d)) return `Available today at ${time}`;
  if (isTomorrow(d)) return `Available tomorrow at ${time}`;

  return `Next: ${format(d, "EEE d MMM")} at ${time}`;
}
