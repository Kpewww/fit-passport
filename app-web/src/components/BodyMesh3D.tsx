"use client";

// A 3D body built from the measurements the user actually typed.
//
// WHAT IT IS. `lib/bodyMesh.ts` turns their girths into a stack of elliptical
// cross-sections; this lofts those into a surface. The circumference of every
// section is the number they gave us, so the volume you see is theirs — see that
// module for which parts are measurement and which are drawing convention.
//
// WHAT IT IS NOT. A try-on, and not a scan. `docs/design/fit-algorithm-research.md`
// §1 is that image-based try-on transfers appearance and not fit, which is why
// `FitFigure` is a diagram (invariant ⑲). This is the same contract in three
// dimensions: no face, no skin, no clothing, and the centimetres printed beside
// it. A figure that looked like a photograph of a person would quietly make the
// promise the research says nobody can keep.
//
// WEBGL DISCIPLINE — every line of it is a scar in this codebase:
//   • lazy-loaded and wrapped in SafeBoundary by the caller (a failed three.js
//     chunk silently blanks the subtree otherwise);
//   • ONE renderer, and `forceContextLoss()` plus a full dispose on unmount —
//     leaked contexts are what made the badge page heavy (see
//     docs/memory/project-fit-passport-performance.md);
//   • rotation is driven through refs inside the animation loop and NEVER
//     through React state. A previous pointermove handler in this codebase
//     re-rendered React 60–120×/second.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { bodyCrossSections, drawingRings, type BodyMeasurementsInput } from "@/lib/bodyMesh";

const RADIAL_SEGMENTS = 48;
// Interpolated rings between each measured pair. Enough that the surface reads
// as a body rather than a set of stacked hoops; low enough to stay cheap.
const RINGS_BETWEEN = 8;

/** Points around one elliptical ring, in world units (cm). */
function ring(halfWidth: number, halfDepth: number, y: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < RADIAL_SEGMENTS; i++) {
    const t = (i / RADIAL_SEGMENTS) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(t) * halfWidth, y, Math.sin(t) * halfDepth));
  }
  return pts;
}

/**
 * Loft the sections into a closed surface.
 *
 * Each of half-width, half-depth and height is interpolated along its own
 * Catmull-Rom curve, so the waist narrows smoothly instead of the body being a
 * stack of cones. The measured rings still sit exactly on their measured values
 * — Catmull-Rom passes through its control points, which is the reason for
 * choosing it here rather than a B-spline that would round the numbers off.
 */
