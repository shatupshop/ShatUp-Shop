"use client";

import { useStore } from "@/context/StoreContext";
import { useBump } from "@/lib/useBump";

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export default function MobileBottomNav() {
  const { lang, cartCount, setCartOpen, isProfileComplete, setProfileOpen, setSignupOpen } =
    useStore();

  const bump = useBump(cartCount);

  const L = {
    home: lang === "bn" ? "হোম" : "Home",
    categories: lang === "bn" ? "ক্যাটাগরি" : "Categories",
    chat: lang === "bn" ? "মেসেজ" : "Message",
    cart: lang === "bn" ? "কার্ট" : "Cart",
    account: lang === "bn" ? "অ্যাকাউন্ট" : "Account"
  };

  const item = "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-gray-500 transition active:scale-90 dark:text-gray-400";

  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="glass mx-auto flex max-w-md items-center justify-between rounded-[28px] px-2 py-1.5 shadow-[0_18px_40px_-12px_rgba(23,18,14,0.45)] ring-1 ring-black/[0.06] dark:ring-white/10">
        <a href="#top" className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-emerald transition active:scale-90">
          <HomeIcon />
          <span className="text-[10px] font-bold">{L.home}</span>
        </a>

        <a href="#categories" className={item}>
          <GridIcon />
          <span className="text-[10px] font-semibold">{L.categories}</span>
        </a>

        {/* raised centre button = cart */}
        <button
          onClick={() => setCartOpen(true)}
          aria-label={L.cart}
          data-cart-target="dock"
          className="relative -mt-8 flex flex-col items-center"
        >
          <span className={`btn-brand flex h-14 w-14 items-center justify-center rounded-full text-white ring-4 ring-[#FBF8F4] dark:ring-gray-950 ${bump ? "hx-bump" : ""}`}>
            <span className="scale-110">
              <CartIcon />
            </span>
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#17120E] px-1 text-[10px] font-bold text-white ring-2 ring-[#FBF8F4] dark:bg-white dark:text-black dark:ring-gray-950">
                {cartCount}
              </span>
            )}
          </span>
          <span className="mt-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">{L.cart}</span>
        </button>

        <a
          href="https://wa.me/8801868561887"
          target="_blank"
          rel="noopener noreferrer"
          className={item}
        >
          <ChatIcon />
          <span className="text-[10px] font-semibold">{L.chat}</span>
        </a>

        <button
          onClick={() => (isProfileComplete ? setProfileOpen(true) : setSignupOpen(true))}
          className={item}
        >
          <UserIcon />
          <span className="text-[10px] font-semibold">{L.account}</span>
        </button>
      </div>
    </nav>
  );
}
