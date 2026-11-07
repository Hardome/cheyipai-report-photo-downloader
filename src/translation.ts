import { translate } from "@vitalets/google-translate-api";
import { sanitizeFilename } from "./filenames.js";
import type { TranslationCache } from "./translation-cache.js";

export interface TranslationDependencies {
  translateName?: (name: string) => Promise<string>;
  wait?: (milliseconds: number) => Promise<void>;
  warn?: (message: string) => void;
}

export async function translateNames(names: string[], cache: TranslationCache, dependencies: TranslationDependencies = {}): Promise<Map<string, string>> {
  const translator = dependencies.translateName ?? (async name => (await translate(name, { from: "zh-CN", to: "ru" })).text);
  const wait = dependencies.wait ?? (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));

  const warn = dependencies.warn ?? (() => {});
  const result = new Map<string, string>();
  const unique = [...new Set(names)];

  for (const name of unique) {
    const known = cache.entries.get(name);
    if (known) { result.set(name, known); continue; }

    let translated: string | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        translated = sanitizeFilename(await translator(name));
        break;
      } catch {
        if (attempt < 2) await wait(800 * (attempt + 1));
      }
    }

    if (translated === undefined) {
      warn(`Translation unavailable: ${name}`);

      result.set(name, sanitizeFilename(name));
    } else {
      cache.entries.set(name, translated);
      result.set(name, translated);

      try { await cache.save(); }
      catch { warn("Translation cache could not be saved"); }
    }
    if (name !== unique.at(-1)) await wait(200);
  }
  return result;
}
