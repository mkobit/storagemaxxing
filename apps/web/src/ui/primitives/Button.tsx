import type { ReactNode } from "react";

export interface ButtonProps {
  readonly children: ReactNode;
  readonly onClick?: () => void;
  readonly variant?: "primary" | "secondary";
}

export const Button = ({
  children,
  onClick,
  variant = "primary",
}: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`button ${variant}`}
      type="button"
    >
      {children}
    </button>
  );
};
