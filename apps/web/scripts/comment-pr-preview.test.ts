import { describe, expect, it, mock } from "bun:test";
import {
  COMMENT_MARKER,
  extractPreviewUrl,
  formatCommentBody,
  formatTeardownCommentBody,
  postOrUpdateComment,
  verifyUrlStatus,
} from "./comment-pr-preview.ts";

describe("comment-pr-preview", () => {
  describe("extractPreviewUrl", () => {
    it("extracts target URL from wrangler deploy ND-JSON output", () => {
      const output = JSON.stringify({
        type: "deploy",
        targets: [
          "https://storagemaxxing-web-pr-42.mkobit-cloudflare.workers.dev",
        ],
      });
      const url = extractPreviewUrl(output, 42);
      expect(url).toBe(
        "https://storagemaxxing-web-pr-42.mkobit-cloudflare.workers.dev",
      );
    });

    it("ensures https protocol prefix if target lacks scheme", () => {
      const output = JSON.stringify({
        type: "deploy",
        targets: ["storagemaxxing-web-pr-42.mkobit-cloudflare.workers.dev"],
      });
      const url = extractPreviewUrl(output, 42);
      expect(url).toBe(
        "https://storagemaxxing-web-pr-42.mkobit-cloudflare.workers.dev",
      );
    });

    it("falls back to regex match if output contains plain log text", () => {
      const output =
        "Deployed triggers\n  https://storagemaxxing-web-pr-99.mkobit-cloudflare.workers.dev\nDone!";
      const url = extractPreviewUrl(output, 99);
      expect(url).toBe(
        "https://storagemaxxing-web-pr-99.mkobit-cloudflare.workers.dev",
      );
    });

    it("falls back to default URL when output is empty", () => {
      const url = extractPreviewUrl("", 101);
      expect(url).toBe(
        "https://storagemaxxing-web-pr-101.mkobit-cloudflare.workers.dev",
      );
    });
  });

  describe("formatCommentBody", () => {
    it("formats body containing comment marker and commit sha", () => {
      const body = formatCommentBody(
        "https://storagemaxxing-web-pr-42.mkobit-cloudflare.workers.dev",
        "abcdef1234567890",
      );
      expect(body).toContain(COMMENT_MARKER);
      expect(body).toContain(
        "https://storagemaxxing-web-pr-42.mkobit-cloudflare.workers.dev",
      );
      expect(body).toContain("`abcdef1`");
    });
  });

  describe("formatTeardownCommentBody", () => {
    it("formats teardown comment containing marker and PR number", () => {
      const body = formatTeardownCommentBody(42);
      expect(body).toContain(COMMENT_MARKER);
      expect(body).toContain("storagemaxxing-web-pr-42");
      expect(body).toContain("torn down");
    });
  });

  describe("verifyUrlStatus", () => {
    it("resolves when fetch returns status 200", async () => {
      const mockFetch = mock(() =>
        Promise.resolve(new Response("OK", { status: 200 })),
      ) as unknown as typeof fetch;

      await expect(
        verifyUrlStatus("https://example.com", 2, 10, mockFetch),
      ).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("retries on non-200 and eventually throws if never reaches 200", async () => {
      const mockFetch = mock(() =>
        Promise.resolve(new Response("Not Found", { status: 404 })),
      ) as unknown as typeof fetch;

      await expect(
        verifyUrlStatus("https://example.com", 3, 10, mockFetch),
      ).rejects.toThrow(
        "Preview URL https://example.com did not return HTTP 200 after 3 attempts.",
      );
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("postOrUpdateComment", () => {
    it("creates a new comment if none exists", async () => {
      const calls: { url: string; method?: string; body?: unknown }[] = [];
      const mockFetch = mock(
        (url: string | URL | Request, init?: RequestInit) => {
          const urlStr = String(url);
          calls.push({ url: urlStr, method: init?.method, body: init?.body });
          if (init?.method === "POST") {
            return Promise.resolve(
              new Response(JSON.stringify({ id: 999 }), { status: 201 }),
            );
          }
          return Promise.resolve(
            new Response(JSON.stringify([]), { status: 200 }),
          );
        },
      ) as unknown as typeof fetch;

      await postOrUpdateComment({
        repo: "owner/repo",
        prNumber: 42,
        token: "fake-token",
        body: "test body",
        fetchFn: mockFetch,
      });

      expect(calls.length).toBe(2);
      expect(calls[0].url).toContain("/issues/42/comments");
      expect(calls[1].method).toBe("POST");
      expect(calls[1].url).toContain("/issues/42/comments");
    });

    it("updates existing comment if marker is present", async () => {
      const calls: { url: string; method?: string; body?: unknown }[] = [];
      const mockFetch = mock(
        (url: string | URL | Request, init?: RequestInit) => {
          const urlStr = String(url);
          calls.push({ url: urlStr, method: init?.method, body: init?.body });
          if (init?.method === "PATCH") {
            return Promise.resolve(
              new Response(JSON.stringify({ id: 123 }), { status: 200 }),
            );
          }
          return Promise.resolve(
            new Response(
              JSON.stringify([
                { id: 123, body: `${COMMENT_MARKER}\nold comment` },
              ]),
              { status: 200 },
            ),
          );
        },
      ) as unknown as typeof fetch;

      await postOrUpdateComment({
        repo: "owner/repo",
        prNumber: 42,
        token: "fake-token",
        body: "new body",
        fetchFn: mockFetch,
      });

      expect(calls.length).toBe(2);
      expect(calls[0].url).toContain("/issues/42/comments");
      expect(calls[1].method).toBe("PATCH");
      expect(calls[1].url).toContain("/issues/comments/123");
    });
  });
});
