import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseReportUrl,
  sanitizeFilename,
  buildFilenames,
} from "../download.js";

test("URL parameters and invalid URLs", () => {
  assert.equal(
    parseReportUrl("https://report.cheyipai.com/?reportCode=abc").reportCode,
    "abc",
  );
  assert.throws(() => parseReportUrl("not a url?bad"));
});

test("names are safe and duplicate names numbered", () => {
  assert.equal(sanitizeFilename("../a:b"), ".. a b");
  const p = { photoName: "?", bigPhotoUrl: "", photoPath: "", photoIdStr: "" };
  assert.deepEqual(buildFilenames([p, p], new Map([["?", "Car"]])), [
    "Car 1.jpg",
    "Car 2.jpg",
  ]);
});
