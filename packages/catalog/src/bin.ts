import { z } from "zod";
import { Dimensions3D } from "@storagemaxxing/geometry/index";
import { CatalogSource } from "./catalogSource";
import { StorageSystem } from "./StorageSystem";

export const BinIdSchema = z.string().brand("BinId");
export type BinId = z.infer<typeof BinIdSchema>;

export const binId = (id: string): BinId => BinIdSchema.parse(id);

export interface BinSpec<T extends number = number> {
  readonly id: BinId;
  readonly name: string;
  readonly sku: string;
  readonly vendor: string;
  readonly system?: StorageSystem;
  readonly catalogSource: CatalogSource;

  readonly nominal: Dimensions3D<T>;
  readonly actual: Dimensions3D<T>;
  readonly tolerance: Dimensions3D<T>;
}
