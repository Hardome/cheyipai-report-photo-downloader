import { createWriteStream, type WriteStream } from "node:fs";
import { once } from "node:events";
import { access, link, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { describeError } from "./errors.js";
import type { Fetcher } from "./types.js";

export async function fileExists(filename: string): Promise<boolean> {
  try { await access(filename); return true; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

class PhotoHttpError extends Error {
  constructor(readonly status: number) {
    super(`Сервер вернул HTTP ${status}`);
  }
}

const requestPhoto: Fetcher = url => fetch(url, { signal: AbortSignal.timeout(30_000) });

export async function downloadPhoto(url: string, destination: string, overwrite = false, request: Fetcher = requestPhoto): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const temporary = `${destination}.${randomUUID()}.part`;
    let receiving = true;
    let writer: WriteStream | undefined;

    try {
      const response = await request(url);

      if (!response.ok) {
        await response.body?.cancel();
        throw new PhotoHttpError(response.status);
      }
      if (!response.body) throw new Error("Сервер не передал содержимое фотографии");

      writer = createWriteStream(temporary, { flags: "wx" });
      await once(writer, "open");
      await pipeline(response.body, writer);
      receiving = false;

      if (overwrite) await rename(temporary, destination);
      else await link(temporary, destination);

      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      const permanentHttp = error instanceof PhotoHttpError && error.status !== 429 && error.status < 500;
      const localFailure = ["EEXIST", "EACCES", "EPERM", "ENOSPC", "ENOENT"].includes(code ?? "");

      if (!receiving || permanentHttp || localFailure) throw error;
      if (attempt === 2) throw new Error(`Не удалось загрузить фотографию после 3 попыток: ${describeError(error)}`, { cause: error });
    } finally {
      if (writer && !writer.closed) {
        const closed = new Promise<void>(resolve => writer!.once("close", resolve));
        writer.destroy();
        await closed;
      }
      await rm(temporary, { force: true });
    }

    await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
  }
}
