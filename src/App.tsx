import React, { useEffect, useState } from "react";

// Brand + business config
const BRAND = {
  dark: "#1f160f",
  lime: "#b6e300",
};

const BUSINESS = {
  phone: "(215) 531-0907",
  email: "Neighborhoodkrew@gmail.com",
  facebook: "https://www.facebook.com/TheNeighborhoodKrew",
};

// Public checklist PDF (served from /public)
const CHECKLIST_PDF_URL = "/NeighborhoodKrewMovingDayChecklist.pdf";

// Calendly embed URL
const CALENDLY_URL = "https://calendly.com/tesoromanagements/call-the-neighborhood-krew";

// --- Exit-intent + promo helpers ----------------------------------------

const EXIT_DISMISS_KEY = "nk_exit_dismissed_until";
const EXIT_SEEN_SESSION = "nk_exit_seen_session";

function shouldOpenExit() {
  try {
    if (typeof window === "undefined") return false;
    if (sessionStorage.getItem(EXIT_SEEN_SESSION) === "1") return false;
    const until = Number(localStorage.getItem(EXIT_DISMISS_KEY) || 0);
    if (until && Date.now() < until) return false;
  } catch {}
  return true;
}

function markExitSeen() {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(EXIT_SEEN_SESSION, "1");
  } catch {}
}

function dismissExit(days: number) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      EXIT_DISMISS_KEY,
      String(Date.now() + days * 86400000)
    );
  } catch {}
}

async function subscribeAndSendPromo(email: string) {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    return data;
  } catch {
    return { ok: false };
  }
}

// --- Simple UI primitives ------------------------------------------------

type DivProps = React.HTMLAttributes<HTMLDivElement>;

function Card(props: DivProps) {
  const { className = "", ...rest } = props;
  return (
    <div
      className={
        "rounded-2xl border border-gray-200 bg-white shadow-sm " + className
      }
      {...rest}
    />
  );
}

function CardHeader(props: DivProps) {
  const { className = "", ...rest } = props;
  return (
    <div className={"px-4 pt-4 md:px-6 md:pt-5 " + className} {...rest} />
  );
}

function CardContent(props: DivProps) {
  const { className = "", ...rest } = props;
  return (
    <div className={"px-4 pb-4 md:px-6 md:pb-6 " + className} {...rest} />
  );
}

