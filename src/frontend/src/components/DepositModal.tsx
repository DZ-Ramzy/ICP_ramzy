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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop amélioré */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal avec meilleure lisibilité */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gray-900/95 p-8 shadow-2xl backdrop-blur-xl">
          {/* Gradient d'arrière-plan plus visible */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

          <div className="relative z-10">
            {/* Header amélioré */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-green-500 to-blue-500">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Deposit Funds
                  </h2>
                  <p className="text-sm text-white/70">
                    Add funds to your trading balance
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all duration-200 hover:bg-white/20 hover:text-white"
              >
                <svg
                  className="h-5 w-5"
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

            {/* Currency Selection améliorée */}
            <div className="mb-6">
              <label className="mb-4 block text-lg font-bold text-white">
                Select Currency
              </label>
              <div className="grid grid-cols-2 gap-3">
                {currencies.map((currency) => (
                  <button
                    key={currency.symbol}
                    onClick={() => setSelectedCurrency(currency.symbol)}
                    className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 hover:scale-[1.02] ${
                      selectedCurrency === currency.symbol
                        ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/25"
                        : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white ${
                          selectedCurrency === currency.symbol
                            ? "bg-blue-500"
                            : "bg-gray-600"
                        }`}
                      >
                        {currency.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {currency.symbol}
                        </div>
                        <div className="text-sm text-white/70">
                          {currency.name}
                        </div>
                      </div>
                    </div>
                    {selectedCurrency === currency.symbol && (
                      <div className="absolute top-2 right-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input amélioré */}
            <div className="mb-6">
              <label className="mb-4 block text-lg font-bold text-white">
                Amount to Deposit
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-xl border-2 border-white/30 bg-white/10 px-6 py-4 pr-20 text-lg font-medium text-white placeholder-white/50 backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white/15 focus:ring-4 focus:ring-blue-500/30 focus:outline-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <div className="absolute top-1/2 right-4 -translate-y-1/2 rounded-lg border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-sm font-bold text-blue-300">
                  {selectedCurrency}
                </div>
              </div>
              <div className="mt-2 text-sm text-white/60">
                Minimum deposit: $1.00
              </div>
            </div>

            {/* Quick Amount Buttons améliorés */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-white/80">
                Quick Amounts
              </label>
              <div className="grid grid-cols-4 gap-3">
                {["10", "50", "100", "500"].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setAmount(quickAmount)}
                    className={`rounded-xl border py-3 text-sm font-bold transition-all duration-300 hover:scale-105 ${
                      amount === quickAmount
                        ? "border-green-400 bg-green-500/20 text-green-300"
                        : "border-white/30 bg-white/5 text-white/80 hover:border-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message amélioré */}
            {error && (
              <div className="mb-6 rounded-xl border-2 border-red-400/50 bg-red-500/20 p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/30">
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
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-bold text-red-300">
                      Deposit Error
                    </h4>
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Deposit Button amélioré */}
            <button
              onClick={handleDeposit}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4 text-lg font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:from-green-400 hover:to-blue-400 focus:ring-4 focus:ring-green-500/30 focus:outline-none disabled:scale-100 disabled:cursor-not-allowed disabled:from-gray-600 disabled:to-gray-600 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  <span>Processing Deposit...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg
                    className="h-5 w-5"
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
                  <span>
                    {amount && parseFloat(amount) > 0
                      ? `Deposit $${parseFloat(amount).toFixed(2)} ${selectedCurrency}`
                      : "Enter Amount to Deposit"}
                  </span>
                </div>
              )}
            </button>

            {/* Info Section améliorée */}
            <div className="mt-6 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4">
              <div className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                  <svg
                    className="h-4 w-4 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-bold text-blue-300">
                    Deposit Information
                  </h4>
                  <ul className="space-y-1 text-xs text-blue-200/80">
                    <li>
                      • Funds will be available after blockchain confirmation
                    </li>
                    <li>• Typical confirmation time: 2-5 minutes</li>
                    <li>• No additional fees for deposits</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
