import { translate } from "@vitalets/google-translate-api";
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from "fs";
import { pipeline } from "stream/promises";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const API_BASE =
  "https://npi.cheyipai.com/detect/report/reportConfigurableApi/getReport";

const TABS: Array<{ folderName: string; key: keyof ReportData }> = [
  { folderName: "Exterior Photos", key: "photoList" },
  { folderName: "Paint Photos", key: "paintPhotoList" },
  { folderName: "Annotated Photos", key: "markPhotoList" },
  { folderName: "Defect Photos", key: "defectPhotoList" },
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT_PATH = path.join(__dirname, "dictionary.json");
const DICT: Record<string, string> = JSON.parse(readFileSync(DICT_PATH, "utf-8"));

function saveDictEntry(chinese: string, russian: string): void {
  DICT[chinese] = russian;
  writeFileSync(DICT_PATH, JSON.stringify(DICT, null, 2), "utf-8");
}


interface Photo {
  photoName: string;
  bigPhotoUrl: string;
  photoPath: string;
  photoIdStr: string;
}

interface ReportData {
  photoList: Photo[];
  paintPhotoList: Photo[];
  markPhotoList: Photo[];
  defectPhotoList: Photo[];
}

function parseReportUrl(input: string): Record<string, string> {
  const url = input.includes("?") ? input : `https://x.com/?${input}`;
  const parsed = new URL(url);
  return Object.fromEntries(parsed.searchParams.entries());
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim() || "unnamed";
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateName(name: string): Promise<string> {
  if (DICT[name]) return DICT[name];
  // Fallback: Google Translate (may be rate-limited on heavy use)
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { text } = await translate(name, { from: "zh-CN", to: "ru" });
      const result = sanitizeFilename(text);
      saveDictEntry(name, result);
      return result;
    } catch {
      await sleep(800 * (attempt + 1));
    }
  }
  return sanitizeFilename(name);
}

async function translateBatch(names: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(names)];
  const result = new Map<string, string>();
  const unknown: string[] = [];

  for (const name of unique) {
    if (DICT[name]) {
      result.set(name, DICT[name]);
    } else {
      unknown.push(name);
    }
  }

  if (unknown.length > 0) {
    console.log(`  (${unknown.length} unknown terms — translating via Google Translate and saving to dictionary.json)`);
    for (let i = 0; i < unknown.length; i++) {
      const name = unknown[i];
      result.set(name, await translateName(name));
      if (i < unknown.length - 1) await sleep(200);
    }
  }

  return result;
}

async function downloadPhoto(url: string, dest: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!response.body) throw new Error("No response body");
  const writer = createWriteStream(dest);
  // @ts-expect-error Node 22 fetch body is compatible with pipeline
  await pipeline(response.body, writer);
}

function buildFilenames(
  photos: Photo[],
  translations: Map<string, string>
): string[] {
  const translatedNames = photos.map(
    (p) => translations.get(p.photoName) ?? sanitizeFilename(p.photoName)
  );
  const counts = new Map<string, number>();
  for (const name of translatedNames)
    counts.set(name, (counts.get(name) ?? 0) + 1);

  const indices = new Map<string, number>();
  return translatedNames.map((name) => {
    if ((counts.get(name) ?? 1) > 1) {
      const idx = (indices.get(name) ?? 0) + 1;
      indices.set(name, idx);
      return `${name} ${idx}.jpg`;
    }
    return `${name}.jpg`;
  });
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log("==============================================");
  console.log(" Cheyipai Report Photo Downloader");
  console.log("==============================================");
  console.log();

  let input = process.argv[2];

  if (!input) {
    console.log("Вставьте ссылку на отчёт с сайта report.cheyipai.com и нажмите Enter.");
    console.log("Paste the report URL from report.cheyipai.com and press Enter.\n");
    input = await prompt("URL: ");
  }

  if (!input) {
    console.error("No URL provided. Exiting.");
    process.exit(1);
  }

  let params: Record<string, string>;
  try {
    params = parseReportUrl(input);
  } catch {
    console.error("Could not parse the URL. Please paste the full URL.");
    process.exit(1);
  }

  const { reportCode, templateCode, reportVersion } = params;

  if (!reportCode || !templateCode || !reportVersion) {
    console.error(
      "The URL is missing required parameters (reportCode, templateCode, reportVersion)."
    );
    process.exit(1);
  }

  console.log(`\nReport code: ${reportCode}`);
  console.log("Fetching report data...");

  const query = new URLSearchParams({ reportCode, templateCode, reportVersion, regenerate: "1" });
  const apiResponse = await fetch(`${API_BASE}?${query}`);
  if (!apiResponse.ok) throw new Error(`API error: HTTP ${apiResponse.status}`);
  const json = (await apiResponse.json()) as { success: boolean; data: ReportData };
  if (!json.success) throw new Error("API returned success=false");
  const data = json.data;

  const allNames: string[] = [];
  for (const { key } of TABS)
    for (const photo of data[key] ?? []) allNames.push(photo.photoName);

  console.log(`Translating ${new Set(allNames).size} unique photo names to Russian...`);
  const translations = await translateBatch(allNames);

  const outputDir = path.join(process.cwd(), "photos");
  mkdirSync(outputDir, { recursive: true });

  let totalDownloaded = 0;
  let totalFailed = 0;

  for (const { folderName, key } of TABS) {
    const photos = data[key] ?? [];
    if (photos.length === 0) {
      console.log(`\n[${folderName}] No photos, skipping.`);
      continue;
    }

    const folderPath = path.join(outputDir, folderName);
    mkdirSync(folderPath, { recursive: true });

    const filenames = buildFilenames(photos, translations);
    console.log(`\n[${folderName}] ${photos.length} photos`);

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = filenames[i];
      const dest = path.join(folderPath, filename);
      const url = photo.bigPhotoUrl || photo.photoPath;

      process.stdout.write(`  ${String(i + 1).padStart(3)}/${photos.length}  ${filename} ... `);
      try {
        await downloadPhoto(url, dest);
        console.log("✓");
        totalDownloaded++;
      } catch (err) {
        console.log(`✗  ${(err as Error).message}`);
        totalFailed++;
      }
    }
  }

  console.log("\n==============================================");
  console.log(`Done! Downloaded ${totalDownloaded} photos${totalFailed ? `, ${totalFailed} failed` : ""}.`);
  console.log(`Saved to: ${outputDir}`);
  console.log("==============================================");
}

main().catch((err) => {
  console.error("\nFatal error:", err.message ?? err);
  process.exit(1);
});
