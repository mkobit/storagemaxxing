import { BOM, BOMItem } from "@storagemaxxing/assembly/BaseTypes.js";
import { BinSpec, binId } from "@storagemaxxing/catalog/bin.js";

const getSpecField = <K extends keyof BinSpec>(
  spec: BinSpec | undefined,
  field: K,
  fallback: string,
): string => {
  return spec?.[field] ? String(spec[field]) : fallback;
};

const sanitizeCSVField = (value: string): string => {
  const formulaChars = ["=", "+", "-", "@"];
  if (formulaChars.some((char) => value.startsWith(char))) {
    return `'${value}`;
  }
  return value;
};

const formatRow = (item: BOMItem, spec: BinSpec | undefined): string => {
  const sku = sanitizeCSVField(getSpecField(spec, "sku", item.binId));
  const rawName = sanitizeCSVField(getSpecField(spec, "name", "Unknown"));
  const name = `"${rawName.replace(/"/g, '""')}"`;
  const quantity = item.quantity;
  const price = spec?.price || 0;
  const total = price * quantity;
  const system = sanitizeCSVField(getSpecField(spec, "system", "unknown"));
  const source = sanitizeCSVField(
    getSpecField(spec, "catalogSource", "unknown"),
  );

  return [
    sku,
    name,
    quantity,
    price.toFixed(2),
    total.toFixed(2),
    system,
    source,
  ].join(",");
};

export const exportBOMToCSV = (
  bom: BOM,
  catalog: ReadonlyArray<BinSpec>,
): string => {
  const header = [
    "SKU",
    "Name",
    "Quantity",
    "Unit Price",
    "Total Price",
    "System",
    "Source",
  ].join(",");

  const rows = bom.items.map((item) => {
    const parsedId = binId(item.binId);
    const spec = catalog.find((b) => b.id === parsedId);
    return formatRow(item, spec);
  });

  return [header, ...rows].join("\n");
};
