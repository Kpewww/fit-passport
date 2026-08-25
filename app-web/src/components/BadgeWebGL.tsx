"use client";

// TRUE 3D badge — a real extruded medal lit as metal, for the inspect stage.
//
// The body is the badge's ACTUAL silhouette (shield / hexagon / quatrefoil /
// rosette / disc) extruded with a bevelled edge, using the same outline the SVG
// art is drawn from — a shield that turned into a plain disc in 3D would read as
// a different award. The struck art is rasterised from that SVG and laid on the
// front face, so engraving and 3D geometry agree.
//
// Loaded lazily (only when the inspect stage opens), so three.js never touches
// first paint.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PALETTE, shapePolygon, type BadgeShape } from "@/components/BadgeMedallion";
import type { Metal } from "@/lib/badges";

/** The art box (0..1 in SVG space) maps to this many world units. */
const W = 4;
/** Extrusion depth and bevel — a medal, not a wafer. */
const DEPTH = 0.34;
const BEVEL = 0.07;

/** Rasterise an SVG string into a THREE texture. */
async function svgTexture(svg: string, px: number): Promise<THREE.Texture> {
  // Belt and braces: a serialized inline SVG normally carries its namespace, but
  // an <img> refuses to decode it if anything stripped it, and the failure is a
  // silent blank texture.
  const withNs = svg.includes("xmlns=")
    ? svg
    : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNs)}`;
  const img = new Image();
  await new Promise<void>((res, rej) => {
    img.onload = () => res();
    img.onerror = () => rej(new Error("texture load failed"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, px, px);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function BadgeWebGL({
  metal,
  shape = "circle",
  faceSvg,
  faceAspect = 1,
  size = 300,
  onUnavailable,
}: {
  metal: Metal;
  shape?: BadgeShape;
  /** The medallion rendered as an SVG string (used as the face texture). */
  faceSvg: string;
  /** height / width of that SVG (>1 when a laurel overflows below the rim). */
  faceAspect?: number;
  size?: number;
  /** Called when this device can't give us a WebGL context. */
  onUnavailable?: () => void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  // Drag state lives in a ref so the render loop reads it without re-rendering.
  const drag = useRef({ down: false, x: 0, y: 0, rx: -0.12, ry: 0.3, vy: 0.004 });

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn("[BadgeWebGL] no WebGL context:", err);
      onUnavailable?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 8.4);

    const p = PALETTE[metal];
    const medal = new THREE.Group();

    // A small studio environment gives the metal something to reflect.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#15171c");
    const keyGeo = new THREE.PlaneGeometry(12, 12);
    const key = new THREE.Mesh(keyGeo, new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    key.position.set(4, 6, 4);
    key.lookAt(0, 0, 0);
    envScene.add(key);
    const fill = new THREE.Mesh(
      keyGeo,
      new THREE.MeshBasicMaterial({ color: new THREE.Color(p.glow).multiplyScalar(0.5) }),
    );
    fill.position.set(-6, -3, 3);
    fill.lookAt(0, 0, 0);
    envScene.add(fill);
    const env = pmrem.fromScene(envScene, 0.05).texture;
    scene.environment = env;

    // ---- Body: the real silhouette, extruded ----
    const poly = shapePolygon(shape, 0.5, 0.44, 16);
    let bodyGeo: THREE.BufferGeometry;
    if (poly) {
      const outline = new THREE.Shape(
        // SVG y grows downward; world y grows up.
        poly.map(([px, py]) => new THREE.Vector2((px - 0.5) * W, -(py - 0.5) * W)),
      );
      bodyGeo = new THREE.ExtrudeGeometry(outline, {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL,
        bevelSize: BEVEL * 0.85,
        bevelSegments: 3,
        curveSegments: 2,
      });
      bodyGeo.translate(0, 0, -DEPTH / 2);
    } else {
      bodyGeo = new THREE.CylinderGeometry(W * 0.44, W * 0.44, DEPTH + BEVEL, 128);
      bodyGeo.rotateX(Math.PI / 2);
    }
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(p.mid),
      metalness: 1,
      roughness: 0.32,
      envMapIntensity: 1.15,
    });
    medal.add(new THREE.Mesh(bodyGeo, bodyMat));

    // ---- Front face: the struck art, laid on the bevelled top ----
    const frontZ = DEPTH / 2 + (poly ? BEVEL : 0) + 0.02;
    const artGeo = new THREE.PlaneGeometry(W, W * faceAspect);
    const artMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.7,
      roughness: 0.28,
      envMapIntensity: 1.0,
      transparent: true,
      depthWrite: false,
    });
    const art = new THREE.Mesh(artGeo, artMat);
    // The SVG box grows DOWNWARD when a laurel overflows, so keep the medal's top
    // edge aligned rather than centring the taller box.
    art.position.set(0, (W * (1 - faceAspect)) / 2, frontZ);
    medal.add(art);
    scene.add(medal);

    // Practical lights on top of the environment for crisp highlights.
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const spot = new THREE.DirectionalLight(0xffffff, 2.2);
    spot.position.set(3, 4, 5);
    scene.add(spot);
    const rimLight = new THREE.DirectionalLight(new THREE.Color(p.glow), 1.1);
    rimLight.position.set(-4, -2, 2);
    scene.add(rimLight);

    let disposed = false;
    let tex: THREE.Texture | null = null;
    if (faceSvg) {
      svgTexture(faceSvg, 1024)
        .then((t) => {
          if (disposed) {
            t.dispose();
            return;
          }
          tex = t;
          artMat.map = t;
          artMat.needsUpdate = true;
        })
        .catch((err) => {
          // Keep the untextured metal medal rather than showing nothing.
          console.warn("[BadgeWebGL] face texture failed:", err);
        });
    }

    let raf = 0;
    const loop = () => {
      if (!drag.current.down) drag.current.ry += drag.current.vy; // idle drift
      medal.rotation.x = drag.current.rx;
      medal.rotation.y = drag.current.ry;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.domElement.remove();
      renderer.dispose();
      // dispose() frees three.js's own GPU objects but NOT the WebGL context
      // itself. Without this, every badge inspected in True 3D leaks a live
      // context; Chrome caps concurrent contexts (~16) and starts evicting the
      // oldest, and until then each one holds GPU memory. That shows up as the
      // whole tab getting heavier the longer you browse — not as an error.
      renderer.forceContextLoss();
      pmrem.dispose();
      env.dispose();
      keyGeo.dispose();
      bodyGeo.dispose();
      artGeo.dispose();
      bodyMat.dispose();
      artMat.dispose();
      tex?.dispose();
    };
  }, [metal, shape, faceSvg, faceAspect, size, onUnavailable]);

  return (
    <div
      ref={mount}
      onPointerDown={(e) => {
        drag.current.down = true;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current.down) return;
        const dx = e.clientX - drag.current.x;
        const dy = e.clientY - drag.current.y;
        drag.current.x = e.clientX;
        drag.current.y = e.clientY;
        drag.current.ry += dx * 0.008;
        drag.current.rx = Math.max(-1.2, Math.min(1.2, drag.current.rx + dy * 0.008));
      }}
      onPointerUp={(e) => {
        drag.current.down = false;
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      }}
      onPointerCancel={() => {
        drag.current.down = false;
      }}
      className="cursor-grab active:cursor-grabbing"
      style={{ width: size, height: size, touchAction: "none" }}
    />
  );
}
