// Wallet connection service for the prediction market dApp
// This service handles crypto wallet connections and interactions

export interface WalletInfo {
  address: string;
  network: string;
  balance?: string;
  isConnected: boolean;
}

export interface WalletProvider {
  name: string;
  icon: string;
  isInstalled: boolean;
  connect: () => Promise<WalletInfo>;
  disconnect: () => Promise<void>;
}

class WalletService {
  private walletInfo: WalletInfo | null = null;
  private listeners: ((wallet: WalletInfo | null) => void)[] = [];

  // Get current wallet state
  getWallet(): WalletInfo | null {
    return this.walletInfo;
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.walletInfo?.isConnected ?? false;
  }

  // Subscribe to wallet state changes
  subscribe(listener: (wallet: WalletInfo | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners of wallet state change
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.walletInfo));
  }

  // Get available wallet providers
  getAvailableWallets(): WalletProvider[] {
    const wallets: WalletProvider[] = [];

    // MetaMask
    if (typeof window !== "undefined" && (window as any).ethereum) {
      wallets.push({
        name: "MetaMask",
        icon: "🦊",
        isInstalled: true,
        connect: () => this.connectMetaMask(),
        disconnect: () => this.disconnect(),
      });
    }

    // Phantom (Solana)
    if (typeof window !== "undefined" && (window as any).phantom?.solana) {
      wallets.push({
        name: "Phantom",
        icon: "👻",
        isInstalled: true,
        connect: () => this.connectPhantom(),
        disconnect: () => this.disconnect(),
      });
    }

    // Internet Identity (ICP native)
    wallets.push({
      name: "Internet Identity",
      icon: "∞",
      isInstalled: true,
      connect: () => this.connectInternetIdentity(),
      disconnect: () => this.disconnect(),
    });

    // If no wallets installed, show installation options
    if (wallets.length === 0) {
      wallets.push(
        {
          name: "MetaMask",
          icon: "🦊",
          isInstalled: false,
          connect: () => this.installWallet("https://metamask.io/"),
          disconnect: () => Promise.resolve(),
        },
        {
          name: "Phantom",
          icon: "👻",
          isInstalled: false,
          connect: () => this.installWallet("https://phantom.app/"),
          disconnect: () => Promise.resolve(),
        },
      );
    }

    return wallets;
  }

  // Connect to MetaMask
  private async connectMetaMask(): Promise<WalletInfo> {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        throw new Error("MetaMask not installed");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get balance
      const balance = await ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });

      const walletInfo: WalletInfo = {
        address: accounts[0],
        network: "Ethereum",
        balance: this.formatBalance(balance, "ETH"),
        isConnected: true,
      };

      this.walletInfo = walletInfo;
      this.notifyListeners();
      return walletInfo;
    } catch (error) {
      console.error("MetaMask connection failed:", error);
      throw new Error("Failed to connect to MetaMask");
    }
  }

  // Connect to Phantom (Solana)
  private async connectPhantom(): Promise<WalletInfo> {
    try {
      const phantom = (window as any).phantom?.solana;
      if (!phantom) {
        throw new Error("Phantom wallet not installed");
      }

      const response = await phantom.connect();
      if (!response.publicKey) {
        throw new Error("Failed to connect to Phantom");
      }

      // Get balance (simplified - in real implementation you'd call Solana RPC)
      const balance = await phantom
        .request({
          method: "getBalance",
          params: [response.publicKey.toString()],
        })
        .catch(() => "0");

      const walletInfo: WalletInfo = {
        address: response.publicKey.toString(),
        network: "Solana",
        balance: this.formatBalance(balance, "SOL"),
        isConnected: true,
      };

      this.walletInfo = walletInfo;
      this.notifyListeners();
      return walletInfo;
    } catch (error) {
      console.error("Phantom connection failed:", error);
      throw new Error("Failed to connect to Phantom wallet");
    }
  }

  // Connect to Internet Identity (ICP native)
  private async connectInternetIdentity(): Promise<WalletInfo> {
    try {
      // In a real implementation, you'd use @dfinity/auth-client
      // For now, we'll simulate the connection with a valid principal
      const mockPrincipal =
        "hu4mr-xdpm5-tho4x-tyiqd-nl4og-yiavx-ftzje-toyfl-vwavt-fbpbq-7ae";

      const walletInfo: WalletInfo = {
        address: mockPrincipal,
        network: "Internet Computer",
        balance: "1,000 ICP",
        isConnected: true,
      };

      this.walletInfo = walletInfo;
      this.notifyListeners();
      return walletInfo;
    } catch (error) {
      console.error("Internet Identity connection failed:", error);
      throw new Error("Failed to connect to Internet Identity");
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    this.walletInfo = null;
    this.notifyListeners();
  }

  // Helper to open wallet installation page
  private async installWallet(url: string): Promise<WalletInfo> {
    window.open(url, "_blank");
    throw new Error("Please install the wallet and refresh the page");
  }

  // Format balance for display
  private formatBalance(balance: string, symbol: string): string {
    try {
      // Convert from wei/lamports to main unit (simplified)
      const num = parseInt(balance, 16) || parseInt(balance, 10) || 0;
      const formatted = (num / Math.pow(10, 18)).toFixed(4);
      return `${formatted} ${symbol}`;
    } catch {
      return `0 ${symbol}`;
    }
  }

  // Get formatted address for display
  getDisplayAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export const walletService = new WalletService();
