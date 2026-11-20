"use client";

import { useState } from "react";

// Fallback aspect ratios (width / height) used only for the very first
// paint, before each image finishes loading and reports its real size.
const ICON_ASPECT = 504 / 460;
const FULL_ASPECT = 867 / 689;

/**
 * Renders the official ShatUp mark. showWordmark=false uses the icon-only
 * crop (/public/logo-icon.png) for tight spots like the header on mobile or
 * the admin bar. showWordmark=true uses the full lockup
 * (/public/logo.png) — icon + "SHATUP" + the "Style meets you" tagline are
 * already baked into that image, so nothing else needs to be rendered next
 * to it. Falls back to a simple orange "S" badge if a file is ever missing.
 */
export default function Logo({
  size = 36,
  showWordmark = true
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [aspect, setAspect] = useState(showWordmark ? FULL_ASPECT : ICON_ASPECT);

  if (imgFailed) {
    return (
      <span
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-xl bg-emerald font-bold text-white shadow-premium"
      >
        S
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={showWordmark ? "/logo.png" : "/logo-icon.png"}
      alt="ShatUp — Style Meets You"
      onError={() => setImgFailed(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth && img.naturalHeight) {
          setAspect(img.naturalWidth / img.naturalHeight);
        }
      }}
      className="object-contain"
      style={{ height: size, width: size * aspect }}
    />
  );
}
