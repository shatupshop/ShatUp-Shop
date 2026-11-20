"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { LogOut, X } from "./icons";
import { useDialog } from "@/lib/useDialog";

export default function ProfileModal() {
  const { isProfileOpen, setProfileOpen, profile, setProfile, t } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);

  useDialog(isProfileOpen, () => setProfileOpen(false));

  if (!isProfileOpen) return null;

  function save() {
    setProfile({ name, phone, address });
    setEditing(false);
  }

  function logout() {
    setProfile({ name: "", phone: "", address: "" });
    setProfileOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fadeSlide items-center justify-center bg-[#17120E]/60 p-4 backdrop-blur-md"
      onClick={() => setProfileOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("profile")}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm animate-fadeUp rounded-[32px] bg-white p-7 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] dark:bg-gray-900"
      >
        <button
          aria-label="close"
          onClick={() => setProfileOpen(false)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.05] text-gray-500 transition hover:bg-black/10 dark:bg-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mb-4 text-center">
          <span className="btn-brand mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] text-2xl font-black text-white">
            {profile.name.charAt(0).toUpperCase() || "U"}
          </span>
          <h2 className="mt-3 text-xl font-black tracking-tight">{t("profile")}</h2>
        </div>

        {editing ? (
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
              onClick={save}
              className="btn-brand h-12 rounded-full text-sm font-bold text-white"
            >
              {t("save")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 text-sm">
            <div className="rounded-2xl bg-[#f6f6f7] p-3.5 dark:bg-white/5">
              <span className="text-xs text-gray-400">{t("name")}</span>
              <p className="font-medium">{profile.name}</p>
            </div>
            <div className="rounded-2xl bg-[#f6f6f7] p-3.5 dark:bg-white/5">
              <span className="text-xs text-gray-400">{t("phone")}</span>
              <p className="font-medium">{profile.phone}</p>
            </div>
            <div className="rounded-2xl bg-[#f6f6f7] p-3.5 dark:bg-white/5">
              <span className="text-xs text-gray-400">{t("address")}</span>
              <p className="font-medium">{profile.address}</p>
            </div>
            <button
              onClick={() => setEditing(true)}
              className="mt-2 h-12 rounded-full border-2 border-emerald/50 text-sm font-bold text-emerald transition hover:border-emerald hover:bg-emerald hover:text-white"
            >
              Edit
            </button>
            <button
              onClick={logout}
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-red-200 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
