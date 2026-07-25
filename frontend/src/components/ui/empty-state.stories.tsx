import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./empty-state";
import { Button } from "./button";
import { AlertCircle, Plus, Search } from "lucide-react";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoCampaigns: Story = {
  render: () => (
    <div className="max-w-sm">
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-muted-foreground" />}
        title="No campaigns found"
        description="You haven't created any campaigns yet. Start one to make an impact."
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create your first campaign
          </Button>
        }
      />
    </div>
  ),
};

export const NoSearchResults: Story = {
  render: () => (
    <div className="max-w-sm">
      <EmptyState
        icon={<Search className="w-12 h-12 text-muted-foreground" />}
        title="No results match your search"
        description="Try adjusting your search terms or filters to find what you're looking for."
        action={<Button variant="outline">Clear search</Button>}
      />
    </div>
  ),
};

export const AccessDenied: Story = {
  render: () => (
    <div className="max-w-sm">
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-destructive" />}
        title="Access Denied"
        description="Only campaign owners can access this page. You do not currently own any campaigns."
      />
    </div>
  ),
};

export const NoDonations: Story = {
  render: () => (
    <div className="max-w-sm">
      <EmptyState
        title="No donations yet"
        description="You haven't made any donations yet. Explore campaigns and support causes you care about."
        action={
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Explore campaigns
          </Button>
        }
      />
    </div>
  ),
};
