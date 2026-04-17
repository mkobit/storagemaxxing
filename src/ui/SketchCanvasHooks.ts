import { useState, MouseEvent, useCallback, MutableRefObject } from 'react'
import { useStore } from '../store/useStore'
import { createPoint2D } from '../geometry/Point2D'
import { createRect2D } from '../geometry/Rect2D'
import { createSketchRectangle, SketchElement } from '../assembly/SketchElement'
import { createDimensions2D } from '../geometry/Dimensions2D'
import { createSketchElementId } from '../assembly/SketchElementId'

export type Point = { readonly x: number; readonly y: number }

const handleTwoPointRect = (
  start: Point,
  current: Point,
  addElement: (el: SketchElement) => void,
) => {
  const x = Math.min(start.x, current.x)
  const y = Math.min(start.y, current.y)
  const w = Math.abs(current.x - start.x)
  const h = Math.abs(current.y - start.y)

  const origin = createPoint2D(x, y)
  const dims = createDimensions2D(w, h)
  const geometry = createRect2D(origin, dims)
  addElement(createSketchRectangle(createSketchElementId(), geometry))
}

const handleCenterRect = (
  start: Point,
  current: Point,
  addElement: (el: SketchElement) => void,
) => {
  const dx = Math.abs(current.x - start.x)
  const dy = Math.abs(current.y - start.y)

  const origin = createPoint2D(start.x - dx, start.y - dy)
  const dims = createDimensions2D(dx * 2, dy * 2)
  const geometry = createRect2D(origin, dims)
  addElement(createSketchRectangle(createSketchElementId(), geometry))
}

export const useSketchEvents = (canvasRef: MutableRefObject<HTMLCanvasElement | null>) => {
  const mode = useStore((state) => state.mode)
  const addElement = useStore((state) => state.addElementToActiveSketch)

  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<Point | null>(null)
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null)

  const handlePointerDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (mode === 'select') return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setStartPoint({ x, y })
      setCurrentPoint({ x, y })
      setIsDrawing(true)
    },
    [mode, canvasRef],
  )

  const handlePointerMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setCurrentPoint({ x, y })
    },
    [isDrawing, canvasRef],
  )

  const handlePointerUp = useCallback(() => {
    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false)
      return
    }

    if (mode === 'two_point_rect') handleTwoPointRect(startPoint, currentPoint, addElement)
    else if (mode === 'center_rect') handleCenterRect(startPoint, currentPoint, addElement)

    setIsDrawing(false)
    setStartPoint(null)
    setCurrentPoint(null)
  }, [isDrawing, startPoint, currentPoint, mode, addElement])

  return {
    isDrawing,
    startPoint,
    currentPoint,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
