import React, { useRef, useEffect, useMemo, useState } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import {
  selectPackedLayout,
  LayoutResolution,
} from "@storagemaxxing/store/layoutSelectors";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { BinSpec, binId } from "@storagemaxxing/catalog/bin";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";
import { useTheme } from "./theme/useTheme";
import { buildWireframeScene, WireframeScene } from "./wireframeScene";
import {
  computeViewportFit,
  computeLayoutBounds,
  ViewportFit,
} from "./viewportFit";
import { Rect2D } from "@storagemaxxing/geometry/Rect2D";
import {
  Dimensions2D,
  createDimensions2D,
} from "@storagemaxxing/geometry/Dimensions2D";
import { Toolbar } from "./Toolbar";

const VIEWPORT_MARGIN_PX = 20;

export type LayoutTransform = {
  readonly fit: ViewportFit;
  readonly bounds: Rect2D;
};

const lookupBin = (id: string): BinSpec | undefined =>
  findBinById(ALL_BINS, binId(id));

const resolveCanvasToken = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const drawSpaceBounds = (
  ctx: CanvasRenderingContext2D,
  template: SpaceTemplate,
  transform: LayoutTransform,
) => {
  if (template.w === undefined || template.l === undefined) return;
  const { fit, bounds } = transform;
  const spaceX = (0 - bounds.origin[0]) * fit.scale + fit.offsetX;
  const spaceY = (0 - bounds.origin[1]) * fit.scale + fit.offsetY;
  const spaceW = template.w * fit.scale;
  const spaceL = template.l * fit.scale;

  /* eslint-disable functional/immutable-data -- Canvas 2D API requires imperative property assignment */
  ctx.strokeStyle = resolveCanvasToken("--color-canvas-grid");
  ctx.lineWidth = 1;
  /* eslint-enable functional/immutable-data -- re-enable after the imperative Canvas 2D block above */
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(spaceX, spaceY, spaceW, spaceL);
  ctx.setLineDash([]);

  if (template.backClearance !== undefined && template.backClearance > 0) {
    const clearance = template.backClearance;
    const usableDepth = template.l - clearance;
    const clearanceY =
      (usableDepth - bounds.origin[1]) * fit.scale + fit.offsetY;
    const clearanceH = clearance * fit.scale;

    /* eslint-disable functional/immutable-data -- Canvas 2D API requires imperative property assignment */
    ctx.fillStyle =
      resolveCanvasToken("--color-canvas-reach-clearance") ||
      "rgba(100, 116, 139, 0.15)";
    ctx.fillRect(spaceX, clearanceY, spaceW, clearanceH);

    ctx.strokeStyle = resolveCanvasToken("--color-canvas-grid");
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(spaceX, clearanceY);
    ctx.lineTo(spaceX + spaceW, clearanceY);
    ctx.stroke();
    ctx.setLineDash([]);

    const label = `${clearance.toFixed(1)}in reach clearance (usable depth ${usableDepth.toFixed(1)}in)`;
    ctx.fillStyle = resolveCanvasToken("--color-canvas-grid");
    ctx.font = "11px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(label, spaceX + 8, clearanceY + clearanceH / 2);
    /* eslint-enable functional/immutable-data -- re-enable after the imperative Canvas 2D block above */
  }
};

const ACCESSORY_BORDER_DASH = [4, 2] as const;
const ACCESSORY_HATCH_STEP_PX = 8;

type CanvasFootprint = {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly l: number;
};

const drawAccessoryHatch = (
  ctx: CanvasRenderingContext2D,
  footprint: CanvasFootprint,
  strokeColor: string,
) => {
  const { x, y, w, l } = footprint;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, l);
  ctx.clip();
  /* eslint-disable functional/immutable-data -- Canvas 2D API requires imperative property assignment */
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  /* eslint-enable functional/immutable-data -- re-enable after the imperative Canvas 2D block above */
  ctx.setLineDash([]);
  const lineCount = Math.ceil((w + l) / ACCESSORY_HATCH_STEP_PX) + 1;
  Array.from({ length: lineCount }).forEach((_, i) => {
    const offset = -l + i * ACCESSORY_HATCH_STEP_PX;
    ctx.beginPath();
    ctx.moveTo(x + offset, y);
    ctx.lineTo(x + offset + l, y + l);
    ctx.stroke();
  });
  ctx.restore();
};

