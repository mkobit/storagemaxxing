/* eslint-disable functional/no-expression-statements */
/* eslint-disable max-lines-per-function */
import { describe, it, expect } from 'bun:test'
import { packSpace } from './packer'
import { createBinSpec, createBinSpecBasic } from '../assembly/BinSpec'
import { createSpaceTemplate } from '../assembly/SpaceTemplate'
import { createSpaceConstraint } from '../assembly/SpaceConstraint'
import { createDimensions3D } from '../geometry/Dimensions3D'

describe('Packer Engine', () => {
  it('basic fill of a 24x24 drawer', () => {
    const space = createSpaceTemplate('drawer', createDimensions3D(24, 6, 24), 'top')
    const bin1 = createBinSpecBasic('bin1', 6, 6, 4)
    const constraint = createSpaceConstraint('bin1', 0, 0)

    const result = packSpace(space, [bin1], [constraint])

    expect(result.validity).toBe('valid')
    expect(result.metrics.placedCounts['bin1']).toBe(16)
    expect(result.placedBins.length).toBe(16)
    expect(result.metrics.areaUtilization).toBe(1)
  })

  it('hard min violation producing invalid state', () => {
    const space = createSpaceTemplate('drawer', createDimensions3D(10, 6, 10), 'top')
    const bin1 = createBinSpecBasic('bin1', 6, 6, 4)
    const constraint = createSpaceConstraint('bin1', 4, 4)

    const result = packSpace(space, [bin1], [constraint])

    expect(result.validity).toBe('invalid')
    expect(result.metrics.placedCounts['bin1']).toBe(1)
    expect(result.metrics.failures.length).toBe(1)
    expect(result.metrics.failures[0].reason).toBe('hardMin')
  })

  it('soft min shortfall producing partial state', () => {
    const space = createSpaceTemplate('drawer', createDimensions3D(10, 6, 10), 'top')
    const bin1 = createBinSpecBasic('bin1', 6, 6, 4)
    const constraint = createSpaceConstraint('bin1', 1, 4)

    const result = packSpace(space, [bin1], [constraint])

    expect(result.validity).toBe('partial')
    expect(result.metrics.placedCounts['bin1']).toBe(1)
    expect(result.metrics.failures.length).toBe(1)
    expect(result.metrics.failures[0].reason).toBe('softMin')
  })

  it('front-access depth clamping', () => {
    const space = createSpaceTemplate('shelf', createDimensions3D(24, 6, 24), 'front')
    const bin1 = createBinSpecBasic('bin1', 6, 6, 4)
    const constraint = createSpaceConstraint('bin1', 0, 0)

    const result = packSpace(space, [bin1], [constraint])

    expect(result.validity).toBe('valid')
    expect(result.metrics.placedCounts['bin1']).toBe(4)
    expect(result.placedBins.length).toBe(4)
  })

  it('tolerance reducing bin count', () => {
    const space = createSpaceTemplate('drawer', createDimensions3D(24, 6, 24), 'top')
    const bin1 = createBinSpec({
      id: 'bin1',
      w: 6,
      l: 6,
      h: 4,
      toleranceW: 0.5,
      toleranceL: 0.5,
      toleranceH: 0,
    })
    const constraint = createSpaceConstraint('bin1', 0, 0)

    const result = packSpace(space, [bin1], [constraint])

    expect(result.validity).toBe('valid')
    expect(result.metrics.placedCounts['bin1']).toBe(9)
    expect(result.placedBins.length).toBe(9)
  })
})
