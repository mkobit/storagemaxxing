import { z } from 'zod';
import { Inches, inches } from './Inches.js';

export const MillimetersSchema = z.number().nonnegative().brand('mm');
export type Millimeters = z.infer<typeof MillimetersSchema>;

export const mm = (value: number): Millimeters => MillimetersSchema.parse(value);
export const createMillimeters = mm;

export const mmToIn = (value: Millimeters): Inches => inches(value / 25.4);
export const inToMm = (value: Inches): Millimeters => mm(value * 25.4);