const drawPackedLayout = (
  ctx: CanvasRenderingContext2D,
  packingResult: PackingResult,
  constraints: readonly SpaceConstraint[],
  transform: LayoutTransform,
) => {
  const { fit, bounds } = transform;
  const fallbackFill = resolveCanvasToken("--color-canvas-fallback-fill");
  const outline = resolveCanvasToken("--color-canvas-outline");
  const gridColor = resolveCanvasToken("--color-canvas-grid");
  packingResult.placedBins.forEach((placed) => {
    const spec = lookupBin(placed.binId);
    if (!spec) return;
    const constraint = constraints.find((c) => c.binId === placed.binId);
    const isAccessory = spec.kind === "accessory";
    /* eslint-disable functional/immutable-data -- Canvas 2D API requires imperative property assignment */
    ctx.fillStyle = constraint?.color ?? fallbackFill;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1;
    /* eslint-enable functional/immutable-data -- re-enable after the imperative Canvas 2D block above */
    const x = (placed.origin[0] - bounds.origin[0]) * fit.scale + fit.offsetX;
    const y = (placed.origin[2] - bounds.origin[1]) * fit.scale + fit.offsetY;
    const w = spec.nominal.w * fit.scale;
    const l = spec.nominal.l * fit.scale;
    ctx.fillRect(x, y, w, l);
    if (isAccessory) {
      drawAccessoryHatch(ctx, { x, y, w, l }, gridColor);
      ctx.setLineDash(ACCESSORY_BORDER_DASH);
    }
    ctx.strokeRect(x, y, w, l);
    if (isAccessory) {
      ctx.setLineDash([]);
    }
  });
};

const paintWireframe = (
  ctx: CanvasRenderingContext2D,
  scene: WireframeScene,
  fit: ViewportFit,
) => {
  const bounds = scene.boundingBox;
  const bboxH = bounds.dimensions.l;

  scene.polygons.forEach((polygon) => {
    ctx.beginPath();
    polygon.points.forEach((p, i) => {
      const canvasX = (p[0] - bounds.origin[0]) * fit.scale + fit.offsetX;
      const canvasY =
        fit.offsetY + bboxH * fit.scale - (p[1] - bounds.origin[1]) * fit.scale;
      if (i === 0) ctx.moveTo(canvasX, canvasY);
      else ctx.lineTo(canvasX, canvasY);
    });
    ctx.closePath();
    /* eslint-disable functional/immutable-data -- Canvas 2D API requires imperative property assignment */
    if (polygon.fillColor) {
      ctx.fillStyle = polygon.fillColor;
      ctx.fill();
    } else if (polygon.fillToken) {
      ctx.fillStyle = resolveCanvasToken(polygon.fillToken);
      ctx.fill();
    }
    ctx.strokeStyle = resolveCanvasToken(polygon.strokeToken);
    ctx.lineWidth = 1;
    /* eslint-enable functional/immutable-data -- re-enable after the imperative Canvas 2D block above */
    ctx.stroke();
  });
};

const validityDotClassName: Readonly<
  Record<PackingResult["validity"], string>
> = {
  valid: "bg-status-success",
  partial: "bg-status-warning",
  invalid: "bg-status-danger",
};

const badgeBase: React.CSSProperties = {
  position: "absolute",
  top: 8,
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
};

type ResolvedCanvasProps = {
  readonly result: PackingResult;
  readonly unresolvedBinIds: readonly string[];
  readonly template: SpaceTemplate | null;
  readonly constraints: readonly SpaceConstraint[];
  readonly wireframeEnabled: boolean;
  readonly zoomLevel: number;
  readonly panOffset: { readonly x: number; readonly y: number };
  readonly onPanChange: (offset: {
    readonly x: number;
    readonly y: number;
  }) => void;
};

