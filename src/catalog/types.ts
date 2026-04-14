import { Inches } from "../geometry/imperial";

export type StorageSystem = "schaller" | "gridfinity" | "akromils" | "opengrid" | "custom";
export type CatalogSource = "builtin" | "csv_import" | "user_defined";

export interface InstallationRequirement {
  readonly type: "drill" | "rail" | "adhesive" | "freestanding" | "stack-only";
  readonly description: string;
}

export interface BinSpec<T = Inches> {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly vendor: string;
  readonly system: StorageSystem;
  readonly catalogSource: CatalogSource;

  readonly nominalW: T;
  readonly nominalL: T;
  readonly nominalH: T;

  readonly actualW: T;
  readonly actualL: T;
  readonly actualH: T;

  readonly toleranceW: T;
  readonly toleranceL: T;
  readonly toleranceH: T;

  readonly price: number;
  readonly priceApproximate: boolean;

  readonly colors: ReadonlyArray<string>;
}
