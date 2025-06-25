import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PredictionMarketService } from "../services/predictionMarket";
import { walletService, type WalletInfo } from "../services/wallet";
import { accountService, type AccountBalance } from "../services/account";
import { WalletConnectModal, DepositModal } from "../components";

interface MarketSummary {
  market: {
    id: number;
    title: string;
    description: string;
    status: any;
    result?: any;
    yes_pool: number;
    no_pool: number;
  };
  yes_price: number;
  no_price: number;
  total_volume: number;
}

interface Position {
  user_principal: any;
  market_id: number;
  quantity: number;
  side: any;
}

export function MarketDetailView() {
  const { id } = useParams<{ id: string }>();
  const marketId = id ? parseInt(id) : 0;

  const [market, setMarket] = useState<MarketSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wallet state
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Account state
  const [balance, setBalance] = useState<AccountBalance>({
    totalBalance: 0,
    currencies: {},
  });

  // Trading form state
  const [selectedSide, setSelectedSide] = useState<"Yes" | "No">("Yes");
  const [quantity, setQuantity] = useState("");
  const [tradingLoading, setTradingLoading] = useState(false);

  useEffect(() => {
    if (marketId) {
      loadMarketData();
    }
  }, [marketId]);

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = walletService.subscribe((walletInfo) => {
      setWallet(walletInfo);

      // Initialize account when wallet connects
      if (walletInfo?.isConnected) {
        accountService.initializeAccount(walletInfo.address);
      }
    });

    // Set initial state
    const initialWallet = walletService.getWallet();
    setWallet(initialWallet);

    if (initialWallet?.isConnected) {
      accountService.initializeAccount(initialWallet.address);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (wallet?.isConnected) {
      // Subscribe to account balance changes
      const updateBalance = () => {
        setBalance(accountService.getBalance());
      };

      updateBalance();
      const unsubscribeAccount = accountService.subscribe(updateBalance);

      return unsubscribeAccount;
    }
  }, [wallet?.isConnected]);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const [marketData, userPositions] = await Promise.all([
        PredictionMarketService.getMarket(marketId),
        PredictionMarketService.getUserPositions(marketId),
      ]);

      setMarket(marketData);
      setPositions(userPositions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load market data",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      const analysisResult =
        await PredictionMarketService.analyzeMarket(marketId);
      setAnalysis(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analysis");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleTrade = async () => {
    // Check if wallet is connected first
    if (!wallet?.isConnected) {
      setShowWalletModal(true);
      return;
    }

    if (!quantity) {
      setError("Please enter bet amount");
      return;
    }

    const betAmount = parseFloat(quantity);
    if (betAmount <= 0) {
      setError("Bet amount must be greater than 0");
      return;
    }

    if (betAmount > balance.totalBalance) {
      setError(
        `Insufficient balance. You have $${balance.totalBalance.toFixed(2)} available`,
      );
      return;
    }

    try {
      setTradingLoading(true);

      // Place bet using account service
      await accountService.placeBet(
        marketId,
        market?.market.title || `Market ${marketId}`,
        selectedSide,
        betAmount,
      );

      // Update prediction market service (backend call)
      await PredictionMarketService.buyTokens(
        marketId,
        selectedSide,
        Math.floor(betAmount), // Convert to shares
        Math.floor(betAmount * 1000), // Convert to tokens for backend
      );

      // Reset form and reload data
      setQuantity("");
      await loadMarketData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute trade");
    } finally {
      setTradingLoading(false);
    }
  };

  const handleWalletConnect = (walletInfo: WalletInfo) => {
    setWallet(walletInfo);
    setShowWalletModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="py-20 text-center">
        <div className="glass-hover mx-auto max-w-md rounded-3xl p-12">
          <div className="gradient-icp-card mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
            <svg
              className="h-10 w-10 text-white/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Market not found
          </h2>
          <Link
            to="/"
            className="gradient-icp-primary inline-flex items-center space-x-2 rounded-xl px-6 py-3 font-medium text-white shadow-xl transition-all duration-300 hover:scale-105"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to Markets</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOpen =
    PredictionMarketService.getStatusDisplay(market.market.status) === "Open";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="group flex items-center space-x-2 font-medium text-white/80 transition-all duration-200 hover:text-white"
        >
          <svg
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>Back to Markets</span>
        </Link>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold backdrop-blur-sm ${
            isOpen
              ? "border border-green-400/30 bg-green-500/20 text-green-300"
              : "border border-gray-400/30 bg-gray-500/20 text-gray-300"
          }`}
        >
          {PredictionMarketService.getStatusDisplay(market.market.status)}
        </span>
      </div>

      {/* Market Info */}
      <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
        <div className="gradient-icp-card absolute inset-0 rounded-2xl opacity-30"></div>

        <div className="relative z-10">
          <h1 className="text-gradient mb-4 text-3xl font-bold">
            {market.market.title}
          </h1>
          <p className="mb-6 text-lg leading-relaxed text-white/80">
            {market.market.description}
          </p>

          {/* Prices - more compact layout */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="glass card-hover rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-green-300">YES</div>
              <div className="mb-3 text-2xl font-bold text-white">
                {PredictionMarketService.formatPrice(market.yes_price)}
              </div>
              <div className="mb-2 h-1.5 w-full rounded-full bg-green-900/30">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-300 transition-all duration-500"
                  style={{ width: `${market.yes_price * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-green-300/80">
                Pool: {market.market.yes_pool.toLocaleString()}
              </div>
            </div>

            <div className="glass card-hover rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-red-300">NO</div>
              <div className="mb-3 text-2xl font-bold text-white">
                {PredictionMarketService.formatPrice(market.no_price)}
              </div>
              <div className="mb-2 h-1.5 w-full rounded-full bg-red-900/30">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-red-400 to-red-300 transition-all duration-500"
                  style={{ width: `${market.no_price * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-red-300/80">
                Pool: {market.market.no_pool.toLocaleString()}
              </div>
            </div>

            <div className="glass card-hover flex flex-col justify-center rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-white/80">Volume</div>
              <div className="text-2xl font-bold text-white">
                {market.total_volume > 1000
                  ? `${(market.total_volume / 1000).toFixed(1)}k`
                  : market.total_volume}
              </div>
              <div className="text-xs text-white/60">tokens</div>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Interface */}
      {isOpen && (
        <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
          <div className="gradient-icp-card absolute inset-0 rounded-2xl opacity-20"></div>

          <div className="relative z-10">
            <h2 className="text-gradient mb-4 flex items-center space-x-3 text-xl font-bold">
              <div className="gradient-icp-primary flex h-7 w-7 items-center justify-center rounded-lg">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span>Place a Trade</span>
            </h2>

            <div className="space-y-4">
              {/* Side selection */}
              <div>
                <label className="mb-3 block text-sm font-bold text-white/80">
                  Choose side
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedSide("Yes")}
                    className={`rounded-xl p-4 font-bold transition-all duration-300 ${
                      selectedSide === "Yes"
                        ? "scale-105 bg-gradient-to-r from-green-500 to-green-400 text-white shadow-xl"
                        : "glass border border-green-400/30 text-green-300 hover:bg-green-500/20"
                    }`}
                  >
                    <div className="mb-1 text-lg">YES</div>
                    <div className="text-sm opacity-80">
                      {PredictionMarketService.formatPrice(market.yes_price)}
                    </div>
                  </button>
                  <button
                    onClick={() => setSelectedSide("No")}
                    className={`rounded-xl p-4 font-bold transition-all duration-300 ${
                      selectedSide === "No"
                        ? "scale-105 bg-gradient-to-r from-red-500 to-red-400 text-white shadow-xl"
                        : "glass border border-red-400/30 text-red-300 hover:bg-red-500/20"
                    }`}
                  >
                    <div className="mb-1 text-lg">NO</div>
                    <div className="text-sm opacity-80">
                      {PredictionMarketService.formatPrice(market.no_price)}
                    </div>
                  </button>
                </div>
              </div>

              {/* Account Balance Display */}
              {wallet?.isConnected && (
                <div className="mb-6 rounded-xl border border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white/60">
                        Available Balance
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(balance.totalBalance)}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDepositModal(true)}
                      className="rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:from-blue-500/30 hover:to-purple-500/30"
                    >
                      Add Funds
                    </button>
                  </div>
                </div>
              )}

              {/* Bet Amount input */}
              <div>
                <label className="mb-3 block text-sm font-bold text-white/80">
                  Bet Amount (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="glass w-full rounded-xl border border-white/20 px-4 py-4 pl-8 text-white placeholder-white/50 transition-all duration-300 focus:border-white/40 focus:outline-none"
                    placeholder="Enter bet amount"
                    min="1"
                    max={balance.totalBalance}
                    step="0.01"
                  />
                  <div className="absolute top-1/2 left-3 -translate-y-1/2 transform text-white/60">
                    $
                  </div>
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 transform text-white/60">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                </div>
                {quantity && (
                  <div className="mt-2 text-sm text-white/60">
                    Potential return:{" "}
                    {formatCurrency(
                      parseFloat(quantity || "0") *
                        (selectedSide === "Yes"
                          ? market?.yes_price || 1
                          : market?.no_price || 1),
                    )}
                  </div>
                )}
              </div>

              {/* Trade button */}
              <button
                onClick={handleTrade}
                disabled={
                  tradingLoading ||
                  !wallet?.isConnected ||
                  !quantity ||
                  parseFloat(quantity || "0") > balance.totalBalance
                }
                className={`flex w-full items-center justify-center space-x-3 rounded-xl px-6 py-4 text-lg font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  wallet?.isConnected
                    ? "gradient-icp-primary"
                    : "gradient-icp-warm"
                }`}
              >
                {tradingLoading ? (
                  <>
                    <div className="loading-spinner h-5 w-5"></div>
                    <span>Executing Trade...</span>
                  </>
                ) : !wallet?.isConnected ? (
                  <>
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
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>Connect Wallet to Bet</span>
                  </>
                ) : (
                  <>
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>
                      Bet{" "}
                      {quantity ? formatCurrency(parseFloat(quantity)) : "$0"}{" "}
                      on {selectedSide}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Positions */}
      {positions.length > 0 && (
        <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
          <div className="gradient-icp-card absolute inset-0 rounded-2xl opacity-20"></div>

          <div className="relative z-10">
            <h2 className="text-gradient mb-4 flex items-center space-x-3 text-xl font-bold">
              <div className="gradient-icp-secondary flex h-7 w-7 items-center justify-center rounded-lg">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <span>Your Positions</span>
            </h2>
            <div className="grid gap-3">
              {positions.map((position, index) => (
                <div
                  key={index}
                  className="glass card-hover flex items-center justify-between rounded-xl p-3"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        PredictionMarketService.getSideDisplay(
                          position.side,
                        ) === "YES"
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {PredictionMarketService.getSideDisplay(
                          position.side,
                        ) === "YES"
                          ? "Y"
                          : "N"}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {PredictionMarketService.getSideDisplay(position.side)}
                      </div>
                      <div className="text-xs text-white/60">Position</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {position.quantity.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/60">tokens</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
        <div className="gradient-icp-accent absolute inset-0 rounded-2xl opacity-10"></div>

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-gradient flex items-center space-x-3 text-xl font-bold">
              <div className="gradient-icp-accent flex h-7 w-7 items-center justify-center rounded-lg">
                <span className="text-sm text-white">🤖</span>
              </div>
              <span>AI Market Analysis</span>
            </h2>
            <button
              onClick={loadAnalysis}
              disabled={analysisLoading}
              className="gradient-icp-accent flex items-center space-x-2 rounded-xl px-4 py-2 font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50"
            >
              {analysisLoading ? (
                <>
                  <div className="loading-spinner h-4 w-4"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span>Get Analysis</span>
                </>
              )}
            </button>
          </div>

          {analysis ? (
            <div className="glass rounded-2xl border-l-4 border-purple-400 p-6">
              <p className="leading-relaxed whitespace-pre-wrap text-white/90">
                {analysis}
              </p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="gradient-icp-accent mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl opacity-20">
                <svg
                  className="h-8 w-8 text-white/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <p className="text-white/60 italic">
                Click "Get Analysis" to see AI-powered insights about this
                market's price movements.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-hover rounded-2xl border border-red-400/20 bg-red-50/10 p-6 backdrop-blur-xl">
          <div className="flex items-start space-x-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
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
            </div>
            <div className="flex-1">
              <h3 className="mb-1 font-bold text-red-300">Error</h3>
              <p className="mb-3 text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm font-medium text-red-300 transition-colors duration-200 hover:text-red-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
      />

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
    </div>
  );
}
