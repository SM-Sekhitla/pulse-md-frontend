import { ActionButton } from "@/components/action-feedback";
import { useState } from "react";
import { createFileRoute, Link } from "@/lib/router-compat";
import { PulseLogo, PulseLogoOnDark } from "@/components/brand";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  HeartHandshake,
  MapPin,
  Menu,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import "./landing.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseMD — Practice intelligence, delivered." },
      {
        name: "description",
        content:
          "More time for patients. Less time on paperwork. Practice management built for South African healthcare providers.",
      },
    ],
  }),
  component: Landing,
});

const slides = [
  {
    eyebrow: "Better practice. Better care.",
    title: "Your patients first.",
    accent: "Everything else,",
    ending: "made simpler.",
    body: "Bring your appointments, patient records and day-to-day admin together. One connected platform, built for the way South African practices care.",
    image: "/images/landing/medical-team.webp",
    alt: "Healthcare professionals walking together in a bright medical facility",
  },
  {
    eyebrow: "Connected teams. Smoother days.",
    title: "Less paperwork.",
    accent: "More time for",
    ending: "what matters.",
    body: "From the first booking to the final invoice, give your team the tools to keep your practice moving — and your attention where it belongs.",
    image: "/images/landing/medical-care.webp",
    alt: "A Black doctor warmly greeting a Black patient in a bright medical reception",
  },
];

const features = [
  {
    icon: CalendarDays,
    title: "Smarter appointments",
    body: "Bring online bookings, availability and your daily schedule into one organised calendar.",
    detail:
      "Set working hours, block out time and review incoming booking requests in one place.",
  },
  {
    icon: Users,
    title: "Connected patient records",
    body: "Keep patient details, clinical history and consultation notes together and easy to find.",
    detail:
      "Move from a patient profile to their appointments, prescriptions and documents without switching systems.",
  },
  {
    icon: Receipt,
    title: "Simpler billing",
    body: "Create invoices, record payments and stay on top of your practice’s outstanding balances.",
    detail:
      "Keep billing connected to your patients, with a clear view of invoices and payment status.",
  },
  {
    icon: ClipboardList,
    title: "Digital clinical documents",
    body: "Prepare prescriptions and sick notes directly from your practice workspace.",
    detail:
      "Keep the documents you issue linked to the right patient for easy reference at their next visit.",
  },
  {
    icon: Package,
    title: "Inventory in focus",
    body: "Track stock, monitor expiry dates and manage the equipment your team relies on.",
    detail:
      "Review stock levels and inventory movements to help your team plan ahead.",
  },
  {
    icon: ShieldCheck,
    title: "The right access for your team",
    body: "Manage staff permissions and keep a record of important activity across your practice.",
    detail:
      "Use role-based access and audit logs to support accountable, organised practice operations.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "799",
    description: "A simpler start for your solo practice.",
    features: ["Online bookings", "Patient records", "Billing basics"],
  },
  {
    name: "Growth",
    price: "1,799",
    description: "More support for a growing practice.",
    features: [
      "Everything in Starter",
      "Appointment reminders",
      "Practice reports",
    ],
  },
  {
    name: "Enterprise",
    price: null,
    description: "A plan shaped around your team.",
    features: ["Custom modules", "Priority support", "Advanced controls"],
  },
];

