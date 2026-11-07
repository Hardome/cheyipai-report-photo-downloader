import { createWriteStream } from "node:fs";
import { access, link, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { fetchWithRetry } from "./http.js";
import type { Fetcher } from "./types.js";

export async function fileExists(filename: string): Promise<boolean> {
  try { await access(filename); return true; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export async function downloadPhoto(url: string, destination: string, overwrite = false, request: Fetcher = fetchWithRetry): Promise<void> {
  const response = await request(url);

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) throw new Error("No response body");

  const temporary = `${destination}.${randomUUID()}.part`;

  try {
    await pipeline(response.body, createWriteStream(temporary, { flags: "wx" }));
    if (overwrite) await rename(temporary, destination);
    else await link(temporary, destination);
  } finally {
    await rm(temporary, { force: true });
  }
}
