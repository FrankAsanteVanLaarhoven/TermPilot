"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GrokBotMark, type BotMood } from "@/components/GrokBotMark";
import { useI18n } from "@/components/Providers";
import { animateGrokRig, buildGrokRig, type GrokExpression } from "@/lib/splineGrokRig";

export type { BotMood, GrokExpression };

// Self-hosted Spline stage. The robot is assembled at runtime so TermPilot owns
// the character rather than depending on an unrelated public Spline scene.
export const SPLINE_HUMANOID = "/splash/stage.splinecode";

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
  const moodRef = useRef(mood);
  const expressionRef = useRef(expression);
  const gazeRef = useRef({ x: 0, y: 0 });
  const [spline, setSpline] = useState<"loading" | "ready" | "fallback">("loading");

  moodRef.current = mood;
  expressionRef.current = expression;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;
    let disposed = false;
    let frame = 0;
    let app: import("@splinetool/runtime").Application | undefined;
    const trackPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      gazeRef.current = {
        x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2)),
        y: Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2)),
      };
    };
    const releasePointer = () => { gazeRef.current = { x: 0, y: 0 }; };
    canvas.addEventListener("pointermove", trackPointer);
    canvas.addEventListener("pointerleave", releasePointer);
    async function mount() {
      try {
        const { Application } = await import("@splinetool/runtime/build/runtime.standalone.webgl.js");
        if (disposed) return;
        app = new Application(canvasEl, { renderMode: "continuous", renderer: "webgl", htmlContentMode: "none" });
        await app.load(SPLINE_HUMANOID);
        if (disposed) return;
        const rig = await buildGrokRig(app);
        if (disposed) return;
        setSpline("ready");
        const started = performance.now();
        const tick = (now: number) => {
          if (disposed) return;
          animateGrokRig(rig, { t: (now - started) / 1000, gazeX: gazeRef.current.x, gazeY: gazeRef.current.y, mood: moodRef.current, expression: expressionRef.current });
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      } catch (error) {
        console.error("TermPilot Spline robot failed to load", error);
        if (!disposed) setSpline("fallback");
      }
    }
    void mount();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointermove", trackPointer);
      canvas.removeEventListener("pointerleave", releasePointer);
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
        <em>{tr("splash.spline")}</em>
      </div>
    </div>
  );
}
