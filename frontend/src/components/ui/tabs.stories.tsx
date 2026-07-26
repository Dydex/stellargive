import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta: Meta<typeof Tabs> = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// ---------------------------------------------------------------------------
// Default — first tab selected
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <Tabs defaultValue="campaigns">
        <TabsList aria-label="Profile sections">
          <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
          <TabsTrigger value="donations">My Donations</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Campaigns you have created will appear here.
          </p>
        </TabsContent>
        <TabsContent value="donations" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Campaigns you have donated to will appear here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// SecondTabSelected — renders with the second tab active by default
// ---------------------------------------------------------------------------

export const SecondTabSelected: Story = {
  render: () => (
    <div className="w-[480px]">
      <Tabs defaultValue="donations">
        <TabsList aria-label="Profile sections">
          <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
          <TabsTrigger value="donations">My Donations</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Campaigns you have created will appear here.
          </p>
        </TabsContent>
        <TabsContent value="donations" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Campaigns you have donated to will appear here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// ThreeTabs — verifies roving focus and keyboard nav across more than two tabs
// ---------------------------------------------------------------------------

export const ThreeTabs: Story = {
  render: () => (
    <div className="w-[560px]">
      <Tabs defaultValue="overview">
        <TabsList aria-label="Campaign sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <p className="text-sm text-muted-foreground">Campaign overview content.</p>
        </TabsContent>
        <TabsContent value="activity" className="mt-6">
          <p className="text-sm text-muted-foreground">Recent activity feed.</p>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <p className="text-sm text-muted-foreground">Campaign settings and controls.</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// Controlled — external state drives the selected tab
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [tab, setTab] = useState("campaigns");
    return (
      <div className="w-[480px] space-y-4">
        <p className="text-xs text-muted-foreground font-mono">selected: {tab}</p>
        <Tabs defaultValue="campaigns" value={tab} onValueChange={setTab}>
          <TabsList aria-label="Controlled demo">
            <TabsTrigger value="campaigns">My Campaigns</TabsTrigger>
            <TabsTrigger value="donations">My Donations</TabsTrigger>
          </TabsList>
          <TabsContent value="campaigns" className="mt-6">
            <p className="text-sm text-muted-foreground">Campaigns panel.</p>
          </TabsContent>
          <TabsContent value="donations" className="mt-6">
            <p className="text-sm text-muted-foreground">Donations panel.</p>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
};
