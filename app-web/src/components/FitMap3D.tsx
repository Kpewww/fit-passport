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
// WEBGL DISCIPLINE (as the passport's old BodyMesh3D had it): lazy and boundaried by the caller; ONE
// renderer, created once per body and reused while sizes change (only the colours
// and the shell are swapped); `forceContextLoss()` with a full dispose on unmount;
// rotation through refs inside the frame loop, never React state; no idle spin
// under reduced motion.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { dressFormGeometry, shellGeometry } from "@/lib/dressForm3d";
import { FORM_COLOUR, fitMapColours, type BodyGeometryData, type Zone } from "@/lib/fitMapColours";
import type { BodyMeasurementsInput, GarmentMeasurements } from "@/lib/bodyMesh";

type Scene = {
  renderer: THREE.WebGLRenderer;
  bodyGeometry: THREE.BufferGeometry;
  pivot: THREE.Group;
  centre: THREE.Vector3;
  shell: THREE.Mesh | null;
  head: THREE.Mesh | null;
  camera: THREE.PerspectiveCamera;
  span: number;
  bodyMaterial: THREE.Material;
};

/** A mesh drawn with the body in its plain colour: the realistic body's face. */
export type Attachment = { positions: Float32Array; indices: Uint16Array | Uint32Array };

function meshSum(p: Float32Array): number {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = (Math.imul(h, 31) + Math.round(p[i] * 100)) | 0;
  return h;
}

export function FitMap3D({
  measurements,
  zones,
  garment,
  body: givenBody,
  size = 300,
  className = "",
  tint = FORM_COLOUR,
  head = null,
  zoom = 1,
  skin = false,
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
  /** The body's colour where no zone speaks (Session 98, /body): the form's grey by default. */
  tint?: string;
  /** A face for the realistic body, already placed in the body's space. */
  head?: Attachment | null;
  /** 1 frames the whole body; larger moves the camera in (towards the upper body). */
  zoom?: number;
  /** A skin tone, not the mannequin's (Session 98d): a soft sheen and a warm bounce
   *  light from below, instead of the form's dry matte. */
  skin?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const spinRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const idleRef = useRef(true);

  const body = givenBody ?? dressFormGeometry(measurements);
  // The scene is rebuilt when the body's shape changes. Two sampled vertices were not
  // enough: a cup size moves neither, so the body was not redrawn (Session 98d). A
  // checksum over the whole mesh is.
  const bodyKey = body
    ? `${body.positions.length}:${body.indices.length}:${meshSum(body.positions)}:${JSON.stringify(measurements)}:${head ? `${head.positions.length}:${meshSum(head.positions)}` : "-"}:${skin ? "skin" : "form"}`
    : "";

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

    // Matte for the mannequin: a form study of someone's measurements. With a skin tone,
    // a soft sheen at grazing angles, which is what makes skin read as skin and not
    // as painted plastic.
    const surface = (extra: THREE.MeshPhysicalMaterialParameters) =>
      skin
        ? new THREE.MeshPhysicalMaterial({
            roughness: 0.62, metalness: 0, sheen: 0.25, sheenRoughness: 0.75,
            // In the skin's own colour: a white sheen greyed the darker tones.
            sheenColor: new THREE.Color(tint),
            // A faint glow in the same colour keeps the shadows warm, the way light
            // scattered under skin does, instead of letting them go grey.
            emissive: new THREE.Color(tint).multiplyScalar(0.07),
            ...extra,
          })
        : new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.02, ...extra });
    const material = surface({ vertexColors: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.sub(centre);
    const pivot = new THREE.Group();
    pivot.add(mesh);

    const scene = new THREE.Scene();
    scene.add(pivot);
    // Skin is lit to show its own colour: three.js lights are physical (an intensity
    // of pi returns a surface's colour), and the form's levels gave about two thirds of
    // it, which made the Monk tones muddy. Neutral tone mapping keeps the highlights.
    if (skin) {
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
    }
    const key = new THREE.DirectionalLight(0xffffff, skin ? 2.6 : 1.7);
    key.position.set(-0.6, 1, 0.9);
    const fill = new THREE.DirectionalLight(0xffffff, skin ? 0.9 : 0.55);
    fill.position.set(1, 0.2, -0.6);
    scene.add(key, fill, skin ? new THREE.HemisphereLight(0xffffff, 0xc7a28c, 1.5) : new THREE.AmbientLight(0xffffff, 0.5));

    // Frame on the taller axis, with room for a shell wider than the body.
    const span = Math.max(bb.max.y - bb.min.y, (bb.max.x - bb.min.x) * 1.35);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 4000);
    camera.position.set(0, 0, span * 2.3);
    camera.lookAt(0, 0, 0);

    let headMesh: THREE.Mesh | null = null;
    if (head) {
      const hg = new THREE.BufferGeometry();
      hg.setAttribute("position", new THREE.BufferAttribute(head.positions, 3));
      hg.setIndex(new THREE.BufferAttribute(head.indices, 1));
      hg.computeVertexNormals();
      // The same matte as the body: a sculpture's face, one colour, no texture.
      headMesh = new THREE.Mesh(hg, surface({ color: new THREE.Color(tint) }));
      headMesh.position.sub(centre);
      pivot.add(headMesh);
    }

    sceneRef.current = { renderer, bodyGeometry: geometry, pivot, centre, shell: null, head: headMesh, camera, span, bodyMaterial: material };

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
      if (s?.head) {
        s.head.geometry.dispose();
        (s.head.material as THREE.Material).dispose();
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
  const sizeKey = JSON.stringify([zones ?? null, garment ?? null, bodyKey, tint]);
  useEffect(() => {
    const s = sceneRef.current;
    if (!s || !body) return;
    s.bodyGeometry.setAttribute("color", new THREE.BufferAttribute(fitMapColours(body, zones, tint), 3));
    if (s.head) (s.head.material as THREE.MeshStandardMaterial).color.set(tint);
    // A skin's sheen and glow follow its colour.
    for (const m of [s.bodyMaterial, s.head?.material as THREE.Material | undefined]) {
      if (m instanceof THREE.MeshPhysicalMaterial) {
        m.sheenColor.set(tint);
        m.emissive.set(tint).multiplyScalar(0.07);
      }
    }

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

  // ---- zoom: move the camera in, aiming higher as it closes in ----
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    // At 3x the view is centred on the head; at 2x it still holds the head and chest.
    const z = Math.max(1, Math.min(3, zoom));
    const aim = s.span * 0.22 * (z - 1);
    s.camera.position.set(0, aim, (s.span * 2.3) / z);
    s.camera.lookAt(0, aim, 0);
  }, [zoom, bodyKey, size]);

  return <div ref={hostRef} className={className} style={{ width: size, height: size }} />;
}
