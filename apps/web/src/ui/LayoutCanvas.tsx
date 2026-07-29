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
import { SpaceInstance } from "@storagemaxxing/assembly/SpaceInstance";
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

const VIEWPORT_MARGIN_PX = 20;

type LayoutTransform = {
  readonly fit: ViewportFit;
  readonly bounds: Rect2D;
};

const lookupBin = (id: string): BinSpec | undefined =>
  findBinById(ALL_BINS, binId(id));

const resolveCanvasToken = (name: string): string =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const drawSpaceBounds = (
  ctx: CanvasRenderingContext2D,
  template: SpaceTemplate,
  transform: LayoutTransform,
) => {
  if (template.w === undefined || template.l === undefined) return;
  const { fit, bounds } = transform;
  /* eslint-disable functional/immutable-data -- Canvas 2D API requires imperative property assignment */
  ctx.strokeStyle = resolveCanvasToken("--color-canvas-grid");
  ctx.lineWidth = 1;
  /* eslint-enable functional/immutable-data */
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(
    (0 - bounds.origin[0]) * fit.scale + fit.offsetX,
    (0 - bounds.origin[1]) * fit.scale + fit.offsetY,
    template.w * fit.scale,
    template.l * fit.scale,
  );
  ctx.setLineDash([]);
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
  packingResult.placedBins.forEach((placed) => {
    const spec = lookupBin(placed.binId);
    if (!spec) return;
    const constraint = constraints.find((c) => c.binId === placed.binId);
    /* eslint-disable functional/immutable-data -- Canvas 2D API requires imperative property assignment */
    ctx.fillStyle = constraint?.color ?? fallbackFill;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1;
    /* eslint-enable functional/immutable-data */
    const x = (placed.origin[0] - bounds.origin[0]) * fit.scale + fit.offsetX;
    const y = (placed.origin[2] - bounds.origin[1]) * fit.scale + fit.offsetY;
    const w = spec.nominal.w * fit.scale;
    const l = spec.nominal.l * fit.scale;
    ctx.fillRect(x, y, w, l);
    ctx.strokeRect(x, y, w, l);
  });
};

const paintWireframe = (
  ctx: CanvasRenderingContext2D,
  scene: WireframeScene,
  viewport: Dimensions2D,
) => {
  const bounds = scene.boundingBox;
  const fit = computeViewportFit(bounds, viewport, VIEWPORT_MARGIN_PX);
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
    /* eslint-enable functional/immutable-data */
    ctx.stroke();
  });
};

const validityBadgeClassName: Readonly<
  Record<PackingResult["validity"], string>
> = {
  valid: "bg-green-600",
  partial: "bg-amber-600",
  invalid: "bg-red-600",
};

const badgeBase: React.CSSProperties = {
  position: "absolute",
  top: 8,
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
};

const ResolvedCanvas: React.FC<{
  readonly result: PackingResult;
  readonly unresolvedBinIds: readonly string[];
  readonly template: SpaceTemplate | null;
  readonly constraints: readonly SpaceConstraint[];
}> = ({ result, unresolvedBinIds, template, constraints }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const [wireframeEnabled, setWireframeEnabled] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (wireframeEnabled) {
      const scene = buildWireframeScene(result, template, constraints, lookupBin);
      paintWireframe(
        ctx,
        scene,
        createDimensions2D(canvas.width, canvas.height),
      );
    } else {
      const bounds = computeLayoutBounds(template, result.placedBins, lookupBin);
      const fit = computeViewportFit(
        bounds,
        createDimensions2D(canvas.width, canvas.height),
        VIEWPORT_MARGIN_PX,
      );
      const transform: LayoutTransform = { fit, bounds };
      if (template) drawSpaceBounds(ctx, template, transform);
      drawPackedLayout(ctx, result, constraints, transform);
    }
  }, [result, template, constraints, resolvedTheme, wireframeEnabled]);

  return (
    <div>
      <button
        type="button"
        data-testid="wireframe-toggle"
        aria-pressed={wireframeEnabled}
        onClick={() => setWireframeEnabled((enabled) => !enabled)}
        className="mb-2 rounded-sm border border-border-default bg-surface-raised px-3 py-1 text-text-primary transition-colors duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)] hover:bg-surface-hover"
      >
        Wireframe preview
      </button>
      <div style={{ position: "relative", display: "inline-block" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border border-border-strong bg-surface-sunken"
        />
        <span
          data-testid="layout-validity-badge"
          className={`text-white ${validityBadgeClassName[result.validity]}`}
          style={{ ...badgeBase, left: 8 }}
        >
          {result.validity}
        </span>
        {unresolvedBinIds.length > 0 && (
          <span
            data-testid="layout-unresolved-count"
            className="bg-red-600 text-white"
            style={{ ...badgeBase, right: 8 }}
          >
            {unresolvedBinIds.length} unresolved
          </span>
        )}
      </div>
    </div>
  );
};

const renderResolution = (
  resolution: LayoutResolution,
  activeSpace: SpaceInstance | null,
  template: SpaceTemplate | null,
  constraints: readonly SpaceConstraint[],
): React.ReactElement => {
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
        className="p-8 text-red-600"
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
    />
  );
};

export const LayoutCanvas: React.FC = () => {
  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const spaces = useStore((state) => state.spaces);
  const templatesById = useStore((state) => state.templatesById);

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

  return renderResolution(resolution, activeSpace, activeTemplate, constraints);
};
