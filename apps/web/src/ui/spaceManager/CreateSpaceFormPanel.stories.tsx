import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { useStore } from "@storagemaxxing/store/useStore";
import { CreateSpaceFormPanel } from "./CreateSpaceFormPanel";

const meta: Meta<typeof CreateSpaceFormPanel> = {
  component: CreateSpaceFormPanel,
  decorators: [
    (Story) => {
      useStore.setState({
        spaces: [],
        activeSpaceId: null,
        templatesById: {},
        constraintsBySpace: {},
      });
      return <Story />;
    },
  ],
};
export default meta;

type Story = StoryObj<typeof CreateSpaceFormPanel>;

export const Blank: Story = {};

export const FilledValid: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText("Space name"),
      "Workshop drawer",
    );
    await userEvent.type(canvas.getByLabelText("Columns"), "5");
    await userEvent.type(canvas.getByLabelText("Rows"), "4");
    await userEvent.type(canvas.getByLabelText("Depth"), "2");

    await expect(canvas.getByLabelText("Space name")).toHaveValue(
      "Workshop drawer",
    );
    await expect(canvas.getByLabelText("Columns")).toHaveValue("5");
    await expect(canvas.getByLabelText("Rows")).toHaveValue("4");
    await expect(canvas.getByLabelText("Depth")).toHaveValue("2");
    await expect(canvas.queryByTestId("create-space-error")).toBeNull();
  },
};

export const ValidationErrorEmpty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitButton = canvas.getByRole("button", { name: "Create space" });

    await userEvent.click(submitButton);

    const error = canvas.getByTestId("create-space-error");
    await expect(error).toBeInTheDocument();
  },
};

export const ValidationErrorInvalidNumber: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const submitButton = canvas.getByRole("button", { name: "Create space" });

    await userEvent.type(
      canvas.getByLabelText("Space name"),
      "Workshop drawer",
    );
    await userEvent.type(canvas.getByLabelText("Columns"), "abc");
    await userEvent.type(canvas.getByLabelText("Rows"), "4");
    await userEvent.type(canvas.getByLabelText("Depth"), "2");
    await userEvent.click(submitButton);

    const error = canvas.getByTestId("create-space-error");
    await expect(error).toBeInTheDocument();
  },
};
