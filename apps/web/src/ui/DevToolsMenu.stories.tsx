import type { Meta, StoryObj } from "@storybook/react-vite";
import { DevToolsMenu } from "./DevToolsMenu";

const meta: Meta<typeof DevToolsMenu> = {
  component: DevToolsMenu,
};
export default meta;

type Story = StoryObj<typeof DevToolsMenu>;

export const Default: Story = {};
