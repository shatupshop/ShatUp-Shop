"use client";

import { useEffect, useRef } from "react";

// Light smoke drifting up from whatever it is placed on top of.
// Pure canvas, ~20 soft particles; pauses when off-screen / tab hidden and
// stays still for people who prefer reduced motion.
type P = { x: number; y: number; age: number; life: number; vy: number; phase: number; amp: number; size: number; wind: number; peak: number };

export default function SmokeWisps({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // one soft white puff, drawn once and re-used for every particle
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const sctx = sprite.getContext("2d")!;
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(235,238,245,0.55)");
    g.addColorStop(1, "rgba(235,238,245,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    let w = 0;
    let h = 0;
    let dpr = 1;
    function resize() {
      const r = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas!.width = Math.max(1, Math.round(w * dpr));
      canvas!.height = Math.max(1, Math.round(h * dpr));
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const parts: P[] = [];
    let spawnAcc = 0;
    let last = performance.now();
    let raf = 0;
    let visible = false;

    // three little "sources" along the bottom edge (left, centre, right of the badge)
    const sources = [0.3, 0.5, 0.7];
    function spawn() {
      const sx = (sources[Math.floor(Math.random() * sources.length)] + (Math.random() - 0.5) * 0.06) * w;
      parts.push({
        x: sx,
        y: h - 2,
        age: 0,
        life: 4.2 + Math.random() * 2.8,
        vy: 22 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        amp: 6 + Math.random() * 9,
        size: 8 + Math.random() * 8,
        wind: (Math.random() - 0.35) * 7,
        peak: 0.18 + Math.random() * 0.12
      });
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      spawnAcc += dt * 9; // ~9 puffs per second
      while (spawnAcc >= 1) {
        spawn();
        spawnAcc -= 1;
      }

      ctx!.clearRect(0, 0, w, h);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.age += dt;
        const t = p.age / p.life;
        if (t >= 1) {
          parts.splice(i, 1);
          continue;
        }
        p.y -= p.vy * dt * (1 - t * 0.45); // slows as it thins out
        // lazy curl that widens as the smoke rises, plus a faint sideways drift
        const x = p.x + Math.sin(p.age * 1.7 + p.phase) * (p.amp * (0.4 + t * 1.6)) + p.wind * p.age;
        const size = p.size + t * 52;
        const alpha = Math.sin(Math.min(1, t * 1.15) * Math.PI) * p.peak;
        ctx!.globalAlpha = Math.max(0, alpha);
        ctx!.drawImage(sprite, x - size / 2, p.y - size / 2, size, size);
      }
      ctx!.globalAlpha = 1;
    }

    // only animate while on screen
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(canvas);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className={`pointer-events-none ${className}`} />;
}
