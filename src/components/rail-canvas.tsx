"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The rail, in three dimensions.
 *
 * LOADED ON DEMAND AND NEVER ON THE SERVER. `state-rail.tsx` pulls this in
 * through `next/dynamic` with `ssr:false`, so three.js is its own chunk that a
 * shopper downloads only if this is the treatment she drew — it is not in the
 * bundle of a storefront that is working.
 *
 * The material is a 1px `LineBasicMaterial`, which is the house hairline, so
 * what is drawn in WebGL reads as the same drawing as the SVG everywhere else
 * rather than as a second illustration style.
 */
export default function RailCanvas({ onReady }: { onReady?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    const ink =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--ink")
        .trim() || "#14130f";

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // No WebGL context. The flat drawing underneath stays visible.
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    node.append(renderer.domElement);

    const scene = new THREE.Scene();
    /* Orthographic: a shop rail seen from the street has no perspective worth
       drawing, and a vanishing point would make four identical hangers four
       different sizes for no reason a shopper cares about. */
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    camera.position.set(0, 0.6, 10);

    const solid = new THREE.LineBasicMaterial({ color: new THREE.Color(ink) });
    const far = new THREE.LineBasicMaterial({
      color: new THREE.Color(ink),
      transparent: true,
      opacity: 0.34,
    });

    const V = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
    const line = (pts: THREE.Vector3[], mat: THREE.Material) =>
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);

    /* HOOK_R is the hook's radius and RAIL_Y its centre, so the rail runs
       through the hook rather than past it and each piece pivots about the
       point it actually hangs from. Everything else derives from these. */
    const HOOK_R = 0.1;
    const RAIL_Y = 0.89;
    const APEX_Y = 0.58;
    const BAR_HALF = 0.42;
    const BAR_Y = 0.26;

    const hookPoints = () => {
      const pts: THREE.Vector3[] = [];
      /* 310 degrees, opening to one side. A full sweep closes the curve and
         the hanger reads as a letter G. */
      for (let i = 0; i <= 30; i++) {
        const a = -Math.PI / 2 + (i / 30) * Math.PI * 1.72;
        pts.push(V(Math.cos(a) * HOOK_R, RAIL_Y + Math.sin(a) * HOOK_R));
      }
      return pts;
    };
    const stem = [V(0, RAIL_Y - HOOK_R), V(0, APEX_Y)];
    const bar = [
      V(0, APEX_Y),
      V(-BAR_HALF, BAR_Y),
      V(BAR_HALF, BAR_Y),
      V(0, APEX_Y),
    ];

    const RAIL_HALF = 1.94;
    scene.add(line([V(-RAIL_HALF, RAIL_Y), V(RAIL_HALF, RAIL_Y)], solid));

    const pivots = [
      { x: -1.425, z: -0.6, dim: true },
      { x: -0.475, z: 0, dim: false },
      { x: 0.475, z: -0.6, dim: true },
      { x: 1.425, z: 0, dim: false },
    ].map((h) => {
      const pivot = new THREE.Group();
      pivot.position.set(h.x, RAIL_Y, h.z);
      const mat = h.dim ? far : solid;
      const piece = new THREE.Group();
      piece.position.y = -RAIL_Y;
      piece.add(line(hookPoints(), mat), line(stem, mat), line(bar, mat));
      pivot.add(piece);
      scene.add(pivot);
      /* A pendulum, not a keyframe: an angle, an angular velocity, a restoring
         term proportional to displacement and a damping term proportional to
         speed. A push near one hanger moves that one and barely its neighbour,
         which no set of keyframes gives you. */
      return {
        pivot,
        a: 0,
        v: (Math.random() - 0.5) * 0.14,
        k: 5.2 + Math.random() * 1.6,
        c: 0.55,
      };
    });

    /* WIDTH FIRST. This is a wide, short rail; fitting it to the height of a
       landscape panel leaves the hangers a third of the width of the box with
       empty stone either side. The vertical derives from it and is then capped
       so a narrow phone does not zoom out to nothing — past the cap the rail's
       ends crop, which costs no information, it being a line. */
    const HALF_W = 2;
    const MAX_HALF_H = 1.15;
    const resize = () => {
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const aspect = r.width / r.height;
      let halfW = HALF_W;
      let halfH = halfW / aspect;
      if (halfH > MAX_HALF_H) {
        halfH = MAX_HALF_H;
        halfW = halfH * aspect;
      }
      camera.left = -halfW;
      camera.right = halfW;
      camera.top = halfH;
      camera.bottom = -halfH;
      camera.updateProjectionMatrix();
      renderer.setSize(r.width, r.height, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();

    /* The pointer pushes what it passes, falling off with distance, scaled by
       how fast it moved. A slow drag is a small swing. */
    let last: number | null = null;
    const onMove = (event: PointerEvent) => {
      const r = node.getBoundingClientRect();
      const x =
        camera.left +
        ((event.clientX - r.left) / r.width) * (camera.right - camera.left);
      if (last !== null) {
        const vx = x - last;
        for (const p of pivots) {
          const d = Math.abs(p.pivot.position.x - x);
          if (d < 0.7) p.v += vx * (1 - d / 0.7) * 2.6;
        }
      }
      last = x;
    };
    const onLeave = () => (last = null);
    node.addEventListener("pointermove", onMove);
    node.addEventListener("pointerleave", onLeave);

    let visible = true;
    const seen = new IntersectionObserver(
      ([entry]) => (visible = entry.isIntersecting),
    );
    seen.observe(node);

    let frame = 0;
    let clock = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible || document.hidden) {
        clock = now;
        return;
      }
      const dt = Math.min((now - clock) / 1000, 0.05);
      clock = now;
      for (const p of pivots) {
        p.v += (-p.k * p.a - p.c * p.v) * dt;
        p.a += p.v * dt;
        p.pivot.rotation.z = p.a;
      }
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(tick);
    onReady?.();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      seen.disconnect();
      node.removeEventListener("pointermove", onMove);
      node.removeEventListener("pointerleave", onLeave);
      scene.traverse((object) => {
        if (object instanceof THREE.Line) object.geometry.dispose();
      });
      solid.dispose();
      far.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={host} className="lq-rail3d__host" />;
}
