"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Collection } from "@/lib/types";
import FadeUp from "./FadeUp";

export default function CollectionsGrid() {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    async function load() {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase
        .from("collections")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data) setCollections(data as Collection[]);
    }
    load();
  }, []);

  if (collections.length === 0) return null;

  return (
    <FadeUp>
      <section className="mx-auto max-w-7xl px-3 py-4 sm:px-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {collections.map((c) => (
            <a
              key={c.id}
              href={c.button_link || "#products"}
              className="card-lux group relative aspect-square overflow-hidden rounded-[22px] shadow-lux ring-1 ring-black/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image_url}
                alt={c.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute bottom-3 left-3 right-3 line-clamp-2 text-xs font-extrabold tracking-tight text-white drop-shadow sm:text-base">
                {c.title}
              </span>
            </a>
          ))}
        </div>
      </section>
    </FadeUp>
  );
}
