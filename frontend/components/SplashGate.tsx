"use client";

import { useEffect, useMemo, useState } from "react";
import { GrokBotMark, TermPilotLogo } from "@/components/GrokBotMark";
import { GrokHumanoid } from "@/components/GrokHumanoid";
import { useI18n } from "@/components/Providers";
import { api } from "@/lib/api";
import type { GrokExpression } from "@/lib/splineGrokRig";

export const GROKBOT_SESSION = "termpilot.grokbot.session";
const ONBOARD_KEY = "termpilot.grokbot.onboard";
const DEMO_EMAIL = "info@frankvanlaarhoven.co.uk";
const DEMO_PASSWORD = "termpilot";

const JOBS = [
  { id: "scout", label: "Deadline Scout", note: "Watch authorised sources so nothing due becomes a surprise.", tone: "coral" },
  { id: "planner", label: "Week Planner", note: "Build a 14-day plan around your 20-hour cap.", tone: "cyan" },
  { id: "mail", label: "Mail Desk", note: "Triage P0 mail. Drafts wait for on-screen approval.", tone: "amber" },
  { id: "watch", label: "Conflict Watch", note: "Surface colliding deadlines. Never writes the calendar alone.", tone: "violet" },
] as const;

const TOOLS = [
  { id: "src_mailbox", label: "Student mailbox" },
  { id: "src_cal", label: "Demo calendar" },
  { id: "src_lms", label: "Northbridge LMS" },
  { id: "src_notion", label: "Notion" },
  { id: "src_slack", label: "Slack" },
  { id: "src_linkedin", label: "LinkedIn" },
  { id: "src_orcid", label: "ORCID" },
  { id: "src_x", label: "X" },
] as const;

const FOCI = [
  { id: "modules", label: "Modules & deadlines" },
  { id: "recruiting", label: "Recruiting" },
  { id: "international", label: "International student life" },
  { id: "research", label: "Research / ORCID" },
  { id: "wellbeing", label: "Wellbeing signpost" },
  { id: "admin", label: "Campus admin" },
] as const;

type Step = "login" | "jobs" | "tools" | "focus";

export function readGrokSession(): boolean {
  try {
    return localStorage.getItem(GROKBOT_SESSION) === "1";
  } catch {
    return false;
  }
}

