import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const BRAND = { dark: "#1f160f", lime: "#b6e300" };
const BUSINESS = {
  phone: "(215) 531-0907",
  email: "Neighborhoodkrew@gmail.com",
  facebook: "https://www.facebook.com/TheNeighborhoodKrew",
};

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
      // Redirect to Stripe Checkout
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

  return (
    <div id="top">
      {/* Top contact bar */}
      <div className="bg-black text-white text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>
            Call{" "}
            <a className="underline" href="tel:+12155310907">
              {BUSINESS.phone}
            </a>{" "}
            • Email{" "}
            <a className="underline" href={`mailto:${BUSINESS.email}`}>
              {BUSINESS.email}
            </a>
          </div>
          <a className="underline" href={BUSINESS.facebook}>
            Facebook
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="#top" className="font-semibold">
            Neighborhood Krew Inc
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services">Services</a>
            <a href="#pricing">Pricing</a>
            <a href="#reviews">Reviews</a>
            <a href="#gallery">Gallery</a>
            <a href="#hiring">We’re Hiring</a>
          </nav>
        </div>
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
              <CardTitle>Residential & Apartment</CardTitle>
            </CardHeader>
            <CardContent>
              Full-service moves with protection wrap, disassembly/reassembly,
              and careful loading.
              <QuoteBtn label="Residential Moves" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Commercial & Freight</CardTitle>
            </CardHeader>
            <CardContent>
              Store buildouts, distribution, palletized freight, gym & office
              moves.
              <QuoteBtn label="Commercial & Freight" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Junk Removal & Hauling</CardTitle>
            </CardHeader>
            <CardContent>
              Cleanouts and responsible disposal, priced by volume.
              <QuoteBtn label="Junk Removal" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-12 md:py-16 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>2 Movers + Truck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$150/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  2-hour minimum • Includes pads, shrink wrap & basic supplies
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>3 Movers + Truck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$210/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  Great for 2–3 bedroom moves
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Packing / Labor Only</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$75/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  Per mover • 2-hour minimum
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reserve Date with Deposit */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-3">
            Reserve Your Move Date with a Deposit
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            In a time crunch? Secure your preferred move date with a $100
            deposit. We’ll call to finalize your full quote and apply this
            deposit to your invoice.
          </p>

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
                    : "Pay $100 Deposit & Reserve Date"}
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

      {/* Reviews */}
      <section id="reviews" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">What Our Customers Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>“Every item arrived undamaged”</CardTitle>
              </CardHeader>
              <CardContent>
                <StarRow />
                <p className="mt-3 text-gray-700">
                  From the moment I contacted Alex, I knew I was in good hands.
                  He came out to my house to see what his team would be moving
                  to give me a quote... He was very patient working around the
                  weather. I am pleased to say every item arrived at the new
                  home undamaged. His pricing was reasonable with exceptional
                  service. I would highly recommend Alex and the Neighborhood
                  Krew and give them 20 stars if I could.
                </p>
                <img
                  src="/reviews/review1.jpg"
                  alt="Full review screenshot"
                  className="mt-3 rounded-lg border"
                />
                <div className="mt-2 text-sm text-gray-500">
                  — Verified Homeowner
                </div>
              </CardContent>
            </Card>
            <div className="grid gap-6">
              <Card>
                <CardContent>
                  <StarRow />
                  <p className="mt-2">
                    “Team was early, wrapped everything, and got us moved in
                    record time. 10/10.”
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    — Maria P., Princeton, NJ
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <StarRow />
                  <p className="mt-2">
                    “Best movers I’ve used. Fair hourly rate and super careful
                    with my gym equipment.”
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    — Devon S., Bucks County
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <StarRow />
                  <p className="mt-2">
                    “Responsive, transparent pricing, and the crew was
                    respectful. Highly recommend.”
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    — Hannah R., Philadelphia
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <StarRow />
                  <p className="mt-2">
                    “Handled a store buildout flawlessly. Will be using them for
                    future freight runs.”
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    — Chris L., Retail Ops
                  </div>
                </CardContent>
              </Card>
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

      {/* Contact with "Choose Service" dropdown */}
      <section id="contact" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">Get Your Quote</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                alert("Thanks! We’ll get back to you shortly.");
                (e.currentTarget as HTMLFormElement).reset();
              }}
              className="space-y-3"
            >
              <Input name="name" placeholder="Full name" required />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                required
              />
              <Input name="phone" placeholder="Phone" />
              <select
                name="service"
                className="border rounded-md px-3 py-2 w-full"
                required
              >
                <option value="">Choose service</option>
                <option>Residential & Apartment Move</option>
                <option>Commercial & Freight</option>
                <option>Junk Removal</option>
                <option>Packing Only</option>
                <option>Labor Only (No Truck)</option>
              </select>
              <Textarea
                name="details"
                placeholder="Move details (where from, where to, stairs, etc.)"
              />
              <Button
                style={{ backgroundColor: "#b6e300", color: "#111" }}
              >
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
              <Button
                style={{ backgroundColor: "#b6e300", color: "#111" }}
              >
                Get Code
              </Button>
            </form>
            <p className="text-sm text-gray-600 mt-4">
              Questions? Email{" "}
              <a
                href={`mailto:${BUSINESS.email}`}
                className="underline"
              >
                {BUSINESS.email}
              </a>{" "}
              or call{" "}
              <a
                href="tel:+12155310907"
                className="underline"
              >
                {BUSINESS.phone}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* We're Hiring */}
      <section id="hiring" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold">We’re Hiring!</h2>
          <p className="text-gray-600 mt-2">
            Looking for hard-working movers and drivers. Fill out the form and
            we’ll get in touch.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(
                e.currentTarget as HTMLFormElement
              );
              const raw = Object.fromEntries(fd.entries());
              const payload = { type: "hiring_application", ...raw };
              const r = await fetch("/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (r.ok)
                alert("Thanks! Your application was submitted.");
              else
                alert(
                  "Could not submit application. Please email us."
                );
              (e.currentTarget as HTMLFormElement).reset();
            }}
            className="mt-4 grid md:grid-cols-3 gap-3"
          >
            <Input name="name" placeholder="Full name" required />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
            />
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
              <Button
                style={{ backgroundColor: "#b6e300", color: "#111" }}
              >
                Submit Application
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} Neighborhood Krew Inc
          </div>
          <a
            href={BUSINESS.facebook}
            className="underline"
          >
            Facebook
          </a>
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
              <Button
                style={{ backgroundColor: "#b6e300", color: "#111" }}
              >
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
    </div>
  );
}
