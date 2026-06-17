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
import { useState } from "react";

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
  const [activeFeature, setActiveFeature] = useState("Smart scheduling");
  
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
        <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[url('./public/asset/feature_bg.jpg')] bg-cover bg-center" />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-black/50" />

        {/* Hero Content */}
        <div className="relative z-10">
          <div className="mx-auto max-w-[1280px] px-8 pb-24 pt-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>

                <h1 className="mt-6 text-[52px] font-bold leading-[1.05] tracking-tight text-white">
                  Your practice,
                  <br />
                  running at full capacity.
                </h1>

                <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/75">
                  PulseMD gives South African GPs one intelligent platform for
                  appointments, patients, billing, inventory, and compliance —
                  with zero paper.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-md bg-blue px-5 py-3 text-[14px] font-medium text-white shadow-lg shadow-blue/20 transition hover:bg-blue/90"
                  >
                    Start free 30-day trial
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <a
                    href="#demo"
                    className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-5 py-3 text-[14px] font-medium text-white backdrop-blur transition hover:bg-white/15"
                  >
                    Book a live demo
                  </a>
                </div>

                <p className="mt-4 text-[12.5px] text-white/50">
                  No credit card required · Setup in under 10 minutes
                </p>
              </div>

              <DashboardMockup />
            </div>
          </div>
        </div>
         <div className="absolute bottom-0 left-0 h-1.5 w-full bg-navy" />
      </section>
      </div>

      {/* Features */}
      <section
        id="features"
        className="relative overflow-hidden bg-navy px-8 py-24"
      >
        <div className="absolute inset-0 bg-[url('/images/clinic-feature-bg.jpg')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-navy/70 to-black/40" />

        <div className="relative z-10 mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="label-caps text-blue">Platform</div>

            <h2 className="mt-3 max-w-xl text-[44px] font-semibold leading-tight tracking-tight text-white">
              One platform. Every <span className="text-blue">workflow.</span>
            </h2>

            <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/70">
              PulseMD brings bookings, patients, billing, inventory, staff, and
              compliance into one simple operating system for modern GP practices.
            </p>
          </div>

          <div className="space-y-5">
            {[
              {
                icon: Calendar,
                title: "Smart scheduling",
                body: "Manage public bookings, working hours, reminders, blocked dates, and patient flow from one calendar.",
              },
              {
                icon: Users,
                title: "Patient intelligence",
                body: "Access complete patient records, contact details, history, and clinical notes in one place.",
              },
              {
                icon: Receipt,
                title: "Billing & payments",
                body: "Create invoices, track payments, and simplify revenue management for your practice.",
              },
              {
                icon: ShieldCheck,
                title: "Compliance-ready",
                body: "Built with POPIA, secure access control, and healthcare privacy in mind.",
              },
            ].map((f) => {
              const active = activeFeature === f.title;

              return (
                <button
                  key={f.title}
                  type="button"
                  onClick={() =>
                    setActiveFeature(active ? null : f.title)
                  }
                  className={`group w-full rounded-2xl border p-6 text-left shadow-2xl backdrop-blur-md transition-all duration-300 ${
                    active
                      ? "border-blue/40 bg-white/15 shadow-blue/10"
                      : "border-white/10 bg-white/10 hover:border-blue/30 hover:bg-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          active ? "bg-blue text-white" : "bg-white/15 text-white"
                        }`}
                      >
                        <f.icon className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-[18px] font-semibold text-white">
                          {f.title}
                        </h3>

                        {active && (
                          <p className="mt-3 max-w-xl text-[14px] leading-7 text-white/75">
                            {f.body}
                          </p>
                        )}
                      </div>
                    </div>

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[20px] font-semibold ${
                        active ? "bg-blue text-white" : "bg-white text-navy"
                      }`}
                    >
                      {active ? "−" : "+"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-navy" />
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
    <footer className="relative overflow-hidden">
      <div className="absolute inset-0 bg-black/55" /> 
      <div className="absolute inset-0 bg-gradient-to-r from-black via-navy/95 to-black" />

      <div className="relative z-10 mx-auto max-w-[1280px] px-8 py-20">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <PulseLogoOnDark size={34} />

            <p className="mt-5 max-w-xs text-[13px] leading-7 text-white/55">
              Practice intelligence, delivered. Built specifically for South
              African healthcare providers and modern medical practices.
            </p>

            <div className="mt-6 flex gap-3">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
                POPIA
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
                HPCSA
              </div>

              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
                South Africa
              </div>
            </div>
          </div>

          {[
            {
              title: "Platform",
              links: [
                "Appointments",
                "Patients",
                "Billing",
                "Inventory",
              ],
            },
            {
              title: "Company",
              links: [
                "About",
                "Contact",
                "Partners",
                "Careers",
              ],
            },
            {
              title: "Legal",
              links: [
                "POPIA Notice",
                "Privacy Policy",
                "Terms of Service",
                "Data Processing",
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                {col.title}
              </div>

              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-[13.5px] text-white/65 transition hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-[12px] text-white/40">
              © {new Date().getFullYear()} PulseMD. All rights reserved.
            </div>

            <div className="flex items-center gap-6 text-[12px] text-white/40">
              <span>POPIA-compliant</span>
              <span>Hosted in South Africa</span>
              <span>Healthcare SaaS Platform</span>
            </div>
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
