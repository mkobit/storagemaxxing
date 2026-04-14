import { z } from "zod";
import { Inches } from "../geometry/imperial";
import { Dimensions3D } from "../geometry/types";
import { CatalogSource } from "./catalogSource";

// Define BinId schema with Zod v4 and branded typing
export const BinIdSchema = z.string().brand("BinId");
export type BinId = z.infer<typeof BinIdSchema>;

// Helper to create BinId securely
export const binId = (id: string): BinId => BinIdSchema.parse(id);

export interface BinSpec<T = Inches> {
  readonly id: BinId;
  readonly name: string;
  readonly sku: string;
  readonly vendor: string;
  readonly catalogSource: CatalogSource;

  readonly nominal: Dimensions3D<T>;
  readonly actual: Dimensions3D<T>;
  readonly tolerance: Dimensions3D<T>;
}

// Zod schema to enforce non-negative dimensions
export const DimensionNumberSchema = z.number().min(0);
