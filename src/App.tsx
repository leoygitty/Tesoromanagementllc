import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Facebook, Menu } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const BRAND = { dark: "#1f160f", lime: "#b6e300" };
const BUSINESS = {
  phone: "(215) 531-0907",
  email: "Neighborhoodkrew@gmail.com",
  facebook: "https://www.facebook.com/TheNeighborhoodKrew",
};

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
);

// Exit-intent promo logic
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

// Stripe deposit form
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
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || "Unable to start payment");
      }

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

// Quiz / wizard types + helpers
type MoveSize = "studio_1br" | "2br" | "3br" | "4br" | "5plus";
type QuoteStep = 1 | 2 | 3;

type QuoteWizardState = {
  moveType: "Local" | "Long-distance";
  size: MoveSize | "";
  sqft: string;
  fromZip: string;
  toZip: string;
  distance: "under25" | "25-75" | "75-150" | "150+";
  stairs: "None" | "Some" | "A lot";
  hasElevator: "yes" | "no" | "unknown";
  specialItems: string;
  name: string;
  email: string;
  phone: string;
  moveDate: string;
  photos: File[];
};

function computeEstimate(state: QuoteWizardState) {
  let low = 2000;
  let high = 3500;

  switch (state.size) {
    case "2br":
      low = 3000;
      high = 5000;
      break;
    case "3br":
      low = 4500;
      high = 7000;
      break;
    case "4br":
      low = 6500;
      high = 10000;
      break;
    case "5plus":
      low = 9000;
      high = 12000;
      break;
    default:
      break;
  }

  // Sqft nudge
  const sqft = parseInt(state.sqft || "0", 10);
  if (!isNaN(sqft) && sqft > 0) {
    if (sqft > 2500) {
      low *= 1.1;
      high *= 1.15;
    } else if (sqft < 900) {
      low *= 0.9;
      high *= 0.9;
    }
  }

  // Distance
  if (state.moveType === "Long-distance" || state.distance === "150+") {
    low *= 1.2;
    high *= 1.25;
  } else if (state.distance === "75-150") {
    low *= 1.1;
    high *= 1.15;
  }

  // Stairs
  if (state.stairs === "Some") {
    low *= 1.05;
    high *= 1.08;
  } else if (state.stairs === "A lot") {
    low *= 1.1;
    high *= 1.15;
  }

  // Special items
  if (state.specialItems.trim().length > 0) {
    low *= 1.03;
    high *= 1.06;
  }

  // Clamp between 2k–12k
  low = Math.max(2000, Math.min(low, 12000));
  high = Math.max(low + 500, Math.min(high, 12000));

  // Round to nearest $50
  low = Math.round(low / 50) * 50;
  high = Math.round(high / 50) * 50;

  return { low, high };
}

function QuoteButton({ label }: { label: string }) {
  return (
    <Button
      style={{ backgroundColor: BRAND.lime, color: "#111" }}
      className="mt-3 w-full"
      onClick={() =>
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
      }
    >
      Get a Quote for {label}
    </Button>
  );
}

function StarRow() {
  return (
    <div
      aria-label="5 star rating"
      className="text-yellow-500"
      style={{ letterSpacing: "2px" }}
    >
      ★★★★★
    </div>
  );
}

