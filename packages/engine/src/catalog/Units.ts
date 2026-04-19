import { z } from "zod";
import { createMillimeters } from "../geometry/Millimeters.js";
import { createInches } from "../geometry/Inches.js";

export const MillimetersSchema = z.number().transform(createMillimeters);
export const InchesSchema = z.number().transform(createInches);
