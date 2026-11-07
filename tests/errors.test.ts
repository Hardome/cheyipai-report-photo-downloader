import { expect, test } from "vitest";
import { describeError } from "../src/errors.js";

test("network errors expose a useful Russian cause", () => {
  expect(describeError(new TypeError("fetch failed", { cause: { code: "ECONNRESET" } })))
    .toBe("Сервер разорвал соединение");
  expect(describeError(new TypeError("fetch failed", { cause: { errors: [{ code: "ETIMEDOUT" }] } })))
    .toContain("время ожидания");
  expect(describeError(new TypeError("fetch failed"))).toBe("Не удалось подключиться к серверу");
});
