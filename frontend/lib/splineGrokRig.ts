import type { Application, CreateMaterialOptions, SPEObject } from "@splinetool/runtime";

export type GrokRig = {
  root: SPEObject;
  head: SPEObject;
  torso: SPEObject;
  pulse: SPEObject;
  armL: SPEObject;
  armR: SPEObject;
};

const BLACK: CreateMaterialOptions = { color: "#0c0c0c", roughness: 0.12, metalness: 0.92 };
const GUN: CreateMaterialOptions = { color: "#2a323c", roughness: 0.32, metalness: 0.72 };
const CYAN: CreateMaterialOptions = { color: "#3ad0ff", roughness: 0.22, metalness: 0.55 };
const WHITE: CreateMaterialOptions = { color: "#f4f6f8", roughness: 0.18, metalness: 0.08 };

async function make(
  app: Application,
  type: string,
  options: Record<string, unknown>,
): Promise<SPEObject> {
  return app.createObject(type, options);
}

export async function buildGrokRig(app: Application): Promise<GrokRig> {
  for (const obj of app.getAllObjects()) {
    const name = (obj.name || "").toLowerCase();
    if (name.includes("camera") || name.includes("light") || name.includes("sun")) continue;
    try {
      obj.hide();
    } catch {
      /* some scene nodes are not hideable */
    }
  }

  try {
    app.setBackgroundColor("#05070a");
  } catch {
    /* host scene may lock background */
  }

  const root = await make(app, "Group", { name: "GrokRig", position: [0, -40, 0] });

  const torso = await make(app, "Cube", {
    name: "GrokTorso",
    parent: root,
    position: [0, 92, 0],
    width: 118,
    height: 108,
    depth: 58,
    cornerRadius: 14,
    material: GUN,
    castShadow: true,
  });
  torso.scale.x = 1.08;
  torso.scale.z = 0.92;

  const pulse = await make(app, "Cube", {
    name: "GrokPulse",
    parent: root,
    position: [0, 108, 30],
    width: 72,
    height: 4,
    depth: 6,
    cornerRadius: 2,
    material: CYAN,
  });

  await make(app, "Cube", {
    name: "GrokSternum",
    parent: root,
    position: [0, 78, 30],
    width: 4,
    height: 36,
    depth: 5,
    material: CYAN,
  });

  const neck = await make(app, "Cylinder", {
    name: "GrokNeck",
    parent: root,
    position: [0, 152, 0],
    height: 22,
    width: 16,
    material: GUN,
  });
  void neck;

  await make(app, "Cylinder", {
    name: "GrokCableL",
    parent: root,
    position: [-7, 150, 6],
    height: 18,
    width: 4.4,
    rotation: [8, 0, -12],
    material: { color: "#1a222c", roughness: 0.5, metalness: 0.4 },
  });
  await make(app, "Cylinder", {
    name: "GrokCableR",
    parent: root,
    position: [7, 150, 6],
    height: 18,
    width: 4.4,
    rotation: [8, 0, 12],
    material: { color: "#1a222c", roughness: 0.5, metalness: 0.4 },
  });

  const head = await make(app, "Group", { name: "GrokHead", parent: root, position: [0, 188, 0] });

  await make(app, "Sphere", {
    name: "GrokSkull",
    parent: head,
    position: [0, 0, 0],
    width: 92,
    material: BLACK,
    castShadow: true,
  });

  const eye = async (name: string, x: number) => {
    return make(app, "Sphere", {
      name,
      parent: head,
      position: [x, 16, 34],
      width: 16,
      scale: [0.5, 0.95, 0.38],
      rotation: [0, 0, -22],
      material: WHITE,
    });
  };
  await eye("GrokEyeL", -13);
  await eye("GrokEyeR", 13);

  await make(app, "Sphere", {
    name: "GrokShoulderL",
    parent: root,
    position: [-68, 128, 0],
    width: 32,
    material: GUN,
  });
  await make(app, "Sphere", {
    name: "GrokShoulderR",
    parent: root,
    position: [68, 128, 0],
    width: 32,
    material: GUN,
  });

  const armL = await make(app, "Group", { name: "GrokArmL", parent: root, position: [-72, 118, 0] });
  const armR = await make(app, "Group", { name: "GrokArmR", parent: root, position: [72, 118, 0] });

  await make(app, "Cylinder", {
    name: "GrokUpperL",
    parent: armL,
    position: [0, -32, 0],
    height: 58,
    width: 16,
    material: GUN,
  });
  await make(app, "Cylinder", {
    name: "GrokUpperR",
    parent: armR,
    position: [0, -32, 0],
    height: 58,
    width: 16,
    material: GUN,
  });
  await make(app, "Sphere", {
    name: "GrokElbowL",
    parent: armL,
    position: [0, -62, 0],
    width: 10,
    material: GUN,
  });
  await make(app, "Sphere", {
    name: "GrokElbowR",
    parent: armR,
    position: [0, -62, 0],
    width: 10,
    material: GUN,
  });
  await make(app, "Cylinder", {
    name: "GrokForeL",
    parent: armL,
    position: [4, -96, 6],
    height: 54,
    width: 14,
    rotation: [12, 0, 8],
    material: GUN,
  });
  await make(app, "Cylinder", {
    name: "GrokForeR",
    parent: armR,
    position: [-4, -96, 6],
    height: 54,
    width: 14,
    rotation: [12, 0, -8],
    material: GUN,
  });
  await make(app, "Sphere", {
    name: "GrokHandL",
    parent: armL,
    position: [8, -126, 12],
    width: 9,
    material: BLACK,
  });
  await make(app, "Sphere", {
    name: "GrokHandR",
    parent: armR,
    position: [-8, -126, 12],
    width: 9,
    material: BLACK,
  });

  await make(app, "Cylinder", {
    name: "GrokRingL",
    parent: armL,
    position: [0, -40, 0],
    height: 4,
    width: 11,
    material: CYAN,
  });
  await make(app, "Cylinder", {
    name: "GrokRingR",
    parent: armR,
    position: [0, -40, 0],
    height: 4,
    width: 11,
    material: CYAN,
  });

  await make(app, "Cube", {
    name: "GrokHip",
    parent: root,
    position: [0, 34, 0],
    width: 72,
    height: 22,
    depth: 46,
    cornerRadius: 8,
    material: GUN,
  });

  await make(app, "Cylinder", {
    name: "GrokThighL",
    parent: root,
    position: [-22, -8, 0],
    height: 70,
    width: 22,
    material: GUN,
  });
  await make(app, "Cylinder", {
    name: "GrokThighR",
    parent: root,
    position: [22, -8, 0],
    height: 70,
    width: 22,
    material: GUN,
  });
  await make(app, "Sphere", {
    name: "GrokKneeL",
    parent: root,
    position: [-22, -44, 4],
    width: 12,
    material: GUN,
  });
  await make(app, "Sphere", {
    name: "GrokKneeR",
    parent: root,
    position: [22, -44, 4],
    width: 12,
    material: GUN,
  });
  await make(app, "Cylinder", {
    name: "GrokShinL",
    parent: root,
    position: [-22, -82, 2],
    height: 62,
    width: 18,
    material: GUN,
  });
  await make(app, "Cylinder", {
    name: "GrokShinR",
    parent: root,
    position: [22, -82, 2],
    height: 62,
    width: 18,
    material: GUN,
  });
  await make(app, "Cube", {
    name: "GrokFootL",
    parent: root,
    position: [-22, -118, 10],
    width: 28,
    height: 12,
    depth: 48,
    cornerRadius: 4,
    material: BLACK,
  });
  await make(app, "Cube", {
    name: "GrokFootR",
    parent: root,
    position: [22, -118, 10],
    width: 28,
    height: 12,
    depth: 48,
    cornerRadius: 4,
    material: BLACK,
  });
  await make(app, "Cylinder", {
    name: "GrokAnkleL",
    parent: root,
    position: [-22, -110, 0],
    height: 5,
    width: 12,
    material: CYAN,
  });
  await make(app, "Cylinder", {
    name: "GrokAnkleR",
    parent: root,
    position: [22, -110, 0],
    height: 5,
    width: 12,
    material: CYAN,
  });

  await make(app, "DirectionalLight", {
    name: "GrokKey",
    position: [180, 260, 220],
    intensity: 1.35,
    color: "#f2f6ff",
  });
  await make(app, "PointLight", {
    name: "GrokFill",
    position: [-140, 120, 160],
    intensity: 0.55,
    color: "#7ec8ff",
  });
  await make(app, "PointLight", {
    name: "GrokRim",
    position: [80, 40, -160],
    intensity: 0.8,
    color: "#3ad0ff",
  });

  root.scale.x = 1.2;
  root.scale.y = 1.2;
  root.scale.z = 1.2;
  root.position.y = -90;
  root.rotation.y = 0.55;

  for (const obj of app.getAllObjects()) {
    const name = obj.name || "";
    if (name.startsWith("Grok")) continue;
    if (/camera|cam\b|orbit/i.test(name)) continue;
    try {
      obj.hide();
    } catch {
      /* keep cameras */
    }
  }

  poseStudioCamera(app);

  try {
    app.setZoom(1.05);
  } catch {
    /* zoom is optional */
  }

  return { root, head, torso, pulse, armL, armR };
}

