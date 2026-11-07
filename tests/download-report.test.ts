import { afterEach, beforeEach, expect, test } from "vitest";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { downloadReport } from "../src/download-report.js";

let directory: string;
const reportUrl = "https://report.cheyipai.com/?reportCode=sample&templateCode=template&reportVersion=1";

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "cheyipai-report-"));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true, maxRetries: 5 });
});

test("a report can partially fail, then skip successful files on the next run", async () => {
  const request = async (url: string): Promise<Response> => {
    if (url.startsWith("https://npi.cheyipai.com/")) {
      return Response.json({
        success: true,
        data: {
          photoList: [
            { photoName: "Exterior", photoPath: "https://example.test/good.jpg" },
            { photoName: "Defect", photoPath: "https://example.test/bad.jpg" },
          ],
        },
      });
    }

    return url.endsWith("good.jpg")
      ? new Response("image bytes")
      : new Response("unavailable", { status: 404 });
  };

  const options = { output: directory, noTranslate: true };
  const first = await downloadReport(reportUrl, options, { request });

  expect(first).toMatchObject({ downloaded: 1, skipped: 0, failed: 1 });
  expect(await readFile(path.join(first.outputDir, "Exterior Photos", "Exterior.jpg"), "utf8"))
    .toBe("image bytes");

  const second = await downloadReport(reportUrl, options, { request });

  expect(second).toMatchObject({ downloaded: 0, skipped: 1, failed: 1 });
  expect(await readdir(path.join(first.outputDir, "Exterior Photos"))).toEqual(["Exterior.jpg"]);
  expect(await readdir(directory)).toEqual(["sample"]);
});

test("an empty report succeeds without accessing translation services", async () => {
  const result = await downloadReport(reportUrl, { output: directory, noTranslate: true }, {
    request: async () => Response.json({ success: true, data: {} }),
  });

  expect(result).toMatchObject({ downloaded: 0, skipped: 0, failed: 0 });
  expect(await readdir(result.outputDir)).toEqual([]);
});