// Multi-step quote / quiz wizard
function QuoteWizard() {
  const [step, setStep] = useState<QuoteStep>(1);
  const [state, setState] = useState<QuoteWizardState>({
    moveType: "Local",
    size: "",
    sqft: "",
    fromZip: "",
    toZip: "",
    distance: "under25",
    stairs: "None",
    hasElevator: "unknown",
    specialItems: "",
    name: "",
    email: "",
    phone: "",
    moveDate: "",
    photos: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<{ low: number; high: number } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateField = (field: keyof QuoteWizardState, value: any) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!state.size) {
        setError("Please choose your home size.");
        return;
      }
      if (!state.sqft) {
        setError("Please estimate your square footage.");
        return;
      }
    }
    if (step === 2) {
      if (!state.fromZip || !state.toZip) {
        setError("Please enter both starting and destination ZIP codes.");
        return;
      }
    }
    setStep((s) => (s < totalSteps ? ((s + 1) as QuoteStep) : s));
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => (s > 1 ? ((s - 1) as QuoteStep) : s));
  };

  const handlePhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    updateField("photos", files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitted(false);

    if (!state.name || !state.email) {
      setError("Please enter your name and email so we can follow up.");
      return;
    }

    const est = computeEstimate(state);
    setEstimate(est);

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", state.name);
      fd.append("email", state.email);
      fd.append("phone", state.phone);
      fd.append("service", "Residential Move – Quiz Funnel");

      const detailsLines = [
        `Move type: ${state.moveType}`,
        `Home size: ${
          state.size === "studio_1br"
            ? "Studio / 1 Bedroom"
            : state.size === "2br"
            ? "2 Bedroom"
            : state.size === "3br"
            ? "3 Bedroom"
            : state.size === "4br"
            ? "4 Bedroom"
            : state.size === "5plus"
            ? "5+ Bedroom"
            : "Not specified"
        }`,
        `Approx. square footage: ${state.sqft || "N/A"}`,
        `From ZIP: ${state.fromZip || "N/A"}`,
        `To ZIP: ${state.toZip || "N/A"}`,
        `Approx. distance: ${
          state.distance === "under25"
            ? "Under 25 miles"
            : state.distance === "25-75"
            ? "25–75 miles"
            : state.distance === "75-150"
            ? "75–150 miles"
            : "150+ miles / Long-distance"
        }`,
        `Stairs: ${state.stairs}`,
        `Elevator: ${
          state.hasElevator === "yes"
            ? "Yes"
            : state.hasElevator === "no"
            ? "No"
            : "Not sure"
        }`,
        `Special items: ${
          state.specialItems.trim() || "No special items specified"
        }`,
        `Preferred move date: ${state.moveDate || "Not specified"}`,
        "",
        `ROUGH ESTIMATE (non-binding): $${est.low.toLocaleString()} – $${est.high.toLocaleString()}`,
        "This is a rough ballpark only. Final pricing will be provided after speaking with the crew and confirming details.",
      ];

      fd.append("details", detailsLines.join("\n"));

      state.photos.forEach((file) => {
        fd.append("photos", file, file.name);
      });

      const res = await fetch("/api/quote", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(
          "We generated your estimate, but there was an issue sending details. If you don’t hear from us soon, please call or email directly."
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        "There was an issue submitting your request. Please also feel free to call or email us directly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>
              Step {step} of {totalSteps}
            </span>
            <span>
              {step === 1
                ? "About your home"
                : step === 2
                ? "Distance & access"
                : "Contact & estimate"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: BRAND.lime,
              }}
            />
          </div>
        </div>

        {error && (
          <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm text-gray-700">
                Let&apos;s start with the basics.{" "}
                <span className="font-semibold">
                  What kind of home are we moving?
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: "Studio / 1 BR", value: "studio_1br" as MoveSize },
                  { label: "2 Bedroom", value: "2br" as MoveSize },
                  { label: "3 Bedroom", value: "3br" as MoveSize },
                  { label: "4 Bedroom", value: "4br" as MoveSize },
                  { label: "5+ Bedroom", value: "5plus" as MoveSize },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateField("size", opt.value)}
                    className={`rounded-lg border px-2 py-2 text-left ${
                      state.size === opt.value
                        ? "border-black bg-black text-white"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 text-sm">
                <label className="text-xs text-gray-700">
                  Is this a local move or long-distance?
                  <div className="mt-1 inline-flex rounded-full bg-gray-100 p-1 text-xs">
                    {["Local", "Long-distance"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          updateField(
                            "moveType",
                            type as QuoteWizardState["moveType"]
                          )
                        }
                        className={`px-3 py-1 rounded-full ${
                          state.moveType === type
                            ? "bg-black text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </label>
                <label className="text-xs text-gray-700">
                  Roughly how many square feet is your home?
                  <Input
                    className="mt-1"
                    type="number"
                    min={300}
                    max={10000}
                    placeholder="e.g. 1,800"
                    value={state.sqft}
                    onChange={(e) =>
                      updateField("sqft", (e.target as HTMLInputElement).value)
                    }
                  />
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-gray-700">
                Now let&apos;s get a feel for the{" "}
                <span className="font-semibold">
                  distance and how easy it is to move things in/out.
                </span>
              </p>
              <div className="grid gap-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-gray-700">
                    From ZIP
                    <Input
                      className="mt-1"
                      maxLength={10}
                      placeholder="19103"
                      value={state.fromZip}
                      onChange={(e) =>
                        updateField(
                          "fromZip",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </label>
                  <label className="text-xs text-gray-700">
                    To ZIP
                    <Input
                      className="mt-1"
                      maxLength={10}
                      placeholder="08540"
                      value={state.toZip}
                      onChange={(e) =>
                        updateField(
                          "toZip",
                          (e.target as HTMLInputElement).value
                        )
                      }
                    />
                  </label>
                </div>
                <label className="text-xs text-gray-700">
                  About how far is the move?
                  <select
                    className="mt-1 border rounded-md px-3 py-2 w-full text-xs"
                    value={state.distance}
                    onChange={(e) =>
                      updateField(
                        "distance",
                        e.target.value as QuoteWizardState["distance"]
                      )
                    }
                  >
                    <option value="under25">Under 25 miles</option>
                    <option value="25-75">25–75 miles</option>
                    <option value="75-150">75–150 miles</option>
                    <option value="150+">150+ miles</option>
                  </select>
                </label>
                <label className="text-xs text-gray-700">
                  How many stairs are we working with?
                  <select
                    className="mt-1 border rounded-md px-3 py-2 w-full text-xs"
                    value={state.stairs}
                    onChange={(e) =>
                      updateField(
                        "stairs",
                        e.target.value as QuoteWizardState["stairs"]
                      )
                    }
                  >
                    <option>None</option>
                    <option>Some</option>
                    <option>A lot</option>
                  </select>
                </label>
                <label className="text-xs text-gray-700">
                  Elevator access?
                  <select
                    className="mt-1 border rounded-md px-3 py-2 w-full text-xs"
                    value={state.hasElevator}
                    onChange={(e) =>
                      updateField(
                        "hasElevator",
                        e.target.value as QuoteWizardState["hasElevator"]
                      )
                    }
                  >
                    <option value="unknown">Not sure / N/A</option>
                    <option value="yes">Yes, elevator available</option>
                    <option value="no">No elevator</option>
                  </select>
                </label>
                <label className="text-xs text-gray-700">
                  Any heavy or specialty items we should know about?
                  <Textarea
                    className="mt-1"
                    rows={3}
                    placeholder="Piano, safe, gym equipment, delicate antiques, etc."
                    value={state.specialItems}
                    onChange={(e) =>
                      updateField(
                        "specialItems",
                        (e.target as HTMLTextAreaElement).value
                      )
                    }
                  />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-gray-700">
                Last step.{" "}
                <span className="font-semibold">
                  Where can we send your ballpark estimate and follow up?
                </span>
              </p>
              <div className="grid gap-3 text-sm">
                <Input
                  name="name"
                  placeholder="Full name"
                  value={state.name}
                  onChange={(e) =>
                    updateField("name", (e.target as HTMLInputElement).value)
                  }
                  required
                />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={state.email}
                  onChange={(e) =>
                    updateField("email", (e.target as HTMLInputElement).value)
                  }
                  required
                />
                <Input
                  name="phone"
                  placeholder="Phone (optional but helpful)"
                  value={state.phone}
                  onChange={(e) =>
                    updateField("phone", (e.target as HTMLInputElement).value)
                  }
                />
                <label className="text-xs text-gray-700">
                  Preferred move date (if known)
                  <Input
                    className="mt-1"
                    type="date"
                    value={state.moveDate}
                    onChange={(e) =>
                      updateField(
                        "moveDate",
                        (e.target as HTMLInputElement).value
                      )
                    }
                  />
                </label>
                <label className="text-xs text-gray-700">
                  Optional photos (help us get closer with your estimate):
                  <input
                    type="file"
                    name="photos"
                    accept="image/*"
                    multiple
                    className="mt-1 block w-full text-xs text-gray-700"
                    onChange={handlePhotosChange}
                  />
                  <span className="mt-1 block text-[11px] text-gray-500">
                    Add pictures of stairs, driveways, tight spaces, or the
                    items you’re most concerned about.
                  </span>
                </label>
              </div>

              {estimate && (
                <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  <div className="font-semibold text-gray-900 mb-1">
                    Your rough ballpark estimate:
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${estimate.low.toLocaleString()} – $
                    {estimate.high.toLocaleString()}
                  </div>
                  <p className="mt-1">
                    This is a{" "}
                    <span className="font-semibold">non-binding range</span>{" "}
                    based on the details you shared. Final pricing will be
                    confirmed after speaking with our team and locking in your
                    move plan.
                  </p>
                  <p className="mt-1">
                    For the most accurate quote, call{" "}
                    <a
                      href="tel:+12155310907"
                      className="underline font-medium"
                    >
                      {BUSINESS.phone}
                    </a>{" "}
                    or reply to the follow-up email we send.
                  </p>
                </div>
              )}

              {submitted && (
                <p className="mt-2 text-[11px] text-green-600">
                  We’ve received your details and rough estimate. The crew will
                  review and follow up to firm up pricing and availability.
                </p>
              )}
            </>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}

            {step < totalSteps ? (
              <Button
                type="button"
                style={{ backgroundColor: "#111", color: "#fff" }}
                size="sm"
                onClick={nextStep}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: BRAND.lime, color: "#111" }}
                disabled={submitting}
              >
                {submitting ? "Calculating & Sending..." : "See My Estimate"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const [exitOpen, setExitOpen] = useState(false);
  const [exitEmail, setExitEmail] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerSmall, setHeaderSmall] = useState(false);
  const [activeReview, setActiveReview] = useState(0);

  // Exit intent
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

  // Shrinking header
  useEffect(() => {
    const onScroll = () => {
      setHeaderSmall(window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-rotating reviews
  useEffect(() => {
    const id = setInterval(
      () => setActiveReview((prev) => (prev + 1) % REVIEWS.length),
      8000
    );
    return () => clearInterval(id);
  }, []);

  const closeExit = () => {
    setExitOpen(false);
    dismissExit(7);
  };

  const currentReview = REVIEWS[activeReview];

  return (
    <div id="top">
      {/* Top contact bar */}
      <div className="bg-black text-white text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-white/80">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
              <Phone className="h-3 w-3" />
            </span>
            <span>Fast, careful, neighbor-approved movers</span>
          </div>
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

      {/* Header / Nav */}
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

          {/* Mobile menu */}
          <button
            className="md:hidden inline-flex items-center gap-1 rounded-md border px-2 py-1 text-sm bg-white"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs">Menu</span>
          </button>
        </div>

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

      {/* Hero */}
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
              <QuoteButton label="Residential Moves" />
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
              <QuoteButton label="Commercial & Freight" />
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
              <QuoteButton label="Junk Removal" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quote / Contact – WIZARD + promo */}
      <section id="contact" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Instant Ballpark Estimate
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Answer a few quick questions and we&apos;ll show you a{" "}
              <span className="font-semibold">rough price range</span> for your
              residential move. Then we&apos;ll follow up to lock in an official
              quote.
            </p>
            <QuoteWizard />
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

      {/* Pricing – In-home moves only */}
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

      {/* Reserve Date with Deposit – Stripe Elements */}
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

      {/* Reviews – auto-rotating slideshow */}
      <section id="reviews" className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm text-gray-500 mb-1">
            Trusted by more than 10,000 customers.
          </p>
          <h2 className="text-2xl font-bold mb-6">What Our Customers Say</h2>

          <div className="grid md:grid-cols-[2fr,1fr] gap-8 items-stretch">
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

            <div className="space-y-3">
              {REVIEWS.slice(0, 3).map((r, idx) => (
                <Card key={idx} className="border-dashed border-gray-200">
                  <CardContent className="py-3">
                    <StarRow />
                    <p className="mt-1 text-xs text-gray-700">
                      {r.body.substring(0, 150)}...
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

      {/* We’re Hiring */}
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
              else alert("Could not submit application. Please email us.");
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

      {/* Mobile "Call Now" button */}
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
