import { test } from "vitest";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { fetchWithRetry } from "../network.js";

test("transient HTTP errors are retried, permanent errors are returned", async () => {
  let attempts = 0;
  const server = createServer((request, response) => {
    if (request.url === "/missing") {
      response.writeHead(404).end();
      return;
    }

    attempts++;
    response.writeHead(attempts === 1 ? 503 : 200).end("photo");
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();

  assert.ok(address && typeof address === "object");

  const base = `http://127.0.0.1:${address.port}`;

  try {
    const response = await fetchWithRetry(base);
    assert.equal(await response.text(), "photo");
    assert.equal(attempts, 2);
    const missing = await fetchWithRetry(`${base}/missing`);
    assert.equal(missing.status, 404);
    await missing.body?.cancel();
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});
