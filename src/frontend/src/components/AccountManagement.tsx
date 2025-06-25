import { useState, useEffect } from "react";
import {
  accountService,
  type AccountBalance,
  type Transaction,
  type UserPosition,
  type PnLSummary,
} from "../services/account";
import { DepositModal } from "./DepositModal";

interface AccountManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountManagement({ isOpen, onClose }: AccountManagementProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "positions" | "history" | "deposit"
  >("overview");
  const [balance, setBalance] = useState<AccountBalance>({
    totalBalance: 0,
    currencies: {},
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [positions, setPositions] = useState<UserPosition[]>([]);
  const [pnlSummary, setPnlSummary] = useState<PnLSummary | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const updateData = () => {
      setBalance(accountService.getBalance());
      setTransactions(accountService.getTransactions());
      setPositions(accountService.getPositions());
      setPnlSummary(accountService.getPnLSummary());
    };

    updateData();
    const unsubscribe = accountService.subscribe(updateData);

    return unsubscribe;
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCurrency = (amount: number, symbol = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: symbol === "USD" ? "USD" : undefined,
      minimumFractionDigits: symbol === "USD" ? 2 : 6,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400";
      case "pending":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="glass-card mx-4 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <h2 className="gradient-text text-2xl font-bold">
              Account Management
            </h2>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Balance Overview */}
          <div className="border-b border-white/10 p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4">
                <p className="text-sm text-gray-400">Total Balance</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(balance.totalBalance)}
                </p>
              </div>
              {pnlSummary && (
                <>
                  <div className="rounded-xl bg-gradient-to-br from-green-500/20 to-blue-500/20 p-4">
                    <p className="text-sm text-gray-400">Total P&L</p>
                    <p
                      className={`text-2xl font-bold ${getPnLColor(pnlSummary.totalPnL)}`}
                    >
                      {formatCurrency(pnlSummary.totalPnL)}
                    </p>
                    <p
                      className={`text-sm ${getPnLColor(pnlSummary.totalPnL)}`}
                    >
                      {formatPercentage(pnlSummary.totalPnLPercentage)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-4">
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {pnlSummary.winRate.toFixed(1)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex">
              {[
                { id: "overview", label: "Overview" },
                { id: "positions", label: "Positions" },
                { id: "history", label: "History" },
                { id: "deposit", label: "Deposit" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-6 py-4 font-medium transition-colors ${
                    activeTab === tab.id
                      ? "text-blue-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-400" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Currency Balances */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Currency Balances
                  </h3>
                  <div className="grid gap-3">
                    {Object.entries(balance.currencies).map(
                      ([currency, data]) => (
                        <div
                          key={currency}
                          className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                              <span className="text-xs font-bold text-blue-400">
                                {data.symbol}
                              </span>
                            </div>
                            <span className="font-medium text-white">
                              {data.symbol}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-white">
                              {data.amount.toFixed(6)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {formatCurrency(data.usdValue)}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                    {Object.keys(balance.currencies).length === 0 && (
                      <p className="text-center text-gray-400">
                        No currencies deposited yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowDepositModal(true)}
                      className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 p-4 font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Deposit Funds
                    </button>
                    <button className="rounded-xl bg-white/10 p-4 font-semibold text-white transition-colors hover:bg-white/20">
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "positions" && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Open Positions
                </h3>
                <div className="space-y-3">
                  {positions.map((position, index) => (
                    <div key={index} className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-white">
                            {position.marketTitle}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {position.shares} shares @{" "}
                            {formatCurrency(position.avgPrice)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${getPnLColor(position.pnl)}`}
                          >
                            {formatCurrency(position.pnl)}
                          </p>
                          <p className={`text-sm ${getPnLColor(position.pnl)}`}>
                            {formatPercentage(position.pnlPercentage)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-gray-400">
                        <span>Side: {position.side}</span>
                        <span>
                          Current: {formatCurrency(position.currentPrice)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {positions.length === 0 && (
                    <p className="text-center text-gray-400">
                      No open positions
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Transaction History
                </h3>
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="rounded-lg bg-white/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white capitalize">
                            {tx.type.replace("_", " ")}
                          </p>
                          <p className="text-sm text-gray-400">
                            {tx.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            {tx.type === "withdrawal" || tx.type === "bet_loss"
                              ? "-"
                              : "+"}
                            {formatCurrency(tx.usdValue)}
                          </p>
                          <p className={`text-sm ${getStatusColor(tx.status)}`}>
                            {tx.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-sm text-gray-400">
                        <span>
                          {tx.amount} {tx.currency}
                        </span>
                        <span>{tx.timestamp.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-gray-400">
                      No transactions yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "deposit" && (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-white">
                  Deposit Funds
                </h3>
                <p className="mb-6 text-gray-400">
                  Add funds to your account to start trading. Support for
                  multiple cryptocurrencies and stablecoins.
                </p>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 p-4 font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Open Deposit Modal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          onSuccess={(amount, currency) => {
            console.log(`Deposited ${amount} ${currency}`);
            setShowDepositModal(false);
          }}
        />
      )}
    </>
  );
}
