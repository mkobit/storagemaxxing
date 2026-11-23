import { describe, expect, it, mock } from "bun:test";
import {
  evaluateWorkerPrune,
  parsePreviewWorkerName,
  sweepPreviewWorkers,
} from "./sweep-pr-previews.ts";

const NOW_ISO = "2026-11-23T12:00:00.000Z";
const NOW_MS = Date.parse(NOW_ISO);

describe("sweep-pr-previews", () => {
  describe("parsePreviewWorkerName", () => {
    it("extracts the PR number from a preview worker name", () => {
      expect(parsePreviewWorkerName("storagemaxxing-web-pr-42")).toBe(42);
    });

    it("returns null for non-preview or malformed worker names", () => {
      expect(parsePreviewWorkerName("storagemaxxing-web")).toBeNull();
      expect(parsePreviewWorkerName("storagemaxxing-web-pr-")).toBeNull();
      expect(parsePreviewWorkerName("storagemaxxing-web-pr-abc")).toBeNull();
      expect(parsePreviewWorkerName("storagemaxxing-web-pr-0")).toBeNull();
      expect(parsePreviewWorkerName("other-app-pr-12")).toBeNull();
    });
  });

  describe("evaluateWorkerPrune", () => {
    it("prunes when the PR is not found (404)", () => {
      const decision = evaluateWorkerPrune(
        { workerName: "storagemaxxing-web-pr-99", prNumber: 99 },
        null,
        7,
        NOW_MS,
      );
      expect(decision.shouldPrune).toBe(true);
      expect(decision.reason).toContain("404");
    });

    it("prunes when the PR is closed", () => {
      const decision = evaluateWorkerPrune(
        { workerName: "storagemaxxing-web-pr-42", prNumber: 42 },
        { number: 42, state: "closed", updated_at: NOW_ISO },
        7,
        NOW_MS,
      );
      expect(decision.shouldPrune).toBe(true);
      expect(decision.reason).toContain("closed");
    });

    it("prunes when an open PR has been inactive beyond the TTL", () => {
      const eightDaysAgo = new Date(
        NOW_MS - 8 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const decision = evaluateWorkerPrune(
        { workerName: "storagemaxxing-web-pr-15", prNumber: 15 },
        { number: 15, state: "open", updated_at: eightDaysAgo },
        7,
        NOW_MS,
      );
      expect(decision.shouldPrune).toBe(true);
      expect(decision.reason).toContain("TTL");
    });

    it("keeps an open PR updated within the TTL", () => {
      const threeDaysAgo = new Date(
        NOW_MS - 3 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const decision = evaluateWorkerPrune(
        { workerName: "storagemaxxing-web-pr-50", prNumber: 50 },
        { number: 50, state: "open", updated_at: threeDaysAgo },
        7,
        NOW_MS,
      );
      expect(decision.shouldPrune).toBe(false);
    });

    it("keeps an open PR at the exact TTL boundary", () => {
      const exactlySevenDaysAgo = new Date(
        NOW_MS - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const decision = evaluateWorkerPrune(
        { workerName: "storagemaxxing-web-pr-51", prNumber: 51 },
        { number: 51, state: "open", updated_at: exactlySevenDaysAgo },
        7,
        NOW_MS,
      );
      expect(decision.shouldPrune).toBe(false);
    });
  });

  describe("sweepPreviewWorkers", () => {
    it("deletes closed, stale, and missing PR workers while keeping active and production workers", async () => {
      const deletedUrls: string[] = [];
      const logs: string[] = [];
      const tenDaysAgo = new Date(
        NOW_MS - 10 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const twoDaysAgo = new Date(
        NOW_MS - 2 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const mockFetch = mock(
        (url: string | URL | Request, init?: RequestInit) => {
          const urlStr = String(url);
          const method = init?.method ?? "GET";

          if (
            method === "GET" &&
            urlStr.endsWith("/accounts/acc-123/workers/scripts")
          ) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  success: true,
                  result: [
                    { id: "storagemaxxing-web", modified_on: tenDaysAgo },
                    { id: "storagemaxxing-web-pr-10", modified_on: twoDaysAgo },
                    { id: "storagemaxxing-web-pr-20", modified_on: tenDaysAgo },
                    { id: "storagemaxxing-web-pr-30", modified_on: twoDaysAgo },
                    { id: "storagemaxxing-web-pr-40", modified_on: tenDaysAgo },
                  ],
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "GET" && urlStr.endsWith("/pulls/10")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  number: 10,
                  state: "closed",
                  updated_at: twoDaysAgo,
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "GET" && urlStr.endsWith("/pulls/20")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  number: 20,
                  state: "open",
                  updated_at: tenDaysAgo,
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "GET" && urlStr.endsWith("/pulls/30")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  number: 30,
                  state: "open",
                  updated_at: twoDaysAgo,
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "GET" && urlStr.endsWith("/pulls/40")) {
            return Promise.resolve(
              new Response(JSON.stringify({ message: "Not Found" }), {
                status: 404,
              }),
            );
          }

          if (method === "DELETE") {
            deletedUrls.push(urlStr);
            return Promise.resolve(
              new Response(JSON.stringify({ success: true }), { status: 200 }),
            );
          }

          return Promise.resolve(new Response("Unexpected", { status: 500 }));
        },
      ) as unknown as typeof fetch;

      const result = await sweepPreviewWorkers({
        accountId: "acc-123",
        cloudflareToken: "cf-token",
        githubToken: "gh-token",
        repo: "mkobit/storagemaxxing",
        ttlDays: 7,
        nowMs: NOW_MS,
        fetchFn: mockFetch,
        log: (msg) => logs.push(msg),
        errorLog: (msg) => logs.push(msg),
      });

      expect(result).toEqual({
        totalWorkers: 5,
        previewWorkers: 4,
        pruned: [
          "storagemaxxing-web-pr-10",
          "storagemaxxing-web-pr-20",
          "storagemaxxing-web-pr-40",
        ],
        kept: ["storagemaxxing-web-pr-30"],
        failed: [],
      });

      expect(deletedUrls).toEqual([
        "https://api.cloudflare.com/client/v4/accounts/acc-123/workers/scripts/storagemaxxing-web-pr-10?force=true",
        "https://api.cloudflare.com/client/v4/accounts/acc-123/workers/scripts/storagemaxxing-web-pr-20?force=true",
        "https://api.cloudflare.com/client/v4/accounts/acc-123/workers/scripts/storagemaxxing-web-pr-40?force=true",
      ]);

      expect(
        logs.some((line) => line.includes("Pruned storagemaxxing-web-pr-10")),
      ).toBe(true);
      expect(
        logs.some((line) => line.includes("Pruned storagemaxxing-web-pr-20")),
      ).toBe(true);
      expect(
        logs.some((line) => line.includes("Pruned storagemaxxing-web-pr-40")),
      ).toBe(true);
    });

    it("does not delete any workers in dry-run mode", async () => {
      const deletedUrls: string[] = [];
      const mockFetch = mock(
        (url: string | URL | Request, init?: RequestInit) => {
          const urlStr = String(url);
          const method = init?.method ?? "GET";

          if (
            method === "GET" &&
            urlStr.endsWith("/accounts/acc-123/workers/scripts")
          ) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  success: true,
                  result: [{ id: "storagemaxxing-web-pr-10" }],
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "GET" && urlStr.endsWith("/pulls/10")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  number: 10,
                  state: "closed",
                  updated_at: NOW_ISO,
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "DELETE") {
            deletedUrls.push(urlStr);
            return Promise.resolve(new Response("{}", { status: 200 }));
          }

          return Promise.resolve(new Response("Unexpected", { status: 500 }));
        },
      ) as unknown as typeof fetch;

      const result = await sweepPreviewWorkers({
        accountId: "acc-123",
        cloudflareToken: "cf-token",
        githubToken: "gh-token",
        repo: "mkobit/storagemaxxing",
        dryRun: true,
        nowMs: NOW_MS,
        fetchFn: mockFetch,
        log: () => {},
        errorLog: () => {},
      });

      expect(deletedUrls).toEqual([]);
      expect(result.pruned).toEqual(["storagemaxxing-web-pr-10"]);
    });

    it("records failures and continues without deleting when GitHub API errors", async () => {
      const deletedUrls: string[] = [];
      const mockFetch = mock(
        (url: string | URL | Request, init?: RequestInit) => {
          const urlStr = String(url);
          const method = init?.method ?? "GET";

          if (
            method === "GET" &&
            urlStr.endsWith("/accounts/acc-123/workers/scripts")
          ) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  success: true,
                  result: [
                    { id: "storagemaxxing-web-pr-10" },
                    { id: "storagemaxxing-web-pr-11" },
                  ],
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "GET" && urlStr.endsWith("/pulls/10")) {
            return Promise.resolve(
              new Response("Server Error", { status: 500 }),
            );
          }

          if (method === "GET" && urlStr.endsWith("/pulls/11")) {
            return Promise.resolve(
              new Response(
                JSON.stringify({
                  number: 11,
                  state: "closed",
                  updated_at: NOW_ISO,
                }),
                { status: 200 },
              ),
            );
          }

          if (method === "DELETE") {
            deletedUrls.push(urlStr);
            return Promise.resolve(new Response("{}", { status: 200 }));
          }

          return Promise.resolve(new Response("Unexpected", { status: 500 }));
        },
      ) as unknown as typeof fetch;

      const result = await sweepPreviewWorkers({
        accountId: "acc-123",
        cloudflareToken: "cf-token",
        githubToken: "gh-token",
        repo: "mkobit/storagemaxxing",
        nowMs: NOW_MS,
        fetchFn: mockFetch,
        log: () => {},
        errorLog: () => {},
      });

      expect(result.failed).toEqual(["storagemaxxing-web-pr-10"]);
      expect(result.pruned).toEqual(["storagemaxxing-web-pr-11"]);
      expect(deletedUrls).toHaveLength(1);
    });

    it("rejects non-positive TTL values", async () => {
      await expect(
        sweepPreviewWorkers({
          accountId: "acc-123",
          cloudflareToken: "cf-token",
          githubToken: "gh-token",
          repo: "mkobit/storagemaxxing",
          ttlDays: 0,
        }),
      ).rejects.toThrow("Invalid TTL days");
    });
  });
});
