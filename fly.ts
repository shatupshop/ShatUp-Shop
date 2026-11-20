// "Fly to cart": a big copy of the product photo arcs into the cart button,
// the cart bumps, and a little "Added to cart" pill pops up above the dock.
// Purely visual — never touches the cart data.
export function flyToCart(
  from: Element | null | undefined,
  imageUrl?: string | null,
  toastText?: string | null,
  productName?: string | null
) {
  if (typeof document === "undefined" || !from) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const visible = (el: Element | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? (el as HTMLElement) : null;
  };
  // the phone dock cart (closest to the thumb) if it is showing, else the header cart
  const target =
    visible(document.querySelector('[data-cart-target="dock"]')) ||
    visible(document.querySelector('[data-cart-target="header"]'));
  if (!target) return;

  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 88;
  const sx = a.left + a.width / 2 - size / 2;
  const sy = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - size / 2 - sx;
  const dy = b.top + b.height / 2 - size / 2 - sy;

  const dot = document.createElement("div");
  Object.assign(dot.style, {
    position: "fixed",
    left: `${sx}px`,
    top: `${sy}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "9999px",
    zIndex: "9999",
    pointerEvents: "none",
    background: imageUrl ? `center/cover url("${imageUrl}")` : "linear-gradient(135deg,#ff8236,#ff5a0a)",
    border: "3px solid #fff",
    boxShadow: "0 18px 36px -8px rgba(255,90,10,0.6)"
  } as Partial<CSSStyleDeclaration>);
  document.body.appendChild(dot);

  const anim = dot.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      {
        transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(0.7) rotate(-8deg)`,
        opacity: 1,
        offset: 0.5
      },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18) rotate(0deg)`, opacity: 0.5 }
    ],
    { duration: 850, easing: "cubic-bezier(0.5, 0, 0.25, 1)" }
  );
  anim.onfinish = () => {
    dot.remove();
    target.animate(
      [{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(1)" }],
      { duration: 380, easing: "ease-out" }
    );
    showAddedToast(toastText, productName);
  };
}

function showAddedToast(toastText?: string | null, productName?: string | null) {
  if (!toastText && !productName) return;
  // one toast at a time — a fast double-tap restarts it instead of stacking
  document.querySelector('[data-added-toast="1"]')?.remove();

  const pill = document.createElement("div");
  pill.setAttribute("data-added-toast", "1");
  const label = [toastText, productName].filter(Boolean).join(" · ");
  Object.assign(pill.style, {
    position: "fixed",
    left: "50%",
    bottom: "104px",
    transform: "translateX(-50%)",
    zIndex: "9999",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "86vw",
    padding: "10px 16px",
    borderRadius: "9999px",
    background: "#111827",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    lineHeight: "1.2",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    boxShadow: "0 12px 28px -8px rgba(0,0,0,0.45)"
  } as Partial<CSSStyleDeclaration>);

  const check = document.createElement("span");
  Object.assign(check.style, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: "0",
    width: "20px",
    height: "20px",
    borderRadius: "9999px",
    background: "#10b981",
    color: "#fff"
  } as Partial<CSSStyleDeclaration>);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "3");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "m5 12.5 4.5 4.5L19 7.5");
  svg.appendChild(path);
  check.appendChild(svg);
  pill.appendChild(check);

  const text = document.createElement("span");
  Object.assign(text.style, {
    overflow: "hidden",
    textOverflow: "ellipsis"
  } as Partial<CSSStyleDeclaration>);
  text.textContent = label;
  pill.appendChild(text);

  document.body.appendChild(pill);
  const toastAnim = pill.animate(
    [
      { transform: "translateX(-50%) translateY(14px)", opacity: 0 },
      { transform: "translateX(-50%) translateY(0)", opacity: 1, offset: 0.12 },
      { transform: "translateX(-50%) translateY(0)", opacity: 1, offset: 0.8 },
      { transform: "translateX(-50%) translateY(8px)", opacity: 0 }
    ],
    { duration: 1900, easing: "ease-out" }
  );
  toastAnim.onfinish = () => pill.remove();
}
