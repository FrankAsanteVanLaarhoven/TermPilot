"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GrokBotMark, type BotMood } from "@/components/GrokBotMark";
import { useI18n } from "@/components/Providers";

export type GrokExpression = "idle" | "welcome" | "curious" | "listen" | "think" | "glad" | "careful";
export type { BotMood };

// A production scene must be exported from the exact licensed Spline project.
// Never substitute the previous primitive-generated approximation.
export const SPLINE_HUMANOID = process.env.NEXT_PUBLIC_SPLINE_SCENE_URL ?? "";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spline, setSpline] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;
    let disposed = false;
    let app: import("@splinetool/runtime").Application | undefined;
    async function mount() {
      try {
        if (!SPLINE_HUMANOID) {
          setSpline("fallback");
          return;
        }
        const { Application } = await import("@splinetool/runtime/build/runtime.standalone.webgl.js");
        if (disposed) return;
        app = new Application(canvasEl, { renderMode: "continuous", renderer: "webgl", htmlContentMode: "none" });
        await app.load(SPLINE_HUMANOID);
        if (disposed) return;
        setSpline("ready");
      } catch (error) {
        console.error("TermPilot Spline robot failed to load", error);
        if (!disposed) setSpline("fallback");
      }
    }
    void mount();
    return () => {
      disposed = true;
      app?.dispose();
    };
  }, []);

  return (
    <div
      className={`tp-bot ${variant} mood-${mood} expr-${expression} ${className}`}
      data-spline={spline}
      aria-label={tr("splash.spline")}
    >
      <canvas ref={canvasRef} className="tp-bot-spline" aria-hidden />
      {spline === "loading" && (
        <div className="tp-bot-loading" aria-hidden>
          <GrokBotMark size={72} mood={mood} />
        </div>
      )}
      {spline === "fallback" && <Image className="tp-bot-reference" src="/splash/grokbot-humanoid.png" alt="" fill priority sizes="(max-width: 900px) 100vw, 60vw" aria-hidden />}
      <div className="tp-bot-badge">
        <GrokBotMark size={18} mood={mood} />
        <span>{tr("grokbot.name")}</span>
        {spline === "ready" && <em>{tr("splash.spline")}</em>}
      </div>
    </div>
  );
}
