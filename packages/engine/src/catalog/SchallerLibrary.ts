import { SchallerBinSchema, type SchallerBin } from './SchallerBin.js';
import { createMillimeters } from '../geometry/Millimeters.js';

// Using actual standard Schaller bin dimensions (Width x Depth x Height in mm)
// Reference approximations for standard drawer bins
const rawSchallerLibrary = [
  {
    id: 'schaller-1-8',
    name: '1/8 Drawer Bin',
    system: 'Schaller',
    boundingBox: {
      width: createMillimeters(54),
      depth: createMillimeters(54),
      height: createMillimeters(45), // standard height for low drawers
    },
    color: 'red',
    labelHolder: false,
  },
  {
    id: 'schaller-1-4',
    name: '1/4 Drawer Bin',
    system: 'Schaller',
    boundingBox: {
      width: createMillimeters(108),
      depth: createMillimeters(54),
      height: createMillimeters(45),
    },
    color: 'yellow',
    labelHolder: true,
  },
  {
    id: 'schaller-1-2',
    name: '1/2 Drawer Bin',
    system: 'Schaller',
    boundingBox: {
      width: createMillimeters(108),
      depth: createMillimeters(108),
      height: createMillimeters(45),
    },
    color: 'blue',
    labelHolder: true,
  },
  {
    id: 'schaller-1-1',
    name: 'Full Drawer Bin',
    system: 'Schaller',
    boundingBox: {
      width: createMillimeters(216),
      depth: createMillimeters(108),
      height: createMillimeters(45),
    },
    color: 'grey',
    labelHolder: true,
  },
] as const;

export const SCHALLER_BINS: ReadonlyArray<SchallerBin> = Object.freeze(
  rawSchallerLibrary.map((bin) => Object.freeze(SchallerBinSchema.parse(bin)))
);

export const getSchallerBinById = (id: string): SchallerBin | undefined =>
  SCHALLER_BINS.find((bin) => bin.id === id);
