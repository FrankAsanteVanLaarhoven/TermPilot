"use client";

import { useEffect, useState } from "react";
import { GrokBotMark, type BotMood } from "@/components/GrokBotMark";
import { useI18n } from "@/components/Providers";
import type { GrokExpression } from "@/lib/splineGrokRig";

export type { BotMood, GrokExpression };

// Public Spline 3D robot mesh (Whobee). Interactive play-mode scene, not a still.
export const SPLINE_HUMANOID =
  "https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode";
const SPLINE_VIEWER = "https://unpkg.com/@splinetool/viewer@1.10.51/build/spline-viewer.js";

export function GrokHumanoid({
  mood = "idle",
  expression = "idle",
  variant = "stage",
  className = "",
}: {
  mood?: BotMood;
  expression?: GrokExpression;
  variant?: "splash" | "stage" | "compact";
  className?: string;
}) {
  const { tr } = useI18n();
  const [spline, setSpline] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (!cancelled) setSpline((prev) => (prev === "ready" ? prev : "fallback"));
    }, 12000);

    if (customElements.get("spline-viewer")) {
      setSpline("ready");
      window.clearTimeout(timer);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = SPLINE_VIEWER;
    script.onload = () => {
      if (!cancelled) setSpline("ready");
      window.clearTimeout(timer);
    };
    script.onerror = () => {
      if (!cancelled) setSpline("fallback");
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={`tp-bot ${variant} mood-${mood} expr-${expression} ${className}`}
      data-spline={spline}
      aria-label={tr("splash.spline")}
    >
      {spline === "ready" && (
        <spline-viewer
          className="tp-bot-spline"
          url={SPLINE_HUMANOID}
          events-target="global"
          loading-anim-type="spinner-small-dark"
        />
      )}
      {spline !== "ready" && (
        <div className="tp-bot-loading" aria-hidden>
          <GrokBotMark size={72} mood={mood} />
        </div>
      )}
      <div className="tp-bot-badge">
        <GrokBotMark size={18} mood={mood} />
        <span>{tr("grokbot.name")}</span>
        <em>{tr("splash.spline")}</em>
      </div>
    </div>
  );
}