const faqs = [
  {
    question: "Who is PulseMD built for?",
    answer:
      "PulseMD is built for South African GPs and medical practices. It brings the front desk, clinical records and practice administration into a shared workspace for practitioners and their teams.",
  },
  {
    question: "How do I get started?",
    answer:
      "Register your practice, choose a plan and add your practice details and working hours. Your application is reviewed before your practice is activated. You can then invite your team and configure your workspace.",
  },
  {
    question: "Can patients book appointments online?",
    answer:
      "Yes. Practices can set up a public booking profile and availability. Patients can find a practice and request an appointment through the booking directory, while your team manages incoming requests in PulseMD.",
  },
  {
    question: "Can I control what each staff member can access?",
    answer:
      "Yes. PulseMD supports staff roles and permissions, so you can manage access to your practice’s tools. Audit logs provide a record of important activity.",
  },
];

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const slide = slides[activeSlide];

  return (
    <div className="landing" id="top">
      <a href="#main-content" className="landing-skip">
        Skip to content
      </a>
      <div className="landing-topbar">
        <div className="landing-container">
          <span>
            <Activity size={14} aria-hidden="true" /> Practice intelligence,
            delivered.
          </span>
          <div>
            <span className="landing-topbar-location">
              <MapPin size={13} aria-hidden="true" /> Built for South Africa
            </span>
            <Link to="/book">
              Looking for a doctor?{" "}
              <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <header
        className="landing-header"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            document.getElementById("landing-menu-toggle")?.focus();
          }
        }}
      >
        <div className="landing-container landing-nav">
          <Link to="/" aria-label="PulseMD home" className="landing-logo">
            <PulseLogo size={42} />
          </Link>
          <nav aria-label="Main navigation" className="landing-desktop-nav">
            <a href="#top" aria-current="page">
              Home
            </a>
            <a href="#about">About PulseMD</a>
            <a href="#features">Our platform</a>
            <a href="#pricing">Pricing</a>
            <a href="#faqs">FAQs</a>
          </nav>
          <div className="landing-nav-actions">
            <Link to="/login" className="landing-signin">
              Admin sign in <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
            <Link
              to="/register"
              className="landing-button landing-button-yellow landing-nav-cta"
            >
              Get started <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
            <ActionButton
              type="button"
              id="landing-menu-toggle"
              className="landing-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="landing-mobile-nav"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </ActionButton>
          </div>
        </div>
        {menuOpen && (
          <nav
            id="landing-mobile-nav"
            className="landing-mobile-nav"
            aria-label="Mobile navigation"
            onClick={() => setMenuOpen(false)}
          >
            <a href="#top">Home</a>
            <a href="#about">About PulseMD</a>
            <a href="#features">Our platform</a>
            <a href="#pricing">Pricing</a>
            <a href="#faqs">FAQs</a>
            <Link to="/login">Admin sign in</Link>
            <Link to="/register">
              Get started <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </nav>
        )}
      </header>

      <main id="main-content" tabIndex={-1}>
        <section
          className="landing-hero"
          aria-label="Meet PulseMD"
          aria-roledescription="carousel"
        >
          {slides.map((item, index) => (
            <img
              key={item.image}
              src={item.image}
              alt={item.alt}
              width="1920"
              height="614"
              fetchPriority={index === 0 ? "high" : "auto"}
              className={`landing-hero-image ${index === activeSlide ? "is-active" : ""}`}
              aria-hidden={index !== activeSlide}
            />
          ))}
          <div className="landing-hero-wash" />
          <div className="landing-container landing-hero-inner">
            <div
              className="landing-hero-copy"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className="landing-eyebrow">
                <span />
                {slide.eyebrow}
              </p>
              <h1>
                {slide.title}
                <br />
                <span>{slide.accent}</span>
                <br />
                {slide.ending}
              </h1>
              <p className="landing-hero-description">{slide.body}</p>
            </div>
            <div className="landing-hero-actions">
              <Link
                to="/register"
                className="landing-button landing-button-yellow"
              >
                Start your free trial{" "}
                <ArrowUpRight size={19} aria-hidden="true" />
              </Link>
              <a href="#features" className="landing-text-link">
                Explore the platform <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
            <p className="landing-trial-note">
              <ShieldCheck size={15} aria-hidden="true" /> 30-day free trial{" "}
              <span>·</span> No credit card required
            </p>
            <div className="landing-hero-bottom">
              <a href="#about" className="landing-discover">
                <span>
                  <ArrowDown size={15} aria-hidden="true" />
                </span>{" "}
                Discover a better way to practice
              </a>
              <div className="landing-slide-controls">
                <span className="landing-slide-number">
                  0{activeSlide + 1}
                  <span> / 02</span>
                </span>
                <ActionButton
                  type="button"
                  onClick={() =>
                    setActiveSlide(
                      (activeSlide + slides.length - 1) % slides.length,
                    )
                  }
                  aria-label="Previous slide"
                >
                  <ChevronLeft size={19} />
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={() =>
                    setActiveSlide((activeSlide + 1) % slides.length)
                  }
                  aria-label="Next slide"
                >
                  <ChevronRight size={19} />
                </ActionButton>
              </div>
            </div>
          </div>
          <div className="landing-photo-label">
            <span />
            <span>
              People at the heart.
              <br />
              <strong>Technology by your side.</strong>
            </span>
          </div>
        </section>

        <section
          className="landing-highlights"
          aria-label="PulseMD at a glance"
        >
          <div className="landing-container">
            <div>
              <strong>
                01<span>.</span>
              </strong>
              <p>
                Connected platform.
                <br />
                Your whole practice.
              </p>
            </div>
            <div>
              <strong>
                06<span>.</span>
              </strong>
              <p>
                Core workflows.
                <br />
                Working together.
              </p>
            </div>
            <div>
              <strong>
                30<span> days</span>
              </strong>
              <p>
                To explore PulseMD.
                <br />
                Start with a free trial.
              </p>
            </div>
            <div className="landing-highlight-local">
              <MapPin size={33} strokeWidth={1.4} aria-hidden="true" />
              <p>
                Made for the way
                <br />
                <b>South Africa cares.</b>
              </p>
            </div>
          </div>
        </section>

        <section id="about" className="landing-section landing-about">
          <div className="landing-container landing-about-grid">
            <div className="landing-about-visual">
              <div className="landing-about-photo">
                <img
                  src="/images/landing/practice-team.webp"
                  width="700"
                  height="760"
                  alt="A medical team collaborating in their practice"
                  loading="lazy"
                />
              </div>
              <div className="landing-about-badge">
                <HeartHandshake
                  size={31}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span>
                  Made for people.
                  <br />
                  <strong>Built around your practice.</strong>
                </span>
              </div>
              <div className="landing-about-cross" aria-hidden="true">
                <Plus strokeWidth={1} />
              </div>
            </div>
            <div className="landing-about-copy">
              <p className="landing-eyebrow">
                <span /> A healthier way to run your practice
              </p>
              <h2>
                You care for your patients.
                <br />
                We help you care for
                <br />
                <span className="landing-muted-heading">your practice.</span>
              </h2>
              <p>
                Great care starts with a practice that runs smoothly. PulseMD
                brings your people, information and everyday tasks together, so
                the small things don’t get in the way of the important ones.
              </p>
              <div className="landing-about-benefits">
                <div>
                  <Stethoscope size={26} strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <h3>Designed around your day</h3>
                    <p>
                      From the first appointment to the last invoice, keep your
                      team in sync.
                    </p>
                  </div>
                </div>
                <div>
                  <ShieldCheck size={26} strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <h3>Confidence in every workflow</h3>
                    <p>
                      Organised records, staff permissions and a clearer view of
                      your practice.
                    </p>
                  </div>
                </div>
              </div>
              <a
                href="#features"
                className="landing-button landing-button-navy"
              >
                Meet your new workspace{" "}
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section landing-features">
          <div className="landing-container">
            <div className="landing-section-heading">
              <div>
                <p className="landing-eyebrow">
                  <span /> One platform. A more connected practice.
                </p>
                <h2>
                  Everything your day needs.
                  <br />
                  <span>All working together.</span>
                </h2>
              </div>
              <p>
                Less switching between systems. More clarity for your team.
                Discover the tools that keep your practice moving.
              </p>
            </div>
            <div className="landing-feature-grid">
              {features.map((feature, index) => (
                <article
                  key={feature.title}
                  className={`landing-feature-card ${activeFeature === index ? "is-expanded" : ""}`}
                >
                  <div className="landing-feature-top">
                    <feature.icon
                      size={34}
                      strokeWidth={1.3}
                      aria-hidden="true"
                    />
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                  <ActionButton
                    type="button"
                    onClick={() =>
                      setActiveFeature(activeFeature === index ? null : index)
                    }
                    aria-expanded={activeFeature === index}
                    aria-controls={`feature-detail-${index}`}
                    aria-label={`${activeFeature === index ? "Show less about" : "Explore"} ${feature.title}`}
                  >
                    {activeFeature === index ? "Show less" : "Explore feature"}
                    <span>
                      {activeFeature === index ? (
                        <X size={15} />
                      ) : (
                        <ArrowUpRight size={17} />
                      )}
                    </span>
                  </ActionButton>
                  <p
                    id={`feature-detail-${index}`}
                    className="landing-feature-detail"
                    hidden={activeFeature !== index}
                  >
                    {feature.detail}
                  </p>
                </article>
              ))}
            </div>
            <div className="landing-features-foot">
              <span>
                <HeartHandshake size={20} aria-hidden="true" /> Better tools for
                the people behind better care.
              </span>
              <Link to="/register">
                Find your fit <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-process">
          <div className="landing-container">
            <div className="landing-centered-heading">
              <p className="landing-eyebrow">
                <span /> Your next chapter starts here
              </p>
              <h2>A simpler practice, step by step.</h2>
              <p>
                A clear path from getting set up to getting on with your day.
              </p>
            </div>
            <div className="landing-process-grid">
              {[
                {
                  icon: ClipboardList,
                  title: "Make it your practice",
                  body: "Register, choose your plan and share your practice details for review.",
                },
                {
                  icon: Users,
                  title: "Bring your team together",
                  body: "Once approved, invite your staff, set permissions and organise your workspace.",
                },
                {
                  icon: HeartHandshake,
                  title: "Get back to great care",
                  body: "Manage your bookings, patient records and billing from one connected place.",
                },
              ].map((step, index) => (
                <div className="landing-process-step" key={step.title}>
                  <div className="landing-process-icon">
                    <step.icon
                      size={33}
                      strokeWidth={1.35}
                      aria-hidden="true"
                    />
                    <span>0{index + 1}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="landing-section landing-pricing">
          <div className="landing-container">
            <div className="landing-section-heading">
              <div>
                <p className="landing-eyebrow">
                  <span /> Room to grow
                </p>
                <h2>
                  The right fit for
                  <br />
                  your practice.
                </h2>
              </div>
              <p>
                Start with a 30-day free trial. Choose the plan that fits your
                team, with pricing in South African rand.
              </p>
            </div>
            <div className="landing-pricing-grid">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`landing-plan ${plan.name === "Growth" ? "landing-plan-featured" : ""}`}
                >
                  <div className="landing-plan-title">
                    <h3>{plan.name}</h3>
                    {plan.name === "Growth" && <span>POPULAR CHOICE</span>}
                  </div>
                  <p>{plan.description}</p>
                  <div className="landing-plan-price">
                    {plan.price ? (
                      <>
                        <span>R</span>
                        {plan.price}
                        <small>/ month</small>
                      </>
                    ) : (
                      <>
                        Let’s talk
                        <ArrowUpRight
                          size={31}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </div>
                  <p className="landing-plan-note">
                    {plan.price
                      ? "Excluding VAT"
                      : "Tailored to your practice’s needs"}
                  </p>
                  <Link
                    to="/register"
                    className={`landing-button ${plan.name === "Growth" ? "landing-button-yellow" : "landing-button-outline"}`}
                  >
                    {plan.price
                      ? "Start your free trial"
                      : "Register your interest"}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </Link>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={16} aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="landing-pricing-note">
              <ShieldCheck size={15} aria-hidden="true" /> No credit card
              required to start your trial.
            </p>
          </div>
        </section>

        <section id="faqs" className="landing-section landing-faqs">
          <div className="landing-container landing-faq-grid">
            <div>
              <p className="landing-eyebrow">
                <span /> A little more clarity
              </p>
              <h2>
                Good questions.
                <br />
                Simple answers.
              </h2>
              <p>Get to know PulseMD before you take the next step.</p>
              <Link to="/register" className="landing-text-link">
                Ready to get started?{" "}
                <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
            <div className="landing-faq-list">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>
                    {faq.question}
                    <Plus size={19} aria-hidden="true" />
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="landing-cta">
          <div className="landing-container">
            <div className="landing-cta-icon">
              <Activity size={48} strokeWidth={1.2} aria-hidden="true" />
            </div>
            <div>
              <p>Your practice. Your people. Your next step.</p>
              <h2>Make more room for better care.</h2>
            </div>
            <Link to="/register" className="landing-button landing-button-navy">
              Let’s get started <ArrowUpRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <Link to="/" aria-label="PulseMD home">
                <PulseLogoOnDark size={42} />
              </Link>
              <p>
                A more connected practice.
                <br />
                More time for the people who need you.
              </p>
              <span>
                <MapPin size={15} aria-hidden="true" /> Built for South African
                healthcare.
              </span>
            </div>
            <div>
              <h2>Discover PulseMD</h2>
              <a href="#about">About us</a>
              <a href="#features">Our platform</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Plans & pricing</a>
            </div>
            <div>
              <h2>Take the next step</h2>
              <Link to="/register">Register your practice</Link>
              <Link to="/login">Admin sign in</Link>
              <Link to="/book">Find a doctor</Link>
              <a href="#faqs">Frequently asked questions</a>
            </div>
            <div className="landing-footer-patient">
              <Stethoscope size={29} strokeWidth={1.4} aria-hidden="true" />
              <h2>Here as a patient?</h2>
              <p>Find a practice and take the next step towards your care.</p>
              <Link to="/book">
                Book an appointment{" "}
                <ArrowUpRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <span>
              © {new Date().getFullYear()} PulseMD. All rights reserved.
            </span>
            <span>Practice intelligence, delivered.</span>
            <a href="#top">
              Back to top <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
