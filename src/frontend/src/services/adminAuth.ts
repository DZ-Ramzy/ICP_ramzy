import { Principal } from "@dfinity/principal";
import { walletService } from "./wallet";
import { PredictionMarketService } from "./predictionMarket";

export interface AdminAuthService {
  isCurrentUserAdmin(): Promise<boolean>;
  getCurrentUserPrincipal(): Promise<Principal | null>;
  getAdminPrincipal(): Promise<Principal | null>;
}

class AdminAuthServiceImpl implements AdminAuthService {
  private adminPrincipal: Principal | null = null;
  private lastCheck: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds cache

  /**
   * Check if the current connected user is the admin
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUserPrincipal();
      if (!currentUser) {
        return false;
      }

      const admin = await this.getAdminPrincipal();
      if (!admin) {
        return false;
      }

      return currentUser.toText() === admin.toText();
    } catch (error) {
      console.error("Failed to check admin status:", error);
      return false;
    }
  }

  /**
   * Get the current user's principal from wallet connection
   */
  async getCurrentUserPrincipal(): Promise<Principal | null> {
    try {
      const wallet = walletService.getWallet();
      if (!wallet || !wallet.isConnected) {
        return null;
      }
      // For development, return the test principal when wallet is connected
      // In production, this should use proper ICP wallet integration
      return Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
    } catch (error) {
      console.error("Failed to get current user principal:", error);
      return null;
    }
  }

  /**
   * Get the admin principal (with caching)
   */
  async getAdminPrincipal(): Promise<Principal | null> {
    const now = Date.now();

    // Use cached value if still valid
    if (this.adminPrincipal && now - this.lastCheck < this.CACHE_DURATION) {
      return this.adminPrincipal;
    }

    try {
      this.adminPrincipal = await PredictionMarketService.getAdmin();
      this.lastCheck = now;
      return this.adminPrincipal;
    } catch (error) {
      console.error("Failed to get admin principal:", error);
      return null;
    }
  }

  /**
   * Clear cache (useful when admin changes)
   */
  clearCache(): void {
    this.adminPrincipal = null;
    this.lastCheck = 0;
  }
}

export const adminAuthService = new AdminAuthServiceImpl();
