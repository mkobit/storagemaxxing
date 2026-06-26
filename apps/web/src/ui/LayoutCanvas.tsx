/* eslint-disable functional/immutable-data */
import React, { useRef, useEffect, useMemo } from "react";
import { useStore } from "@storagemaxxing/store/useStore";
import { selectPackedLayout } from "@storagemaxxing/store/layoutSelectors";
import { ALL_BINS, findBinById } from "@storagemaxxing/catalog/lookup";
import { BinSpec, binId } from "@storagemaxxing/catalog/bin";
import { SpaceTemplate } from "@storagemaxxing/assembly/SpaceTemplate";
import { SpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { PackingResult } from "@storagemaxxing/assembly/PackingResult";

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

export const LayoutCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeSpaceId = useStore((state) => state.activeSpaceId);
  const spaces = useStore((state) => state.spaces);
  const templatesById = useStore((state) => state.templatesById);

  const activeSpace = activeSpaceId
    ? spaces.find((s) => s.id === activeSpaceId) ?? null
    : null;
  const activeTemplate = activeSpace
    ? (templatesById[activeSpace.templateId] ?? null)
    : null;
  const constraints = useMemo(
    () => (activeSpace ? Object.values(activeSpace.constraints) : []),
    [activeSpace],
  );

  const packingResult = useMemo(
    () => selectPackedLayout({ spaces, activeSpaceId, templatesById }),
    [spaces, activeSpaceId, templatesById],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (activeTemplate) drawSpaceBounds(ctx, activeTemplate);
    if (packingResult)
      drawPackedLayout(ctx, packingResult, constraints);
  }, [activeSpace, activeTemplate, constraints, packingResult]);

  if (!activeSpace) {
    return (
      <div style={{ padding: "2rem", color: "#666" }}>
        Select or add a space to view the layout.
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: "1px solid black", backgroundColor: "#f5f5f5" }}
    />
  );
};
