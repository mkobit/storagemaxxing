import type { Meta, StoryObj } from "@storybook/react-vite";
import { ThemeToggle } from "./ThemeToggle";

const meta: Meta<typeof ThemeToggle> = {
  component: ThemeToggle,
};
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

// Toggle the Storybook toolbar's Theme control to see the icon/label flip --
// the story's own click handler is ThemeToggle's real setPreference call,
// which preview.tsx's decorator no-ops (theme is toolbar-driven here).
export const Default: Story = {};
