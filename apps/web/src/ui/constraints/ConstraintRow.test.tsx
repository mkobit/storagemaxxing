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

  it("updates min quantity for a soft constraint", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 0, 2, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Min:"), {
      target: { value: "3" },
    });

    expect(onChange).toHaveBeenCalledWith({ ...constraint, lo: 3 });
  });

  it("updates max quantity for a soft constraint", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 0, 2, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Max:"), {
      target: { value: "8" },
    });

    expect(onChange).toHaveBeenCalledWith({ ...constraint, hi: 8 });
  });

  it("clears max quantity for a soft constraint when the input is emptied", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 0, 2, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Max:"), {
      target: { value: "" },
    });

    expect(onChange).toHaveBeenCalledWith({ ...constraint, hi: null });
  });

  it("updates max quantity for a hard constraint, clamping to at least 1", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 2, 0, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByLabelText("Max:"), {
      target: { value: "0" },
    });

    expect(onChange).toHaveBeenCalledWith({ ...constraint, hi: 1 });
  });

  it("switches to auto mode via the mode select", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 2, 0, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByTestId(`constraint-mode-${binSpecId}`), {
      target: { value: "auto" },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "auto",
      binId: binSpecId,
      lo: 0,
      hi: null,
      hard: false,
      color: constraint.color,
    });
  });

  it("switches from auto to hard mode, defaulting lo to 1", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 0, 0);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByTestId(`constraint-mode-${binSpecId}`), {
      target: { value: "hard" },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "hard",
      binId: binSpecId,
      lo: 1,
      hi: null,
      hard: true,
      color: constraint.color,
    });
  });

  it("switches from soft to hard mode, preserving lo and hi", () => {
    const onChange = mock();
    const constraint = createSpaceConstraint(binSpecId, 0, 2, 5);
    render(
      <ConstraintRow constraint={constraint} binName="Test bin" onChange={onChange} />,
    );

    fireEvent.change(screen.getByTestId(`constraint-mode-${binSpecId}`), {
      target: { value: "hard" },
    });

    expect(onChange).toHaveBeenCalledWith({
      mode: "hard",
      binId: binSpecId,
      lo: 2,
      hi: 5,
      hard: true,
      color: constraint.color,
    });
  });
});
