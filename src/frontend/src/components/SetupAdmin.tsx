import { useState } from "react";
import { Principal } from "@dfinity/principal";
import { PredictionMarketService } from "../services/predictionMarket";
import { walletService } from "../services/wallet";

interface SetupAdminProps {
  onAdminSet: () => void;
}

export function SetupAdmin({ onAdminSet }: SetupAdminProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const wallet = walletService.getWallet();

  const handleSetAdmin = async () => {
    if (!wallet || !wallet.isConnected) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For development, use a valid test principal
      // In production, this should be properly handled with ICP wallet integration
      const adminPrincipal = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
      await PredictionMarketService.setAdmin(adminPrincipal);

      setSuccess(true);
      setTimeout(() => {
        onAdminSet();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set admin");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-hover relative overflow-hidden rounded-3xl p-12 text-center">
          <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-30"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <div className="gradient-icp-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-white">
              Admin Set Successfully!
            </h2>
            <p className="mb-2 text-white/70">
              You are now the admin of this prediction market.
            </p>
            <p className="text-sm text-white/50">
              Redirecting to admin panel...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="glass-hover relative overflow-hidden rounded-3xl p-12 text-center">
        <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-30"></div>
        <div className="relative z-10">
          <div className="mb-6">
            <div className="gradient-icp-warm mx-auto flex h-16 w-16 items-center justify-center rounded-full">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>

          <h2 className="mb-4 text-2xl font-bold text-white">
            Setup Admin Access
          </h2>

          <p className="mb-6 text-white/70">
            No admin is currently set for this prediction market. Set yourself
            as the admin to access the management interface.
          </p>

          {wallet && wallet.isConnected ? (
            <div className="mb-6">
              <div className="mb-4 rounded-xl bg-white/5 p-4">
                <p className="mb-2 text-sm font-medium text-white/80">
                  Admin Principal ID (Development):
                </p>
                <p className="font-mono text-xs break-all text-white/60">
                  rdmx6-jaaaa-aaaaa-aaadq-cai
                </p>
                <p className="mt-2 text-xs text-white/50">
                  Connected Wallet: {wallet.address}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border-2 border-red-400/50 bg-red-500/20 p-4">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <button
                onClick={handleSetAdmin}
                disabled={loading}
                className="gradient-icp-primary w-full rounded-xl px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    <span>Setting Admin...</span>
                  </div>
                ) : (
                  "Set Me as Admin"
                )}
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <p className="mb-4 text-yellow-300">
                Please connect your wallet first
              </p>
              <button
                onClick={() => (window.location.href = "/")}
                className="gradient-icp-secondary rounded-xl px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-105"
              >
                Connect Wallet
              </button>
            </div>
          )}

          <p className="text-xs text-white/50">
            ⚠️ This is a one-time setup. Once set, only the admin can manage
            markets.
          </p>
        </div>
      </div>
    </div>
  );
}
