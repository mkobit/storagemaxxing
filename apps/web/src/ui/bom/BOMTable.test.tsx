import { describe, it, expect } from "bun:test";
import { render, screen } from "@testing-library/react";
import { BOMTable } from "./BOMTable";
import { BOM, BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";

describe("BOMTable", () => {
  it("visually distinguishes accessory line items from bin line items", () => {
    const bom: BOM = {
      items: [
        {
          binId: BinSpecIdSchema.parse("gridfinity-1x1x2"),
          quantity: 3,
        },
        {
          binId: BinSpecIdSchema.parse("gridfinity-hook-1x1"),
          quantity: 2,
        },
      ],
      totalPrice: 0,
      isApproximatePrice: true,
    };

    render(<BOMTable bom={bom} />);

    const binRow = screen.getByTestId("bom-row-gridfinity-1x1x2");
    const accessoryRow = screen.getByTestId("bom-row-gridfinity-hook-1x1");

    expect(binRow).toBeTruthy();
    expect(accessoryRow).toBeTruthy();

    expect(binRow.getAttribute("data-item-kind")).toBe("bin");
    expect(accessoryRow.getAttribute("data-item-kind")).toBe("accessory");

    const accessoryBadge = screen.getByTestId("accessory-badge");
    expect(accessoryBadge.textContent).toBe("Accessory");
    expect(accessoryRow.contains(accessoryBadge)).toBe(true);
    expect(binRow.contains(accessoryBadge)).toBe(false);

    expect(binRow.textContent).toContain("Gridfinity 1x1x2");
    expect(binRow.textContent).toContain("GF-112");
    expect(accessoryRow.textContent).toContain("Gridfinity Hook Plate 1x1");
    expect(accessoryRow.textContent).toContain("GF-ACC-HOOK");
  });

  it("renders empty state message when BOM has no items", () => {
    const emptyBom: BOM = {
      items: [],
      totalPrice: 0,
      isApproximatePrice: false,
    };

    render(<BOMTable bom={emptyBom} />);

    expect(
      screen.getByText(
        "No items in BOM. Add and pack spaces to see materials.",
      ),
    ).toBeTruthy();
  });

  it("handles unknown bin item gracefully without showing an accessory badge", () => {
    const unknownBom: BOM = {
      items: [
        {
          binId: BinSpecIdSchema.parse("nonexistent-item-id"),
          quantity: 1,
        },
      ],
      totalPrice: 0,
      isApproximatePrice: true,
    };

    render(<BOMTable bom={unknownBom} />);

    const row = screen.getByTestId("bom-row-nonexistent-item-id");
    expect(row).toBeTruthy();
    expect(row.getAttribute("data-item-kind")).toBe("unknown");
    expect(screen.queryByTestId("accessory-badge")).toBeNull();
    expect(row.textContent).toContain("Unknown Item");
  });
});
