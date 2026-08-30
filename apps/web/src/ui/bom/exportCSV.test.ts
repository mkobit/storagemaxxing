import { describe, expect, test } from "bun:test";
import { exportBOMToCSV } from "./exportCSV";
import { BOM, BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";
import { BinSpec, binId } from "@storagemaxxing/catalog/bin";

const parseId = (id: string) => BinSpecIdSchema.parse(id);

const mockDims = { w: 1, l: 1, h: 1 } as never;

const catalog: ReadonlyArray<BinSpec> = [
  {
    id: binId("gridfinity-1x1x2"),
    name: "Gridfinity 1x1x2",
    sku: "GF-112",
    vendor: "Gridfinity",
    system: "gridfinity",
    catalogSource: "builtin",
    kind: "bin",
    price: 2.5,
    nominal: mockDims,
    actual: mockDims,
    tolerance: mockDims,
  },
  {
    id: binId("evil-bin"),
    name: '=HYPERLINK("http://evil.com")',
    sku: "+666",
    vendor: "Vendor",
    system: "gridfinity",
    catalogSource: "builtin",
    kind: "bin",
    price: 5,
    nominal: mockDims,
    actual: mockDims,
    tolerance: mockDims,
  },
];

describe("exportBOMToCSV", () => {
  test("renders a header row and one row per BOM item", () => {
    const bom: BOM = {
      items: [{ binId: parseId("gridfinity-1x1x2"), quantity: 3 }],
      totalPrice: 7.5,
      isApproximatePrice: false,
    };

    const csv = exportBOMToCSV(bom, catalog);
    const lines = csv.split("\n");

    expect(lines[0]).toBe(
      "SKU,Name,Quantity,Unit Price,Total Price,System,Source",
    );
    expect(lines[1]).toBe(
      'GF-112,"Gridfinity 1x1x2",3,2.50,7.50,gridfinity,builtin',
    );
  });

  test("falls back to placeholders for bins missing from the catalog", () => {
    const bom: BOM = {
      items: [{ binId: parseId("unknown-bin"), quantity: 1 }],
      totalPrice: 0,
      isApproximatePrice: true,
    };

    const csv = exportBOMToCSV(bom, catalog);
    const [, row] = csv.split("\n");

    expect(row).toBe('unknown-bin,"Unknown",1,0.00,0.00,unknown,unknown');
  });

  test("prefixes formula-leading SKU/name fields to prevent CSV injection", () => {
    const bom: BOM = {
      items: [{ binId: parseId("evil-bin"), quantity: 2 }],
      totalPrice: 10,
      isApproximatePrice: false,
    };

    const csv = exportBOMToCSV(bom, catalog);
    const [, row] = csv.split("\n");

    expect(row).toBe(
      '\'+666,"\'=HYPERLINK(""http://evil.com"")",2,5.00,10.00,gridfinity,builtin',
    );
  });
});
