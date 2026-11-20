import { useEffect, useRef, useState } from "react";

// Returns true for a moment each time `value` goes UP (e.g. cart count after "Add to cart").
// Used only to trigger a CSS bounce — never touches cart data.
export function useBump(value: number, ms = 650) {
  const prev = useRef(value);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (value > prev.current) {
      setBump(true);
      const id = setTimeout(() => setBump(false), ms);
      prev.current = value;
      return () => clearTimeout(id);
    }
    prev.current = value;
  }, [value, ms]);
  return bump;
}
