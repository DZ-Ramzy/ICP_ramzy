import { useState, useEffect } from "react";
import {
  walletService,
  type WalletProvider,
  type WalletInfo,
} from "../services/wallet";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (wallet: WalletInfo) => void;
}

export function WalletConnectModal({
  isOpen,
  onClose,
  onConnect,
}: WalletConnectModalProps) {
  const [wallets, setWallets] = useState<WalletProvider[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWallets(walletService.getAvailableWallets());
      setError(null);
    }
  }, [isOpen]);

  const handleWalletConnect = async (wallet: WalletProvider) => {
    try {
      setConnecting(wallet.name);
      setError(null);

      const walletInfo = await wallet.connect();
      onConnect(walletInfo);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    } finally {
      setConnecting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="glass-hover relative overflow-hidden rounded-3xl p-8 shadow-2xl">
          <div className="gradient-icp-card absolute inset-0 rounded-3xl opacity-40"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-gradient text-2xl font-bold">
                Connect Wallet
              </h2>
              <button
                onClick={onClose}
                className="text-white/60 transition-colors duration-200 hover:text-white"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4">
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              </div>
            )}

            {/* Wallet Options */}
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleWalletConnect(wallet)}
                  disabled={connecting === wallet.name || !wallet.isInstalled}
                  className={`glass card-hover w-full rounded-xl p-4 text-left transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50 ${
                    !wallet.isInstalled ? "border border-yellow-400/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{wallet.icon}</div>
                      <div>
                        <div className="font-bold text-white">
                          {wallet.name}
                        </div>
                        <div className="text-sm text-white/60">
                          {wallet.isInstalled
                            ? "Available"
                            : "Install required"}
                        </div>
                      </div>
                    </div>

                    {connecting === wallet.name ? (
                      <div className="loading-spinner h-5 w-5"></div>
                    ) : (
                      <svg
                        className="h-5 w-5 text-white/60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-white/60">
                Connect your wallet to place bets and manage your positions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
