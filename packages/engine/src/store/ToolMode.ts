export type ToolMode = "select" | "center_rect" | "two_point_rect";

export const isDrawingMode = (mode: ToolMode): boolean => {
  return mode === "center_rect" || mode === "two_point_rect";
};
