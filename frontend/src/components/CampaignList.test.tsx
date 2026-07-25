import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CampaignList } from "./CampaignList";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MockWalletProvider } from "./MockWalletProvider";
import { server, errorHandlers } from "@/mocks/setup";
import { setMockCampaigns } from "@/mocks/handlers";
import { buildCampaign } from "@/test/factories";
import React from "react";

// Mock @sentry/nextjs
vi.mock("@sentry/nextjs", () => ({
  setUser: vi.fn(),
  init: vi.fn(),
}));

// Mock CampaignCard to keep it simple
vi.mock("./CampaignCard", () => ({
  CampaignCard: ({ campaign }: any) => <div data-testid="campaign-card">{campaign.title}</div>,
}));

// Mock next/navigation
const replaceMock = vi.fn();
let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/",
  useSearchParams: () => currentParams,
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MockWalletProvider>
          {children}
        </MockWalletProvider>
      </QueryClientProvider>
    );
  };
}

beforeEach(() => {
  replaceMock.mockClear();
  currentParams = new URLSearchParams();
  setMockCampaigns([]);
  vi.resetAllMocks();
});

describe("CampaignList - MSW Integrated States", () => {
  it("displays 'No campaigns found' and 'Create campaign' button when no campaigns exist", async () => {
    setMockCampaigns([]);
    const Wrapper = makeWrapper();
    render(<CampaignList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No campaigns found/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Why not create the first one\?/i)).toBeInTheDocument();
    const createButton = screen.getByRole("link", { name: /Create campaign/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toHaveAttribute("href", "/create");
  });

  it("displays correct campaign cards when multiple exist", async () => {
    setMockCampaigns([
      buildCampaign({ id: 1n, title: "Flood Relief" }),
      buildCampaign({ id: 2n, title: "School Supplies" }),
    ]);
    const Wrapper = makeWrapper();
    render(<CampaignList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Flood Relief")).toBeInTheDocument();
      expect(screen.getByText("School Supplies")).toBeInTheDocument();
    });
    expect(screen.getAllByTestId("campaign-card")).toHaveLength(2);
  });

  it("displays error message on RPC failure", async () => {
    server.use(...errorHandlers.transactionFailed);
    const Wrapper = makeWrapper();
    render(<CampaignList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load campaigns/i)).toBeInTheDocument();
    });
  });

  it("displays 'No campaigns match your search' when search filters out all campaigns", async () => {
    setMockCampaigns([
      buildCampaign({ id: 1n, title: "Flood Relief" }),
    ]);
    const Wrapper = makeWrapper();
    render(<CampaignList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Flood Relief")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search campaigns/i);
    fireEvent.change(searchInput, { target: { value: "Non-existent-campaign" } });

    // Wait for debounced search (300ms)
    await waitFor(
      () => {
        expect(screen.getByText(/No campaigns match your search/i)).toBeInTheDocument();
      },
      { timeout: 1000 },
    );

    expect(screen.getByText(/Try a different term or clear your search/i)).toBeInTheDocument();
  });
});

describe("CampaignList - Search & URL sync", () => {
  beforeEach(() => {
    setMockCampaigns([
      buildCampaign({ id: 1n, title: "Flood Relief", category: "Disaster" }),
      buildCampaign({ id: 2n, title: "School Supplies", category: "Education" }),
    ]);
  });

  it("filters the grid by title as the user types", async () => {
    const Wrapper = makeWrapper();
    render(<CampaignList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Flood Relief")).toBeInTheDocument();
    });
    expect(screen.getByText("School Supplies")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search campaigns/i), {
      target: { value: "flood" },
    });

    await waitFor(() => {
      expect(screen.getByText("Flood Relief")).toBeInTheDocument();
      expect(screen.queryByText("School Supplies")).not.toBeInTheDocument();
    });
  });

  it("syncs the debounced query into the ?q= URL param", async () => {
    const Wrapper = makeWrapper();
    render(<CampaignList />, { wrapper: Wrapper });

    fireEvent.change(screen.getByPlaceholderText(/Search campaigns/i), {
      target: { value: "flood" },
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/?q=flood", { scroll: false });
    });
  });

  it("initializes the query from the ?q= URL param on load", async () => {
    currentParams = new URLSearchParams("q=school");
    const Wrapper = makeWrapper();
    render(<CampaignList />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("School Supplies")).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Search campaigns/i)).toHaveValue("school");
    expect(screen.queryByText("Flood Relief")).not.toBeInTheDocument();
  });
});
