"use client";

import Ico from "./Ico";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { X } from "./icons";
import { useDialog } from "@/lib/useDialog";

export default function SignupModal() {
  const { isSignupOpen, setSignupOpen, setProfile, profile, t, lang } = useStore();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);

  useDialog(isSignupOpen, () => setSignupOpen(false));

  if (!isSignupOpen) return null;

  function handleSave() {
    setProfile({ name, phone, address });
    setSignupOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadeSlide items-center justify-center bg-[#17120E]/60 p-4 backdrop-blur-md"
      onClick={() => setSignupOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("signup")}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm animate-fadeUp rounded-[32px] bg-white p-7 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] dark:bg-gray-900"
      >
        <button
          aria-label="close"
          onClick={() => setSignupOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-gray-500 transition hover:bg-black/10 dark:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4 text-center">
          <span className="btn-brand mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] text-2xl">
            <Ico name="user" className="h-7 w-7" />
          </span>
          <h2 className="mt-3 text-xl font-black tracking-tight">{t("signup")}</h2>
          <p className="mt-1 text-xs text-gray-500">
            {lang === "bn"
              ? "মাত্র একবার — হোয়াটসঅ্যাপ অর্ডারে আপনার তথ্য নিজে থেকেই বসে যাবে।"
              : "One quick step — used to fill your WhatsApp order automatically."}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            className="rounded-2xl border border-black/[0.08] bg-black/[0.03] px-4 py-3 text-sm outline-none transition focus:border-emerald/60 focus:bg-white focus:ring-4 focus:ring-emerald/15 dark:border-white/10 dark:bg-white/5"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("phone")}
            type="tel"
            className="rounded-2xl border border-black/[0.08] bg-black/[0.03] px-4 py-3 text-sm outline-none transition focus:border-emerald/60 focus:bg-white focus:ring-4 focus:ring-emerald/15 dark:border-white/10 dark:bg-white/5"
          />
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("address")}
            rows={2}
            className="rounded-2xl border border-black/[0.08] bg-black/[0.03] px-4 py-3 text-sm outline-none transition focus:border-emerald/60 focus:bg-white focus:ring-4 focus:ring-emerald/15 dark:border-white/10 dark:bg-white/5"
          />
          <button
            onClick={handleSave}
            disabled={!name || !phone || !address}
            className="btn-brand mt-1 h-12 rounded-full text-sm font-bold text-white disabled:cursor-not-allowed"
          >
            {t("save")}
          </button>
        </div>
      </div>
    </div>
  );
}
