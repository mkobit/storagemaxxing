import { describe, it, expect, mock } from "bun:test";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConstraintRow } from "./ConstraintRow";
import { createSpaceConstraint } from "@storagemaxxing/assembly/SpaceConstraint";
import { BinSpecIdSchema } from "@storagemaxxing/assembly/BaseTypes";

const binSpecId = BinSpecIdSchema.parse("gridfinity-1x1x2");

describe("ConstraintRow", () => {
  it("switches to off mode via the mode select", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 2, 0, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByTestId(`constraint-mode-${binSpecId}`), {
      target: { value: "off" },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "off",
      binId: binSpecId,
      lo: 0,
      hi: 0,
      hard: false,
      color: constraint.color,
    });
  });

  it("switches from hard to soft mode, preserving lo/hi", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 2, 0, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByTestId(`constraint-mode-${binSpecId}`), {
      target: { value: "soft" },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "soft",
      binId: binSpecId,
      lo: 2,
      hi: 5,
      hard: false,
      color: constraint.color,
    });
  });

  it("updates min quantity for a hard constraint", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 2, 0, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Min:"), {
      target: { value: "4" },
    });

    expect(onChange).toHaveBeenCalledWith({ ...constraint, lo: 4 });
  });
});
