import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExplorePage from "./page";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MockWalletProvider } from "@/components/MockWalletProvider";
import { server, errorHandlers } from "@/mocks/setup";
import { setMockCampaigns } from "@/mocks/handlers";
import { buildCampaign } from "@/test/factories";
import React from "react";

// Mock @sentry/nextjs
vi.mock("@sentry/nextjs", () => ({
  setUser: vi.fn(),
  init: vi.fn(),
}));

// Mock navigation
const replaceMock = vi.fn();
let currentParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => currentParams,
  usePathname: () => "/explore",
}));

// Mock components to keep tests focused
vi.mock("@/components/Navbar", () => ({ Navbar: () => <div data-testid="navbar" /> }));
vi.mock("@/components/CampaignCard", () => ({
  CampaignCard: ({ campaign }: any) => <div data-testid="campaign-card">{campaign.title}</div>,
}));
vi.mock("@/components/Footer", () => ({ Footer: () => <div data-testid="footer" /> }));

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

describe("ExplorePage - MSW Integrated States", () => {
  it("displays correct empty message and button when no campaigns exist", async () => {
    setMockCampaigns([]);
    const Wrapper = makeWrapper();
    render(<ExplorePage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/No active campaigns right now/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Create the first one/i })).toBeInTheDocument();
  });

  it("displays correct campaign cards when multiple exist", async () => {
    setMockCampaigns([
      buildCampaign({ id: 1n, title: "Campaign A" }),
      buildCampaign({ id: 2n, title: "Campaign B" }),
    ]);
    const Wrapper = makeWrapper();
    render(<ExplorePage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Campaign A")).toBeInTheDocument();
      expect(screen.getByText("Campaign B")).toBeInTheDocument();
    });
    expect(screen.getAllByTestId("campaign-card")).toHaveLength(2);
  });

  it("displays correct message when search has no results", async () => {
    setMockCampaigns([
      buildCampaign({ id: 1n, title: "Test Campaign" }),
    ]);
    const Wrapper = makeWrapper();
    render(<ExplorePage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Test Campaign")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by title or creator/i);
    fireEvent.change(searchInput, { target: { value: "Nothing" } });

    await waitFor(() => {
      expect(screen.getByText(/No campaigns match your search/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Clear search/i })).toBeInTheDocument();
    });
  });

  it("displays error message on RPC failure", async () => {
    server.use(...errorHandlers.transactionFailed);
    const Wrapper = makeWrapper();
    render(<ExplorePage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load explore data/i)).toBeInTheDocument();
    });
  });
});
