// Shared helpers for product photo / video uploads.
// Some phones and browsers hand over a File with an EMPTY mime type (or a wrong one),
// so we also look at the file extension before rejecting it.

export type MediaKind = "image" | "video" | null;

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_MIME = ["video/mp4", "video/webm"];

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm"
};

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm"
};

function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

/** The real mime type we will store (falls back to the extension when the browser gave none). */
export function resolveMime(file: File): string {
  if (IMAGE_MIME.includes(file.type) || VIDEO_MIME.includes(file.type)) return file.type;
  return EXT_TO_MIME[extOf(file.name)] || "";
}

export function mediaKind(file: File): MediaKind {
  const mime = resolveMime(file);
  if (IMAGE_MIME.includes(mime)) return "image";
  if (VIDEO_MIME.includes(mime)) return "video";
  return null;
}

/** Safe storage file extension derived from the resolved mime type. */
export function storageExt(file: File): string {
  return MIME_TO_EXT[resolveMime(file)] || "bin";
}

/** Hint for the most common failure: iPhone .mov / HEIC files. */
export function unsupportedHint(file: File): string {
  const ext = extOf(file.name);
  if (ext === "mov" || file.type === "video/quicktime") {
    return `"${file.name}" is a .mov video. Please export it as MP4 (iPhone: Settings → Camera → Formats → Most Compatible) and try again.`;
  }
  if (ext === "heic" || ext === "heif") {
    return `"${file.name}" is a HEIC photo. Please use a JPG or PNG (iPhone: Settings → Camera → Formats → Most Compatible).`;
  }
  return `"${file.name}" is not supported. Use a JPG, PNG, WebP or GIF photo, or an MP4/WebM video.`;
}
