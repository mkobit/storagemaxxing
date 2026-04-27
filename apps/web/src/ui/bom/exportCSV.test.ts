/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test } from "bun:test";
import { exportBOMToCSV } from "./exportCSV.js";
import { BinSpec, binId } from "@storagemaxxing/catalog/bin.js";
import { BOM, BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes.js";

const parseId = (id: string) => BinSpecIdSchema.parse(id);

describe("exportBOMToCSV security", () => {
  test("protects against CSV injection (formula injection)", () => {
    const catalog: readonly BinSpec[] = [
      {
        id: binId("vuln-1"),
        sku: "=1+2",
        name: "+SUM(A1)",
        vendor: "Malicious",
        catalogSource: "@source" as any,
        system: "-system" as any,
        nominal: { w: 1, l: 1, h: 1 } as any,
        actual: { w: 1, l: 1, h: 1 } as any,
        tolerance: { w: 0, l: 0, h: 0 } as any,
        price: 10,
      },
    ];

    const bom: BOM = {
      items: [{ binId: parseId("vuln-1"), quantity: 1 }],
      totalPrice: 10,
      isApproximatePrice: false,
    };

    const csv = exportBOMToCSV(bom, catalog);
    const rows = csv.split("\n");
    const dataRow = rows[1];

    // Check if formula characters are escaped with an apostrophe
    expect(dataRow.startsWith("'=1+2")).toBe(true);
    expect(dataRow).toContain('"\'+SUM(A1)"');
    expect(dataRow).toContain("'-system");
    expect(dataRow).toContain("'@source");
  });

  test("does not escape normal strings", () => {
    const catalog: readonly BinSpec[] = [
      {
        id: binId("normal-1"),
        sku: "NORMAL-SKU",
        name: "Normal Bin",
        vendor: "Vendor",
        catalogSource: "builtin" as any,
        system: "gridfinity" as any,
        nominal: { w: 1, l: 1, h: 1 } as any,
        actual: { w: 1, l: 1, h: 1 } as any,
        tolerance: { w: 0, l: 0, h: 0 } as any,
        price: 5,
      },
    ];

    const bom: BOM = {
      items: [{ binId: parseId("normal-1"), quantity: 2 }],
      totalPrice: 10,
      isApproximatePrice: false,
    };

    const csv = exportBOMToCSV(bom, catalog);
    const rows = csv.split("\n");
    const dataRow = rows[1];

    expect(dataRow.startsWith("NORMAL-SKU")).toBe(true);
    expect(dataRow).toContain('"Normal Bin"');
    expect(dataRow).toContain("gridfinity");
    expect(dataRow).toContain("builtin");
  });
});
