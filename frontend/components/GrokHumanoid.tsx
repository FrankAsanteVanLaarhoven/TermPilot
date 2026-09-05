"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GrokBotMark, type BotMood } from "@/components/GrokBotMark";
import { useI18n } from "@/components/Providers";

export type GrokExpression = "idle" | "welcome" | "curious" | "listen" | "think" | "glad" | "careful";
export type { BotMood };
export const URDF_HUMANOID = "/robot/g1/g1.urdf";

type Pointer = { x: number; y: number };

export function GrokHumanoid({ mood = "idle", expression = "idle", variant = "stage", className = "" }: {
  mood?: BotMood;
  expression?: GrokExpression;
  variant?: "splash" | "stage" | "compact";
  className?: string;
}) {
  const { tr } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef(mood);
  const expressionRef = useRef(expression);
  const pointerRef = useRef<Pointer>({ x: 0, y: 0 });
  const [modelState, setModelState] = useState<"loading" | "ready" | "fallback">("loading");
  moodRef.current = mood;
  expressionRef.current = expression;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    async function mount() {
      try {
        const THREE = await import("three");
        const { default: URDFLoader } = await import("urdf-loader");
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 40);
        camera.position.set(2.45, 1.35, 3.65);
        camera.lookAt(0, 0.78, 0);
        scene.add(new THREE.HemisphereLight(0xbfefff, 0x03060b, 2.4));
        const key = new THREE.DirectionalLight(0xffffff, 4.6);
        key.position.set(2.5, 4, 3.5);
        key.castShadow = true;
        scene.add(key);
        const rim = new THREE.PointLight(0x00e5ff, 22, 8, 1.6);
        rim.position.set(-2.2, 1.4, 1.2);
        scene.add(rim);

        const floor = new THREE.Mesh(new THREE.CircleGeometry(1.05, 96), new THREE.MeshPhysicalMaterial({ color: 0x071018, metalness: 0.82, roughness: 0.24, transparent: true, opacity: 0.72 }));
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.71;
        floor.receiveShadow = true;
        scene.add(floor);

        const loader = new URDFLoader();
        loader.parseCollision = false;
        const robot = await new Promise<import("urdf-loader").URDFRobot>((resolve, reject) => loader.load(URDF_HUMANOID, resolve, undefined, reject));
        if (disposed) { renderer.dispose(); return; }
        robot.rotation.x = -Math.PI / 2;
        robot.rotation.z = Math.PI / 2;
        robot.scale.setScalar(1.22);
        robot.position.y = -0.7;
        scene.add(robot);

        const dark = new THREE.MeshPhysicalMaterial({ color: 0x05090d, metalness: 0.94, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.1 });
        const graphite = new THREE.MeshPhysicalMaterial({ color: 0x17222c, metalness: 0.9, roughness: 0.2, clearcoat: 0.9 });
        const cyan = new THREE.LineBasicMaterial({ color: 0x15e6f4, transparent: true, opacity: 0.36 });
        let meshIndex = 0;
        robot.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return;
          node.material = meshIndex++ % 4 === 0 ? graphite : dark;
          node.castShadow = true;
          node.receiveShadow = true;
          const edges = new THREE.LineSegments(new THREE.EdgesGeometry(node.geometry, 27), cyan);
          edges.renderOrder = 2;
          node.add(edges);
        });

        const head = robot.links.head_link;
        if (head) {
          const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
          for (const side of [-1, 1]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 22, 14), eyeMaterial);
            eye.scale.set(0.55, 1, 0.3);
            eye.position.set(0.104, side * 0.036, 0.475);
            eye.rotation.y = Math.PI / 2;
            head.add(eye);
          }
        }

        const setJoint = (name: string, value: number) => {
          try { robot.setJointValue(name, value); } catch { /* optional joint */ }
        };
        const resize = () => {
          const rect = canvasEl.getBoundingClientRect();
          const width = Math.max(1, Math.round(rect.width));
          const height = Math.max(1, Math.round(rect.height));
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(canvasEl);
        resize();
        const onPointer = (event: PointerEvent) => {
          const rect = canvasEl.getBoundingClientRect();
          pointerRef.current = { x: THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1), y: THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1) };
        };
        const resetPointer = () => { pointerRef.current = { x: 0, y: 0 }; };
        canvasEl.addEventListener("pointermove", onPointer);
        canvasEl.addEventListener("pointerleave", resetPointer);

        const clock = new THREE.Clock();
        const homeCamera = camera.position.clone();
        const animate = () => {
          if (disposed) return;
          const t = clock.getElapsedTime();
          const p = pointerRef.current;
          const active = moodRef.current === "speaking" || expressionRef.current === "glad";
          const listening = moodRef.current === "listening" || expressionRef.current === "listen";
          const thinking = moodRef.current === "processing" || expressionRef.current === "think";
          const breath = Math.sin(t * 1.55) * 0.025;
          const gesture = active ? Math.sin(t * 3.1) * 0.23 : listening ? 0.16 : Math.sin(t * 0.72) * 0.035;
          setJoint("waist_yaw_joint", p.x * 0.18 + Math.sin(t * 0.42) * 0.025);
          setJoint("left_shoulder_pitch_joint", -0.12 + breath - gesture * 0.45);
          setJoint("right_shoulder_pitch_joint", -0.12 - breath + gesture);
          setJoint("left_shoulder_roll_joint", 0.12 + p.x * 0.06);
          setJoint("right_shoulder_roll_joint", -0.12 + p.x * 0.06);
          setJoint("left_elbow_joint", 0.28 + Math.abs(gesture) * 0.45);
          setJoint("right_elbow_joint", 0.28 + (active ? 0.48 + gesture * 0.4 : 0));
          setJoint("left_wrist_yaw_joint", Math.sin(t * 1.1) * 0.08);
          setJoint("right_wrist_yaw_joint", active ? Math.sin(t * 2.8) * 0.22 : 0);
          setJoint("left_hip_pitch_joint", -0.06 + breath * 0.2);
          setJoint("right_hip_pitch_joint", -0.06 - breath * 0.2);
          setJoint("left_knee_joint", 0.12 - breath * 0.2);
          setJoint("right_knee_joint", 0.12 + breath * 0.2);
          if (head) {
            head.rotation.z += (p.x * -0.34 - head.rotation.z) * 0.08;
            head.rotation.y += ((-p.y * 0.2) + (thinking ? Math.sin(t * 1.8) * 0.045 : 0) - head.rotation.y) * 0.08;
          }
          robot.position.y = -0.7 + Math.sin(t * 1.55) * 0.006;
          robot.rotation.y = Math.sin(t * 0.32) * 0.025;
          camera.position.x += (homeCamera.x + p.x * 0.18 - camera.position.x) * 0.035;
          camera.position.y += (homeCamera.y - p.y * 0.08 - camera.position.y) * 0.035;
          camera.lookAt(0, 0.76, 0);
          renderer.render(scene, camera);
          frame = requestAnimationFrame(animate);
        };
        setModelState("ready");
        frame = requestAnimationFrame(animate);
        cleanup = () => {
          observer.disconnect();
          canvasEl.removeEventListener("pointermove", onPointer);
          canvasEl.removeEventListener("pointerleave", resetPointer);
          renderer.dispose();
        };
      } catch (error) {
        console.error("TermPilot URDF humanoid failed to load", error);
        if (!disposed) setModelState("fallback");
      }
    }
    void mount();
    return () => { disposed = true; cancelAnimationFrame(frame); cleanup(); };
  }, []);

  return (
    <div className={`tp-bot ${variant} mood-${mood} expr-${expression} ${className}`} data-spline={modelState} aria-label={`${tr("grokbot.name")} interactive humanoid`}>
      <canvas ref={canvasRef} className="tp-bot-spline" aria-hidden />
      {modelState === "loading" && <div className="tp-bot-loading" aria-hidden><GrokBotMark size={72} mood={mood} /></div>}
      {modelState === "fallback" && <Image className="tp-bot-reference" src="/splash/grokbot-humanoid.png" alt="" fill priority sizes="(max-width: 900px) 100vw, 60vw" aria-hidden />}
      <div className="tp-bot-badge"><GrokBotMark size={18} mood={mood} /><span>{tr("grokbot.name")}</span>{modelState === "ready" && <em>URDF · 29 DoF</em>}</div>
    </div>
  );
}
