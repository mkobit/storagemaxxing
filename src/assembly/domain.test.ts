import { describe, it, expect } from 'bun:test';
import { SpaceConstraintSchema } from './SpaceConstraint.js';
import { SpaceTemplateSchema } from './SpaceTemplate.js';
import { BinSpecId } from './BaseTypes.js';

describe('Planning Domain Models Constraint', () => {
  it('should parse a valid auto constraint', () => {
    const input = {
      mode: 'auto',
      binId: 'bin-123',
      lo: 0,
      hi: null,
      hard: false,
      color: '#ff0000'
    };

    const result = SpaceConstraintSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe('auto');
      expect(result.data.binId).toBe('bin-123' as BinSpecId);
    }
  });

  it('should reject a hard constraint without a positive lo value', () => {
    const input = { mode: 'hard', binId: 'bin-123', lo: 0, hi: null, hard: true, color: '#ff0000' };
    const result = SpaceConstraintSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject a soft constraint where lo > hi', () => {
    const input = { mode: 'soft', binId: 'bin-123', lo: 5, hi: 3, hard: false, color: '#ff0000' };
    const result = SpaceConstraintSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('Planning Domain Models Template', () => {
  it('should parse a valid simple rectangular space template', () => {
    const input = {
      id: 'template-1',
      name: 'Standard Drawer',
      type: 'drawer',
      accessFace: 'top',
      w: 24,
      l: 24,
      h: 6,
      gridResolution: 0.5,
      packingModel: '2d',
      installationConstraints: []
    };
    const result = SpaceTemplateSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject a template missing both w/l/h and footprint', () => {
    const input = {
      id: 'template-2',
      name: 'Invalid Space',
      type: 'drawer',
      accessFace: 'top',
      gridResolution: 0.5,
      packingModel: '2d',
      installationConstraints: []
    };
    const result = SpaceTemplateSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