function CardTitle(props: DivProps) {
  const { className = "", ...rest } = props;
  return (
    <h3 className={"text-lg md:text-xl font-semibold tracking-tight " + className} {...rest} />
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
};

function Button({ variant = "solid", className = "", ...rest }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

  let style = "";
  if (variant === "solid") {
    style = "bg-lime-400 text-black hover:bg-lime-300 focus:ring-lime-400";
  } else if (variant === "outline") {
    style =
      "border border-white/70 bg-transparent text-white hover:bg-white/10 focus:ring-white";
  } else {
    style = "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300";
  }

  return <button className={`${base} ${style} ${className}`} {...rest} />;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

function TextInput({ className = "", ...rest }: InputProps) {
  return (
    <input
      className={
        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-300 " +
        className
      }
      {...rest}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

function TextArea({ className = "", ...rest }: TextareaProps) {
  return (
    <textarea
      className={
        "w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-300 " +
        className
      }
      {...rest}
    />
  );
}

// --- Quote Wizard / Quiz Funnel -----------------------------------------

type JobType = "residential" | "commercial" | "junk";

type WizardState = {
  jobType: JobType;
  size: string;
  sqft: string;
  fromZip: string;
  toZip: string;
  distance: string;
  stairs: string;
  hasElevator: "yes" | "no" | "unsure";
  specialItems: string;
  moveDate: string;
  name: string;
  email: string;
  phone: string;
  photos: File[];
  businessType: string;
  junkWeight: string;
  junkDescription: string;
};

type Estimate = { low: number; high: number };

function computeEstimate(state: WizardState): Estimate {
  if (state.jobType === "junk") {
    switch (state.junkWeight) {
      case "under500":
        return { low: 200, high: 400 };
      case "500-1500":
        return { low: 350, high: 700 };
      case "1500-3000":
        return { low: 600, high: 1200 };
      case "3000plus":
        return { low: 1000, high: 2000 };
      default:
        return { low: 300, high: 900 };
    }
  }

  let baseLow = 2000;
  let baseHigh = 6000;

  if (state.jobType === "residential") {
    if (state.size === "studio_1br") {
      baseLow = 2000;
      baseHigh = 4000;
    } else if (state.size === "2br") {
      baseLow = 2500;
      baseHigh = 5000;
    } else if (state.size === "3br") {
      baseLow = 3500;
      baseHigh = 7000;
    } else if (state.size === "4br") {
      baseLow = 4500;
      baseHigh = 9000;
    } else if (state.size === "5plus") {
      baseLow = 6000;
      baseHigh = 12000;
    }
  } else if (state.jobType === "commercial") {
    baseLow = 4000;
    baseHigh = 15000;
  }

  if (state.distance === "75-150") {
    baseLow += 500;
    baseHigh += 1000;
  } else if (state.distance === "150plus") {
    baseLow += 1000;
    baseHigh += 2000;
  }

  return { low: baseLow, high: baseHigh };
}

// Encode files to base64 for API
async function filesToBase64List(files: File[]) {
  const encodeOne = (file: File) =>
    new Promise<{ name: string; type: string; size: number; base64: string }>(
      (resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(",")[1] || "";
          resolve({ name: file.name, type: file.type, size: file.size, base64 });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    );

  return Promise.all(files.map((f) => encodeOne(f)));
}

export function QuoteWizard() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>({
    jobType: "residential",
    size: "",
    sqft: "",
    fromZip: "",
    toZip: "",
    distance: "",
    stairs: "none",
    hasElevator: "unsure",
    specialItems: "",
    moveDate: "",
    name: "",
    email: "",
    phone: "",
    photos: [],
    businessType: "",
    junkWeight: "",
    junkDescription: "",
  });

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);

  const stepsByJobType: Record<JobType, string[]> = {
    residential: ["Job Type", "Home & Distance", "Logistics", "Contact"],
    commercial: ["Job Type", "Scope & Distance", "Logistics", "Contact"],
    junk: ["Job Type", "Junk Details", "Contact"],
  };

  const steps = stepsByJobType[state.jobType];
  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const isLastStep = step === totalSteps - 1;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setState((s) => ({ ...s, photos: files }));
  };

  function nextStep() {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      setError(null);
    }
  }

  function prevStep() {
    if (step > 0) {
      setStep((s) => s - 1);
      setError(null);
    }
  }

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

    const jobLabel =
      state.jobType === "residential"
        ? "Residential move"
        : state.jobType === "commercial"
        ? "Commercial move"
        : "Junk removal";

    const detailsLines: string[] = [`Job type: ${jobLabel}`];

    if (state.jobType === "commercial") {
      detailsLines.push(`Business/project: ${state.businessType || "N/A"}`);
    }

    if (state.jobType === "junk") {
      detailsLines.push(
        `Estimated junk weight: ${state.junkWeight || "not specified"}`
      );
      detailsLines.push(
        `Junk description: ${state.junkDescription || "not specified"}`
      );
    } else {
      detailsLines.push(
        `Home size: ${state.size || "not specified"}, approx. square footage: ${state.sqft || "N/A"}`
      );
      detailsLines.push(`Approx. distance: ${state.distance || "N/A"}`);
      detailsLines.push(`To ZIP: ${state.toZip || "N/A"}`);
    }

    detailsLines.push(`From ZIP: ${state.fromZip || "N/A"}`);
    detailsLines.push(`Preferred date: ${state.moveDate || "Not specified"}`);
    detailsLines.push("");
    detailsLines.push(
      `ROUGH ESTIMATE (non-binding): $${est.low.toLocaleString()} – $${est.high.toLocaleString()}`
    );
    detailsLines.push(
      "This is a rough starting range only. Final pricing will be provided after speaking with the crew and confirming details."
    );
    detailsLines.push("");
    detailsLines.push(`Special items / notes: ${state.specialItems || "(none)"}`);
    detailsLines.push(
      `Photo count (uploaded via quiz): ${state.photos.length}`
    );

    let photoFilesPayload: any[] = [];

    try {
      if (state.photos.length > 0) {
        photoFilesPayload = await filesToBase64List(state.photos);
      }
    } catch (err) {
      console.error("Error encoding photos:", err);
    }

    const payload = {
      type: "quote",
      name: state.name,
      email: state.email,
      phone: state.phone,
      service: `${jobLabel} – Quiz Funnel`,
      details: detailsLines.join("\n"),
      photoFiles: photoFilesPayload,
    };

    setSubmitting(true);

    try {
      await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      try {
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        const checklistUrl = `${origin}${CHECKLIST_PDF_URL}`;

        await fetch("/api/send-checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: state.email,
            name: state.name,
            checklistUrl,
            promoCode: "KREW25",
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {}

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Load Calendly script only after submission
  useEffect(() => {
    if (submitted && !calendlyLoaded) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.onload = () => setCalendlyLoaded(true);
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [submitted, calendlyLoaded]);

  const currentStepLabel = steps[step];

  let jobSpecificLine = "";
  if (state.jobType === "residential") {
    jobSpecificLine =
      "A move coordinator will review your answers, confirm the crew size and trucks needed, and follow up with a firm quote.";
  } else if (state.jobType === "commercial") {
    jobSpecificLine =
      "Our commercial team will review your scope and schedule, then coordinate a detailed plan around access windows, freight elevators, and timelines.";
  } else {
    jobSpecificLine =
      "A junk removal dispatcher will match your estimate to the right truck size and reach out to lock in a time window.";
  }

  const commonLine =
    "This range is based on similar jobs we've completed in the area and is meant as a starting point, not a final price.";

  return (
    <Card className="shadow-lg border-gray-900">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1">
          <span className="text-2xl font-bold">Free Quote</span>
          <span className="text-sm font-normal text-gray-600">
            Answer a few quick questions and see an estimated price in under 60 seconds.
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Animated Progress Bar – visible only during quiz */}
          {!submitted && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-700 ease-out relative overflow-hidden shadow-md"
                  style={{ width: `${progress}%` }}
                >
                  {/* Subtle pulse + shimmer for dopamine hit */}
                  <div className="absolute inset-0 animate-pulse bg-white opacity-20" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                      animation: "shimmer 2.5s infinite",
                      backgroundSize: "200% 100%",
                    }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Step {step + 1} of {totalSteps} — {currentStepLabel}
              </p>
            </div>
          )}

          {/* Step 0 – Choose job type */}
          {step === 0 && !submitted && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">What kind of job is this?</label>

              <select
                className="border rounded-md px-3 py-2 w-full text-sm"
                value={state.jobType}
                onChange={(e) =>
                  setState((s) => ({ ...s, jobType: e.target.value as JobType }))
                }
              >
                <option value="residential">Residential home / apartment move</option>
                <option value="commercial">Commercial move / store buildout / freight</option>
                <option value="junk">Junk removal / cleanout</option>
              </select>

              <p className="text-xs text-gray-500">
                We'll tailor the questions so you only answer what matters.
              </p>
            </div>
          )}

          {/* Step 1 – Residential */}
          {step === 1 && state.jobType === "residential" && !submitted && (
            <div className="space-y-4">

              {/* Home size */}
              <div>
                <label className="block text-sm font-medium">Home size</label>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  {[
                    { id: "studio_1br", label: "Studio / 1 BR" },
                    { id: "2br", label: "2 BR" },
                    { id: "3br", label: "3 BR" },
                    { id: "4br", label: "4 BR" },
                    { id: "5plus", label: "5+ BR" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setState((s) => ({ ...s, size: opt.id }))}
                      className={`border rounded-md px-3 py-2 text-left ${
                        state.size === opt.id ? "border-lime-400 bg-lime-50" : "border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sqft + Distance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Approx. square footage</label>
                  <TextInput
                    placeholder="e.g. 1,800"
                    value={state.sqft}
                    onChange={(e) => setState((s) => ({ ...s, sqft: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Approx. distance</label>
                  <select
                    className="border rounded-md px-3 py-2 w-full text-sm"
                    value={state.distance}
                    onChange={(e) => setState((s) => ({ ...s, distance: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="under25">Under 25 miles</option>
                    <option value="25-75">25–75 miles</option>
                    <option value="75-150">75–150 miles</option>
                    <option value="150plus">150+ miles / long-distance</option>
                  </select>
                </div>
              </div>

              {/* Zips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">From ZIP</label>
                  <TextInput
                    value={state.fromZip}
                    onChange={(e) => setState((s) => ({ ...s, fromZip: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">To ZIP</label>
                  <TextInput
                    value={state.toZip}
                    onChange={(e) => setState((s) => ({ ...s, toZip: e.target.value }))}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Step 1 – Commercial */}
          {step === 1 && state.jobType === "commercial" && !submitted && (
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium">Business / project type</label>
                <TextInput
                  placeholder="e.g. retail buildout, office move, gym install"
                  value={state.businessType}
                  onChange={(e) =>
                    setState((s) => ({ ...s, businessType: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Approx. square footage</label>
                  <TextInput
                    placeholder="e.g. 3,500"
                    value={state.sqft}
                    onChange={(e) => setState((s) => ({ ...s, sqft: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Approx. distance</label>
                  <select
                    className="border rounded-md px-3 py-2 w-full text-sm"
                    value={state.distance}
                    onChange={(e) => setState((s) => ({ ...s, distance: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="under25">Under 25 miles</option>
                    <option value="25-75">25–75 miles</option>
                    <option value="75-150">75–150 miles</option>
                    <option value="150plus">150+ miles / long-distance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">From ZIP</label>
                  <TextInput
                    value={state.fromZip}
                    onChange={(e) => setState((s) => ({ ...s, fromZip: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">To ZIP</label>
                  <TextInput
                    value={state.toZip}
                    onChange={(e) => setState((s) => ({ ...s, toZip: e.target.value }))}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Step 1 – Junk */}
          {step === 1 && state.jobType === "junk" && !submitted && (
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium">What are we hauling away?</label>
                <TextArea
                  rows={3}
                  placeholder="e.g. garage cleanout, basement furniture, renovation debris"
                  value={state.junkDescription}
                  onChange={(e) =>
                    setState((s) => ({ ...s, junkDescription: e.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Estimated total weight of junk
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-sm"
                  value={state.junkWeight}
                  onChange={(e) => setState((s) => ({ ...s, junkWeight: e.target.value }))}
                >
                  <option value="">Choose an estimate</option>
                  <option value="under500">Under 500 lbs (small load)</option>
                  <option value="500-1500">500–1,500 lbs</option>
                  <option value="1500-3000">1,500–3,000 lbs</option>
                  <option value="3000plus">3,000+ lbs</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Property ZIP</label>
                  <TextInput
                    value={state.fromZip}
                    onChange={(e) => setState((s) => ({ ...s, fromZip: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Preferred date</label>
                  <TextInput
                    type="date"
                    value={state.moveDate}
                    onChange={(e) => setState((s) => ({ ...s, moveDate: e.target.value }))}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Step 2 – Logistics (non-junk) */}
          {step === 2 && state.jobType !== "junk" && !submitted && (
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium">Stairs at either location?</label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-sm"
                  value={state.stairs}
                  onChange={(e) => setState((s) => ({ ...s, stairs: e.target.value }))}
                >
                  <option value="none">No stairs</option>
                  <option value="some">1–2 flights / split level</option>
                  <option value="heavy">3+ flights or walk-up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Elevator access?</label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-sm"
                  value={state.hasElevator}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      hasElevator: e.target.value as WizardState["hasElevator"],
                    }))
                  }
                >
                  <option value="unsure">Not sure yet</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Any special or heavy items?</label>
                <TextArea
                  rows={3}
                  placeholder="Pianos, safes, gym equipment, pool tables, etc."
                  value={state.specialItems}
                  onChange={(e) => setState((s) => ({ ...s, specialItems: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Preferred move date</label>
                <TextInput
                  type="date"
                  value={state.moveDate}
                  onChange={(e) => setState((s) => ({ ...s, moveDate: e.target.value }))}
                />
              </div>

            </div>
          )}

          {/* Contact step */}
          {((step === 2 && state.jobType === "junk") ||
          (step === 3 && state.jobType !== "junk")) && !submitted ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div>
                  <label className="block text-sm font-medium">Full name</label>
                  <TextInput
                    value={state.name}
                    onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <TextInput
                    value={state.phone}
                    onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium">Email address</label>
                <TextInput
                  type="email"
                  value={state.email}
                  onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Upload photos (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-700 
                  file:mr-3 file:py-1.5 file:px-3 file:rounded-md 
                  file:border-0 file:text-sm file:font-medium 
                  file:bg-lime-100 file:text-gray-900 
                  hover:file:bg-lime-200"
                />

                <p className="text-xs text-gray-500 mt-1">
                  Photos help us give a tighter quote. They're attached privately so the
                  crew can review them before calling you back.
                </p>
              </div>

            </div>
          ) : null}

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Post-submission view */}
          {submitted && estimate && (
            <div className="space-y-6">

              {/* Strong post-submission CTA */}
              <div className="rounded-2xl bg-gradient-to-r from-lime-400 to-lime-500 p-6 text-center shadow-xl">
                <p className="text-2xl font-bold text-black">
                  👉 Schedule a quick call to lock in your estimate faster
                </p>
                <p className="mt-3 text-sm text-black/80">
                  Speak directly with the crew, confirm details, and get priority scheduling + a finalized price.
                </p>
              </div>

              {/* Estimate display */}
              <div className="rounded-2xl bg-lime-100 border-4 border-lime-500 p-6 text-center shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-wide text-black/70">
                  Your estimated price range
                </p>
                <p className="mt-2 text-4xl md:text-5xl font-extrabold text-black">
                  ${estimate.low.toLocaleString()} – ${estimate.high.toLocaleString()}
                </p>
              </div>

              {/* Explanation text */}
              <div className="space-y-3 text-sm text-gray-700 bg-gray-50 rounded-xl p-5">
                <p>{commonLine}</p>
                <p>{jobSpecificLine}</p>
                <p className="text-gray-600">
                  You'll receive a confirmation email shortly with all your details.
                </p>
              </div>

              {/* Calendly inline widget – loads only after submission */}
              {calendlyLoaded && (
                <div className="mt-8">
                  <div
                    className="calendly-inline-widget"
                    data-url={CALENDLY_URL}
                    style={{ minWidth: "320px", height: "700px" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons – only during quiz */}
          {!submitted && (
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 0 || submitting}
                className={`text-sm px-4 py-2 rounded-md border ${
                  step === 0 || submitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-gray-50"
                }`}
              >
                Back
              </button>

              <div className="flex gap-3">
                {!isLastStep && (
                  <Button type="button" onClick={nextStep} disabled={submitting}>
                    Next
                  </Button>
                )}
                {isLastStep && (
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "See My Estimate"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </form>
      </CardContent>

      {/* Shimmer keyframe animation */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </Card>
  );
}

// --- Reviews data ---------------------------------------------------------

const REVIEWS = [
  {
    name: "Anthony R.",
    text: "The Krew was unbelievably fast and careful. They wrapped everything, labeled boxes, and took the stress away. Worth every penny.",
    rating: 5,
  },
  {
    name: "Samantha G.",
    text: "These guys moved my 3-bedroom townhouse in under 6 hours. They even helped assemble my bed frames without me asking.",
    rating: 5,
  },
  {
    name: "John M.",
    text: "On time, professional, and extremely efficient. I will be hiring them again for my next commercial project.",
    rating: 5,
  },
  {
    name: "Rachel P.",
    text: "I had a difficult piano move and they handled it perfectly. No scratches, no drama. Great pricing too.",
    rating: 5,
  },
];

// --- Gallery images --------------------------------------------------------

const GALLERY_IMAGES: string[] = [
  "/gallery/krew1.jpg",
  "/gallery/krew2.jpg",
  "/gallery/krew3.jpg",
  "/gallery/krew4.jpg",
  "/gallery/krew5.jpg",
  "/gallery/krew6.jpg",
  "/gallery/krew7.jpg",
  "/gallery/krew8.jpg",
  "/gallery/krew9.jpg",
  "/gallery/krew10.jpg",
  "/gallery/krew11.jpg",
  "/gallery/krew12.jpg",
  "/gallery/krew13.jpg",
  "/gallery/krew14.jpg",
  "/gallery/krew15.jpg",
];

// --- Main App Component ----------------------------------------------------

export default function App() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [activeReview, setActiveReview] = useState(0);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  // Exit-intent modal
  const [exitOpen, setExitOpen] = useState(false);
  const [exitEmail, setExitEmail] = useState("");
  const [exitStatus, setExitStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

// Promo submit helper (newsletter + exit-intent)
const handlePromoSubmit = async (email: string) => {
  try {
    const clean = String(email || "").trim();
    if (!clean) return { ok: false };

    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: clean }),
    });

    const data = await res.json().catch(() => ({} as any));

    if (!res.ok) return { ok: false, ...data };
    return { ok: true, ...data };
  } catch (err) {
    console.error(err);
    return { ok: false };
  }
};

  // Track checklist downloads (optional endpoint; fails silently)
  const trackChecklistDownload = (source: "button" | "image") => {
    try {
      const payload = JSON.stringify({ source, ts: Date.now() });
      // Prefer sendBeacon if available so downloads aren't blocked
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav: any = typeof navigator !== "undefined" ? navigator : null;
      if (nav?.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        nav.sendBeacon("/api/track-checklist", blob);
        return;
      }
      fetch("/api/track-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {}
  };


  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Exit intent listener
  useEffect(() => {
    if (!shouldOpenExit()) return;

    const handler = (e: MouseEvent) => {
      if (e.clientY < 0 || e.clientY < 8) {
        markExitSeen();
        setExitOpen(true);
      }
    };

    document.addEventListener("mouseleave", handler);
    return () => document.removeEventListener("mouseleave", handler);
  }, []);

  // ❗ FIXED TSX ROOT WRAPPER — REQUIRED FOR VALID REACT TSX
  return (
    <div className="font-sans text-gray-900 bg-white" id="top">

      {/* Top black banner */}
      <div className="bg-black text-white text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-3">

          {/* Reviews button (links to reviews section) */}
          <a
            href="#reviews"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 font-semibold hover:bg-white/10 transition"
          >
            <span className="text-yellow-400 tracking-wider">★★★★★</span>
            <span>Reviews</span>
          </a>

          {/* Locations (not clickable) */}
          <div className="hidden sm:block text-center text-white/90 font-medium">
            Bucks County · Montco · Greater NJ · Philadelphia · Princeton
          </div>

          {/* Quote button (links to quote section) */}
          <a
            href="#quote"
            className="inline-flex items-center justify-center rounded-full bg-lime-400 px-4 py-1.5 font-semibold text-black hover:bg-lime-300 transition"
          >
            Get Quote
          </a>
        </div>

        {/* Mobile locations line */}
        <div className="sm:hidden px-4 pb-2 text-center text-white/90 font-medium">
          Bucks County · Montco · Greater NJ · Philadelphia · Princeton
        </div>
      </div>
      {/* Main navigation header */}
      <header
        className={`sticky top-0 z-40 border-b bg-white/80 backdrop-blur ${navScrolled ? "py-2 shadow-sm" : "py-3"}`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">

          {/* Logo */}
          <a
            href="#top"
            className="flex items-center gap-2 font-semibold text-sm sm:text-base"
          >
            <img
              src="/official-krew-logo.png"
              alt="Neighborhood Krew Inc logo"
              className="h-7 w-7 rounded-full border border-black/10 object-contain bg-white"
            />
            <span>Neighborhood Krew Inc</span>
          </a>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="hover:text-lime-500">Services</a>
            <a href="#quote" className="hover:text-lime-500">Free Quote</a>
            <a href="#moving-checklist" className="hover:text-lime-500">Checklist</a>
            <a href="#pricing" className="hover:text-lime-500">Pricing</a>
            <a href="#reviews" className="hover:text-lime-500">Reviews</a>
            <a href="#gallery" className="hover:text-lime-500">Gallery</a>
            <a href="#hiring" className="hover:text-lime-500">We’re Hiring</a>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center rounded-md border border-gray-300 p-2"
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            <span className="flex flex-col gap-0.5 mr-1">
              <span className="w-4 h-0.5 bg-gray-800 rounded" />
              <span className="w-4 h-0.5 bg-gray-800 rounded" />
              <span className="w-4 h-0.5 bg-gray-800 rounded" />
            </span>
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileNavOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
              {[
                ["#services", "Services"],
                ["#quote", "Free Quote"],
                ["#moving-checklist", "Moving Checklist"],
                ["#pricing", "Pricing"],
                ["#reviews", "Reviews"],
                ["#gallery", "Gallery"],
                ["#hiring", "We’re Hiring"],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileNavOpen(false)}
                  className="py-1"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <img
          src="/main2.jpg"
          alt="Neighborhood Krew moving truck"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(31,22,15,0.78), rgba(31,22,15,0.75))",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-white">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Fast, Careful,{" "}
            <span
              className="inline-block rounded-xl px-2"
              style={{ backgroundColor: BRAND.lime, color: "#111" }}
            >
              Neighbor-Approved
            </span>{" "}
            Movers
          </h1>

          <p className="mt-4 text-white/85 text-lg max-w-2xl">
            Local and long-distance moves, commercial buildouts, gym installs,
            and junk removal — handled carefully by a crew that treats
            your space like their own.
          </p>

          {/* Buttons */}
          <div className="mt-6 grid grid-cols-1 gap-4 max-w-2xl md:hidden">
  <Button
    className="w-full h-12"
    onClick={() =>
      document.getElementById("quote")?.scrollIntoView({
        behavior: "smooth",
      })
    }
  >
    Start My Free Quote
  </Button>

  <Button
    className="w-full h-12 bg-white text-black hover:bg-gray-200"
    variant="solid"
    onClick={() =>
      document.getElementById("services")?.scrollIntoView({
        behavior: "smooth",
      })
    }
  >
    Explore Services
  </Button>

  <a href="tel:+12155310907" className="w-full">
    <Button
      variant="outline"
      className="w-full h-12 justify-center"
    >
      Call (215) 531-0907
    </Button>
  </a>
</div>

          {/* Trusted logos text */}
          <div className="mt-8 text-sm text-white/85">
            Trusted by premium brands & venues
          </div>

          {/* Featured CTAs + images (desktop only) */}
          <div className="mt-8 hidden md:block">
            <div className="grid grid-cols-3 gap-4">
              <Button
                className="h-12"
                onClick={() =>
                  document.getElementById("quote")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                Start My Free Quote
              </Button>

              <Button
                className="h-12 bg-white text-black hover:bg-gray-200"
                variant="solid"
                onClick={() =>
                  document.getElementById("services")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                Explore Services
              </Button>

              <a href="tel:+12155310907" className="w-full">
                <Button
                  variant="outline"
                  className="h-12 w-full justify-center"
                >
                  Call (215) 531-0907
                </Button>
              </a>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
              <img
                src="/featured/lux1.jpg"
                alt="Premium client install"
                className="rounded-lg border border-white/15 object-cover h-32 w-full transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              />
              <img
                src="/featured/lux2.jpg"
                alt="Gymshark buildout wall"
                className="rounded-lg border border-white/15 object-cover h-32 w-full transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              />
              <img
                src="/featured/lux3.jpg"
                alt="Gym inventory move"
                className="rounded-lg border border-white/15 object-cover h-32 w-full transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>
        
      {/* Services Section */}
      <section id="services" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
            Services
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Residential */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center md:text-left">
                  Residential & Apartment
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-700">
                  Full-service moves with padding, shrink wrap, disassembly
                  and reassembly, and careful loading — apartments, condos,
                  single-family homes and more.
                </p>

                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    document.getElementById("quote")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  Get a quote for Residential
                </Button>
              </CardContent>
            </Card>

            {/* Commercial */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center md:text-left">
                  Commercial & Freight
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-700">
                  Store buildouts, office moves, palletized freight,
                  gym installs, and recurring runs. Coordinated around access
                  windows and building rules.
                </p>

                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    document.getElementById("quote")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  Get a quote for Commercial
                </Button>
              </CardContent>
            </Card>

            {/* Junk removal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center md:text-left">
                  Junk Removal & Hauling
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-700">
                  Garages, basements, renovation debris and more — priced by
                  volume, weight, and dump fees with responsible disposal and recycling.
                </p>

                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    document.getElementById("quote")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  Get a quote for Junk Removal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Free Quote / Quiz Funnel Section */}
      <section id="quote" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-5 gap-8 items-start">

          {/* Quote Wizard */}
          <div className="md:col-span-3">
            <QuoteWizard />
          </div>

          {/* Sidebar Info */}
          <div className="md:col-span-2 space-y-4 text-sm text-gray-700">
            <h2 className="text-xl font-bold">How your free quote works</h2>

            <p>
              This tool gives you an <strong>estimated price range</strong> based on
              similar jobs we’ve completed. Your final price is confirmed after
              we talk through the details and schedule.
            </p>

            <ul className="list-disc list-inside space-y-1">
              <li>Commercial and specialty projects can be higher depending on scope.</li>
              <li>Junk removal pricing is based on volume, weight, and dump fees.</li>
            </ul>

            <p className="text-xs text-gray-500">
              No spam — just a tailored quote and clear next steps from a real person on the crew. By completing this form, I acknowledge and agree that my information will be collected and processed in accordance with Neighborhood Krew Privacy Policy.            </p>
          </div>
        </div>
      </section>
      
      {/* Moving Day Checklist Section */}
      <section
        id="moving-checklist"
        className="py-12 md:py-16 bg-white border-t"
      >
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">

          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Moving Day Checklist To-Go
            </h2>

            <p className="mt-4 text-gray-600 max-w-lg">
              Download our professional, mover-approved checklist designed to help
              your move go smoothly — whether you’re planning ahead or booking last-minute.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-gray-700">
              <li>✔ One-page, easy-to-follow format</li>
              <li>✔ Parking & access reminders</li>
              <li>✔ Item restrictions clearly outlined</li>
              <li>✔ Helps avoid delays & surprise charges</li>
              <li>✔ Includes exclusive promo code</li>
            </ul>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={CHECKLIST_PDF_URL}
                download
                onClick={() => trackChecklistDownload("button")}
                className="inline-flex items-center justify-center rounded-full bg-lime-400 px-6 py-3 text-black font-semibold hover:bg-lime-300 transition"
              >
                Download Free Checklist
              </a>

              <button
                onClick={() =>
                  document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center justify-center rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold hover:bg-gray-100 transition"
              >
                Get a Free Quote
              </button>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <a
              href={CHECKLIST_PDF_URL}
              download
              onClick={() => trackChecklistDownload("image")}
              className="group block"
              aria-label="Download the Moving Day Checklist PDF"
            >
              <img
                src="/checklist.jpg"
                alt="Moving Day Checklist preview"
                className="w-full max-w-md rounded-2xl border shadow-md
                  transition-transform duration-300 ease-out
                  group-hover:-translate-y-1 group-hover:scale-[1.02]
                  motion-reduce:transition-none motion-reduce:transform-none"
                loading="lazy"
              />
            </a>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">

          <h2 className="text-2xl font-bold mb-2">Simple In-Home Move Pricing</h2>

          <p className="text-sm text-gray-700 mb-6 max-w-3xl">
            For <strong>in-home moves</strong> (like swapping rooms, installing appliances,
            or rearranging furniture), we keep it simple.  
            Full residential moves, long-distance jobs, and commercial projects are quoted individually through the instant estimate tool.
          </p>

          <div className="grid md:grid-cols-3 gap-6">

            {/* 2 Movers + Truck */}
            <Card>
              <CardHeader>
                <CardTitle>2 Movers + Truck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$150/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  2-hour minimum. Includes pads, shrink wrap and basic equipment.
                </p>
              </CardContent>
            </Card>

            {/* 3 Movers */}
            <Card>
              <CardHeader>
                <CardTitle>3 Movers + Truck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$210/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  Ideal for 2–3 bedroom homes, small offices or heavier moves.
                </p>
              </CardContent>
            </Card>

            {/* Labor only */}
            <Card>
              <CardHeader>
                <CardTitle>Packing / Labor Only</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$75/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  Per mover, 2-hour minimum. Perfect if you already have a truck.
                </p>
              </CardContent>
            </Card>

          </div>

          <p className="mt-4 text-xs text-gray-600">
            Full residential and commercial move pricing depends on distance, access, and inventory.
            Use the Free Quote tool above and we’ll confirm a custom quote.
          </p>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">

          <h2 className="text-2xl font-bold mb-2">Trusted by more than 10,000 customers.</h2>

          <p className="text-sm text-gray-700 mb-6">
            Here’s what real neighbors and business owners say about moving with the Krew.
          </p>

          <div className="grid md:grid-cols-2 gap-8 items-start">

            {/* Main rotating review */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Featured review</CardTitle>
              </CardHeader>

              <CardContent>
                {/* Stars */}
                <div className="text-yellow-500 tracking-wider">★★★★★</div>

                <p className="mt-3 text-sm text-gray-800 leading-relaxed">
                  {REVIEWS[activeReview].text}
                </p>

                <div className="mt-3 text-xs text-gray-500">
                  — {REVIEWS[activeReview].name}
                </div>

                {/* Indicators */}
                <div className="mt-4 flex gap-1">
                  {REVIEWS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReview(idx)}
                      className={`h-2 w-2 rounded-full ${
                        idx === activeReview ? "bg-lime-500" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Static supporting reviews */}
            <div className="space-y-4 text-sm text-gray-800">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-yellow-500 tracking-wider">★★★★★</div>
                <p className="mt-2">
                  “Crew was on time, protected every doorway, and checked in before moving the big pieces.
                  Felt like friends helping instead of random movers.”
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-yellow-500 tracking-wider">★★★★★</div>
                <p className="mt-2">
                  “They moved our office without interrupting business. Everything labeled and reset perfectly.”
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-yellow-500 tracking-wider">★★★★★</div>
                <p className="mt-2">
                  “Junk removal team knocked out a full garage in a couple hours. No surprises & they swept up.”
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">

          <h2 className="text-2xl font-bold mb-6">Recent Jobs from the Krew</h2>

          <div className="flex flex-col md:flex-row gap-6 items-center">

            {/* Slideshow */}
            <div className="w-full md:w-3/4">
              <div className="relative cursor-pointer">
                <img
                  src={GALLERY_IMAGES[activeGalleryIndex]}
                  alt="Neighborhood Krew job"
                  className="rounded-2xl border object-cover w-full h-64 md:h-80 shadow-sm"
                  onClick={() => setLightboxIndex(activeGalleryIndex)}
                />
              </div>

              {/* Dots */}
              <div className="mt-4 flex justify-center gap-2">
                {GALLERY_IMAGES.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`h-2 w-2 rounded-full ${
                      idx === activeGalleryIndex ? "bg-lime-500" : "bg-gray-300"
                    }`}
                  ></button>
                ))}
              </div>
            </div>

            {/* Text */}
            <div className="w-full md:w-1/4 text-sm text-gray-700">
              Tap through recent moves, gym installs, cleanouts, and long-distance runs from the Krew.
              Click a photo to view it larger.
            </div>
          </div>
        </div>
      </section>
      {/* Lightbox for gallery */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setLightboxIndex(null)}
        >
          <img
            src={GALLERY_IMAGES[lightboxIndex]}
            alt="Neighborhood Krew job enlarged"
            className="max-h-[80vh] max-w-[90vw] rounded-2xl border-2 border-white shadow-2xl"
          />
        </div>
      )}

      {/* Hiring Section */}
      <section id="hiring" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold">We’re Hiring!</h2>

          <p className="text-sm text-gray-700 mt-2 max-w-2xl">
            Looking for hard-working movers and drivers who care about doing things the right way.
            Fill out a few details and we’ll reach out if it’s a fit.
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget as HTMLFormElement);
              const data = Object.fromEntries(formData.entries());

              try {
                const r = await fetch("/api/apply", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });

                if (r.ok) {
                  alert("Thanks! Your application was submitted.");
                  (e.currentTarget as HTMLFormElement).reset();
                } else {
                  alert("Could not submit application. Please email us directly.");
                }
              } catch {
                alert("Could not submit application. Please email us directly.");
              }
            }}
            className="mt-4 grid md:grid-cols-3 gap-3 text-sm"
          >
            <TextInput name="name" placeholder="Full name" required />
            <TextInput name="email" type="email" placeholder="Email" required />
            <TextInput name="phone" placeholder="Phone" required />
            <TextInput name="city" placeholder="City" />

            <select
              name="role"
              className="border rounded-md px-3 py-2 w-full text-sm"
              required
            >
              <option value="">Position interested in</option>
              <option>Mover</option>
              <option>Driver</option>
              <option>Lead / Foreman</option>
            </select>

            <select
              name="availability"
              className="border rounded-md px-3 py-2 w-full text-sm"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Weekends only</option>
            </select>

            <TextArea
              name="notes"
              className="md:col-span-3"
              placeholder="Tell us about your experience"
              rows={3}
            />

            <div className="md:col-span-3">
              <Button type="submit">Submit Application</Button>
            </div>
          </form>
        </div>
      </section>

      {/* Newsletter / Promo Section */}
      <section className="py-10 border-t bg-gray-900 text-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Join the Neighborhood list</h3>
            <p className="text-sm text-gray-300 mt-1 max-w-md">
              Be the first to hear about move-day promos, off-peak discounts, and
              last-minute openings.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const email = (e.currentTarget as any).email.value;
              await handlePromoSubmit(email);
              (e.currentTarget as HTMLFormElement).reset();
            }}
            className="flex w-full md:w-auto gap-2"
          >
            <TextInput
              name="email"
              type="email"
              placeholder="you@email.com"
              required
              className="bg-white"
            />
            <Button type="submit">Get Promo Code</Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-4 py-6 text-xs sm:text-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div>
            © {new Date().getFullYear()} Neighborhood Krew Inc · Fully licensed & insured
          </div>

          <a
            href={BUSINESS.facebook}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Visit us on Facebook
          </a>
        </div>
      </footer>

      {/* Floating Call Button (Mobile only) */}
      <a
        href="tel:+12155310907"
        className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-lime-400 text-xs font-semibold shadow-lg text-black sm:hidden"
      >
        Call now
      </a>
      {/* Exit-Intent Promo Modal */}
      {exitOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">

            <h3 className="text-xl font-bold">Wait — take $25 off your move?</h3>

            <p className="text-sm text-gray-600 mt-2">
              Join our email list and we’ll send a one-time Neighborhood discount code
              for your next move.
            </p>

            {/* Promo form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setExitStatus("loading");

                const success = await handlePromoSubmit(exitEmail);

                if (success?.ok || success?.code) {
                  setExitStatus("sent");
                } else {
                  setExitStatus("error");
                }
              }}
              className="mt-4 flex gap-2"
            >
              <TextInput
                type="email"
                placeholder="you@email.com"
                value={exitEmail}
                onChange={(e) => setExitEmail(e.target.value)}
                required
              />
              <Button type="submit">
                {exitStatus === "loading" ? "Sending..." : "Send"}
              </Button>
            </form>

            {/* Status messages */}
            {exitStatus === "sent" && (
              <p className="text-green-600 text-sm mt-2">
                Promo code sent! Check your inbox.
              </p>
            )}
            {exitStatus === "error" && (
              <p className="text-red-600 text-sm mt-2">
                Something went wrong — but we saved your email. You'll still receive promos.
              </p>
            )}

            {/* Close button */}
            <div className="mt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  dismissExit(7);
                  setExitOpen(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



