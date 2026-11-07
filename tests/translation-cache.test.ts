import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { loadTranslationCache } from "../src/translation-cache.js";

let directory: string;
beforeEach(async () => { directory = await mkdtemp(path.join(os.tmpdir(), "translation-cache-")); });
afterEach(async () => { await rm(directory, { recursive: true, force: true, maxRetries: 5 }); });

test("corrupt cache warns and falls back to the bundled dictionary", async () => {
  const filename = path.join(directory, "cache.json");

  await writeFile(filename, "invalid json");

  const warn = vi.fn();
  const cache = await loadTranslationCache(filename, warn);

  expect(cache.entries.size).toBeGreaterThan(0);
  expect(warn).toHaveBeenCalledOnce();
});

test("saved entries reload without sharing mutable state between runs", async () => {
  const filename = path.join(directory, "cache.json");
  const first = await loadTranslationCache(filename);
  const second = await loadTranslationCache(filename);

  first.entries.set("test-only-entry", "Перевод");

  expect(second.entries.has("test-only-entry")).toBe(false);

  await first.save();

  expect(JSON.parse(await readFile(filename, "utf8"))["test-only-entry"]).toBe("Перевод");
  expect((await loadTranslationCache(filename)).entries.get("test-only-entry")).toBe("Перевод");
  expect(await readdir(directory)).toEqual(["cache.json"]);
});
