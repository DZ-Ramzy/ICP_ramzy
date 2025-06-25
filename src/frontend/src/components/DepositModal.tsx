import { useState } from "react";
import { accountService } from "../services/account";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number, currency: string) => void;
}

export function DepositModal({
  isOpen,
  onClose,
  onSuccess,
}: DepositModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencies = accountService.getSupportedCurrencies();

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await accountService.depositFunds(selectedCurrency, parseFloat(amount));
      onSuccess(parseFloat(amount), selectedCurrency);
      onClose();
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-md">
        <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
          <div className="gradient-icp-card absolute inset-0 rounded-2xl opacity-30"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-gradient text-2xl font-bold">
                Deposit Funds
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

            {/* Currency Selection */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-white/80">
                Select Currency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.symbol}
                    onClick={() => setSelectedCurrency(currency.symbol)}
                    className={`glass rounded-lg p-3 text-left transition-all duration-300 hover:scale-105 ${
                      selectedCurrency === currency.symbol
                        ? "border border-blue-400/50 bg-blue-500/20"
                        : "border border-white/10"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{currency.icon}</span>
                      <div>
                        <div className="text-sm font-bold text-white">
                          {currency.symbol}
                        </div>
                        <div className="text-xs text-white/60">
                          {currency.name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-bold text-white/80">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="glass w-full rounded-xl border border-white/20 px-4 py-3 pr-16 text-white placeholder-white/50 transition-all duration-300 focus:border-white/40 focus:outline-none"
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                />
                <div className="absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-white/60">
                  {selectedCurrency}
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <div className="grid grid-cols-4 gap-2">
                {["10", "50", "100", "500"].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className="glass rounded-lg py-2 text-sm font-bold text-white/80 transition-all duration-300 hover:bg-white/10 hover:text-white"
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3">
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-4 w-4 text-red-400"
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

            {/* Deposit Button */}
            <button
              onClick={handleDeposit}
              disabled={loading || !amount}
              className="gradient-icp-primary w-full rounded-xl px-6 py-3 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading-spinner h-4 w-4"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Deposit {amount && `$${amount}`}</span>
                </div>
              )}
            </button>

            {/* Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-white/60">
                Funds will be available after blockchain confirmation (~2
                minutes)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
