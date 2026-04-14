import { Inches } from "../geometry/imperial";
import { Dimensions3D } from "../geometry/types";

export type StorageSystem = "schaller" | "gridfinity" | "akromils" | "opengrid" | "custom";
export type CatalogSource = "builtin" | "csv_import" | "user_defined";

export type BinId = string & { readonly _brand: "BinId" };
export type BinColor = "#e53e3e" | "#3182ce" | string;

/* eslint-disable-next-line @typescript-eslint/consistent-type-assertions */
export const binId = (id: string): BinId => id as BinId;

export interface InstallationRequirement {
  readonly type: "drill" | "rail" | "adhesive" | "freestanding" | "stack-only";
  readonly description: string;
}

export interface BinSpec<T = Inches> {
  readonly id: BinId;
  readonly name: string;
  readonly sku: string;
  readonly vendor: string;
  readonly system: StorageSystem;
  readonly catalogSource: CatalogSource;

  readonly nominal: Dimensions3D<T>;
  readonly actual: Dimensions3D<T>;
  readonly tolerance: Dimensions3D<T>;

  readonly colors: ReadonlyArray<BinColor>;
}
