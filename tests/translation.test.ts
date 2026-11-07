import { expect, test, vi } from "vitest";
import { translateNames } from "../src/translation.js";

test("cache write failure does not repeat translation", async () => {
  const translateName = vi.fn(async () => "Car");
  const save = vi.fn(async () => { throw new Error("disk full"); });
  const warn = vi.fn();
  const result = await translateNames(["new", "new"], { entries: new Map(), save }, {
    translateName, warn, wait: async () => {},
  });

  expect(result.get("new")).toBe("Car");
  expect(translateName).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith("Translation cache could not be saved");
});

test("unavailable translator falls back after three attempts", async () => {
  const translateName = vi.fn(async () => { throw new Error("unavailable"); });
  const save = vi.fn(async () => {});
  const result = await translateNames(["车"], { entries: new Map(), save }, { translateName, wait: async () => {} });

  expect(result.get("车")).toBe("车");
  expect(translateName).toHaveBeenCalledTimes(3);
  expect(save).not.toHaveBeenCalled();
});
