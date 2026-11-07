import { readFile, writeFile, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

export interface TranslationCache {
  entries: Map<string, string>;
  save(): Promise<void>;
}

function parseDictionary(text: string): Map<string, string> {
  const value: unknown = JSON.parse(text);

  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid translation dictionary");

  return new Map(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

export async function loadTranslationCache(
  cachePath = path.join(process.cwd(), ".translation-cache.json"),
  warn: (message: string) => void = () => {},
): Promise<TranslationCache> {
  const entries = parseDictionary(await readFile(new URL("../data/dictionary.json", import.meta.url), "utf8"));

  try {
    for (const [key, value] of parseDictionary(await readFile(cachePath, "utf8"))) entries.set(key, value);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") warn("Translation cache could not be loaded");
  }

  return {
    entries,
    async save() {
      const temporary = `${cachePath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(Object.fromEntries(entries), null, 2), { encoding: "utf8", flag: "wx" });
        await rename(temporary, cachePath);
      } finally {
        await rm(temporary, { force: true });
      }
    },
  };
}
