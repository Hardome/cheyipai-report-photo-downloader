import path from "node:path";
import { mkdir } from "node:fs/promises";
import { CATEGORIES } from "./categories.js";
import { buildFilenames, sanitizeFilename } from "./filenames.js";
import { fetchReport, getReportParameters } from "./report.js";
import { loadTranslationCache } from "./translation-cache.js";
import { translateNames } from "./translation.js";
import type { TranslationDependencies } from "./translation.js";
import { downloadPhoto, fileExists } from "./photos.js";
import { describeError } from "./errors.js";
import type { DownloadOptions, DownloadSummary, Fetcher } from "./types.js";

export interface DownloadDependencies extends TranslationDependencies {
  request?: Fetcher;
  log?: (message: string) => void;
  cachePath?: string;
}

export async function downloadReport(input: string, options: DownloadOptions = {}, dependencies: DownloadDependencies = {}): Promise<DownloadSummary> {
  const log = dependencies.log ?? (() => {});
  const parameters = getReportParameters(input);

  log("Получаем данные отчёта...");

  const report = await fetchReport(parameters, dependencies.request);
  const names = CATEGORIES.flatMap(({ key }) => report[key].map(photo => photo.photoName));
  log(`В отчёте ${names.length} фотографий.`);
  if (!options.noTranslate) log("Подготавливаем перевод названий...");
  const translations = options.noTranslate ? new Map<string, string>() : await translateNames(
    names, await loadTranslationCache(dependencies.cachePath, dependencies.warn), dependencies,
  );
  const outputDir = path.resolve(options.output ?? "photos", sanitizeFilename(parameters.reportCode));

  await mkdir(outputDir, { recursive: true });

  const summary: DownloadSummary = { downloaded: 0, skipped: 0, failed: 0, outputDir };

  for (const { folderName, label, key } of CATEGORIES) {
    const photos = report[key];

    if (photos.length === 0) { log(`[${label}] Фотографий нет, пропускаем.`); continue; }

    const directory = path.join(outputDir, folderName);

    await mkdir(directory, { recursive: true });

    const filenames = buildFilenames(photos, translations);
    log(`Категория: ${label}. Фотографий: ${photos.length}.`);

    for (const [index, photo] of photos.entries()) {
      const destination = path.join(directory, filenames[index]);

      try {
        if (!options.overwrite && await fileExists(destination)) {
          summary.skipped++;
          log(`Уже существует, пропускаем: ${filenames[index]}`);

          continue;
        }

        await downloadPhoto(photo.bigPhotoUrl || photo.photoPath, destination, options.overwrite, dependencies.request);

        summary.downloaded++;
        log(`Скачано: ${filenames[index]}`);
      } catch (error) {
        if (!options.overwrite && (error as NodeJS.ErrnoException).code === "EEXIST") summary.skipped++;
        else summary.failed++;

        log(`Не удалось скачать «${filenames[index]}»: ${describeError(error)}`);
      }
    }
  }
  return summary;
}
