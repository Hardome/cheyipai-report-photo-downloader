import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { downloadReport } from "./download-report.js";

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
    return;
  }

  console.log("Cheyipai Report Photo Downloader");

  let input = positionals[0];

  if (!input) {
    console.log("Вставьте ссылку на отчёт с сайта report.cheyipai.com и нажмите Enter.");
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    try { input = (await terminal.question("URL: ")).trim(); }
    finally { terminal.close(); }
  }

  if (!input) throw new Error("No URL provided. Exiting.");

  const result = await downloadReport(input, {
    output: values.output, overwrite: values.overwrite, noTranslate: values["no-translate"],
  }, { log: console.log, warn: console.warn });

  console.log(`Done! Downloaded ${result.downloaded}, skipped ${result.skipped}, failed ${result.failed}.`);
  console.log(`Saved to: ${result.outputDir}`);

  if (result.failed > 0) process.exitCode = 1;
}
