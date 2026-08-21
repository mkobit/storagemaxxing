import { z } from "zod";
import { Dimensions3D } from "@storagemaxxing/geometry/Dimensions3D";
import { CatalogSource } from "./catalogSource";
import { StorageSystem } from "./StorageSystem";
import { InstallationRequirement } from "./installationRequirement";

const BinIdSchema = z.string().brand("BinId");
export type BinId = z.infer<typeof BinIdSchema>;

export const binId = (id: string): BinId => BinIdSchema.parse(id);

type AccessoryType =
  "hook" | "label" | "divider" | "blank" | "cable_clip" | "custom";

interface BaseBinSpec<T extends number = number> {
  readonly id: BinId;
  readonly name: string;
  readonly sku: string;
  readonly vendor: string;
  readonly system?: StorageSystem;
  readonly catalogSource: CatalogSource;
  readonly price?: number;
  readonly priceApproximate?: boolean;

  readonly nominal: Dimensions3D<T>;
  readonly actual: Dimensions3D<T>;
  readonly tolerance: Dimensions3D<T>;

  readonly installation?: InstallationRequirement;
  readonly weightLbs?: number;
}

interface StandardBinSpec<T extends number = number> extends BaseBinSpec<T> {
  readonly kind: "bin";
  readonly accessoryType?: never;
}

interface AccessoryBinSpec<T extends number = number> extends BaseBinSpec<T> {
  readonly kind: "accessory";
  readonly accessoryType: AccessoryType;
}

export type BinSpec<T extends number = number> =
  StandardBinSpec<T> | AccessoryBinSpec<T>;
