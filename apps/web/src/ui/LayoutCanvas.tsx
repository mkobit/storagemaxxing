/* eslint-disable functional/immutable-data */
import React, { useRef, useEffect, useMemo } from "react";
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

const PIXELS_PER_INCH = 24;

const lookupBin = (id: string): BinSpec | undefined =>
  findBinById(ALL_BINS, binId(id));

const drawSpaceBounds = (
  ctx: CanvasRenderingContext2D,
  template: SpaceTemplate,
) => {
  if (template.w === undefined || template.l === undefined) return;
  ctx.strokeStyle = "#666666";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 2]);
  ctx.strokeRect(
    0,
    0,
    template.w * PIXELS_PER_INCH,
    template.l * PIXELS_PER_INCH,
  );
  ctx.setLineDash([]);
};

const drawPackedLayout = (
  ctx: CanvasRenderingContext2D,
  packingResult: PackingResult,
  constraints: readonly SpaceConstraint[],
) => {
  packingResult.placedBins.forEach((placed) => {
    const spec = lookupBin(placed.binId);
    if (!spec) return;
    const constraint = constraints.find((c) => c.binId === placed.binId);
    ctx.fillStyle = constraint?.color ?? "#cccccc";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.fillRect(
      placed.origin[0] * PIXELS_PER_INCH,
      placed.origin[2] * PIXELS_PER_INCH,
      spec.nominal.w * PIXELS_PER_INCH,
      spec.nominal.l * PIXELS_PER_INCH,
    );
    ctx.strokeRect(
      placed.origin[0] * PIXELS_PER_INCH,
      placed.origin[2] * PIXELS_PER_INCH,
      spec.nominal.w * PIXELS_PER_INCH,
      spec.nominal.l * PIXELS_PER_INCH,
    );
  });
};

const validityBadgeColor: Readonly<Record<PackingResult["validity"], string>> =
  {
    valid: "#16a34a",
    partial: "#d97706",
    invalid: "#dc2626",
  };

const badgeBase: React.CSSProperties = {
  position: "absolute",
  top: 8,
  padding: "2px 8px",
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 600,
  color: "white",
};

const ResolvedCanvas: React.FC<{
  readonly result: PackingResult;
  readonly unresolvedBinIds: readonly string[];
  readonly template: SpaceTemplate | null;
  readonly constraints: readonly SpaceConstraint[];
}> = ({ result, unresolvedBinIds, template, constraints }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (template) drawSpaceBounds(ctx, template);
    drawPackedLayout(ctx, result, constraints);
  }, [result, template, constraints]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: "1px solid black", backgroundColor: "#f5f5f5" }}
      />
      <span
        data-testid="layout-validity-badge"
        style={{
          ...badgeBase,
          left: 8,
          backgroundColor: validityBadgeColor[result.validity],
        }}
      >
        {result.validity}
      </span>
      {unresolvedBinIds.length > 0 && (
        <span
          data-testid="layout-unresolved-count"
          style={{
            ...badgeBase,
            right: 8,
            backgroundColor: "#dc2626",
          }}
        >
          {unresolvedBinIds.length} unresolved
        </span>
      )}
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
      <div style={{ padding: "2rem", color: "#666" }}>
        Select or add a space to view the layout.
      </div>
    );
  }
  if (resolution.kind === "missing-template") {
    return (
      <div
        data-testid="layout-error-missing-template"
        style={{ padding: "2rem", color: "#dc2626" }}
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