function poseStudioCamera(app: Application): void {
  const controls = (app.controls ?? (app as unknown as { _controls?: { object?: { position: { set: (x: number, y: number, z: number) => void }; lookAt?: (x: number, y: number, z: number) => void } } })._controls) as
    | {
        object?: { position: { x: number; y: number; z: number; set?: (x: number, y: number, z: number) => void }; lookAt?: (x: number, y: number, z: number) => void };
        target?: { set?: (x: number, y: number, z: number) => void; x?: number; y?: number; z?: number };
      }
    | undefined;

  if (controls?.target?.set) controls.target.set(0, 70, 0);
  if (controls?.object?.position?.set) {
    controls.object.position.set(210, 110, 340);
    controls.object.lookAt?.(0, 70, 0);
  }

  for (const obj of app.getAllObjects()) {
    const name = (obj.name || "").toLowerCase();
    if (!name.includes("camera") && !name.includes("cam")) continue;
    obj.position.x = 210;
    obj.position.y = 110;
    obj.position.z = 340;
    obj.rotation.x = -0.22;
    obj.rotation.y = 0.52;
    obj.rotation.z = 0;
  }
}

export type GrokExpression = "idle" | "welcome" | "curious" | "listen" | "think" | "glad" | "careful";

export function animateGrokRig(
  rig: GrokRig,
  clock: { t: number; gazeX: number; gazeY: number; mood: string; expression?: GrokExpression },
): void {
  const breath = Math.sin(clock.t * 1.55) * 3.2;
  const expr = clock.expression ?? "idle";
  const bounce = expr === "glad" ? Math.abs(Math.sin(clock.t * 4.2)) * 10 : 0;
  const retreat = expr === "careful" ? -14 : expr === "curious" ? 10 : 0;
  rig.root.position.y = -90 + breath * 0.15 + bounce;
  rig.root.position.z = retreat;
  rig.torso.position.y = 92 + breath * 0.25;
  rig.head.rotation.y = clock.gazeX * 0.42 + (expr === "think" ? -0.38 : expr === "curious" ? 0.22 : 0);
  rig.head.rotation.x = clock.gazeY * 0.22 + (expr === "listen" ? 0.08 : 0);
  rig.head.rotation.z = expr === "welcome" ? Math.sin(clock.t * 2.2) * 0.1 : expr === "curious" ? 0.16 : 0;
  const sway = Math.sin(clock.t * 1.25) * 0.07;
  if (expr === "welcome") {
    rig.armR.rotation.z = -0.2 - Math.abs(Math.sin(clock.t * 5.2)) * 1.05;
    rig.armR.rotation.x = 0.55;
    rig.armL.rotation.z = 0.18 + sway;
    rig.armL.rotation.x = 0.05;
  } else if (expr === "think") {
    rig.armL.rotation.z = 1.05;
    rig.armL.rotation.x = 0.72;
    rig.armR.rotation.z = -0.12 + sway;
    rig.armR.rotation.x = 0.04;
  } else if (expr === "glad") {
    rig.armL.rotation.z = 0.7 + Math.sin(clock.t * 5) * 0.25;
    rig.armR.rotation.z = -0.7 - Math.sin(clock.t * 5) * 0.25;
    rig.armL.rotation.x = 0.35;
    rig.armR.rotation.x = 0.35;
  } else {
    rig.armL.rotation.z = 0.16 + sway;
    rig.armR.rotation.z = -0.16 - sway;
    rig.armL.rotation.x = Math.sin(clock.t * 1.1) * 0.05;
    rig.armR.rotation.x = Math.cos(clock.t * 1.1) * 0.05;
  }
  const rate =
    expr === "glad" || clock.mood === "speaking"
      ? 8
      : expr === "listen" || clock.mood === "listening"
        ? 5.4
        : expr === "careful"
          ? 1.8
          : 3.1;
  const beat = 1 + Math.abs(Math.sin(clock.t * rate)) * (expr === "careful" ? 0.2 : 0.55);
  rig.pulse.scale.x = beat;
  rig.pulse.scale.z = beat;
}
