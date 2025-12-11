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

// --- Exit-intent + promo helpers ----------------------------------------

const EXIT_DISMISS_KEY = "nk_exit_dismissed_until";
const EXIT_SEEN_SESSION = "nk_exit_seen_session";

function shouldOpenExit() {
  try {
    if (typeof window === "undefined") return false;
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
    if (typeof window === "undefined") return;
    sessionStorage.setItem(EXIT_SEEN_SESSION, "1");
  } catch {
    // ignore
  }
}

function dismissExit(days: number) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      EXIT_DISMISS_KEY,
      String(Date.now() + days * 24 * 60 * 60 * 1000)
    );
  } catch {
    // ignore
  }
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
    <h3
      className={
        "text-lg md:text-xl font-semibold tracking-tight " + className
      }
      {...rest}
    />
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
    style =
      "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300";
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

// Helper: read a File as data URL (base64)
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
      detailsLines.push(
        `Business/project: ${state.businessType || "N/A"}`
      );
    }

    if (state.jobType === "junk") {
      detailsLines.push(
        `Estimated junk weight: ${state.junkWeight || "not specified"}`
      );
      detailsLines.push(
        `Junk description: ${
          state.junkDescription || "not specified"
        }`
      );
    } else {
      detailsLines.push(
        `Home size: ${
          state.size || "not specified"
        }, approx. square footage: ${state.sqft || "N/A"}`
      );
      detailsLines.push(
        `Approx. distance: ${state.distance || "N/A"}`
      );
      detailsLines.push(`To ZIP: ${state.toZip || "N/A"}`);
    }

    detailsLines.push(`From ZIP: ${state.fromZip || "N/A"}`);
    detailsLines.push(
      `Preferred date: ${state.moveDate || "Not specified"}`
    );
    detailsLines.push("");
    detailsLines.push(
      `ROUGH ESTIMATE (non-binding): $${est.low.toLocaleString()} – $${est.high.toLocaleString()}`
    );
    detailsLines.push(
      "This is a rough starting range only. Final pricing will be provided after speaking with the crew and confirming details."
    );
    detailsLines.push("");
    detailsLines.push(
      `Special items / notes: ${
        state.specialItems || "(none provided)"
      }`
    );
    detailsLines.push(
      `Photo count (uploaded via quiz): ${state.photos.length}`
    );

    // 🔥 Convert photos to base64 so the backend can attach them
    let photoFilesPayload: {
      name: string;
      type: string;
      dataUrl: string;
    }[] = [];

    if (state.photos.length > 0) {
      try {
        photoFilesPayload = await Promise.all(
          state.photos.map(async (file) => ({
            name: file.name,
            type: file.type,
            dataUrl: await fileToDataUrl(file),
          }))
        );
      } catch (err) {
        console.error("Error reading photo files", err);
        // If file reading fails, we still send the quote without photos
        photoFilesPayload = [];
      }
    }

    const payload = {
      type: "quote",
      name: state.name,
      email: state.email,
      phone: state.phone,
      service: `${jobLabel} – Quiz Funnel`,
      details: detailsLines.join("\n"),
      photoFiles: photoFilesPayload, // 👈 backend should use this for attachments
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If you want to debug:
      // const data = await res.json().catch(() => null);
      // console.log("quote response", res.status, data);

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const currentStepLabel = steps[step];

  // bespoke end copy per job type
  let jobSpecificLine = "";
  if (state.jobType === "residential") {
    jobSpecificLine =
      "A move coordinator will review your answers, confirm the crew size and trucks needed, and follow up with a firm quote.";
  } else if (state.jobType === "commercial") {
    jobSpecificLine =
      "Our commercial team will look at your scope and schedule, then coordinate a detailed plan around access windows, freight elevators, and any build-out timelines.";
  } else {
    jobSpecificLine =
      "A junk removal dispatcher will match your estimate to the right truck size and reach out to lock in a time window.";
  }

  const commonLine =
    "This range is based on similar jobs we’ve completed in the area and is meant as a starting point, not a final price.";

  return (
    <Card className="shadow-lg border-gray-900">
      <CardHeader>
        <CardTitle className="flex flex-col gap-1">
          <span className="text-2xl font-bold">Free Quote</span>
          <span className="text-sm font-normal text-gray-600">
            Answer a few quick questions and see an estimated price in
            under 60 seconds.
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress */}
          <div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
              <div
                className="h-full bg-lime-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Step {step + 1} of {totalSteps} · {currentStepLabel}
            </p>
          </div>

          {/* Step 0 – job type */}
          {step === 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                What kind of job is this?
              </label>
              <select
                className="border rounded-md px-3 py-2 w-full text-sm"
                value={state.jobType}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    jobType: e.target.value as JobType,
                  }))
                }
              >
                <option value="residential">
                  Residential home / apartment move
                </option>
                <option value="commercial">
                  Commercial move / store buildout / freight
                </option>
                <option value="junk">Junk removal / cleanout</option>
              </select>
              <p className="text-xs text-gray-500">
                We’ll tailor the questions to your move so you only
                answer what matters.
              </p>
            </div>
          )}

          {/* Step 1 – residential */}
          {step === 1 && state.jobType === "residential" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Home size
                </label>
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
                      onClick={() =>
                        setState((s) => ({ ...s, size: opt.id }))
                      }
                      className={`border rounded-md px-3 py-2 text-left ${
                        state.size === opt.id
                          ? "border-lime-400 bg-lime-50"
                          : "border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Approx. square footage
                  </label>
                  <TextInput
                    placeholder="e.g. 1,800"
                    value={state.sqft}
                    onChange={(e) =>
                      setState((s) => ({ ...s, sqft: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Approx. distance
                  </label>
                  <select
                    className="border rounded-md px-3 py-2 w-full text-sm"
                    value={state.distance}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        distance: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="under25">Under 25 miles</option>
                    <option value="25-75">25–75 miles</option>
                    <option value="75-150">75–150 miles</option>
                    <option value="150plus">
                      150+ miles / long-distance
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    From ZIP
                  </label>
                  <TextInput
                    value={state.fromZip}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        fromZip: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    To ZIP
                  </label>
                  <TextInput
                    value={state.toZip}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        toZip: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1 – commercial */}
          {step === 1 && state.jobType === "commercial" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Business / project type
                </label>
                <TextInput
                  placeholder="e.g. retail buildout, office move, gym install"
                  value={state.businessType}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      businessType: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Approx. square footage
                  </label>
                  <TextInput
                    placeholder="e.g. 3,500"
                    value={state.sqft}
                    onChange={(e) =>
                      setState((s) => ({ ...s, sqft: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Approx. distance
                  </label>
                  <select
                    className="border rounded-md px-3 py-2 w-full text-sm"
                    value={state.distance}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        distance: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    <option value="under25">Under 25 miles</option>
                    <option value="25-75">25–75 miles</option>
                    <option value="75-150">75–150 miles</option>
                    <option value="150plus">
                      150+ miles / long-distance
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    From ZIP
                  </label>
                  <TextInput
                    value={state.fromZip}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        fromZip: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    To ZIP
                  </label>
                  <TextInput
                    value={state.toZip}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        toZip: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1 – junk */}
          {step === 1 && state.jobType === "junk" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  What are we hauling away?
                </label>
                <TextArea
                  rows={3}
                  placeholder="e.g. garage cleanout, basement furniture, renovation debris"
                  value={state.junkDescription}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      junkDescription: e.target.value,
                    }))
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
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      junkWeight: e.target.value,
                    }))
                  }
                >
                  <option value="">Choose an estimate</option>
                  <option value="under500">
                    Under 500 lbs (small load)
                  </option>
                  <option value="500-1500">
                    500–1,500 lbs (pickup / small trailer)
                  </option>
                  <option value="1500-3000">
                    1,500–3,000 lbs (half box truck)
                  </option>
                  <option value="3000plus">
                    3,000+ lbs (full truck / heavy debris)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Property ZIP
                  </label>
                  <TextInput
                    value={state.fromZip}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        fromZip: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Preferred date
                  </label>
                  <TextInput
                    type="date"
                    value={state.moveDate}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        moveDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 – logistics for non-junk */}
          {step === 2 && state.jobType !== "junk" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">
                  Stairs at either location?
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-sm"
                  value={state.stairs}
                  onChange={(e) =>
                    setState((s) => ({ ...s, stairs: e.target.value }))
                  }
                >
                  <option value="none">No stairs</option>
                  <option value="some">1–2 flights / split level</option>
                  <option value="heavy">
                    3+ flights or walk-up
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Elevator access?
                </label>
                <select
                  className="border rounded-md px-3 py-2 w-full text-sm"
                  value={state.hasElevator}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      hasElevator: e.target
                        .value as WizardState["hasElevator"],
                    }))
                  }
                >
                  <option value="unsure">Not sure yet</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Any special or heavy items?
                </label>
                <TextArea
                  rows={3}
                  placeholder="Pianos, safes, gym equipment, pool tables, etc."
                  value={state.specialItems}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      specialItems: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Preferred move date
                </label>
                <TextInput
                  type="date"
                  value={state.moveDate}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      moveDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          )}

          {/* Contact step – junk(step2) or others(step3) */}
          {((step === 2 && state.jobType === "junk") ||
            (step === 3 && state.jobType !== "junk")) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">
                    Full name
                  </label>
                  <TextInput
                    value={state.name}
                    onChange={(e) =>
                      setState((s) => ({ ...s, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Phone
                  </label>
                  <TextInput
                    value={state.phone}
                    onChange={(e) =>
                      setState((s) => ({ ...s, phone: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Email address
                </label>
                <TextInput
                  type="email"
                  value={state.email}
                  onChange={(e) =>
                    setState((s) => ({ ...s, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Upload photos (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-lime-100 file:text-gray-900 hover:file:bg-lime-200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Photos help us give a tighter quote. They’re attached
                  privately to your quote so the crew can review them
                  before calling you back.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {submitted && estimate && (
            <div className="mt-2">
              <div className="animate-bounce rounded-2xl border-2 border-black bg-lime-400 px-4 py-3 text-center shadow-md">
                <div className="text-xs font-semibold uppercase tracking-wide text-black/80">
                  Your estimated price range
                </div>
                <div className="mt-1 text-3xl md:text-4xl font-extrabold text-black">
                  ${estimate.low.toLocaleString()} – $
                  {estimate.high.toLocaleString()}
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-lime-300 bg-lime-50 px-3 py-3 text-xs md:text-sm text-gray-800">
                <p>{commonLine}</p>
                <p className="mt-1">{jobSpecificLine}</p>
                <p className="mt-1 text-gray-600">
                  You’ll get a confirmation email with these details, and
                  you can always reply directly if anything changes.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0 || submitting}
              className={`text-sm px-3 py-2 rounded-md border ${
                step === 0 || submitting
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-50"
              }`}
            >
              Back
            </button>
            <div className="flex items-center gap-3">
              {!isLastStep && (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={submitting}
                >
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
        </form>
      </CardContent>
    </Card>
  );
}

// --- Reviews slider data --------------------------------------------------

type Review = {
  name: string;
  location: string;
  text: string;
};

const REVIEWS: Review[] = [
  {
    name: "Verified Homeowner",
    location: "Bucks County, PA",
    text:
      "From the moment I contacted Alex, I knew I was in good hands. He came out in person, walked the house, and gave me a game plan. Even with terrible weather, his team wrapped every piece, kept the floors clean, and every item arrived undamaged. I’d give them 20 stars if I could.",
  },
  {
    name: "Maria P.",
    location: "Princeton, NJ",
    text:
      "The crew was early, friendly, and wrapped everything like it was their own. We were out of the old place and into the new one faster than I expected.",
  },
  {
    name: "Devon S.",
    location: "Bucks County, PA",
    text:
      "Best movers I’ve used. They handled heavy gym equipment and stairs without a single complaint. Transparent hourly pricing and worth every dollar.",
  },
  {
    name: "Hannah R.",
    location: "Philadelphia, PA",
    text:
      "Very responsive, no hidden fees, and the team was respectful of the building rules and neighbors. I’ve already referred them to two friends.",
  },
  {
    name: "Chris L.",
    location: "Retail Operations",
    text:
      "Handled a store buildout and freight runs flawlessly. Showed up on time, worked around contractors, and kept everything organized.",
  },
];

// --- Gallery images -------------------------------------------------------

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
];

// --- Main App -------------------------------------------------------------

export default function App() {
  const [exitOpen, setExitOpen] = useState(false);
  const [exitEmail, setExitEmail] = useState("");
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(0);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && shouldOpenExit()) {
        setExitOpen(true);
        markExitSeen();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mouseout", onMouseOut);
      return () => window.removeEventListener("mouseout", onMouseOut);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setNavScrolled(window.scrollY > 10);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveReview((idx) => (idx + 1) % REVIEWS.length);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveGalleryIndex((idx) => (idx + 1) % GALLERY_IMAGES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  const closeExit = () => {
    setExitOpen(false);
    dismissExit(7);
  };

  const handlePromoSubmit = async (email: string) => {
    const res = await subscribeAndSendPromo(email);
    dismissExit(7);
    setExitOpen(false);
    if (res?.code) {
      alert(`Promo code sent to ${email}. Backup code: ${res.code}`);
    } else if (res?.ok) {
      alert("Promo sent — check your email.");
    } else {
      alert(
        "We saved your email. Once email sending is fully wired, you’ll receive promos automatically."
      );
    }
  };

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
  const currentGalleryImage = GALLERY_IMAGES[activeGalleryIndex];

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900">
      {/* Top contact bar with centered tagline */}
      <div className="bg-black text-white text-xs sm:text-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full text-center font-semibold tracking-wide">
            Fast, Careful, Neighbor-Approved Movers
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-2 text-white/85">
            <span className="flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.11 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <a href="tel:+12155310907" className="underline">
                {BUSINESS.phone}
              </a>
            </span>
            <span className="hidden sm:inline">•</span>
            <a
              href={`mailto:${BUSINESS.email}`}
              className="underline"
            >
              {BUSINESS.email}
            </a>
            <span className="hidden sm:inline">•</span>
            <a
              href={BUSINESS.facebook}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Facebook
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header
        className={`sticky top-0 z-40 border-b bg-white/80 backdrop-blur ${
          navScrolled ? "py-2 shadow-sm" : "py-3"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
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

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#services" className="hover:text-lime-500">
              Services
            </a>
            <a href="#quote" className="hover:text-lime-500">
              Free Quote
            </a>
            <a href="#pricing" className="hover:text-lime-500">
              Pricing
            </a>
            <a href="#reviews" className="hover:text-lime-500">
              Reviews
            </a>
            <a href="#gallery" className="hover:text-lime-500">
              Gallery
            </a>
            <a href="#hiring" className="hover:text-lime-500">
              We’re Hiring
            </a>
          </nav>

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
        {mobileNavOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2 text-sm">
              {[
                ["#services", "Services"],
                ["#quote", "Free Quote"],
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/main2.jpg"
          alt="Neighborhood Krew moving truck"
          className="absolute inset-0 w-full h-full object-cover"
        />
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
            Local and long-distance moves, commercial buildouts, gym
            installs, and junk removal — handled carefully by a crew
            that treats your space like their own.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:gap-4">
            <Button
              className="w-full max-w-xs"
              onClick={() =>
                document
                  .getElementById("quote")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Start My Free Quote
            </Button>
            <Button
              className="w-full max-w-xs"
              variant="ghost"
              onClick={() =>
                document
                  .getElementById("services")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore Services
            </Button>
          </div>
          <div className="mt-3 flex justify-center sm:justify-start">
            <a href="tel:+12155310907" className="w-full max-w-xs">
              <Button
                variant="outline"
                className="mt-1 w-full justify-center"
              >
                Call {BUSINESS.phone}
              </Button>
            </a>
          </div>
          <div className="mt-8 text-sm text-white/85">
            Trusted by premium brands & venues
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <img
              src="/featured/lux1.jpg"
              alt="Premium client install"
              className="rounded-lg border border-white/15 object-cover h-28 md:h-32 w-full"
            />
            <img
              src="/featured/lux2.jpg"
              alt="Gymshark buildout wall"
              className="rounded-lg border border-white/15 object-cover h-28 md:h-32 w-full"
            />
            <img
              src="/featured/lux3.jpg"
              alt="Gym inventory move"
              className="rounded-lg border border-white/15 object-cover h-28 md:h-32 w-full"
            />
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
            Services
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center md:text-left">
                  Residential & Apartment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  Full-service moves with padding, shrink wrap,
                  disassembly/reassembly, and careful loading —
                  apartments, condos, single-family homes and more.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    document
                      .getElementById("quote")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Get a quote for Residential
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-center md:text-left">
                  Commercial & Freight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  Store buildouts, office moves, palletized freight,
                  gym installs, and recurring runs. Coordinated around
                  access windows and building rules.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    document
                      .getElementById("quote")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Get a quote for Commercial
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-center md:text-left">
                  Junk Removal & Hauling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">
                  Garages, basements, renovation debris and more —
                  priced by volume, weight, and dump fees with
                  responsible disposal and recycling.
                </p>
                <Button
                  className="mt-4 w-full"
                  onClick={() =>
                    document
                      .getElementById("quote")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Get a quote for Junk Removal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Free Quote / quiz funnel */}
      <section id="quote" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-3">
            <QuoteWizard />
          </div>
          <div className="md:col-span-2 space-y-4 text-sm text-gray-700">
            <h2 className="text-xl font-bold">
              How your free quote works
            </h2>
            <p>
              This tool gives you an{" "}
              <strong>estimated price range</strong> based on similar
              jobs we’ve completed. Your final price is confirmed after
              we talk through the details and schedule.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Most local residential moves we quote fall between
                $1k–$12k.
              </li>
              <li>
                Commercial and specialty projects can be higher depending
                on scope and access.
              </li>
              <li>
                Junk removal pricing is based on volume, weight, and dump
                fees.
              </li>
            </ul>
            <p className="text-xs text-gray-500">
              No spam — just a tailored quote and clear next steps from
              a real person on the crew.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">
            Simple In-Home Move Pricing
          </h2>
          <p className="text-sm text-gray-700 mb-6 max-w-3xl">
            For{" "}
            <strong>in-home moves</strong> (like swapping rooms, moving
            new appliances, or rearranging furniture), we keep it
            simple. Full residential moves, long-distance jobs, and
            commercial projects are quoted individually through the
            instant estimate and a quick call.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>2 Movers + Truck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-extrabold">$150/hr</div>
                <p className="text-sm text-gray-600 mt-2">
                  2-hour minimum. Includes pads, shrink wrap and basic
                  equipment.
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
                  Ideal for 2–3 bedroom homes, small offices or heavier
                  moves.
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
                  Per mover, 2-hour minimum. Perfect if you already have
                  a truck and just need a strong, careful crew.
                </p>
              </CardContent>
            </Card>
          </div>
          <p className="mt-4 text-xs text-gray-600">
            Full residential and commercial move pricing depends on
            distance, access, and inventory. Use the Free Quote above and
            we’ll confirm a custom quote.
          </p>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">
            Trusted by more than 10,000 customers.
          </h2>
          <p className="text-sm text-gray-700 mb-6">
            Here’s what real neighbors and business owners say about
            moving with the Krew.
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Main rotating review */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Featured review</CardTitle>
              </CardHeader>
              <CardContent>
                <StarRow />
                <p className="mt-3 text-sm text-gray-800 leading-relaxed">
                  {currentReview.text}
                </p>
                <div className="mt-3 text-xs text-gray-500">
                  — {currentReview.name}, {currentReview.location}
                </div>
                <div className="mt-4 flex gap-1">
                  {REVIEWS.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveReview(idx)}
                      className={`h-2 w-2 rounded-full ${
                        idx === activeReview
                          ? "bg-lime-500"
                          : "bg-gray-300"
                      }`}
                      aria-label={`Show review ${idx + 1}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Static supporting quotes */}
            <div className="space-y-4 text-sm text-gray-800">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <StarRow />
                <p className="mt-2">
                  “Crew was on time, protected every doorway, and checked
                  in with us before moving the big pieces. It felt like
                  having good friends helping instead of random movers.”
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <StarRow />
                <p className="mt-2">
                  “They moved our office without interrupting business.
                  Computers, desks, files — everything labeled and reset
                  exactly where we needed.”
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <StarRow />
                <p className="mt-2">
                  “Junk removal team knocked out a full garage in a
                  couple of hours. No surprises on price and they swept
                  up before leaving.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery slideshow */}
      <section id="gallery" className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">
            Recent Jobs from the Krew
          </h2>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-full md:w-3/4">
              <div className="relative cursor-pointer">
                <img
                  src={currentGalleryImage}
                  alt="Neighborhood Krew job"
                  className="rounded-2xl border object-cover w-full h-64 md:h-80 shadow-sm"
                  onClick={() => setLightboxOpen(true)}
                />
              </div>
              <div className="mt-4 flex justify-center gap-2">
                {GALLERY_IMAGES.map((src, idx) => (
                  <button
                    key={src}
                    onClick={() => setActiveGalleryIndex(idx)}
                    className={`h-2 w-2 rounded-full ${
                      idx === activeGalleryIndex
                        ? "bg-lime-500"
                        : "bg-gray-300"
                    }`}
                    aria-label={`Show gallery image ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
            <div className="w-full md:w-1/4 text-sm text-gray-700">
              <p>
                Tap through recent moves, gym installs, cleanouts, and
                long-distance runs from the Krew. Click a photo to see it
                larger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox for gallery */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={currentGalleryImage}
            alt="Neighborhood Krew job enlarged"
            className="max-h-[80vh] max-w-[90vw] rounded-2xl border-2 border-white shadow-2xl"
          />
        </div>
      )}

      {/* Hiring */}
      <section id="hiring" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold">We’re Hiring!</h2>
          <p className="text-sm text-gray-700 mt-2 max-w-2xl">
            Looking for hard-working movers and drivers who care about
            doing things the right way. Fill out a few details and
            we’ll reach out if it’s a fit.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget as HTMLFormElement);
              const data = Object.fromEntries(fd.entries());
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
                  alert(
                    "Could not submit application. Please email us directly."
                  );
                }
              } catch {
                alert(
                  "Could not submit application. Please email us directly."
                );
              }
            }}
            className="mt-4 grid md:grid-cols-3 gap-3 text-sm"
          >
            <TextInput name="name" placeholder="Full name" required />
            <TextInput
              name="email"
              type="email"
              placeholder="Email"
              required
            />
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

      {/* Simple newsletter / promo form */}
      <section className="py-10 border-t bg-gray-900 text-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">
              Join the Neighborhood list
            </h3>
            <p className="text-sm text-gray-300 mt-1 max-w-md">
              Be the first to hear about move-day promos, off-peak
              discounts, and last-minute openings.
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
            © {new Date().getFullYear()} Neighborhood Krew Inc · Fully
            licensed & insured
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

      {/* Floating call now (mobile only) */}
      <a
        href="tel:+12155310907"
        className="fixed bottom-4 right-4 z-40 px-4 py-2 rounded-full bg-lime-400 text-xs font-semibold shadow-lg text-black sm:hidden"
      >
        Call now
      </a>

      {/* Exit-intent promo modal */}
      {exitOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold">
              Wait — take $25 off your move?
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Join our email list and we’ll send a one-time Neighborhood
              discount code for your next move.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await handlePromoSubmit(exitEmail);
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
              <Button type="submit">Send</Button>
            </form>
            <div className="mt-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeExit}
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
