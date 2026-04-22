/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, functional/no-expression-statements, functional/immutable-data, @typescript-eslint/consistent-type-assertions */
// polyfill self for glpk.js tests in bun
import { describe, it, expect, beforeAll } from "bun:test";

beforeAll(() => {
    if (typeof globalThis !== 'undefined' && !(globalThis as any).Worker) {
        (globalThis as any).Worker = class {
            constructor() {}
            postMessage() {}
            terminate() {}
        };
    }
    if (typeof globalThis !== 'undefined' && !(globalThis as any).self) {
        (globalThis as any).self = { location: { href: 'http://localhost' } };
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).self && !(globalThis as any).self.location) {
        (globalThis as any).self.location = { href: 'http://localhost' };
    }
});

// Important: import after polyfill or use await import
const { checkFeasibility } = await import("./feasibility.js");
import type { SolverRequest } from "./index.js";
import type { SpaceInstance, SpaceTemplate, BinSpec } from "@storagemaxxing/assembly/index.js";

describe("feasibility", () => {
    const mockBin: BinSpec = {
        id: "bin-1",
        w: 2,
        l: 2,
        h: 2
    };

    const mockTemplate: SpaceTemplate = {
        id: "template-1" as any,
        name: "test template",
        type: "drawer",
        accessFace: "top",
        w: 10,
        l: 10,
        h: 10,
        packingModel: "2d",
        installationConstraints: [],
        gridResolution: 0.5
    };

    it("should return feasible for valid constraints", async () => {
        const spaceInstance: SpaceInstance = {
            id: "space-1" as any,
            templateId: "template-1" as any,
            name: "Space 1",
            count: 1,
            constraints: {
                "bin-1": {
                    mode: "hard",
                    binId: "bin-1" as any,
                    lo: 2,
                    hi: 10,
                    hard: true,
                    color: "blue"
                } as any
            } as any
        };

        const request: SolverRequest = {
            spaces: [spaceInstance],
            templates: [mockTemplate],
            bins: [mockBin],
            aggregateConstraints: []
        };

        const result = await checkFeasibility(request);
        expect(result.feasible).toBe(true);
        expect(result.suggestedCounts["space-1"]["bin-1"]).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(result.suggestedCounts["space-1"]["bin-1"])).toBe(true);
    });

    it("should return infeasible when hard min > geometric cap", async () => {
        const spaceInstance: SpaceInstance = {
            id: "space-1" as any,
            templateId: "template-1" as any,
            name: "Space 1",
            count: 1,
            constraints: {
                "bin-1": {
                    mode: "hard",
                    binId: "bin-1" as any,
                    lo: 30, // 30 * 4 = 120 > 100 space area
                    hi: null,
                    hard: true,
                    color: "red"
                } as any
            } as any
        };

        const request: SolverRequest = {
            spaces: [spaceInstance],
            templates: [mockTemplate],
            bins: [mockBin],
            aggregateConstraints: []
        };

        const result = await checkFeasibility(request);
        expect(result.feasible).toBe(false);
    });
});
