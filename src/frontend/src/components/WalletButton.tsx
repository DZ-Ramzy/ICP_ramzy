import { useState, useEffect } from "react";
import { walletService, type WalletInfo } from "../services/wallet";
import { accountService, type AccountBalance } from "../services/account";
import { WalletConnectModal } from "./WalletConnectModal";
import { AccountManagement } from "./AccountManagement";

export function WalletButton() {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountManagement, setShowAccountManagement] = useState(false);
  const [balance, setBalance] = useState<AccountBalance>({
    totalBalance: 0,
    currencies: {},
  });

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = walletService.subscribe(setWallet);

    // Set initial state
    setWallet(walletService.getWallet());

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (wallet?.isConnected) {
      // Initialize account and subscribe to balance changes
      accountService.initializeAccount(wallet.address);

      const updateBalance = () => {
        setBalance(accountService.getBalance());
      };

      updateBalance();
      const unsubscribe = accountService.subscribe(updateBalance);

      return unsubscribe;
    }
  }, [wallet?.isConnected, wallet?.address]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleDisconnect = async () => {
    await walletService.disconnect();
    setShowDropdown(false);
  };

  const handleConnect = (walletInfo: WalletInfo) => {
    setWallet(walletInfo);
    setShowModal(false);
  };

  if (wallet?.isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="gradient-icp-secondary group relative overflow-hidden rounded-lg px-4 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105"
        >
          <span className="relative z-10 flex items-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              <span className="text-xs">
                {wallet.network === "Internet Computer"
                  ? "∞"
                  : wallet.network === "Ethereum"
                    ? "⟠"
                    : wallet.network === "Solana"
                      ? "◎"
                      : "💰"}
              </span>
            </div>
            <span className="hidden sm:block">
              {walletService.getDisplayAddress(wallet.address)}
            </span>
            <svg
              className={`h-4 w-4 transition-transform duration-200 ${
                showDropdown ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border border-white/20 bg-black/95 shadow-2xl backdrop-blur-xl">
              <div className="p-4">
                <div className="mb-3 flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <span className="text-lg">
                      {wallet.network === "Internet Computer"
                        ? "∞"
                        : wallet.network === "Ethereum"
                          ? "⟠"
                          : wallet.network === "Solana"
                            ? "◎"
                            : "💰"}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-white">{wallet.network}</div>
                    <div className="text-sm text-white/60">
                      {walletService.getDisplayAddress(wallet.address)}
                    </div>
                  </div>
                </div>

                {wallet.balance && (
                  <div className="mb-3 rounded-lg bg-white/5 p-3">
                    <div className="text-sm text-white/60">Wallet Balance</div>
                    <div className="font-bold text-white">{wallet.balance}</div>
                  </div>
                )}

                {/* Account Balance */}
                <div className="mb-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3">
                  <div className="text-sm text-white/60">Account Balance</div>
                  <div className="text-xl font-bold text-white">
                    {formatCurrency(balance.totalBalance)}
                  </div>
                  {Object.keys(balance.currencies).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(balance.currencies)
                        .slice(0, 2)
                        .map(([currency, data]) => (
                          <div
                            key={currency}
                            className="flex justify-between text-xs text-white/60"
                          >
                            <span>{data.symbol}</span>
                            <span>{data.amount.toFixed(4)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Account Management Button */}
                <button
                  onClick={() => {
                    console.log("Opening Account Management...");
                    setShowAccountManagement(true);
                    setShowDropdown(false);
                  }}
                  className="mb-3 flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:from-blue-500/30 hover:to-purple-500/30"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 00-2 2H9z"
                    />
                  </svg>
                  <span>Gestion Compte</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors duration-200 hover:bg-red-500/30"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="gradient-icp-warm group relative overflow-hidden rounded-lg px-6 py-2 font-medium text-white shadow-lg transition-all duration-300 hover:scale-105"
      >
        <span className="relative z-10 flex items-center space-x-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span>Connect Wallet</span>
        </span>
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
      </button>

      <WalletConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConnect={handleConnect}
      />

      {/* Account Management Modal */}
      <AccountManagement
        isOpen={showAccountManagement}
        onClose={() => setShowAccountManagement(false)}
      />
    </>
  );
}
