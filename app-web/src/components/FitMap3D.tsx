"use client";

// The fit map: how one size sits on your measured body — Session 97.
//
// The body is coloured by the engine's own per-part numbers (`SizeScore.zones`,
// lib/fitMapColours.ts): warm where the size is tight on you, cobalt where it leaves
// room, light where it fits, the form's grey where nothing was measured. Where the
// chart gives garment girths, a translucent shell shows the garment itself around
// you. The page prints every part's centimetres beside it — the colour is the
// gestalt, the number is the truth (invariant ⑲).
//
// The body arrives as BodyGeometryData, so the realistic body (Anny, Track 2 of the
// Session 97 plan) can take the dress form's place without touching this file.
//
// WEBGL DISCIPLINE, as BodyMesh3D.tsx: lazy and boundaried by the caller; ONE
// renderer, created once per body and reused while sizes change (only the colours
// and the shell are swapped); `forceContextLoss()` with a full dispose on unmount;
// rotation through refs inside the frame loop, never React state; no idle spin
// under reduced motion.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { dressFormGeometry, shellGeometry } from "@/lib/dressForm3d";
import { fitMapColours, type BodyGeometryData, type Zone } from "@/lib/fitMapColours";
import type { BodyMeasurementsInput, GarmentMeasurements } from "@/lib/bodyMesh";

type Scene = {
  renderer: THREE.WebGLRenderer;
  bodyGeometry: THREE.BufferGeometry;
  pivot: THREE.Group;
  centre: THREE.Vector3;
  shell: THREE.Mesh | null;
};

export function FitMap3D({
  measurements,
  zones,
  garment,
  body: givenBody,
  size = 300,
  className = "",
}: {
  measurements: BodyMeasurementsInput;
  /** The size's per-part fit; absent means the plain form. */
  zones?: Zone[] | null;
  /** The size's garment girths, for the shell; null or without a chest means no shell. */
  garment?: GarmentMeasurements | null;
  /** Another body in the same shape (Anny); the dress form when absent. */
  body?: BodyGeometryData | null;
  size?: number;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const spinRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const idleRef = useRef(true);

  const body = givenBody ?? dressFormGeometry(measurements);
  const bodyKey = body ? `${body.positions.length}:${body.positions[1]}:${body.positions[body.positions.length - 2]}:${JSON.stringify(measurements)}` : "";

  // ---- the scene: once per body ----
  useEffect(() => {
    const el = hostRef.current;
    if (!el || !body) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL — the caller's fallback stays on screen
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(body.positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(body.indices, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(fitMapColours(body, null), 3));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    const centre = new THREE.Vector3();
    bb.getCenter(centre);

    // Matte, and not skin: a form study of someone's measurements, not a person.
    const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.02 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.sub(centre);
    const pivot = new THREE.Group();
    pivot.add(mesh);

    const scene = new THREE.Scene();
    scene.add(pivot);
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(-0.6, 1, 0.9);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(1, 0.2, -0.6);
    scene.add(key, fill, new THREE.AmbientLight(0xffffff, 0.5));

    // Frame on the taller axis, with room for a shell wider than the body.
    const span = Math.max(bb.max.y - bb.min.y, (bb.max.x - bb.min.x) * 1.35);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 4000);
    camera.position.set(0, 0, span * 2.3);
    camera.lookAt(0, 0, 0);

    sceneRef.current = { renderer, bodyGeometry: geometry, pivot, centre, shell: null };

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
    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    dom.style.touchAction = "pan-y";
    dom.style.cursor = "grab";

    let raf = 0;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const loop = () => {
      if (idleRef.current && !reduced) spinRef.current += 0.0035;
      pivot.rotation.y = spinRef.current;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointercancel", onUp);
      const s = sceneRef.current;
      if (s?.shell) {
        s.shell.geometry.dispose();
        (s.shell.material as THREE.Material).dispose();
      }
      sceneRef.current = null;
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      dom.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyKey, size]);

  // ---- the size: recolour and swap the shell, keeping the renderer ----
  const sizeKey = JSON.stringify([zones ?? null, garment ?? null, bodyKey]);
  useEffect(() => {
    const s = sceneRef.current;
    if (!s || !body) return;
    s.bodyGeometry.setAttribute("color", new THREE.BufferAttribute(fitMapColours(body, zones), 3));

    if (s.shell) {
      s.pivot.remove(s.shell);
      s.shell.geometry.dispose();
      (s.shell.material as THREE.Material).dispose();
      s.shell = null;
    }
    const tube = garment ? shellGeometry(measurements, garment) : null;
    if (tube && !givenBody) {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(tube.positions, 3));
      g.setIndex(new THREE.BufferAttribute(tube.indices, 1));
      g.computeVertexNormals();
      // A pale glass: the body under it carries the colours.
      const m = new THREE.MeshStandardMaterial({
        color: 0xf4f3ef, roughness: 0.3, transparent: true, opacity: 0.22,
        side: THREE.DoubleSide, depthWrite: false,
      });
      const shell = new THREE.Mesh(g, m);
      shell.position.sub(s.centre);
      shell.renderOrder = 1;
      s.pivot.add(shell);
      s.shell = shell;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeKey]);

  return <div ref={hostRef} className={className} style={{ width: size, height: size }} />;
}
