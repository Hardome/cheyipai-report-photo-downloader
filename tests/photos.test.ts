import { afterEach, beforeEach, expect, test } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { downloadPhoto } from "../src/photos.js";

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "cheyipai-photo-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true, maxRetries: 5 });
});

test("a broken response stream leaves no partial file", async () => {
  let reads = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (reads++ === 0) {
        controller.enqueue(new TextEncoder().encode("partial image"));
      } else {
        controller.error(new Error("connection lost"));
      }
    },
  });

  await expect(downloadPhoto(
    "https://example.test/image.jpg",
    path.join(directory, "image.jpg"),
    false,
    async () => new Response(body),
  )).rejects.toThrow("connection lost");

  expect(await readdir(directory)).toEqual([]);
});

test("existing destination is preserved unless overwrite is explicit", async () => {
  const destination = path.join(directory, "image.jpg");
  const request = async () => new Response("new image");

  await writeFile(destination, "original image");

  await expect(downloadPhoto("https://example.test/image.jpg", destination, false, request))
    .rejects.toMatchObject({ code: "EEXIST" });

  expect(await readFile(destination, "utf8")).toBe("original image");
  expect(await readdir(directory)).toEqual(["image.jpg"]);

  await downloadPhoto("https://example.test/image.jpg", destination, true, request);

  expect(await readFile(destination, "utf8")).toBe("new image");
  expect(await readdir(directory)).toEqual(["image.jpg"]);
});
