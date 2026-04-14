import { Inches } from "../geometry/types";

export type StorageSystem = "schaller" | "gridfinity" | "akromils" | "opengrid" | "custom";
export type CatalogSource = "builtin" | "csv_import" | "user_defined";

export interface InstallationRequirement {
  readonly type: "drill" | "rail" | "adhesive" | "freestanding" | "stack-only";
  readonly description: string;
}

export interface BinSpec {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly vendor: string;
  readonly system: StorageSystem;
  readonly catalogSource: CatalogSource;

  readonly nominalW: Inches;
  readonly nominalL: Inches;
  readonly nominalH: Inches; // this is the BIN HEIGHT — i.e. drawer depth required

  readonly actualW: Inches;
  readonly actualL: Inches;
  readonly actualH: Inches;

  readonly toleranceW: Inches;
  readonly toleranceL: Inches;
  readonly toleranceH: Inches;

  readonly price: number;
  readonly priceApproximate: boolean;

  readonly colors: ReadonlyArray<string>; // standard css colors e.g. '#e53e3e'
}
