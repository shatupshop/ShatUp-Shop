"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { CoderMark } from "./icons";

// Sequence: the bag+S icon slides in from off-screen left with a speed
// trail behind it — like it just crossed the screen — and settles with a
// soft bounce. The wordmark is real text now (not baked into the logo
// image), so each letter can wave into place, then the whole mark gets a
// soft glow. Credit fades in last. Every beat fires off a fixed
// animation-delay, so nothing depends on setInterval or per-frame state —
// it can't stutter regardless of device.
const SLIDE_MS = 950;
const WORD_START = 700; // wordmark starts waving in as the bag is still settling
const LETTER_STAGGER = 45;
const LETTER_DUR = 480;
const SHATUP = ["S", "H", "A", "T", "U", "P"];
const SHATUP_END = WORD_START + (SHATUP.length - 1) * LETTER_STAGGER + LETTER_DUR; // ~1405ms

const TAGLINE_START = SHATUP_END + 120; // ~1525ms
const TAGLINE_STAGGER = 130;
const TAGLINE_DUR = 420;
const TAGLINE_WORDS = ["STYLE", "MEETS", "YOU"];
const TAGLINE_END =
  TAGLINE_START + (TAGLINE_WORDS.length - 1) * TAGLINE_STAGGER + TAGLINE_DUR; // ~2205ms

const ICON_SHINE_START = SLIDE_MS + 150; // ~1100ms
const CREDIT_DELAY_MS = TAGLINE_END + 150; // ~2355ms
const EXIT_START = CREDIT_DELAY_MS + 900; // ~3255ms — keeps total well past 3s
const EXIT_MS = 480;
const UNMOUNT_AT = EXIT_START + EXIT_MS; // ~3735ms

const TRAILS = [
  { top: "42%", width: 34, delay: 0 },
  { top: "58%", width: 46, delay: 60 },
  { top: "72%", width: 26, delay: 120 }
];

const FOG = [
  { left: "4%", size: 5, duration: 3.2, delay: 0, drift: -10 },
  { left: "16%", size: 7, duration: 3.8, delay: 0.5, drift: 8 },
  { left: "30%", size: 4, duration: 2.8, delay: 1.1, drift: -6 },
  { left: "46%", size: 6, duration: 3.5, delay: 0.2, drift: 5 },
  { left: "60%", size: 5, duration: 3.0, delay: 0.8, drift: -8 },
  { left: "74%", size: 7, duration: 3.7, delay: 1.4, drift: 10 },
  { left: "88%", size: 4, duration: 2.9, delay: 0.35, drift: -5 },
  { left: "96%", size: 5, duration: 3.3, delay: 1.0, drift: 6 }
];

export default function SplashScreen() {
  const [mounted, setMounted] = useState(true);
  const [exiting, setExiting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReducedMotion(prefersReduced);

    if (prefersReduced) {
      const t = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(t);
    }

    const exitTimer = setTimeout(() => setExiting(true), EXIT_START);
    const unmountTimer = setTimeout(() => setMounted(false), UNMOUNT_AT);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  // calm, static fallback for people who've asked their device for less
  // motion — no sliding, no waving, just the mark and the credit, briefly
  if (reducedMotion) {
    return (
      <>
        <noscript>
          <style>{`.shatup-splash { display: none !important; }`}</style>
        </noscript>
        <div className="shatup-splash fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 splash-bg">
          <img src="/logo.png" alt="ShatUp — Style Meets You" className="w-[min(72vw,320px)] object-contain" />
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-semibold tracking-wide text-black/60">
              Designed &amp; Developed by
            </span>
            <span className="text-lg font-extrabold text-black/85">Rimon</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* if JavaScript is off, the timers below never run — this forces the
          overlay away so the homepage underneath is never blocked */}
      <noscript>
        <style>{`.shatup-splash { display: none !important; }`}</style>
      </noscript>

      <div
        className={`shatup-splash fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 overflow-hidden splash-bg transition-all duration-500 ease-out ${
          exiting ? "pointer-events-none opacity-0 scale-105" : "opacity-100 scale-100"
        }`}
      >
        {/* the bag+S icon — crosses in from the left with a speed trail,
            bounces once, and settles in place */}
        <div className="icon-wrap">
          {TRAILS.map((tr, i) => (
            <span
              key={i}
              className="speed-trail"
              style={{ top: tr.top, width: `${tr.width}px`, animationDelay: `${tr.delay}ms` }}
              aria-hidden="true"
            />
          ))}
          <img src="/logo-icon.png" alt="" className="icon-mark" />
          <div className="icon-shine" style={{ animationDelay: `${ICON_SHINE_START}ms` }} aria-hidden="true" />
        </div>

        {/* real, live wordmark — each letter waves in once, then the whole
            mark gets a soft illuminated glow */}
        <div className="flex flex-col items-center gap-1.5">
          <h1
            className="word-glow flex text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
            style={{ animationDelay: `${SHATUP_END}ms` }}
          >
            {SHATUP.map((ch, i) => (
              <span
                key={i}
                className="word-letter"
                style={{ animationDelay: `${WORD_START + i * LETTER_STAGGER}ms` }}
              >
                {ch}
              </span>
            ))}
          </h1>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.35em] text-white/85 sm:text-sm">
            {TAGLINE_WORDS.map((w, i) => (
              <span
                key={i}
                className="tagline-word"
                style={{ animationDelay: `${TAGLINE_START + i * TAGLINE_STAGGER}ms` }}
              >
                {w}
              </span>
            ))}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setExiting(true);
            setTimeout(() => setMounted(false), EXIT_MS);
          }}
          className="splash-skip rounded-full border border-black/15 bg-white/25 px-4 py-1.5 text-xs font-semibold text-black/80 backdrop-blur-sm hover:bg-white/40"
          style={{ animationDelay: "300ms" }}
        >
          Skip ›
        </button>

        {/* credit — "Loading Innovation" as a light overline, the real
            credit line bold underneath, with fog rising behind it */}
        <div
          className="absolute bottom-[9%] left-0 right-0 flex flex-col items-center gap-1 opacity-0"
          style={{ animation: "stageIn 500ms ease-out both", animationDelay: `${CREDIT_DELAY_MS}ms` }}
        >
          <span className="text-[11px] font-semibold tracking-wide text-black/55">
            Loading Innovation
          </span>
          <div className="relative flex flex-col items-center gap-0.5">
            <div className="fog-field" aria-hidden="true">
              {FOG.map((f, i) => (
                <span
                  key={i}
                  className="fog-mote"
                  style={
                    {
                      left: f.left,
                      width: `${f.size}px`,
                      height: `${f.size}px`,
                      animationDuration: `${f.duration}s`,
                      animationDelay: `${CREDIT_DELAY_MS / 1000 + f.delay}s`,
                      "--fog-drift": `${f.drift}px`
                    } as CSSProperties
                  }
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <CoderMark className="h-4 w-4 text-black/65" />
              <span className="credit-highlight text-sm font-extrabold tracking-tight text-black/85">
                Designed &amp; Developed by Rimon
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
