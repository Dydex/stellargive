"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWallet } from "@/lib/WalletProvider";
import {
  useRecentCampaigns,
  useAddToWhitelist,
  useCancelCampaign,
  useAddUpdate,
} from "@/hooks/useSoroban";
import { Campaign } from "@/lib/soroban";
import { CampaignStatusBadge } from "@/components/CampaignStatusBadge";
import { PostUpdateForm } from "@/components/PostUpdateForm";
import { Shield, CheckCircle, AlertCircle, Loader2, Eye, FileText, XCircle } from "lucide-react";

export default function AdminPage() {
  const { address, isWrongNetwork } = useWallet();
  const { data: campaigns, isLoading: isLoadingCampaigns } = useRecentCampaigns();
  const addToWhitelist = useAddToWhitelist();
  const cancelCampaign = useCancelCampaign();
  const addUpdate = useAddUpdate();

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [addressToWhitelist, setAddressToWhitelist] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [campaignToCancel, setCampaignToCancel] = useState<Campaign | null>(null);
  const [updateCampaign, setUpdateCampaign] = useState<Campaign | null>(null);

  // Filter campaigns owned by the connected user (creator)
  const ownedCampaigns =
    campaigns?.filter((c) => c.creator.toLowerCase() === address?.toLowerCase()) || [];

  const handleSelectCampaign = (id: string) => {
    setSelectedCampaignId(id);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleAddressChange = (val: string) => {
    setAddressToWhitelist(val);
    setSuccessMessage("");
    setErrorMessage("");
    if (val && !/^G[A-Z0-9]{55}$/.test(val)) {
      setValidationError("Invalid Stellar address format (must start with G and be 56 characters)");
    } else {
      setValidationError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) {
      setErrorMessage("Please select a campaign.");
      return;
    }
    if (!addressToWhitelist || !/^G[A-Z0-9]{55}$/.test(addressToWhitelist)) {
      setValidationError("A valid Stellar address is required.");
      return;
    }

    try {
      await addToWhitelist.mutateAsync({
        campaignId: BigInt(selectedCampaignId),
        addressToWhitelist,
      });
      setSuccessMessage(
        `Successfully whitelisted ${addressToWhitelist} for campaign #${selectedCampaignId}`,
      );
      setAddressToWhitelist("");
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to whitelist address.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 container max-w-4xl py-12 space-y-8">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">
            Manage campaigns, post updates, cancel active campaigns, and configure whitelists.
          </p>
        </div>

        {!address ? (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card/50 backdrop-blur-sm space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Wallet Not Connected</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Please connect your Stellar wallet to verify ownership and access the admin panel.
              </p>
            </div>
          </div>
        ) : isWrongNetwork ? (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card/50 backdrop-blur-sm space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Incorrect Network</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Please switch your wallet network to the correct network to manage your campaigns.
              </p>
            </div>
          </div>
        ) : isLoadingCampaigns ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying campaign ownership...</p>
          </div>
        ) : ownedCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-card/50 backdrop-blur-sm space-y-4 text-center">
            <Shield className="w-12 h-12 text-muted-foreground opacity-50" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-destructive">Access Denied</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Only campaign owners can access this page. You do not currently own any campaigns.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Owned Campaigns Quick Actions */}
            <div className="border rounded-xl bg-card p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Campaign Management</h2>
                <p className="text-sm text-muted-foreground">
                  View your campaigns, post updates to backers, or cancel active campaigns.
                </p>
              </div>

              <div className="divide-y rounded-lg border bg-background overflow-hidden">
                {ownedCampaigns.map((c) => (
                  <div
                    key={c.id.toString()}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base">{c.title}</h3>
                        <CampaignStatusBadge status={c.status} deadline={c.deadline} />
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {c.id.toString()}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/campaign/${c.id.toString()}`}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUpdateCampaign(c)}
                        disabled={addUpdate.isPending}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Post Update
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCampaignToCancel(c)}
                        disabled={c.status !== "Active" || cancelCampaign.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Whitelist Management Section */}
            <div className="border rounded-xl bg-card p-6 shadow-sm space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Whitelist Management</h2>
                <p className="text-sm text-muted-foreground">
                  Authorize specific addresses to contribute to your campaigns.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="campaign-select" className="text-sm font-medium">
                    Select Campaign
                  </label>
                  <Select value={selectedCampaignId} onValueChange={handleSelectCampaign}>
                    <SelectTrigger id="campaign-select">
                      <SelectValue placeholder="-- Choose a Campaign --" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownedCampaigns.map((c) => (
                        <SelectItem key={c.id.toString()} value={c.id.toString()}>
                          {c.title} (ID: {c.id.toString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="address-input" className="text-sm font-medium">
                    Stellar Address to Whitelist
                  </label>
                  <Input
                    id="address-input"
                    placeholder="G..."
                    value={addressToWhitelist}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    disabled={addToWhitelist.isPending}
                    required
                  />
                  {validationError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {validationError}
                    </p>
                  )}
                </div>

                {successMessage && (
                  <div className="p-3 bg-green-500/15 text-green-500 text-sm rounded-md flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-destructive/15 text-destructive text-sm rounded-md flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    addToWhitelist.isPending ||
                    !!validationError ||
                    !selectedCampaignId ||
                    !addressToWhitelist
                  }
                >
                  {addToWhitelist.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Whitelisting Address...
                    </>
                  ) : (
                    "Whitelist Address"
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!campaignToCancel}
        onOpenChange={(open) => {
          if (!cancelCampaign.isPending && !open) setCampaignToCancel(null);
        }}
      >
        <DialogContent aria-labelledby="cancel-dialog-title">
          <DialogHeader>
            <DialogTitle id="cancel-dialog-title">Cancel this campaign?</DialogTitle>
            <DialogDescription>
              This will permanently end <strong>{campaignToCancel?.title}</strong> and open refunds
              for all donors. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCampaignToCancel(null)}
              disabled={cancelCampaign.isPending}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              disabled={cancelCampaign.isPending}
              onClick={async () => {
                if (!campaignToCancel) return;
                try {
                  await cancelCampaign.mutateAsync(campaignToCancel.id);
                  setCampaignToCancel(null);
                } catch (err) {
                  console.error("Failed to cancel campaign:", err);
                }
              }}
            >
              {cancelCampaign.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Campaign"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Update Dialog */}
      <Dialog
        open={!!updateCampaign}
        onOpenChange={(open) => {
          if (!addUpdate.isPending && !open) setUpdateCampaign(null);
        }}
      >
        <DialogContent aria-labelledby="update-dialog-title">
          <DialogHeader>
            <DialogTitle id="update-dialog-title">
              Post Update for {updateCampaign?.title}
            </DialogTitle>
            <DialogDescription>
              Tell your backers what&apos;s happening with this campaign.
            </DialogDescription>
          </DialogHeader>
          {updateCampaign && (
            <PostUpdateForm
              campaignId={updateCampaign.id.toString()}
              onSuccess={() => setUpdateCampaign(null)}
              addUpdateMutation={async (id, content) => {
                await addUpdate.mutateAsync({ campaignId: BigInt(id), content });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
