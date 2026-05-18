import { z } from "zod";
import { createMillimeters } from "@storagemaxxing/geometry/Millimeters";
import { createInches } from "@storagemaxxing/geometry/Inches";

export const MillimetersSchema = z.number().transform(createMillimeters);
export const InchesSchema = z.number().transform(createInches);
