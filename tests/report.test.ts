import { expect, test } from "vitest";
import { getReportParameters, parseReportResponse } from "../src/report.js";

test("missing categories become empty arrays", () => {
  expect(parseReportResponse({ success: true, data: {} })).toEqual({
    photoList: [], paintPhotoList: [], markPhotoList: [], defectPhotoList: [],
  });
});

test.each([null, { success: false }, { success: true, data: [] },
  { success: true, data: { photoList: [{ photoName: "x", photoPath: "file:///secret" }] } },
])("malformed reports are rejected: %j", value => {
  expect(() => parseReportResponse(value)).toThrow();
});

test("all report identifiers are required", () => {
  expect(() => getReportParameters("https://report.cheyipai.com/?reportCode=x")).toThrow("missing required parameters");
});
