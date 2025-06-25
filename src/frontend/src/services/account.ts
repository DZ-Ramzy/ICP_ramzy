// Account management service for deposits, withdrawals, and balance tracking
import { walletService } from "./wallet";

export interface AccountBalance {
  totalBalance: number; // Total USD value
  currencies: {
    [key: string]: {
      amount: number;
      symbol: string;
      usdValue: number;
    };
  };
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "bet_win" | "bet_loss" | "bet_place";
  amount: number;
  currency: string;
  usdValue: number;
  timestamp: Date;
  status: "pending" | "completed" | "failed";
  txHash?: string;
  description: string;
}

export interface UserPosition {
  marketId: number;
  marketTitle: string;
  side: "Yes" | "No";
  shares: number;
  avgPrice: number;
  currentPrice: number;
  investment: number; // USD invested
  currentValue: number; // Current USD value
  pnl: number; // Profit/Loss in USD
  pnlPercentage: number;
}

export interface PnLSummary {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  unrealizedPnL: number;
  realizedPnL: number;
  winRate: number; // Percentage of winning trades
}

class AccountService {
  private balance: AccountBalance = {
    totalBalance: 0,
    currencies: {},
  };

  private transactions: Transaction[] = [];
  private positions: UserPosition[] = [];
  private listeners: ((data: any) => void)[] = [];
  private currentWalletAddress: string | null = null;

