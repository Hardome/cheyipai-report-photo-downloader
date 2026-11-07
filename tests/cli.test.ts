import { expect, test } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const cwd = fileURLToPath(new URL("..", import.meta.url));

test("the existing download command prints help", async () => {
  const { stdout } = await run(process.execPath, ["--import", "tsx", "download.ts", "--help"], { cwd });
  expect(stdout).toContain("--no-translate");
});

test("invalid report parameters return nonzero without fetching", async () => {
  await expect(run(process.execPath, ["--import", "tsx", "download.ts", "https://report.cheyipai.com/?reportCode=x"], { cwd }))
    .rejects.toMatchObject({ code: 1 });
});

test("importing the old entry point does not read a cache or start the CLI", async () => {
  const { stdout, stderr } = await run(process.execPath, ["--import", "tsx", "--input-type=module", "-e", "await import('./download.ts')"], { cwd });
  expect(stdout).toBe("");
  expect(stderr).toBe("");
});
