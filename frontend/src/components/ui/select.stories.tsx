import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
  SelectGroup,
} from "./select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Basic: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="Select a campaign" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="campaign-1">Campaign #1 - Relief Fund</SelectItem>
          <SelectItem value="campaign-2">Campaign #2 - Education</SelectItem>
          <SelectItem value="campaign-3">Campaign #3 - Healthcare</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectItem value="campaign-4">Campaign #4 - Infrastructure</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option-1">Option 1</SelectItem>
        <SelectItem value="option-2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithInitialValue: Story = {
  render: () => (
    <Select defaultValue="active">
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Campaigns</SelectItem>
        <SelectItem value="active">Active</SelectItem>
        <SelectItem value="funded">Funded</SelectItem>
      </SelectContent>
    </Select>
  ),
};
