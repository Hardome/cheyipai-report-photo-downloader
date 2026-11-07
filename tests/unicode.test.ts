import { test } from "vitest";
import assert from "node:assert/strict";
import { buildFilenames } from "../src/index.js";

test("translated names remain Unicode and cannot collide after numbering", () => {
  const photos = ["车", "车", "other"].map((photoName) => ({
    photoName,
    bigPhotoUrl: "",
    photoPath: "",
    photoIdStr: "",
  }));
  const names = buildFilenames(
    photos,
    new Map([
      ["车", "Авто"],
      ["other", "Авто 1"],
    ]),
  );

  assert.equal(names[0], "Авто 1.jpg");
  assert.equal(new Set(names).size, 3);
});
