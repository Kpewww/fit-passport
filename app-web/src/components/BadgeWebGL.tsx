"use client";

// TRUE 3D badge — a real cylinder "coin" lit as metal, for the inspect stage.
//
// Loaded lazily (only when someone opens inspect and switches to 3D), so the
// three.js bundle never touches first paint. The medallion SVG is rasterised to
// a texture for the faces, and the body uses a physical metal material with a
// procedural studio environment, so turning it produces real specular travel —
// closer to a game's weapon-inspect than any CSS approximation.

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PALETTE } from "@/components/BadgeMedallion";
import type { Metal } from "@/lib/badges";

/** Rasterise an SVG string into a THREE texture. */
async function svgTexture(svg: string, px: number): Promise<THREE.Texture> {
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
  faceSvg,
  size = 300,
}: {
  metal: Metal;
  /** The medallion rendered as an SVG string (used as the face texture). */
  faceSvg: string;
  size?: number;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // Drag state lives in a ref so the render loop reads it without re-rendering.
  const drag = useRef({ down: false, x: 0, y: 0, rx: -0.12, ry: 0.3, vy: 0.004 });

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    const p = PALETTE[metal];
    const coin = new THREE.Group();

    // A small studio environment gives the metal something to reflect.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#15171c");
    const keyGeo = new THREE.PlaneGeometry(12, 12);
    const key = new THREE.Mesh(keyGeo, new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    key.position.set(4, 6, 4);
    key.lookAt(0, 0, 0);
    envScene.add(key);
    const fill = new THREE.Mesh(keyGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(p.glow).multiplyScalar(0.5) }));
    fill.position.set(-6, -3, 3);
    fill.lookAt(0, 0, 0);
    envScene.add(fill);
    const env = pmrem.fromScene(envScene, 0.05).texture;
    scene.environment = env;

    // Rim (the coin's edge) — brushed metal.
    const rimMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(p.dark),
      metalness: 1,
      roughness: 0.38,
      envMapIntensity: 1.1,
    });
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.28, 96, 1, true), rimMat);
    rim.rotation.x = Math.PI / 2;
    coin.add(rim);

    // Faces — textured with the medallion art, still metallic underneath.
    const faceMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.75,
      roughness: 0.3,
      envMapIntensity: 1.0,
      transparent: true,
    });
    const backMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(p.mid),
      metalness: 1,
      roughness: 0.34,
      envMapIntensity: 1.0,
    });
    const faceGeo = new THREE.CircleGeometry(2, 96);
    const front = new THREE.Mesh(faceGeo, faceMat);
    front.position.z = 0.141;
    const back = new THREE.Mesh(faceGeo, backMat);
    back.position.z = -0.141;
    back.rotation.y = Math.PI;
    coin.add(front, back);
    scene.add(coin);

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
    svgTexture(faceSvg, 1024)
      .then((t) => {
        if (disposed) { t.dispose(); return; }
        tex = t;
        faceMat.map = t;
        faceMat.needsUpdate = true;
      })
      .catch(() => {/* keep the untextured metal coin */});

    let raf = 0;
    const loop = () => {
      if (!drag.current.down) drag.current.ry += drag.current.vy; // idle drift
      coin.rotation.x = drag.current.rx;
      coin.rotation.y = drag.current.ry;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.domElement.remove();
      renderer.dispose();
      pmrem.dispose();
      env.dispose();
      keyGeo.dispose();
      faceGeo.dispose();
      rim.geometry.dispose();
      rimMat.dispose();
      faceMat.dispose();
      backMat.dispose();
      tex?.dispose();
    };
  }, [metal, faceSvg, size]);

  function onDown(e: React.PointerEvent) {
    drag.current.down = true;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current.down) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current.x = e.clientX;
    drag.current.y = e.clientY;
    drag.current.ry += dx * 0.008;
    drag.current.rx = Math.max(-1.2, Math.min(1.2, drag.current.rx + dy * 0.008));
  }
  function onUp(e: React.PointerEvent) {
    drag.current.down = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  if (failed) {
    return (
      <p className="flex h-40 items-center justify-center text-xs text-white/50">
        3D unavailable on this device — showing the flat view instead.
      </p>
    );
  }

  return (
    <div
      ref={mount}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="cursor-grab active:cursor-grabbing"
      style={{ width: size, height: size, touchAction: "none" }}
    />
  );
}
