import { describe, expect, test } from 'bun:test'
import { createDimensions2D } from './Dimensions2D'
import { createInches } from './Inches'
import { createMillimeters } from './Millimeters'

describe('createDimensions2D', () => {
  test('creates dimensions with regular numbers', () => {
    const width = 10
    const height = 20
    const dimensions = createDimensions2D(width, height)

    expect(dimensions.width).toBe(width)
    expect(dimensions.height).toBe(height)
  })

  test('creates dimensions with Inches', () => {
    const width = createInches(5)
    const height = createInches(10)
    const dimensions = createDimensions2D(width, height)

    expect(dimensions.width).toBe(width)
    expect(dimensions.height).toBe(height)
  })

  test('creates dimensions with Millimeters', () => {
    const width = createMillimeters(100)
    const height = createMillimeters(200)
    const dimensions = createDimensions2D(width, height)

    expect(dimensions.width).toBe(width)
    expect(dimensions.height).toBe(height)
  })
})