const ResolvedCanvas: React.FC<ResolvedCanvasProps> = ({
  result,
  unresolvedBinIds,
  template,
  constraints,
  wireframeEnabled,
  zoomLevel,
  panOffset,
  onPanChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const mode = useStore((state) => state.mode);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{
    readonly x: number;
    readonly y: number;
  } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode === "pan") {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || mode !== "pan") return;
    onPanChange({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const viewport: Dimensions2D = createDimensions2D(
      canvas.width,
      canvas.height,
    );

    if (wireframeEnabled) {
      const scene = buildWireframeScene(
        result,
        template,
        constraints,
        lookupBin,
      );
      const baseFit = computeViewportFit(
        scene.boundingBox,
        viewport,
        VIEWPORT_MARGIN_PX,
      );
      const effectiveScale = baseFit.scale * zoomLevel;
      const fit: ViewportFit = {
        scale: effectiveScale,
        offsetX:
          (canvas.width - scene.boundingBox.dimensions.w * effectiveScale) / 2 +
          panOffset.x,
        offsetY:
          (canvas.height - scene.boundingBox.dimensions.l * effectiveScale) /
            2 +
          panOffset.y,
      };
      paintWireframe(ctx, scene, fit);
      return;
    }

    const bounds = computeLayoutBounds(template, result.placedBins, lookupBin);
    const baseFit = computeViewportFit(bounds, viewport, VIEWPORT_MARGIN_PX);
    const effectiveScale = baseFit.scale * zoomLevel;
    const fit: ViewportFit = {
      scale: effectiveScale,
      offsetX:
        (canvas.width - bounds.dimensions.w * effectiveScale) / 2 + panOffset.x,
      offsetY:
        (canvas.height - bounds.dimensions.l * effectiveScale) / 2 +
        panOffset.y,
    };
    const transform: LayoutTransform = { fit, bounds };
    if (template) drawSpaceBounds(ctx, template, transform);
    drawPackedLayout(ctx, result, constraints, transform);
  }, [
    result,
    template,
    constraints,
    resolvedTheme,
    wireframeEnabled,
    zoomLevel,
    panOffset,
  ]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className={`border border-border-strong bg-surface-sunken ${
          mode === "pan"
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-default"
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <span
        data-testid="layout-validity-badge"
        className="flex items-center gap-1.5 rounded-sm border border-border-default bg-surface-raised px-2 py-0.5 text-xs font-semibold text-text-primary shadow-sm"
        style={{ ...badgeBase, left: 8 }}
      >
        <span
          aria-hidden="true"
          className={`h-2 w-2 rounded-full ${validityDotClassName[result.validity]}`}
        />
        {result.validity}
      </span>
      {unresolvedBinIds.length > 0 && (
        <span
          data-testid="layout-unresolved-count"
          className="rounded-sm border border-border-default bg-surface-raised px-2 py-0.5 text-xs font-semibold text-status-danger shadow-sm"
          style={{ ...badgeBase, right: 8 }}
        >
          {unresolvedBinIds.length} unresolved
        </span>
      )}
    </div>
  );
};

type ResolutionProps = {
  readonly resolution: LayoutResolution;
  readonly template: SpaceTemplate | null;
  readonly constraints: readonly SpaceConstraint[];
  readonly wireframeEnabled: boolean;
  readonly zoomLevel: number;
  readonly panOffset: { readonly x: number; readonly y: number };
  readonly onPanChange: (offset: {
    readonly x: number;
    readonly y: number;
  }) => void;
};

const renderResolution = ({
  resolution,
  template,
  constraints,
  wireframeEnabled,
  zoomLevel,
  panOffset,
  onPanChange,
}: ResolutionProps): React.ReactElement => {
  if (resolution.kind === "none") {
    return (
      <div className="p-8 text-text-secondary">
        Select or add a space to view the layout.
      </div>
    );
  }
  if (resolution.kind === "missing-template") {
    return (
      <div
        data-testid="layout-error-missing-template"
        className="p-8 text-status-danger"
      >
        Selected space references missing template: {resolution.templateId}
      </div>
    );
  }
  return (
    <ResolvedCanvas
      result={resolution.result}
      unresolvedBinIds={resolution.unresolvedBinIds}
      template={template}
      constraints={constraints}
      wireframeEnabled={wireframeEnabled}
      zoomLevel={zoomLevel}
      panOffset={panOffset}
      onPanChange={onPanChange}
    />
  );
};

export const LayoutCanvas: React.FC = () => {
  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const spaces = useStore((state) => state.spaces);
  const templatesById = useStore((state) => state.templatesById);

  const [wireframeEnabled, setWireframeEnabled] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const resolution = useMemo(
    () => selectPackedLayout({ spaces, activeSpaceId, templatesById }),
    [spaces, activeSpaceId, templatesById],
  );

  const activeSpace = activeSpaceId
    ? (spaces.find((s) => s.id === activeSpaceId) ?? null)
    : null;
  const activeTemplate = activeSpace
    ? (templatesById[activeSpace.templateId] ?? null)
    : null;
  const constraints = useMemo(
    () => (activeSpace ? Object.values(activeSpace.constraints) : []),
    [activeSpace],
  );

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z * 1.25, 4));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z / 1.25, 0.25));
  const handleFit = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  const handleToggleWireframe = () =>
    setWireframeEnabled((enabled) => !enabled);

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden"
      data-testid="layout-canvas-container"
    >
      <Toolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        wireframeEnabled={wireframeEnabled}
        onToggleWireframe={handleToggleWireframe}
      />
      <div className="flex-1 overflow-auto p-4">
        {renderResolution({
          resolution,
          template: activeTemplate,
          constraints,
          wireframeEnabled,
          zoomLevel,
          panOffset,
          onPanChange: setPanOffset,
        })}
      </div>
    </div>
  );
};