function buildBodyGeometry(measured: ReturnType<typeof bodyCrossSections>): THREE.BufferGeometry {
  // Measured rings in the middle; drawing-only rings shaping the two ends. The
  // measured ones are untouched, so the volume between shoulder and hip is still
  // exactly the user's numbers — see drawingRings() for why the ends exist.
  const caps = drawingRings(measured);
  const sections = [...caps.below.slice().reverse(), ...measured, ...caps.above]
    .sort((a, b) => a.y - b.y);

  const ys = sections.map((s) => s.y);
  // `centripetal` rather than the uniform default: the shoulder-to-neck step is
  // sharp, and uniform Catmull-Rom overshoots it badly enough to bulge the neck
  // back out wider than the shoulder — the first render looked like a vase for
  // exactly this reason. Centripetal parameterisation is cusp- and
  // self-intersection-free, and still interpolates its control points, so the
  // measured rings stay on their measured values.
  const spline = (pick: (s: (typeof sections)[number]) => number) =>
    new THREE.CatmullRomCurve3(
      sections.map((s, i) => new THREE.Vector3(i, pick(s), 0)),
      false,
      "centripetal",
    );
  const curveW = spline((s) => s.halfWidth);
  const curveD = spline((s) => s.halfDepth);
  const curveY = spline((s) => s.y);

  const steps = (sections.length - 1) * RINGS_BETWEEN;
  const rings: THREE.Vector3[][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    rings.push(ring(curveW.getPoint(t).y, curveD.getPoint(t).y, curveY.getPoint(t).y));
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const pushTri = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    for (const v of [a, b, c]) {
      positions.push(v.x, v.y, v.z);
      normals.push(n.x, n.y, n.z);
    }
  };

  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < RADIAL_SEGMENTS; i++) {
      const j = (i + 1) % RADIAL_SEGMENTS;
      pushTri(rings[r][i], rings[r + 1][i], rings[r + 1][j]);
      pushTri(rings[r][i], rings[r + 1][j], rings[r][j]);
    }
  }

  // Flat caps top and bottom, so the form reads as a solid volume and not a tube.
  for (const [idx, flip] of [[0, true], [rings.length - 1, false]] as const) {
    const centre = new THREE.Vector3(0, ys.length ? rings[idx][0].y : 0, 0);
    for (let i = 0; i < RADIAL_SEGMENTS; i++) {
      const j = (i + 1) % RADIAL_SEGMENTS;
      if (flip) pushTri(centre, rings[idx][j], rings[idx][i]);
      else pushTri(centre, rings[idx][i], rings[idx][j]);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return g;
}

export function BodyMesh3D({
  measurements,
  size = 280,
  className = "",
}: {
  measurements: BodyMeasurementsInput;
  size?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  // Drag state lives in refs on purpose — see the note at the top of this file.
  const spinRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const idleRef = useRef(true);

  const sections = bodyCrossSections(measurements);
  const key = JSON.stringify(sections.map((s) => [s.key, s.y, s.halfWidth, s.halfDepth]));

  useEffect(() => {
    const el = hostRef.current;
    if (!el || sections.length < 2) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL — the caller's fallback stays on screen
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const geometry = buildBodyGeometry(sections);
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    const centre = new THREE.Vector3();
    bb.getCenter(centre);
    // Frame on the taller axis only. Padding the width by a factor pushed the
    // camera back and squashed the figure's apparent proportions.
    const span = Math.max(bb.max.y - bb.min.y, bb.max.x - bb.min.x);

    // Matte, unlit-looking ink. Deliberately not skin: this is a form study of
    // someone's measurements, and a flesh tone would start implying a person.
    const material = new THREE.MeshStandardMaterial({
      color: 0x9aa0ad,
      roughness: 0.48,
      metalness: 0.02,
      flatShading: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.sub(centre);

    const pivot = new THREE.Group();
    pivot.add(mesh);
    scene.add(pivot);

    // One key light, one fill — the same single-source logic the badges use, so
    // the volume reads without the figure looking rendered.
    const key1 = new THREE.DirectionalLight(0xffffff, 1.9);
    key1.position.set(-0.6, 1, 0.9);
    const fill = new THREE.DirectionalLight(0xffffff, 0.5);
    fill.position.set(1, 0.2, -0.6);
    scene.add(key1, fill, new THREE.AmbientLight(0xffffff, 0.42));

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 2000);
    camera.position.set(0, 0, span * 2.35);
    camera.lookAt(0, 0, 0);

    // ---- pointer drag, entirely outside React ----
    const onDown = (e: PointerEvent) => {
      draggingRef.current = true;
      idleRef.current = false;
      lastXRef.current = e.clientX;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      spinRef.current += (e.clientX - lastXRef.current) * 0.01;
      lastXRef.current = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      draggingRef.current = false;
      try { renderer.domElement.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.style.touchAction = "pan-y"; // let the page still scroll
    renderer.domElement.style.cursor = "grab";

    let raf = 0;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const loop = () => {
      // A slow idle turn shows it is three-dimensional without demanding a drag;
      // it stops for good the moment the user takes hold, and never runs for
      // someone who asked for reduced motion.
      if (idleRef.current && !reduced) spinRef.current += 0.0035;
      pivot.rotation.y = spinRef.current;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // `key` collapses the section geometry to a primitive so this re-runs when
    // the measurements change and not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, size]);

  return <div ref={hostRef} className={className} style={{ width: size, height: size }} />;
}
