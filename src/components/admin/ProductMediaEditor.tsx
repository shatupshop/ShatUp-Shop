"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Play, Plus, Trash } from "@/components/icons";
import { imageSizeWarning, SIZES } from "@/lib/imageHints";
import { mediaKind, unsupportedHint } from "@/lib/media";

export interface MediaItem {
  key: string;
  url: string; // remote URL, or a blob: preview for a file not uploaded yet
  type: "image" | "video";
  file?: File; // present only for newly-picked files
}

export const MAX_IMAGES = 3;
export const MAX_VIDEOS = 3;
export const MAX_MEDIA = MAX_IMAGES + MAX_VIDEOS;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export default function ProductMediaEditor({
  items,
  onChange,
  onError
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  onError: (msg: string) => void;
}) {
  const [note, setNote] = useState("");

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow picking the same file again
    const next = [...items];
    let videos = next.filter((m) => m.type === "video").length;
    let images = next.filter((m) => m.type === "image").length;
    let msg = ""; // last problem to show (kept until the end so it is not wiped)
    for (const f of files) {
      const kind = mediaKind(f);
      const isVideo = kind === "video";
      const isImage = kind === "image";
      if (!isVideo && !isImage) {
        msg = unsupportedHint(f);
        continue;
      }
      if (isVideo) {
        if (videos >= MAX_VIDEOS) {
          msg = `Maximum ${MAX_VIDEOS} videos per product.`;
          continue;
        }
        if (f.size > MAX_VIDEO_BYTES) {
          msg = `"${f.name}" is over 20MB. Compress it first (aim for under ~8MB) so the page stays fast on mobile data.`;
          continue;
        }
        videos++;
      } else {
        if (images >= MAX_IMAGES) {
          msg = `Maximum ${MAX_IMAGES} photos per product.`;
          continue;
        }
        if (f.size > MAX_IMAGE_BYTES) {
          msg = `"${f.name}" is over 10MB.`;
          continue;
        }
        images++;
      }
      next.push({
        key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(f),
        type: isVideo ? "video" : "image",
        file: f
      });
    }
    onError(msg);
    onChange(next);
    // gentle, non-blocking size advice for the first new photo
    const firstImg = files.find((f) => mediaKind(f) === "image");
    if (firstImg) imageSizeWarning(firstImg, SIZES.product).then(setNote);
  }

  // swap one item's file for another of the same kind, keeping its position
  function replaceAt(i: number, e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const current = items[i];
    const kind = mediaKind(f);
    const isVideo = kind === "video";
    const isImage = kind === "image";
    if ((current.type === "video" && !isVideo) || (current.type === "image" && !isImage)) {
      onError(`Choose a ${current.type === "video" ? "MP4/WebM video" : "JPG, PNG, WebP or GIF image"} to replace this item.`);
      return;
    }
    if (f.size > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
      onError(`"${f.name}" is over ${isVideo ? 20 : 10}MB.`);
      return;
    }
    onError("");
    const next = [...items];
    next[i] = { key: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url: URL.createObjectURL(f), type: current.type, file: f };
    onChange(next);
  }

  // the cover is always the first photo, so "make cover" moves a photo to the front
  function makeCover(i: number) {
    const next = [...items];
    const [picked] = next.splice(i, 1);
    onChange([picked, ...next]);
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  const firstImage = items.findIndex((m) => m.type === "image");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
        <span>
          Photos {items.filter((m) => m.type === "image").length}/{MAX_IMAGES} · Videos {items.filter((m) => m.type === "video").length}/{MAX_VIDEOS}
        </span>
        <label className="flex cursor-pointer items-center gap-1 rounded-full border border-emerald px-3 py-1 text-emerald hover:bg-emerald hover:text-white">
          <Plus className="h-3.5 w-3.5" /> Add
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm"
            onChange={onFiles}
            className="hidden"
            data-testid="media-input"
          />
        </label>
      </div>
      <p className="text-[11px] text-gray-400">
        The first photo is the cover shown on the shop. Up to {MAX_IMAGES} photos and {MAX_VIDEOS} videos. Best size: {SIZES.product.w}×{SIZES.product.h}px (square).
        Videos: MP4/WebM, under ~8MB is best (20MB max).
      </p>
      {note && <p className="text-[11px] font-medium text-amber-600">Note: {note}</p>}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 py-5 text-center text-xs text-gray-400 dark:border-white/10">
          No photos yet. Add at least one photo so customers can see the product.
        </p>
      ) : (
        <div className="flex flex-col gap-2" data-testid="media-list">
          {items.map((m, i) => (
            <div key={m.key} className="flex items-center gap-2 rounded-xl border border-gray-200 p-2 dark:border-white/10">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/10">
                {m.type === "video" ? (
                  <video src={m.url} muted preload="metadata" className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt="" className="h-full w-full object-cover" />
                )}
                {m.type === "video" && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white"><Play className="h-3 w-3" filled /></span>
                )}
              </div>
              <div className="min-w-0 flex-1 text-[11px] text-gray-500">
                {m.type === "video" ? "Video" : "Photo"}
                {i === firstImage && <span className="ml-1 rounded-full bg-emerald/10 px-1.5 py-0.5 font-bold text-emerald">Cover</span>}
                {m.file && <span className="ml-1 text-amber-600">new</span>}
              </div>
              {m.type === "image" && i !== firstImage && (
                <button type="button" aria-label="make cover photo" onClick={() => makeCover(i)} className="rounded-full border border-gray-200 px-2 py-1 text-[11px] font-semibold dark:border-white/10">Cover</button>
              )}
              <label className="cursor-pointer rounded-full border border-gray-200 px-2 py-1 text-[11px] font-semibold dark:border-white/10">
                Replace
                <input type="file" className="hidden" accept={m.type === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"} onChange={(e) => replaceAt(i, e)} />
              </label>
              <button type="button" aria-label="move up" onClick={() => move(i, -1)} disabled={i === 0} className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button type="button" aria-label="move down" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="inline-flex items-center justify-center rounded-full border border-gray-200 px-2 py-1 disabled:opacity-30 dark:border-white/10"><ChevronDown className="h-3.5 w-3.5" /></button>
              <button
                type="button"
                aria-label="remove"
                onClick={() => onChange(items.filter((x) => x.key !== m.key))}
                className="rounded-full border border-red-300 px-2 py-1 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
