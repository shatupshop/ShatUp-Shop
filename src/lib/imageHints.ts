// Friendly, non-blocking checks shown in the admin when a picture is chosen.
export interface SizeSpec {
  w: number;
  h: number;
  label: string; // e.g. "main banner"
}

export const SIZES = {
  hero: { w: 1600, h: 600, label: "main banner" },
  promo: { w: 1200, h: 375, label: "promo strip" },
  collection: { w: 800, h: 800, label: "collection card" },
  product: { w: 1000, h: 1000, label: "product photo" }
} satisfies Record<string, SizeSpec>;

export async function imageSizeWarning(file: File, spec: SizeSpec): Promise<string> {
  try {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return "";
    const bmp = await createImageBitmap(file);
    const { width, height } = bmp;
    bmp.close?.();
    const msgs: string[] = [];
    const ratio = width / height;
    const want = spec.w / spec.h;
    if (Math.abs(ratio - want) / want > 0.25) {
      msgs.push(
        `This picture is ${width}×${height}px, but the ${spec.label} works best at ${spec.w}×${spec.h}px — some parts will be cropped.`
      );
    }
    if (width < spec.w * 0.6) {
      msgs.push(`It is quite small and may look blurry — aim for about ${spec.w}px wide.`);
    }
    return msgs.join(" ");
  } catch {
    return "";
  }
}
