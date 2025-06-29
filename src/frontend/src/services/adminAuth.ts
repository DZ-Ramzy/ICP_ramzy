import { Principal } from "@dfinity/principal";
import { walletService } from "./wallet";
import { backendService } from "./backendService";

export interface AdminAuthService {
  isCurrentUserAdmin(): Promise<boolean>;
  getCurrentUserPrincipal(): Promise<Principal | null>;
  setAdmin(principal: Principal): Promise<string>;
  getAdminPrincipal(): Promise<Principal | null>; // Added this method
}

class AdminAuthServiceImpl implements AdminAuthService {
  /**
   * Check if the current caller is admin (uses backend is_admin function)
   */
  async isCurrentUserAdmin(): Promise<boolean> {
    try {
      console.log("🔍 Checking if current user is admin...");
      const result = await backendService.isAdmin();
      console.log("🔍 Admin check result:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to check admin status:", error);
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
      return Principal.fromText(
        "hu4mr-xdpm5-tho4x-tyiqd-nl4og-yiavx-ftzje-toyfl-vwavt-fbpbq-7ae",
      );
    } catch (error) {
      console.error("Failed to get current user principal:", error);
      return null;
    }
  }

  /**
   * Set admin principal (only current admin can do this)
   */
  async setAdmin(principal: Principal): Promise<string> {
    try {
      const result = await backendService.setAdmin(principal);
      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(`Failed to set admin: ${Object.keys(result.Err)[0]}`);
      }
    } catch (error) {
      console.error("Failed to set admin:", error);
      throw error;
    }
  }

  /**
   * Get admin principal from backend
   */
  async getAdminPrincipal(): Promise<Principal | null> {
    try {
      console.log("🔍 Getting admin principal...");
      const result = await backendService.getAdmin();
      console.log("🔍 Admin principal result:", result);
      return result;
    } catch (error) {
      console.error("❌ Failed to get admin principal:", error);
      return null;
    }
  }
}

export const adminAuthService = new AdminAuthServiceImpl();
