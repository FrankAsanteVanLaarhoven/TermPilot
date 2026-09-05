# TermPilot humanoid asset contract

TermPilot must not manufacture a substitute robot from primitive geometry.

## Web asset

Provide `NEXT_PUBLIC_SPLINE_SCENE_URL` as either:

- the HTTPS URL produced by Spline's Code export for the licensed project; or
- a self-hosted `.splinecode` export from that exact project.

The Spline scene owns its authored pointer, camera and state animations. When
the variable is absent or the scene cannot load, TermPilot displays the approved
`public/splash/grokbot-humanoid.png` reference image and makes no claim that the
image is an interactive mesh.

## Robotics asset

A URDF/Xacro package is accepted only when it includes:

- a uniquely named link and joint tree;
- visual and collision meshes with explicit units;
- joint origins, axes, types and limits;
- masses, centres of mass and inertia tensors;
- source, version and licence provenance; and
- validation with `check_urdf` plus a visual inspection in RViz or the target simulator.

A Spline scene or rendered image is not a URDF and must not be presented as a
physical robot digital twin.
