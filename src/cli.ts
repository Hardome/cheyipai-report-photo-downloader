import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { downloadReport } from "./download-report.js";
import { describeError } from "./errors.js";

export async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      output: { type: "string" }, "no-translate": { type: "boolean" },
      overwrite: { type: "boolean" }, help: { type: "boolean" },
    },
  });

  if (values.help) {
    console.log("npm run download -- <URL> [--output ./photos] [--no-translate] [--overwrite]");
    console.log("  --output        Папка для сохранения фотографий");
    console.log("  --no-translate  Сохранить исходные названия без перевода");
    console.log("  --overwrite     Перезаписать существующие файлы");
    return;
  }

  console.log("Загрузчик фотографий Cheyipai");

  let input = positionals[0];

  if (!input) {
    console.log("Вставьте ссылку на отчёт с сайта report.cheyipai.com и нажмите Enter.");
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    try { input = (await terminal.question("Ссылка: ")).trim(); }
    finally { terminal.close(); }
  }

  if (!input) throw new Error("Ссылка на отчёт не указана.");

  const result = await downloadReport(input, {
    output: values.output, overwrite: values.overwrite, noTranslate: values["no-translate"],
  }, { log: console.log, warn: console.warn });

  console.log(`Готово! Скачано: ${result.downloaded}, пропущено: ${result.skipped}, ошибок: ${result.failed}.`);
  console.log(`Папка с фотографиями: ${result.outputDir}`);

  if (result.failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`Ошибка: ${describeError(error)}`);
  process.exitCode = 1;
});
