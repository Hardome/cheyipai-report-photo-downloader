import type { Photo } from "./types.js";

export function sanitizeFilename(name: string): string {
  const sanitized = name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[. ]+$/g, "")
      .slice(0, 120);

  if (!sanitized) return "unnamed";

  return /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(sanitized)
    ? `_${sanitized}`
    : sanitized;
}

export function buildFilenames(
  photos: Photo[],
  translations: Map<string, string>,
): string[] {
  const names = photos.map((photo) =>
    sanitizeFilename(translations.get(photo.photoName) ?? photo.photoName),
  );

  const counts = new Map<string, number>();

  for (const name of names)
    counts.set(name.toLowerCase(), (counts.get(name.toLowerCase()) ?? 0) + 1);

  const used = new Set<string>();

  return names.map((name) => {
    let suffix = 1;
    let candidate =
      (counts.get(name.toLowerCase()) ?? 0) > 1 ? name + " " + suffix++ : name;

    while (used.has(candidate.toLowerCase())) candidate = name + " " + suffix++;

    used.add(candidate.toLowerCase());

    return candidate + ".jpg";
  });
}
