import { createFileRoute, Link } from "@/lib/router-compat";
import { PulseLogo, PulseLogoOnDark } from "@/components/brand";
import {
  Calendar,
  Users,
  Package,
  Receipt,
  UserCog,
  ShieldCheck,
  Check,
  ArrowRight,
  Activity,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseMD — Practice intelligence, delivered." },
      {
        name: "description",
        content:
          "PulseMD gives South African GPs one intelligent platform for appointments, patients, billing, inventory, and compliance — with zero paper.",
      },
      {
        property: "og:title",
        content: "PulseMD — Practice intelligence, delivered.",
      },
      {
        property: "og:description",
        content:
          "Run your GP practice on one modern platform built for South Africa.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <div className="bg-navy">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-8 py-5">
          <PulseLogoOnDark size={36} />
          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-[13.5px] text-white/70 hover:text-white"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-[13.5px] text-white/70 hover:text-white"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-[13.5px] text-white/70 hover:text-white"
            >
              Customers
            </a>
            <Link
              to="/login"
              className="text-[13.5px] text-white/70 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-blue px-4 py-2 text-[13px] font-medium text-white hover:opacity-90"
            >
              Start free trial
            </Link>
          </nav>
        </div>

        {/* Hero */}
        <div className="mx-auto max-w-[1280px] px-8 pb-24 pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[12px] font-medium text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" /> POPIA &
                HPCSA compliant
              </div>
              <h1 className="mt-6 text-[52px] font-bold leading-[1.05] tracking-tight text-white">
                Your practice,
                <br />
                running at full capacity.
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70">
                PulseMD gives South African GPs one intelligent platform for
                appointments, patients, billing, inventory, and compliance —
                with zero paper.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-md bg-blue px-5 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  Start free 30-day trial <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center rounded-md border border-white/15 bg-transparent px-5 py-3 text-[14px] font-medium text-white hover:bg-white/5"
                >
                  Book a live demo
                </a>
              </div>
              <p className="mt-4 text-[12.5px] text-white/40">
                No credit card required · Setup in under 10 minutes
              </p>
            </div>

            <DashboardMockup />
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1280px] px-8 py-24">
        <div className="max-w-2xl">
          <div className="label-caps text-blue">Platform</div>
          <h2 className="mt-3 text-[36px] font-semibold tracking-tight text-navy">
            One platform. Every workflow.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Stop juggling paper diaries, spreadsheets, and three different
            billing systems. PulseMD covers your practice end-to-end.
          </p>
        </div>
        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Calendar,
              title: "Smart scheduling",
              body: "Drag-and-drop calendar with automated SMS and email reminders.",
            },
            {
              icon: Users,
              title: "Patient intelligence",
              body: "Complete longitudinal records, vitals, and clinical history at a glance.",
            },
            {
              icon: Package,
              title: "Medical inventory",
              body: "Real-time stock tracking with reorder and expiry alerts.",
            },
            {
              icon: Receipt,
              title: "Integrated billing",
              body: "ICD-10 codes, medical aid claims, and Paystack online payment.",
            },
            {
              icon: UserCog,
              title: "Team management",
              body: "Granular role-based access for every staff member in your practice.",
            },
            {
              icon: ShieldCheck,
              title: "Compliance-ready",
              body: "POPIA, HPCSA, and South African medical aid standards built in.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-white p-7">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-tint">
                <f.icon className="h-5 w-5 text-blue" />
              </div>
              <h3 className="mt-5 text-[16px] font-semibold text-navy">
                {f.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-surface py-24">
        <div className="mx-auto max-w-[1280px] px-8">
          <div className="label-caps text-blue">Trusted by GPs</div>
          <h2 className="mt-3 text-[32px] font-semibold tracking-tight text-navy">
            Built with practitioners across South Africa.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Dr. Lerato Mahlangu",
                practice: "Sandton Family Medical",
                city: "Johannesburg",
                quote:
                  "We cut our reception admin time by half in the first month. The reminders alone reduced our no-shows by 40%.",
              },
              {
                name: "Dr. Pieter Botha",
                practice: "Botha & Partners GP",
                city: "Stellenbosch",
                quote:
                  "Finally a system that understands SA medical aid claims. The ICD-10 lookup is faster than anything I've used.",
              },
              {
                name: "Dr. Ayesha Patel",
                practice: "Umhlanga Medical Suite",
                city: "Durban",
                quote:
                  "Inventory expiry alerts have already saved us thousands. PulseMD pays for itself.",
              },
            ].map((t) => (
              <div key={t.name} className="pulse-card p-7">
                <p className="text-[14.5px] leading-relaxed text-navy">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue text-[13px] font-semibold text-white">
                    {t.name.split(" ")[1][0]}
                    {t.name.split(" ")[2][0]}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-semibold text-navy">
                      {t.name}
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      {t.practice} · {t.city}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-[1280px] px-8 py-24">
        <div className="text-center">
          <div className="label-caps text-blue">Pricing</div>
          <h2 className="mt-3 text-[36px] font-semibold tracking-tight text-navy">
            Simple plans that scale with your practice.
          </h2>
          <p className="mt-3 text-[14px] text-muted-foreground">
            All prices exclude VAT. Cancel anytime.
          </p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {[
            {
              name: "Starter",
              price: 799,
              popular: false,
              blurb: "For solo GPs getting started.",
              features: [
                "1 GP",
                "Up to 3 staff",
                "500 appointments/mo",
                "Patient records",
                "SMS reminders",
                "Basic reports",
              ],
            },
            {
              name: "Growth",
              price: 1799,
              popular: true,
              blurb: "Most popular for established practices.",
              features: [
                "Up to 3 GPs",
                "Unlimited staff",
                "Unlimited appointments",
                "Inventory & equipment",
                "Online payments",
                "All reports",
                "Patient portal",
              ],
            },
            {
              name: "Enterprise",
              price: null,
              popular: false,
              blurb: "For multi-branch and groups.",
              features: [
                "Unlimited GPs",
                "Multi-branch",
                "API access",
                "Dedicated support",
                "Custom integrations",
                "SLA guarantee",
              ],
            },
          ].map((t) => (
            <div
              key={t.name}
              className={`pulse-card relative p-8 ${t.popular ? "border-blue ring-2 ring-blue/20" : ""}`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue px-3 py-1 text-[11px] font-semibold text-white">
                  MOST POPULAR
                </div>
              )}
              <div className="text-[14px] font-semibold text-navy">
                {t.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                {t.price ? (
                  <>
                    <span className="text-[40px] font-bold tracking-tight text-navy">
                      R{t.price.toLocaleString("en-ZA")}
                    </span>
                    <span className="text-[14px] text-muted-foreground">
                      /mo
                    </span>
                  </>
                ) : (
                  <span className="text-[32px] font-bold tracking-tight text-navy">
                    Custom
                  </span>
                )}
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {t.blurb}
              </p>
              <Link
                to="/register"
                className={`mt-6 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-[13.5px] font-medium transition-colors ${
                  t.popular
                    ? "bg-blue text-white hover:opacity-90"
                    : "border border-border bg-white text-navy hover:bg-surface"
                }`}
              >
                {t.price ? "Start free trial" : "Contact sales"}
              </Link>
              <ul className="mt-6 space-y-3 border-t border-border pt-6">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-[13.5px] text-navy"
                  >
                    <Check className="h-4 w-4 shrink-0 text-blue" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy">
        <div className="mx-auto max-w-[1280px] px-8 py-16">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <PulseLogoOnDark size={32} />
              <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/50">
                Practice intelligence, delivered. Built for South African
                general practice.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Patient portal", "Changelog"],
              },
              {
                title: "Company",
                links: ["About", "Customers", "Contact", "Careers"],
              },
              {
                title: "Legal",
                links: [
                  "POPIA notice",
                  "Terms of service",
                  "Privacy policy",
                  "Data processing",
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="label-caps text-white/50">{col.title}</div>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a
                        href="#"
                        className="text-[13.5px] text-white/70 hover:text-white"
                      >
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
            <div className="text-[12px] text-white/40">
              © {new Date().getFullYear()} PulseMD. All rights reserved.
            </div>
            <div className="text-[12px] text-white/40">
              POPIA-compliant · Hosted in South Africa
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardMockup() {
  const slots = [
    {
      time: "08:00",
      name: "Thandiwe Mokoena",
      type: "Consultation",
      color: "bg-blue",
    },
    {
      time: "08:30",
      name: "Sipho Dlamini",
      type: "Follow-up",
      color: "bg-[#6366F1]",
    },
    {
      time: "09:00",
      name: "Ayesha Patel",
      type: "Procedure",
      color: "bg-[#9333EA]",
    },
    {
      time: "09:45",
      name: "Johan van der Merwe",
      type: "Telehealth",
      color: "bg-teal",
    },
    {
      time: "10:30",
      name: "Naledi Khumalo",
      type: "Consultation",
      color: "bg-blue",
    },
  ];
  return (
    <div className="rounded-xl border border-white/10 bg-[#0F1424] p-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-blue" />
          <div className="text-[13px] font-medium text-white">
            Today · Thursday 12 May
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-white/50">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Live
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40">
            Booked
          </div>
          <div className="mt-1 text-[22px] font-semibold text-white">18</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40">
            Seen
          </div>
          <div className="mt-1 text-[22px] font-semibold text-white">12</div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-3">
          <div className="text-[10px] uppercase tracking-wider text-white/40">
            Revenue
          </div>
          <div className="mt-1 text-[22px] font-semibold text-white">R8.4k</div>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {slots.map((s) => (
          <div
            key={s.time}
            className="flex items-center gap-3 rounded-md bg-white/[0.02] px-3 py-2.5"
          >
            <div className="font-mono text-[11px] text-white/40 w-12">
              {s.time}
            </div>
            <div className={`h-7 w-1 rounded-full ${s.color}`} />
            <div className="flex-1">
              <div className="text-[13px] font-medium text-white">{s.name}</div>
              <div className="text-[11px] text-white/50">{s.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
