import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Facebook, Menu } from "lucide-react";

const BRAND = { dark: "#1f160f", lime: "#b6e300" };
const BUSINESS = {
  phone: "(215) 531-0907",
  email: "Neighborhoodkrew@gmail.com",
  facebook: "https://www.facebook.com/TheNeighborhoodKrew",
  const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
);

// Exit-intent & promo email logic
const EXIT_DISMISS_KEY = "nk_exit_dismissed_until";
const EXIT_SEEN_SESSION = "nk_exit_seen_session";

function shouldOpenExit() {
  try {
    if (sessionStorage.getItem(EXIT_SEEN_SESSION) === "1") return false;
    const until = Number(localStorage.getItem(EXIT_DISMISS_KEY) || 0);
    if (until && Date.now() < until) return false;
  } catch {
    // ignore
  }
  return true;
}

function markExitSeen() {
  try {
    sessionStorage.setItem(EXIT_SEEN_SESSION, "1");
  } catch {
    // ignore
  }
}

function dismissExit(days: number) {
  try {
    localStorage.setItem(
      EXIT_DISMISS_KEY,
      String(Date.now() + days * 24 * 60 * 60 * 1000)
    );
  } catch {
    // ignore
  }
}

async function subscribeAndSendPromo(email: string) {
  const r = await fetch("/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }).catch(() => null);
  if (!r) return { ok: false };
  const data = await r.json().catch(() => ({}));
  return data;
}

type DepositForm = {
  email: string;
  service: string;
  date: string;
  timeWindow: string;
};

type Review = {
  title: string;
  body: string;
  name: string;
  meta?: string;
};

const REVIEWS: Review[] = [
  {
    title: "“Every item arrived undamaged”",
    body:
      "From the moment I contacted Alex, I knew I was in good hands. He came out to my house to see what his team would be moving to give me a quote. He was very patient working around the weather. I am pleased to say every item arrived at the new home undamaged. His pricing was reasonable with exceptional service. I would highly recommend Alex and the Neighborhood Krew and give them 20 stars if I could.",
    name: "Verified Homeowner",
    meta: "Full home move",
  },
  {
    title: "“They treated my furniture like it was theirs”",
    body:
      "The crew showed up on time, wrapped every piece of furniture, and took extra care with my glass cabinets. They worked quickly but never rushed. It honestly felt like they were moving their own home.",
    name: "Maria P.",
    meta: "Princeton, NJ",
  },
  {
    title: "“Saved our grand opening”",
    body:
      "We had fixtures and gym equipment show up late for our buildout. Neighborhood Krew rearranged their schedule, delivered everything same-day, and got us ready for our soft opening. Couldn’t have pulled it off without them.",
    name: "Chris L.",
    meta: "Retail / Gym buildout",
  },
  {
    title: "“The only movers I’ll call from now on”",
    body:
      "I’ve moved three times in the last 5 years and this was by far the smoothest. Transparent rates, no surprise fees, and the guys were friendly and professional the entire time.",
    name: "Devon S.",
    meta: "Bucks County, PA",
  },
  {
    title: "“Handled our piano and appliances perfectly”",
    body:
      "We needed a piano and a few new appliances moved around inside the house. They navigated tight stairwells and doorways without a scratch. In-home move was worth every penny.",
    name: "Hannah R.",
    meta: "In-home move",
  },
  {
    title: "“Clean, fast, and respectful”",
    body:
      "They laid down floor protection, wrapped our door frames, and cleaned up as they went. The crew was respectful to both our family and the property. Highly recommend.",
    name: "Jordan K.",
    meta: "Philadelphia, PA",
  },
];
type DepositFormLocal = {
  email: string;
  service: string;
  date: string;
  timeWindow: string;
};

function DepositCheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const [form, setForm] = useState<DepositFormLocal>({
    email: "",
    service: "Residential & Apartment Move",
    date: "",
    timeWindow: "Morning (8am–12pm)",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const updateField = (field: keyof DepositFormLocal, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!stripe || !elements) {
      setError("Payment system is still loading. Please try again in a moment.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Could not find card input. Please refresh and try again.");
      return;
    }

    setLoading(true);
    try {
      // 1) Ask backend to create PaymentIntent
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Unable to start payment");
      }

      // 2) Confirm card payment with Stripe.js
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(data.clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: form.email,
            },
          },
        });

      if (stripeError) {
        console.error(stripeError);
        throw new Error(stripeError.message || "Payment failed");
      }

      if (paymentIntent && paymentIntent.status === "succeeded") {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      } else {
        throw new Error("Payment was not completed. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong while processing payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        type="email"
        required
        placeholder="Your email"
        value={form.email}
        onChange={(e) =>
          updateField("email", (e.target as HTMLInputElement).value)
        }
      />
      <select
        className="border rounded-md px-3 py-2 w-full text-sm"
        value={form.service}
        onChange={(e) => updateField("service", e.target.value)}
      >
        <option>Residential & Apartment Move</option>
        <option>Commercial & Freight</option>
        <option>In-Home Move (appliance / furniture)</option>
        <option>Junk Removal</option>
        <option>Packing Only</option>
        <option>Labor Only (No Truck)</option>
      </select>
      <div className="flex flex-col md:flex-row gap-3">
        <Input
          type="date"
          required
          value={form.date}
          onChange={(e) =>
            updateField("date", (e.target as HTMLInputElement).value)
          }
        />
        <select
          className="border rounded-md px-3 py-2 w-full text-sm"
          value={form.timeWindow}
          onChange={(e) => updateField("timeWindow", e.target.value)}
        >
          <option>Morning (8am–12pm)</option>
          <option>Midday (12pm–4pm)</option>
          <option>Evening (4pm–8pm)</option>
          <option>Flexible / Call to confirm</option>
        </select>
      </div>

      <div className="border rounded-md px-3 py-2 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#111",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-green-600">
          Deposit paid! We’ll follow up to confirm your move details.
        </p>
      )}

      <Button
        type="submit"
        style={{ backgroundColor: "#b6e300", color: "#111" }}
        className="w-full rounded-2xl"
        disabled={loading || !stripe || !elements}
      >
        {loading ? "Processing..." : "Pay $75 Deposit & Reserve Date"}
      </Button>

      <p className="text-[11px] text-gray-500 mt-2">
        Deposit is applied toward your final move total. You can adjust the
        exact policy with the owner (e.g. refundable up to 72 hours before the
        move).
      </p>
    </form>
  );
}
export default function App() {
  const [exitOpen, setExitOpen] = useState(false);
  const [exitEmail, setExitEmail] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositForm, setDepositForm] = useState<DepositForm>({
    email: "",
    service: "Residential & Apartment Move",
    date: "",
    timeWindow: "Morning (8am–12pm)",
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerSmall, setHeaderSmall] = useState(false);
  const [activeReview, setActiveReview] = useState(0);

  // Exit intent popup
  useEffect(() => {
    const onOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && shouldOpenExit()) {
        setExitOpen(true);
        markExitSeen();
      }
    };
    addEventListener("mouseout", onOut);
    return () => removeEventListener("mouseout", onOut);
  }, []);

  // Shrinking header on scroll
  useEffect(() => {
    const onScroll = () => {
      setHeaderSmall(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-rotating reviews
  useEffect(() => {
    const id = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % REVIEWS.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const closeExit = () => {
    setExitOpen(false);
    dismissExit(7);
  };

  const handleDepositChange = (field: keyof DepositForm, value: string) => {
    setDepositForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositLoading(true);
    setDepositError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositForm),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Unable to start checkout");
      }
      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      setDepositError(
        err.message || "Something went wrong starting secure checkout."
      );
    } finally {
      setDepositLoading(false);
    }
  };

  const QuoteBtn = ({ label }: { label: string }) => (
    <Button
      style={{ backgroundColor: BRAND.lime, color: "#111" }}
      className="mt-3 w-full"
      onClick={() =>
        document
          .getElementById("contact")
          ?.scrollIntoView({ behavior: "smooth" })
      }
    >
      Get a Quote for {label}
    </Button>
  );

  const StarRow = () => (
    <div
      aria-label="5 star rating"
      className="text-yellow-500"
      style={{ letterSpacing: "2px" }}
    >
      ★★★★★
    </div>
  );

  const currentReview = REVIEWS[activeReview];

  return (
    <div id="top">
      {/* Top contact bar */}
      <div className="bg-black text-white text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          {/* Tagline / trust */}
          <div className="flex items-center gap-2 text-white/80">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
              <Phone className="h-3 w-3" />
            </span>
            <span>Fast, careful, neighbor-approved movers</span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:+12155310907"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs sm:text-[13px] hover:bg-white/10 hover:border-white/40 transition"
            >
              <Phone className="h-3 w-3" />
              <span>{BUSINESS.phone}</span>
            </a>

            <a
              href={`mailto:${BUSINESS.email}`}
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs sm:text-[13px] hover:bg-white/10 hover:border-white/40 transition"
            >
              <Mail className="h-3 w-3" />
              <span>Email us</span>
            </a>

            <a
              href={BUSINESS.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs sm:text-[13px] hover:bg-white/10 hover:border-white/40 transition"
            >
              <Facebook className="h-3 w-3" />
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>

      {/* Header with mobile nav */}
      <header
        className={`border-b bg-white/80 backdrop-blur sticky top-0 z-40 transition-all duration-200 ${
          headerSmall ? "shadow-sm" : ""
        }`}
      >
        <div
          className={`max-w-6xl mx-auto px-4 flex items-center justify-between transition-all duration-200 ${
            headerSmall ? "py-2" : "py-3"
          }`}
        >
          <a
            href="#top"
            className={`font-semibold transition-all ${
              headerSmall ? "text-sm" : "text-base"
            }`}
          >
            Neighborhood Krew Inc
          </a>

          {/* Desktop nav */}
          <nav
            className={`hidden md:flex items-center gap-6 transition-all duration-200 ${
              headerSmall ? "text-xs" : "text-sm"
            }`}
          >
            <a href="#services">Services</a>
            <a href="#pricing">In-Home Moves</a>
            <a href="#reviews">Reviews</a>
            <a href="#gallery">Gallery</a>
            <a href="#hiring">We’re Hiring</a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm bg-white"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs">Menu</span>
          </button>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
              <a
                href="#services"
                onClick={() => setMobileNavOpen(false)}
                className="py-1"
              >
                Services
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileNavOpen(false)}
                className="py-1"
              >
                In-Home Moves
              </a>
              <a
                href="#reviews"
                onClick={() => setMobileNavOpen(false)}
                className="py-1"
              >
                Reviews
              </a>
              <a
                href="#gallery"
                onClick={() => setMobileNavOpen(false)}
                className="py-1"
              >
                Gallery
              </a>
              <a
                href="#hiring"
                onClick={() => setMobileNavOpen(false)}
                className="py-1"
              >
                We’re Hiring
              </a>
              <a
                href="#contact"
                onClick={() => setMobileNavOpen(false)}
                className="py-1 font-semibold text-[color:#1f160f]"
              >
                Get a Quote
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero with faded background image */}
      <section className="relative overflow-hidden">
        <img
          src="/main2.jpg"
          className="absolute inset-0 w-full h-full object-cover"
          alt="Neighborhood Krew truck"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(31,22,15,.72), rgba(31,22,15,.65))",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Fast, Careful,{" "}
            <span
              className="px-2 rounded-xl"
              style={{ backgroundColor: BRAND.lime, color: "#111" }}
            >
              Neighbor-Approved
            </span>{" "}
            Movers
          </h1>
          <p className="mt-4 text-white/85 text-lg">
            Local & long-distance moving, packing, junk removal, and freight.
            Serving Greater Philadelphia & New Jersey.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a href="tel:+12155310907">
              <Button variant="outline">Call {BUSINESS.phone}</Button>
            </a>
            <Button
              style={{ backgroundColor: BRAND.lime, color: "#111" }}
              onClick={() =>
                document
                  .getElementById("contact")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Get My Quote
            </Button>
          </div>

          <div className="mt-8 text-sm text-white/85">
            Trusted by premium brands & venues
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <img
              src="/featured/lux1.jpg"
              className="rounded-lg border object-cover h-32 w-full"
              alt="Premium client 1"
            />
            <img
              src="/featured/lux2.jpg"
              className="rounded-lg border object-cover h-32 w-full"
              alt="Premium client 2"
            />
            <img
              src="/featured/lux3.jpg"
              className="rounded-lg border object-cover h-32 w-full"
              alt="Premium client 3"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center md:text-left">
                Residential & Apartment
              </CardTitle>
            </CardHeader>
            <CardContent>
              Full-service moves with protection wrap, disassembly/reassembly,
              and careful loading.
              <QuoteBtn label="Residential Moves" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center md:text-left">
                Commercial & Freight
              </CardTitle>
            </CardHeader>
            <CardContent>
              Store buildouts, distribution, palletized freight, gym & office
              moves.
              <QuoteBtn label="Commercial & Freight" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-center md:text-left">
                Junk Removal & Hauling
              </CardTitle>
            </CardHeader>
            <CardContent>
              Cleanouts and responsible disposal, priced by volume.
              <QuoteBtn label="Junk Removal" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact / Quote – moved above pricing, now with file upload */}
      <section id="contact" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">Get Your Quote</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tell us about your move, in-home project, or junk removal job and
              we’ll follow up with a clear, custom quote. You can also attach
              photos so we can give a more accurate estimate.
            </p>
            <form
              onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const formEl = e.currentTarget;
                const formData = new FormData(formEl);

                try {
                  const res = await fetch("/api/quote", {
                    method: "POST",
                    body: formData,
                  });
                  if (res.ok) {
                    alert(
                      "Thanks! We received your details and any photos. We’ll get back to you shortly."
                    );
                  } else {
                    alert(
                      "We received your request, but there was an issue submitting details. If you don’t hear from us, please call or email directly."
                    );
                  }
                } catch (err) {
                  console.error(err);
                  alert(
                    "There was an issue submitting your request. Please also feel free to call or email us directly."
                  );
                }

                formEl.reset();
              }}
              className="space-y-3"
            >
              <Input name="name" placeholder="Full name" required />
              <Input name="email" type="email" placeholder="Email" required />
              <Input name="phone" placeholder="Phone" />
              <select
                name="service"
                className="border rounded-md px-3 py-2 w-full"
                required
              >
                <option value="">Choose service</option>
                <option>Residential & Apartment Move</option>
                <option>Commercial & Freight</option>
                <option>In-Home Move (appliance / furniture)</option>
                <option>Junk Removal</option>
                <option>Packing Only</option>
                <option>Labor Only (No Truck)</option>
              </select>
              <Textarea
                name="details"
                placeholder="Move details (where from, where to, stairs, dates, etc.)"
              />
              <div className="text-xs text-gray-600">
                <label className="block">
                  Optional photos (up to several images):
                  <input
                    type="file"
                    name="photos"
                    accept="image/*"
                    multiple
                    className="mt-1 block w-full text-xs text-gray-700"
                  />
                </label>
                <p className="mt-1">
                  Attach pictures of stairs, driveways, tight spaces, or items
                  you’re most worried about.
                </p>
              </div>
              <Button style={{ backgroundColor: "#b6e300", color: "#111" }}>
                Request Quote
              </Button>
            </form>
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              Join our list for a promo code
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = (e.currentTarget as any).email.value;
                const res = await subscribeAndSendPromo(email);
                dismissExit(7);
                setExitOpen(false);
                if (res?.code)
                  alert(
                    `Promo code sent to ${email}. Backup code: ${res.code}`
                  );
                else
                  alert(
                    res?.ok
                      ? "Promo sent — check your email."
                      : "We saved your email. Connect email to auto-send."
                  );
                (e.currentTarget as HTMLFormElement).reset();
              }}
              className="flex gap-2"
            >
              <Input
                name="email"
                type="email"
                placeholder="you@email.com"
                required
              />
              <Button style={{ backgroundColor: "#b6e300", color: "#111" }}>
                Get Code
              </Button>
            </form>
            <p className="text-sm text-gray-600 mt-4">
              Questions? Email{" "}
              <a href={`mailto:${BUSINESS.email}`} className="underline">
                {BUSINESS.email}
              </a>{" "}
              or call{" "}
              <a href="tel:+12155310907" className="underline">
                {BUSINESS.phone}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Pricing – specifically In-Home Moves */}
      <section id="pricing" className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">Simple In-Home Moves</h2>
          <p className="text-sm text-gray-600 mb-6 max-w-2xl">
            In-home moves are perfect for things like shifting new appliances,
            rearranging heavy furniture, or moving items between rooms and
            floors.{" "}
            <span className="font-semibold">
              Full residential moves (entire apartments or houses) require a
              custom quote and will cost more than these in-home rates.
            </span>
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>2 Movers (In-Home)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$150/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  For in-home furniture rearranges, appliance swaps, and small
                  jobs. 2-hour minimum.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>3 Movers (In-Home)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$210/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  Great when you have stairs, tight spaces, or heavier items
                  that need extra hands.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Labor Only</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$75/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  Per mover • 2-hour minimum • You provide the truck, we provide
                  the muscle for loading/unloading.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

            {/* Reserve Date with Deposit (Stripe Elements on-site card form) */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">
            Reserve Your Move Date with a Deposit
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            In a time crunch? Secure your preferred move date with a{" "}
            <span className="font-semibold">$75 deposit.</span> We’ll call to
            finalize your full quote and apply this deposit to your final move
            invoice.
          </p>

          <Card className="max-w-xl">
            <CardContent className="pt-6">
              <Elements stripe={stripePromise}>
                <DepositCheckoutForm />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </section>

          <Card className="max-w-xl">
            <CardContent className="pt-6">
              <form onSubmit={submitDeposit} className="space-y-3">
                <Input
                  type="email"
                  required
                  placeholder="Your email"
                  value={depositForm.email}
                  onChange={(e) =>
                    handleDepositChange(
                      "email",
                      (e.target as HTMLInputElement).value
                    )
                  }
                />
                <select
                  className="border rounded-md px-3 py-2 w-full text-sm"
                  value={depositForm.service}
                  onChange={(e) =>
                    handleDepositChange("service", e.target.value)
                  }
                >
                  <option>Residential & Apartment Move</option>
                  <option>Commercial & Freight</option>
                  <option>In-Home Move (appliance / furniture)</option>
                  <option>Junk Removal</option>
                  <option>Packing Only</option>
                  <option>Labor Only (No Truck)</option>
                </select>
                <div className="flex flex-col md:flex-row gap-3">
                  <Input
                    type="date"
                    required
                    value={depositForm.date}
                    onChange={(e) =>
                      handleDepositChange(
                        "date",
                        (e.target as HTMLInputElement).value
                      )
                    }
                  />
                  <select
                    className="border rounded-md px-3 py-2 w-full text-sm"
                    value={depositForm.timeWindow}
                    onChange={(e) =>
                      handleDepositChange("timeWindow", e.target.value)
                    }
                  >
                    <option>Morning (8am–12pm)</option>
                    <option>Midday (12pm–4pm)</option>
                    <option>Evening (4pm–8pm)</option>
                    <option>Flexible / Call to confirm</option>
                  </select>
                </div>

                {depositError && (
                  <p className="text-sm text-red-600">{depositError}</p>
                )}

                <Button
                  type="submit"
                  style={{ backgroundColor: BRAND.lime, color: "#111" }}
                  className="w-full rounded-2xl"
                  disabled={depositLoading}
                >
                  {depositLoading
                    ? "Starting secure checkout..."
                    : "Pay $75 Deposit & Reserve Date"}
                </Button>

                <p className="text-[11px] text-gray-500 mt-2">
                  Deposit is applied toward your final move total. You can
                  adjust the exact policy with the owner (e.g. refundable up to
                  72 hours before the move).
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Reviews – auto-rotating slideshow */}
      <section id="reviews" className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm text-gray-500 mb-1">
            Trusted by more than 10,000 customers.
          </p>
          <h2 className="text-2xl font-bold mb-6">What Our Customers Say</h2>

          <div className="grid md:grid-cols-[2fr,1fr] gap-8 items-stretch">
            {/* Main sliding review */}
            <Card className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <CardTitle className="text-base md:text-lg">
                    {currentReview.title}
                  </CardTitle>
                  <StarRow />
                </div>
                <p className="mt-3 text-gray-700 text-sm md:text-base">
                  {currentReview.body}
                </p>
                <div className="mt-4 text-sm text-gray-600">
                  — {currentReview.name}
                  {currentReview.meta ? ` • ${currentReview.meta}` : ""}
                </div>
              </CardContent>

              {/* Dots for slideshow */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                {REVIEWS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveReview(idx)}
                    className={`h-2 w-2 rounded-full transition ${
                      idx === activeReview
                        ? "bg-black"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to review ${idx + 1}`}
                  />
                ))}
              </div>
            </Card>

            {/* Side stack of quick quotes */}
            <div className="space-y-3">
              {REVIEWS.slice(0, 3).map((r, idx) => (
                <Card key={idx} className="border-dashed border-gray-200">
                  <CardContent className="py-3">
                    <StarRow />
                    <p className="mt-1 text-xs text-gray-700 line-clamp-3">
                      {r.body}
                    </p>
                    <div className="mt-1 text-[11px] text-gray-500">
                      — {r.name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section id="gallery" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Recent Jobs & Trucks</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <img
                key={i}
                src={`/gallery/krew${i + 1}.jpg`}
                className="rounded-lg border object-cover w-full h-40"
                alt={`Job ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* We're Hiring */}
      <section id="hiring" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold">We’re Hiring!</h2>
          <p className="text-gray-600 mt-2">
            Looking for hard-working movers and drivers. Fill out the form and
            we’ll get in touch.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const raw = Object.fromEntries(fd.entries());
              const payload = { type: "hiring_application", ...raw };
              const r = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (r.ok) alert("Thanks! Your application was submitted.");
              else
                alert(
                  "Could not submit application. Please email us."
                );
              (e.currentTarget as HTMLFormElement).reset();
            }}
            className="mt-4 grid md:grid-cols-3 gap-3"
          >
            <Input name="name" placeholder="Full name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="phone" placeholder="Phone" required />
            <Input name="city" placeholder="City" />
            <select
              name="role"
              className="border rounded-md px-3 py-2 w-full"
              required
            >
              <option value="">Position interested in</option>
              <option>Mover</option>
              <option>Driver</option>
              <option>Lead / Foreman</option>
            </select>
            <select
              name="availability"
              className="border rounded-md px-3 py-2 w-full"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Weekends only</option>
            </select>
            <Textarea
              name="notes"
              className="md:col-span-3"
              placeholder="Tell us about your experience"
            />
            <div className="md:col-span-3">
              <Button style={{ backgroundColor: "#b6e300", color: "#111" }}>
                Submit Application
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs sm:text-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-gray-600">
            © {new Date().getFullYear()} Neighborhood Krew Inc. All rights
            reserved.
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:+12155310907"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50 transition"
            >
              <Phone className="h-3 w-3 text-gray-700" />
              <span>{BUSINESS.phone}</span>
            </a>
            <a
              href={`mailto:${BUSINESS.email}`}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50 transition"
            >
              <Mail className="h-3 w-3 text-gray-700" />
              <span>Contact</span>
            </a>
            <a
              href={BUSINESS.facebook}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50 transition"
            >
              <Facebook className="h-3 w-3 text-gray-700" />
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Exit-intent promo popup */}
      {exitOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold">Wait — take $25 off?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Join our list and we’ll email you a one-time promo code
              instantly.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const email = exitEmail;
                const res = await subscribeAndSendPromo(email);
                closeExit();
                if (res?.code)
                  alert(
                    `Promo code sent to ${email}. Backup: ${res.code}`
                  );
                else
                  alert(
                    res?.ok
                      ? "Promo sent — check your email."
                      : "We saved your email. Connect email to auto-send."
                  );
              }}
              className="mt-4 flex gap-2"
            >
              <Input
                type="email"
                placeholder="you@email.com"
                value={exitEmail}
                onChange={(e) =>
                  setExitEmail((e.target as HTMLInputElement).value)
                }
                required
              />
              <Button style={{ backgroundColor: "#b6e300", color: "#111" }}>
                Send
              </Button>
            </form>
            <div className="mt-3 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  closeExit();
                }}
              >
                No thanks
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile "Call Now" floating button */}
      <a
        href="tel:+12155310907"
        className="fixed bottom-4 right-4 z-40 md:hidden inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 shadow-lg text-sm"
      >
        <Phone className="h-4 w-4" />
        <span>Call Now</span>
      </a>
    </div>
  );
}