  // Subscribe to account changes
  subscribe(listener: (data: any) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) =>
      listener({
        balance: this.balance,
        transactions: this.transactions,
        positions: this.positions,
      }),
    );

    // Auto-save to localStorage if wallet is connected
    if (this.currentWalletAddress) {
      this.saveAccountState(this.currentWalletAddress);
    }
  }

  // Get current account balance
  getBalance(): AccountBalance {
    return this.balance;
  }

  // Get transaction history
  getTransactions(): Transaction[] {
    return this.transactions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  // Get user positions
  getPositions(): UserPosition[] {
    return this.positions;
  }

  // Calculate PnL summary
  getPnLSummary(): PnLSummary {
    const totalInvested = this.positions.reduce(
      (sum, pos) => sum + pos.investment,
      0,
    );
    const currentValue = this.positions.reduce(
      (sum, pos) => sum + pos.currentValue,
      0,
    );
    const totalPnL = currentValue - totalInvested;
    const totalPnLPercentage =
      totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    // Calculate unrealized PnL (open positions)
    const unrealizedPnL = this.positions.reduce((sum, pos) => sum + pos.pnl, 0);

    // Calculate realized PnL from completed transactions
    const realizedPnL = this.transactions
      .filter((tx) => tx.type === "bet_win" || tx.type === "bet_loss")
      .reduce(
        (sum, tx) => sum + (tx.type === "bet_win" ? tx.usdValue : -tx.usdValue),
        0,
      );

    // Calculate win rate
    const completedTrades = this.transactions.filter(
      (tx) => tx.type === "bet_win" || tx.type === "bet_loss",
    );
    const winningTrades = this.transactions.filter(
      (tx) => tx.type === "bet_win",
    );
    const winRate =
      completedTrades.length > 0
        ? (winningTrades.length / completedTrades.length) * 100
        : 0;

    return {
      totalInvested,
      currentValue,
      totalPnL,
      totalPnLPercentage,
      unrealizedPnL,
      realizedPnL,
      winRate,
    };
  }

  // Deposit funds from wallet
  async depositFunds(currency: string, amount: number): Promise<Transaction> {
    const wallet = walletService.getWallet();
    if (!wallet?.isConnected) {
      throw new Error("Wallet not connected");
    }

    // Simulate deposit transaction
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "deposit",
      amount,
      currency,
      usdValue: await this.getUSDValue(currency, amount),
      timestamp: new Date(),
      status: "pending",
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      description: `Deposit ${amount} ${currency}`,
    };

    this.transactions.push(transaction);

    // Simulate blockchain confirmation delay
    setTimeout(() => {
      transaction.status = "completed";
      this.addToBalance(currency, amount, transaction.usdValue);
      this.notifyListeners();
    }, 2000);

    this.notifyListeners();
    return transaction;
  }

  // Withdraw funds to wallet
  async withdrawFunds(currency: string, amount: number): Promise<Transaction> {
    const wallet = walletService.getWallet();
    if (!wallet?.isConnected) {
      throw new Error("Wallet not connected");
    }

    const currencyBalance = this.balance.currencies[currency];
    if (!currencyBalance || currencyBalance.amount < amount) {
      throw new Error("Insufficient balance");
    }

    const usdValue = await this.getUSDValue(currency, amount);

    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "withdrawal",
      amount,
      currency,
      usdValue,
      timestamp: new Date(),
      status: "pending",
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      description: `Withdraw ${amount} ${currency}`,
    };

    this.transactions.push(transaction);

    // Simulate blockchain confirmation delay
    setTimeout(() => {
      transaction.status = "completed";
      this.removeFromBalance(currency, amount, usdValue);
      this.notifyListeners();
    }, 2000);

    this.notifyListeners();
    return transaction;
  }

  // Place a bet (deduct from balance)
  async placeBet(
    marketId: number,
    marketTitle: string,
    side: "Yes" | "No",
    amount: number,
  ): Promise<void> {
    if (this.balance.totalBalance < amount) {
      throw new Error("Insufficient balance");
    }

    // Deduct from USD balance
    const transaction: Transaction = {
      id: Date.now().toString(),
      type: "bet_place",
      amount,
      currency: "USD",
      usdValue: amount,
      timestamp: new Date(),
      status: "completed",
      description: `Bet $${amount} on ${marketTitle} (${side})`,
    };

    this.transactions.push(transaction);
    this.removeFromBalance("USD", amount, amount);

    // Add to positions
    const position: UserPosition = {
      marketId,
      marketTitle,
      side,
      shares: amount, // Simplified: 1 share = $1
      avgPrice: 1,
      currentPrice: 1,
      investment: amount,
      currentValue: amount,
      pnl: 0,
      pnlPercentage: 0,
    };

    this.positions.push(position);
    this.notifyListeners();
  }

  // Add to balance
  private addToBalance(currency: string, amount: number, usdValue: number) {
    if (!this.balance.currencies[currency]) {
      this.balance.currencies[currency] = {
        amount: 0,
        symbol: currency,
        usdValue: 0,
      };
    }

    this.balance.currencies[currency].amount += amount;
    this.balance.currencies[currency].usdValue += usdValue;
    this.balance.totalBalance += usdValue;
  }

  // Remove from balance
  private removeFromBalance(
    currency: string,
    amount: number,
    usdValue: number,
  ) {
    if (this.balance.currencies[currency]) {
      this.balance.currencies[currency].amount -= amount;
      this.balance.currencies[currency].usdValue -= usdValue;
      this.balance.totalBalance -= usdValue;

      // Remove currency if balance is 0
      if (this.balance.currencies[currency].amount <= 0) {
        delete this.balance.currencies[currency];
      }
    }
  }

  // Get USD value for a currency amount (mock rates)
  private async getUSDValue(currency: string, amount: number): Promise<number> {
    const mockRates: { [key: string]: number } = {
      USDT: 1.0,
      USDC: 1.0,
      ETH: 3500,
      BTC: 65000,
      ICP: 12.5,
      USD: 1.0,
    };

    return amount * (mockRates[currency] || 1);
  }

  // Get supported currencies
  getSupportedCurrencies() {
    return [
      { symbol: "USDT", name: "Tether USD", icon: "₮" },
      { symbol: "USDC", name: "USD Coin", icon: "💲" },
      { symbol: "ETH", name: "Ethereum", icon: "⟠" },
      { symbol: "BTC", name: "Bitcoin", icon: "₿" },
      { symbol: "ICP", name: "Internet Computer", icon: "∞" },
    ];
  }

  // Initialize demo account with some balance
  initDemoAccount() {
    this.balance = {
      totalBalance: 1000,
      currencies: {
        USD: {
          amount: 1000,
          symbol: "USD",
          usdValue: 1000,
        },
      },
    };

    // Add some demo transactions
    this.transactions = [
      {
        id: "1",
        type: "deposit",
        amount: 1000,
        currency: "USDT",
        usdValue: 1000,
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        status: "completed",
        txHash: "0x1234567890abcdef",
        description: "Initial deposit",
      },
    ];

    this.notifyListeners();
  }

  // Initialize account for a connected wallet
  initializeAccount(walletAddress: string) {
    this.currentWalletAddress = walletAddress;

    // Check if this wallet already has an account
    const existingAccountKey = `account_${walletAddress}`;
    const existingAccount = localStorage.getItem(existingAccountKey);

    if (existingAccount) {
      try {
        const accountData = JSON.parse(existingAccount);
        this.balance = accountData.balance || {
          totalBalance: 0,
          currencies: {},
        };
        this.transactions = (accountData.transactions || []).map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp),
        }));
        this.positions = accountData.positions || [];
      } catch (error) {
        console.error("Error loading existing account:", error);
        this.initDemoAccount();
      }
    } else {
      // New wallet, initialize with demo account
      this.initDemoAccount();
    }

    // Save account state for this wallet
    this.saveAccountState(walletAddress);
  }

  // Save account state to localStorage
  private saveAccountState(walletAddress: string) {
    const accountKey = `account_${walletAddress}`;
    const accountData = {
      balance: this.balance,
      transactions: this.transactions,
      positions: this.positions,
    };

    try {
      localStorage.setItem(accountKey, JSON.stringify(accountData));
    } catch (error) {
      console.error("Error saving account state:", error);
    }
  }
}

export const accountService = new AccountService();
