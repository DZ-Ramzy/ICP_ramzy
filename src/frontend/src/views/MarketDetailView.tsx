import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { PredictionMarketService } from "../services/predictionMarket";
import { walletService, type WalletInfo } from "../services/wallet";
import { accountService, type AccountBalance } from "../services/account";
import type {
  MarketSummary,
  UserPosition,
} from "../../../declarations/backend/backend.did";
import {
  WalletConnectModal,
  DepositModal,
  AIInsightModal,
  AIInsightButton,
} from "../components";

export function MarketDetailView() {
  const { id } = useParams<{ id: string }>();
  const marketId = id ? parseInt(id) : 0;

  const [market, setMarket] = useState<MarketSummary | null>(null);
  const [positions, setPositions] = useState<UserPosition[]>([]);
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

  // AI Insight state
  const [showAIInsightModal, setShowAIInsightModal] = useState(false);

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
      // Get market data
      const marketData = await PredictionMarketService.getMarket(marketId);
      setMarket(marketData);

      // For user positions, we need a principal - for now, skip it since we don't have proper user auth
      setPositions([]);
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

      // First, deposit ICP to backend (convert USD to ICP for demo purposes)
      const icpAmount = Math.floor(betAmount * 1000); // Convert USD to ICP tokens for demo
      console.log(`💰 Depositing ${icpAmount} ICP for betting...`);

      const depositResult = await PredictionMarketService.deposit(icpAmount);
      if ("Err" in depositResult) {
        throw new Error(`Deposit failed: ${Object.keys(depositResult.Err)[0]}`);
      }

      // Now buy tokens with the deposited ICP
      console.log(`🛒 Buying ${selectedSide} tokens for market ${marketId}...`);
      await PredictionMarketService.buyTokens(
        marketId,
        selectedSide,
        icpAmount, // Use the same amount we just deposited
        0, // No slippage protection for demo
      );

      // Update frontend wallet simulation
      await accountService.placeBet(
        marketId,
        market?.market.title || `Market ${marketId}`,
        selectedSide,
        betAmount,
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

  // Calculate real-time price impact and slippage for current trade amount
  const calculateTradeImpact = (amount: string, side: "Yes" | "No") => {
    if (!market || !amount || parseFloat(amount) <= 0) {
      return { priceImpact: 0, estimatedTokens: 0, newPrice: 0, slippage: 0 };
    }

    const tradeAmount = parseFloat(amount);
    const tradeFee = 0.003; // 0.3% trading fee
    const amountAfterFee = tradeAmount * (1 - tradeFee);

    const yesReserve = Number(market.market.yes_reserve);
    const noReserve = Number(market.market.no_reserve);
    const k = yesReserve * noReserve; // Constant product

    let estimatedTokens = 0;
    let newPrice = 0;
    let originalPrice = 0;

    if (side === "Yes") {
      originalPrice = market.yes_price;
      // Calculate tokens out using AMM formula
      if (amountAfterFee < noReserve) {
        const newNoReserve = noReserve - amountAfterFee;
        const newYesReserve = k / newNoReserve;
        estimatedTokens = newYesReserve - yesReserve;
        newPrice = newNoReserve / (newYesReserve + newNoReserve);
      }
    } else {
      originalPrice = market.no_price;
      if (amountAfterFee < yesReserve) {
        const newYesReserve = yesReserve - amountAfterFee;
        const newNoReserve = k / newYesReserve;
        estimatedTokens = newNoReserve - noReserve;
        newPrice = newYesReserve / (newYesReserve + newNoReserve);
      }
    }

    const priceImpact =
      Math.abs((newPrice - originalPrice) / originalPrice) * 100;
    const effectivePrice = tradeAmount / estimatedTokens;
    const slippage =
      Math.abs((effectivePrice - originalPrice) / originalPrice) * 100;

    return { priceImpact, estimatedTokens, newPrice, slippage };
  };

  const tradeImpact = calculateTradeImpact(quantity, selectedSide);

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
          {/* Market Title and AI Insights */}
          <div className="mb-6">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h1 className="max-w-4xl rounded-xl border border-white/10 bg-black/20 p-4 text-3xl leading-tight font-bold tracking-tight text-white drop-shadow-lg backdrop-blur-sm lg:text-4xl">
                  {market.market.title}
                </h1>
              </div>
              <div className="flex-shrink-0">
                <AIInsightButton
                  onClick={() => setShowAIInsightModal(true)}
                  className="shadow-lg"
                />
              </div>
            </div>
            <p className="max-w-4xl text-lg leading-relaxed text-white/90 lg:text-xl">
              {market.market.description}
            </p>
          </div>

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
                Pool: {market.market.yes_reserve.toLocaleString()}
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
                Pool: {market.market.no_reserve.toLocaleString()}
              </div>
            </div>

            <div className="glass card-hover flex flex-col justify-center rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-white/80">Volume</div>
              <div className="text-2xl font-bold text-white">
                {Number(market.total_volume) > 1000
                  ? `${(Number(market.total_volume) / 1000).toFixed(1)}k`
                  : Number(market.total_volume)}
              </div>
              <div className="text-xs text-white/60">tokens</div>
            </div>
          </div>
        </div>
      </div>

      {/* AMM Information */}
      <div className="glass-hover relative overflow-hidden rounded-2xl p-6">
        <div className="gradient-icp-card absolute inset-0 rounded-2xl opacity-20"></div>

        <div className="relative z-10">
          <h3 className="text-gradient mb-4 flex items-center space-x-3 text-lg font-bold">
            <div className="gradient-icp-primary flex h-6 w-6 items-center justify-center rounded-lg">
              <svg
                className="h-3 w-3 text-white"
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
            <span>AMM Mechanics</span>
          </h3>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="glass card-hover rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-blue-300">
                Constant Product
              </div>
              <div className="text-lg font-bold text-white">
                {(
                  market.market.yes_reserve * market.market.no_reserve
                ).toLocaleString()}
              </div>
              <div className="text-xs text-white/60">k = x × y</div>
            </div>

            <div className="glass card-hover rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-purple-300">
                Total Liquidity
              </div>
              <div className="text-lg font-bold text-white">
                {market.market.icp_liquidity_pool.toLocaleString()}
              </div>
              <div className="text-xs text-white/60">ICP backing</div>
            </div>

            <div className="glass card-hover rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-yellow-300">
                Price Impact
              </div>
              <div className="text-lg font-bold text-white">
                {market.price_impact?.toFixed(2) || "0.00"}%
              </div>
              <div className="text-xs text-white/60">for 100 ICP trade</div>
            </div>

            <div className="glass card-hover rounded-xl p-4 text-center">
              <div className="mb-2 text-sm font-bold text-orange-300">
                Trading Fee
              </div>
              <div className="text-lg font-bold text-white">0.3%</div>
              <div className="text-xs text-white/60">per transaction</div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex items-start space-x-3">
              <div className="gradient-icp-primary flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg">
                <svg
                  className="h-3 w-3 text-white"
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
                <p className="text-sm text-white/80">
                  <strong className="text-white">
                    Automated Market Maker:
                  </strong>{" "}
                  This market uses a constant product formula (x × y = k) where
                  token prices adjust automatically based on supply and demand.
                  When you buy YES tokens, the YES reserve increases and the NO
                  reserve decreases, making YES tokens more expensive and NO
                  tokens cheaper.
                </p>
                <div className="mt-2 text-xs text-white/60">
                  <strong>Price Impact:</strong> How much your trade affects the
                  token price. <strong>Slippage:</strong> The difference between
                  expected and actual execution price.
                </div>
              </div>
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
                {quantity && tradeImpact.estimatedTokens > 0 && (
                  <div className="mt-3 space-y-2">
                    {/* AMM Trade Preview */}
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3 backdrop-blur-sm">
                      <div className="mb-2 text-xs font-bold text-white/80">
                        AMM Trade Preview
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="text-white/60">Estimated Tokens</div>
                          <div className="font-bold text-white">
                            {tradeImpact.estimatedTokens.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60">Trading Fee</div>
                          <div className="font-bold text-orange-300">
                            {formatCurrency(parseFloat(quantity) * 0.003)}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60">Price Impact</div>
                          <div
                            className={`font-bold ${tradeImpact.priceImpact > 5 ? "text-red-300" : tradeImpact.priceImpact > 2 ? "text-yellow-300" : "text-green-300"}`}
                          >
                            {tradeImpact.priceImpact.toFixed(2)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60">Slippage</div>
                          <div
                            className={`font-bold ${tradeImpact.slippage > 3 ? "text-red-300" : tradeImpact.slippage > 1 ? "text-yellow-300" : "text-green-300"}`}
                          >
                            {tradeImpact.slippage.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 border-t border-white/10 pt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/60">
                            New {selectedSide} Price
                          </span>
                          <span className="font-bold text-blue-300">
                            {PredictionMarketService.formatPrice(
                              tradeImpact.newPrice,
                            )}
                          </span>
                        </div>
                      </div>
                      {tradeImpact.priceImpact > 5 && (
                        <div className="mt-2 rounded border border-red-400/30 bg-red-500/20 p-2">
                          <div className="text-xs font-bold text-red-300">
                            ⚠️ High Price Impact
                          </div>
                          <div className="text-xs text-red-200">
                            This trade will significantly move the market price
                          </div>
                        </div>
                      )}
                    </div>
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

              {/* Trade Impact Display - new section */}
              {quantity && (
                <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="mb-2 text-sm font-bold text-white/80">
                    Trade Impact Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-white/60">
                      <div className="text-xs">Price Impact</div>
                      <div className="text-lg font-bold">
                        {tradeImpact.priceImpact.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-white/60">
                      <div className="text-xs">Slippage</div>
                      <div className="text-lg font-bold">
                        {tradeImpact.slippage.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-white/60">
                      <div className="text-xs">Estimated Tokens</div>
                      <div className="text-lg font-bold">
                        {tradeImpact.estimatedTokens.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-white/60">
                      <div className="text-xs">New Price</div>
                      <div className="text-lg font-bold">
                        {PredictionMarketService.formatPrice(
                          tradeImpact.newPrice,
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/70">
                    Note: Price impact and slippage are estimated values and may
                    vary based on market conditions.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AMM Liquidity Curve Visualization */}
      <div className="mt-4 rounded-xl border border-white/10 bg-gradient-to-r from-blue-500/5 to-purple-500/5 p-4">
        <div className="mb-3 flex items-center space-x-2 text-sm font-bold text-white/80">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2V7a2 2 0 012-2h2a2 2 0 002 2v2a2 2 0 002 2h2a2 2 0 012-2V7a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 00-2 2h-2a2 2 0 00-2 2v6a2 2 0 01-2 2H9z"
            />
          </svg>
          <span>AMM Liquidity Pool Balance</span>
        </div>

        <div className="relative">
          {/* Visual representation of token reserves */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="mb-1 text-xs font-bold text-green-300">
                YES Reserve
              </div>
              <div className="relative h-6 overflow-hidden rounded-lg bg-gradient-to-r from-green-500/20 to-green-500/40">
                <div
                  className="h-full rounded-lg bg-green-500/60 transition-all duration-300"
                  style={{
                    width: `${(Number(market.market.yes_reserve) / (Number(market.market.yes_reserve) + Number(market.market.no_reserve))) * 100}%`,
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {Number(market.market.yes_reserve).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-xs text-white/60">⚖️</div>

            <div className="flex-1">
              <div className="mb-1 text-xs font-bold text-red-300">
                NO Reserve
              </div>
              <div className="relative h-6 overflow-hidden rounded-lg bg-gradient-to-r from-red-500/20 to-red-500/40">
                <div
                  className="h-full rounded-lg bg-red-500/60 transition-all duration-300"
                  style={{
                    width: `${(Number(market.market.no_reserve) / (Number(market.market.yes_reserve) + Number(market.market.no_reserve))) * 100}%`,
                  }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                  {Number(market.market.no_reserve).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center">
            <div className="text-xs text-white/60">
              Current ratio:{" "}
              {(
                Number(market.market.yes_reserve) /
                  Number(market.market.no_reserve) || 0
              ).toFixed(2)}
              :1
              <span className="mx-2">•</span>
              Constant Product K:{" "}
              {(
                Number(market.market.yes_reserve) *
                Number(market.market.no_reserve)
              ).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

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
                        position.yes_tokens > 0
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {position.yes_tokens > 0 ? "Y" : "N"}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-white">
                        {position.yes_tokens > 0 ? "Yes" : "No"}
                      </div>
                      <div className="text-xs text-white/60">Position</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {(
                        position.yes_tokens + position.no_tokens
                      ).toLocaleString()}
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

      {/* AI Insight Modal */}
      <AIInsightModal
        isOpen={showAIInsightModal}
        onClose={() => setShowAIInsightModal(false)}
        marketTitle={market.market.title}
        marketDescription={market.market.description}
      />
    </div>
  );
}