export function writeGrokSession(on: boolean): void {
  try {
    if (on) localStorage.setItem(GROKBOT_SESSION, "1");
    else {
      localStorage.removeItem(GROKBOT_SESSION);
      localStorage.removeItem(ONBOARD_KEY);
    }
  } catch {
    /* private mode */
  }
}

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function SplashGate({ onEnter }: { onEnter: () => void }) {
  const { tr } = useI18n();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [xaiKey, setXaiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<string[]>(["scout", "planner"]);
  const [tools, setTools] = useState<string[]>(["src_mailbox", "src_cal", "src_lms"]);
  const [foci, setFoci] = useState<string[]>(["modules"]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 240);
    return () => window.clearTimeout(id);
  }, []);

  const expression: GrokExpression = useMemo(() => {
    if (step === "login") return "welcome";
    if (step === "jobs") return "curious";
    if (step === "tools") return "listen";
    return "think";
  }, [step]);

  const filteredTools = TOOLS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  function signIn() {
    const mail = email.trim().toLowerCase();
    if (!mail) {
      setError("Enter the demo email to continue.");
      return;
    }
    const allowed = mail === DEMO_EMAIL || mail.includes("favl") || mail.endsWith("@frankvanlaarhoven.co.uk");
    if (!allowed) {
      setError("This demo signs in as FAVL. Use info@frankvanlaarhoven.co.uk.");
      return;
    }
    if (password && password !== DEMO_PASSWORD) {
      setError("Demo password is termpilot, or leave it blank.");
      return;
    }
    setError(null);
    if (xaiKey.trim()) {
      try {
        sessionStorage.setItem("termpilot.xai.key", xaiKey.trim());
      } catch {
        /* private mode */
      }
    }
    setStep("jobs");
  }

  async function finish() {
    try {
      localStorage.setItem(
        ONBOARD_KEY,
        JSON.stringify({ jobs, tools, foci, email: DEMO_EMAIL, at: new Date().toISOString() }),
      );
    } catch {
      /* private mode */
    }
    if (tools.length) {
      try {
        await api.connectAll(tools);
      } catch {
        /* connectors still available in-app */
      }
    }
    onEnter();
  }

  return (
    <div className={`tp-splash ${ready ? "is-on" : ""}`} role="dialog" aria-label={tr("splash.product")}>
      <div className="tp-splash-cosmos" />
      <div className="tp-splash-well" />
      <div className="tp-splash-ribbon" />
      <div className="tp-splash-stars" />
      <div className="tp-splash-vignette" />

      <header className="tp-splash-brand">
        <TermPilotLogo size={44} mood={step === "login" ? "idle" : "listening"} />
      </header>

      <div className="tp-splash-stage">
        <GrokHumanoid variant="splash" mood="idle" expression={expression} />
      </div>

      <aside className="tp-splash-card tp-onboard">
        {step === "login" && (
          <>
            <p className="tp-splash-kicker">{tr("splash.powered")}</p>
            <h1>
              {tr("splash.product")}
              <span>{tr("splash.engine")}</span>
            </h1>
            <p className="tp-splash-tag">{tr("splash.tagline")}</p>
            <form
              className="tp-login"
              onSubmit={(event) => {
                event.preventDefault();
                signIn();
              }}
            >
              <label>
                Email
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="termpilot"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label>
                Optional xAI API key
                <input
                  type="password"
                  autoComplete="off"
                  placeholder="xai-… lives in this browser only"
                  value={xaiKey}
                  onChange={(e) => setXaiKey(e.target.value)}
                />
              </label>
              {error && (
                <p className="tp-login-error" role="alert">
                  {error}
                </p>
              )}
              <button type="submit" className="tp-splash-enter">
                {tr("splash.enter")}
              </button>
            </form>
            <p className="tp-splash-hint">
              Demo identity is FAVL. Official Grok Bot desktop signs in with Cursor at{" "}
              <a href="https://x.ai/bot" target="_blank" rel="noreferrer">
                x.ai/bot
              </a>
              . This screen is TermPilot’s Grok Bot engine — not that app’s OAuth.
            </p>
            <p className="tp-splash-honest">{tr("splash.honest")}</p>
          </>
        )}

        {step === "jobs" && (
          <>
            <p className="tp-splash-kicker">Step 1 of 3</p>
            <h1 className="tp-onboard-title">Hand Grok Bot a student job</h1>
            <p className="tp-splash-tag">One engine. Several watches. Nothing is a second trained bot.</p>
            <div className="tp-choice-orbit">
              {JOBS.map((job) => (
                <button
                  key={job.id}
                  type="button"
                  className={`tp-choice-pill tone-${job.tone} ${jobs.includes(job.id) ? "is-on" : ""}`}
                  onClick={() => setJobs(toggle(jobs, job.id))}
                >
                  <span className={`tp-job-face tone-${job.tone}`}>
                    <GrokBotMark size={42} />
                  </span>
                  <strong>{job.label}</strong>
                  <em>{job.note}</em>
                </button>
              ))}
            </div>
            <div className="tp-onboard-nav">
              <button type="button" className="tp-splash-enter" onClick={() => setStep("tools")}>
                Next
              </button>
              <button type="button" className="tp-onboard-back" onClick={() => setStep("login")}>
                Back
              </button>
            </div>
          </>
        )}

        {step === "tools" && (
          <>
            <p className="tp-splash-kicker">Step 2 of 3</p>
            <h1 className="tp-onboard-title">Which authorised tools already belong to you?</h1>
            <p className="tp-splash-tag">Grok Bot only reads what you connect. Writes still need on-screen approval.</p>
            <input
              className="tp-onboard-search"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tools"
            />
            <div className="tp-choice-grid">
              {filteredTools.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`tp-choice-card ${tools.includes(item.id) ? "is-on" : ""}`}
                  onClick={() => setTools(toggle(tools, item.id))}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="tp-onboard-nav">
              <button type="button" className="tp-splash-enter" onClick={() => setStep("focus")}>
                Next
              </button>
              <button type="button" className="tp-onboard-back" onClick={() => setStep("jobs")}>
                Back
              </button>
            </div>
          </>
        )}

        {step === "focus" && (
          <>
            <p className="tp-splash-kicker">Step 3 of 3</p>
            <h1 className="tp-onboard-title">Where should it watch first?</h1>
            <p className="tp-splash-tag">Student life only. Grok Bot will not complete assessed work.</p>
            <div className="tp-choice-grid">
              {FOCI.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`tp-choice-card ${foci.includes(item.id) ? "is-on" : ""}`}
                  onClick={() => setFoci(toggle(foci, item.id))}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="tp-onboard-nav">
              <button type="button" className="tp-splash-enter" onClick={() => void finish()}>
                Enter console
              </button>
              <button type="button" className="tp-onboard-back" onClick={() => setStep("tools")}>
                Back
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
