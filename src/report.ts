import { CATEGORIES } from "./categories.js";
import { fetchWithRetry } from "./http.js";
import type { Fetcher, Photo, ReportData, ReportParameters } from "./types.js";

export function parseReportUrl(input: string): Record<string, string> {
  const url = input.includes("?") ? input : `https://x.com/?${input}`;

  return Object.fromEntries(new URL(url).searchParams.entries());
}

export function getReportParameters(input: string): ReportParameters {
  const { reportCode, templateCode, reportVersion } = parseReportUrl(input);

  if (!reportCode || !templateCode || !reportVersion) {
    throw new Error("The URL is missing required parameters (reportCode, templateCode, reportVersion).");
  }

  return { reportCode, templateCode, reportVersion };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePhoto(value: unknown): Photo {
  if (!isRecord(value) || typeof value.photoName !== "string") throw new Error("Invalid photo name");

  const url = value.bigPhotoUrl || value.photoPath;

  if (typeof url !== "string" || !URL.canParse(url) || !["http:", "https:"].includes(new URL(url).protocol)) {
    throw new Error("Invalid photo URL");
  }

  return {
    photoName: value.photoName,
    bigPhotoUrl: typeof value.bigPhotoUrl === "string" ? value.bigPhotoUrl : "",
    photoPath: typeof value.photoPath === "string" ? value.photoPath : "",
    photoIdStr: typeof value.photoIdStr === "string" ? value.photoIdStr : "",
  };
}

export function parseReportResponse(value: unknown): ReportData {
  if (!isRecord(value) || value.success !== true || !isRecord(value.data)) throw new Error("Invalid report response");

  const report: ReportData = { photoList: [], paintPhotoList: [], markPhotoList: [], defectPhotoList: [] };

  for (const { key } of CATEGORIES) {
    const photos = value.data[key];
    if (photos === undefined) continue;
    if (!Array.isArray(photos)) throw new Error(`Invalid photo category: ${key}`);
    report[key] = photos.map(parsePhoto);
  }

  return report;
}

export async function fetchReport(parameters: ReportParameters, request: Fetcher = fetchWithRetry): Promise<ReportData> {
  const query = new URLSearchParams({ ...parameters, regenerate: "1" });
  const response = await request(`https://npi.cheyipai.com/detect/report/reportConfigurableApi/getReport?${query}`);

  if (!response.ok) throw new Error(`API error: HTTP ${response.status}`);

  return parseReportResponse(await response.json());
}
