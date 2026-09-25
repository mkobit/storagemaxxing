import type { Meta, StoryObj } from "@storybook/react-vite";
import { useStore } from "@storagemaxxing/store/useStore";
import { GoldenPathSetup } from "./GoldenPathSetup";

const meta: Meta<typeof GoldenPathSetup> = {
  component: GoldenPathSetup,
};
export default meta;

type Story = StoryObj<typeof GoldenPathSetup>;

export const Default: Story = {
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
      });
      return <Story />;
    },
  ],
};

export const DarkTheme: Story = {
  globals: {
    theme: "dark",
  },
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
      });
      return <Story />;
    },
  ],
};
