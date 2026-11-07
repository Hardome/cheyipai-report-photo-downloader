/** Retry transient HTTP and transport failures; each attempt has its own timeout. */
export async function fetchWithRetry(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
      });
      const transient = response.status === 429 || response.status >= 500;

      if (!transient || attempt === 2) return response;
      await response.body?.cancel();
    } catch (error) {
      if (attempt === 2) throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
  }

  throw new Error("Request failed after three attempts");
}
