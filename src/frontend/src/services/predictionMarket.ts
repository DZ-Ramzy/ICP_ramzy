import { backend } from "../../../declarations/backend";
import { Principal } from "@dfinity/principal";
import type {
  AmmMarket,
  MarketSummary,
  UserPosition,
} from "../../../declarations/backend/backend.did";

// Re-export types from the generated declarations
export type { AmmMarket, MarketSummary, UserPosition };

export class PredictionMarketService {
  /**
   * Set the admin principal for the prediction market
   */
  static async setAdmin(adminPrincipal: Principal): Promise<string> {
    try {
      const result = await backend.set_admin(adminPrincipal);
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
   * Check if current caller is admin - NOT AVAILABLE IN CURRENT BACKEND
   */
  static async isAdmin(): Promise<boolean> {
    throw new Error("isAdmin is not available in the current backend API");
  }

  /**
   * Get all markets with pricing information
   */
  static async getMarkets(): Promise<MarketSummary[]> {
    try {
      const markets = await backend.get_markets();
      return markets;
    } catch (error) {
      console.error("Failed to get markets:", error);
      throw error;
    }
  }

  /**
   * Get a specific market by ID
   */
  static async getMarket(marketId: number): Promise<MarketSummary | null> {
    try {
      const result = await backend.get_market(BigInt(marketId));
      return result.length > 0 ? result[0]! : null;
    } catch (error) {
      console.error("Failed to get market:", error);
      throw error;
    }
  }

  /**
   * Get user positions for current user
   */
  static async getUserPositions(_user: Principal): Promise<UserPosition[]> {
    try {
      return await backend.get_all_user_positions();
    } catch (error) {
      console.error("Failed to get user positions:", error);
      throw error;
    }
  }

  /**
   * Get specific user position for a market (for current user)
   */
  static async getUserPosition(
    _user: Principal,
    marketId: number,
  ): Promise<UserPosition | null> {
    try {
      const result = await backend.get_user_position(BigInt(marketId));
      return result.length > 0 ? result[0]! : null;
    } catch (error) {
      console.error("Failed to get user position:", error);
      throw error;
    }
  }

  /**
   * Get user balance by principal
   */
  static async getUserBalance(user: Principal): Promise<bigint> {
    try {
      return await backend.get_balance_of(user);
    } catch (error) {
      console.error("Failed to get user balance:", error);
      throw error;
    }
  }

  /**
   * Deposit ICP to user balance
   */
  static async deposit(amount: number): Promise<{ Ok: string } | { Err: any }> {
    try {
      return await backend.deposit_icp(BigInt(amount));
    } catch (error) {
      console.error("Failed to deposit:", error);
      throw error;
    }
  }

  /**
   * Display status in human-readable format
   */
  static getStatusDisplay(status: any): string {
    if (typeof status === "object" && status !== null) {
      if ("Open" in status) return "Open";
      if ("Closed" in status) return "Closed";
      if ("Resolved" in status) return "Resolved";
      if ("Frozen" in status) return "Frozen";
    }
    return "Unknown";
  }

  // ============================================================
  // DISABLED FUNCTIONS - NOT AVAILABLE IN CURRENT BACKEND
  // ============================================================

  /**
   * Create a new prediction market
   */
  static async createMarket(
    title: string,
    description: string,
    initialLiquidity: number = 5000,
  ): Promise<number> {
    try {
      console.log("🏗️ Creating market:", {
        title,
        description,
        initialLiquidity,
      });

      // First, automatically deposit enough ICP for demo purposes
      const depositAmount = initialLiquidity + 2000; // Extra buffer for safety
      console.log("💰 Depositing ICP:", depositAmount);

      const depositResult = await backend.deposit_icp(BigInt(depositAmount));
      console.log("💰 Deposit result:", depositResult);

      if ("Err" in depositResult) {
        throw new Error(`Deposit failed: ${Object.keys(depositResult.Err)[0]}`);
      }

      console.log("🏗️ Creating market in backend...");
      const result = await backend.create_market(
        title,
        description,
        BigInt(initialLiquidity),
      );

      console.log("🏗️ Market creation result:", result);

      if ("Ok" in result) {
        const marketId = Number(result.Ok);
        console.log("✅ Market created successfully with ID:", marketId);
        return marketId;
      } else {
        throw new Error(
          `Failed to create market: ${Object.keys(result.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("❌ Error creating market:", error);
      throw error;
    }
  }

  /**
   * Buy tokens for a specific market
   */
  static async buyTokens(
    marketId: number,
    side: "Yes" | "No",
    icpAmount: number,
    minTokensOut: number = 0,
  ): Promise<any> {
    try {
      console.log(`🛒 Buying ${side} tokens for market ${marketId}:`, {
        icpAmount,
        minTokensOut,
      });

      const result =
        side === "Yes"
          ? await backend.buy_yes_tokens(
              BigInt(marketId),
              BigInt(icpAmount),
              BigInt(minTokensOut),
            )
          : await backend.buy_no_tokens(
              BigInt(marketId),
              BigInt(icpAmount),
              BigInt(minTokensOut),
            );

      if ("Ok" in result) {
        console.log("✅ Tokens purchased successfully:", result.Ok);
        return result.Ok;
      } else {
        throw new Error(`Failed to buy tokens: ${Object.keys(result.Err)[0]}`);
      }
    } catch (error) {
      console.error("❌ Error buying tokens:", error);
      throw error;
    }
  }

  /**
   * Resolve a market with a result
   */
  static async closeMarket(
    marketId: number,
    result: "Yes" | "No",
  ): Promise<string> {
    try {
      console.log(`🔒 Closing market ${marketId} with result: ${result}`);

      const outcome = result === "Yes" ? { Yes: null } : { No: null };
      const resolveResult = await backend.resolve_market(
        BigInt(marketId),
        outcome,
      );

      if ("Ok" in resolveResult) {
        console.log("✅ Market closed successfully:", resolveResult.Ok);
        return resolveResult.Ok;
      } else {
        throw new Error(
          `Failed to close market: ${Object.keys(resolveResult.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("❌ Error closing market:", error);
      throw error;
    }
  }

  /**
   * Sell user tokens
   */
  static async sellTokens(
    marketId: number,
    side: "Yes" | "No",
    tokenAmount: number,
    minIcpOut: number = 0,
  ): Promise<any> {
    try {
      console.log(`💰 Selling ${side} tokens for market ${marketId}:`, {
        tokenAmount,
        minIcpOut,
      });

      const result =
        side === "Yes"
          ? await backend.sell_yes_tokens(
              BigInt(marketId),
              BigInt(tokenAmount),
              BigInt(minIcpOut),
            )
          : await backend.sell_no_tokens(
              BigInt(marketId),
              BigInt(tokenAmount),
              BigInt(minIcpOut),
            );

      if ("Ok" in result) {
        console.log("✅ Tokens sold successfully:", result.Ok);
        return result.Ok;
      } else {
        throw new Error(`Failed to sell tokens: ${Object.keys(result.Err)[0]}`);
      }
    } catch (error) {
      console.error("❌ Error selling tokens:", error);
      throw error;
    }
  }

  /**
   * Calculate buy quote for tokens
   */
  static async getBuyQuote(
    marketId: number,
    icpAmount: number,
    tokenType: "Yes" | "No",
  ): Promise<any> {
    try {
      const result = await backend.get_buy_quote(
        BigInt(marketId),
        BigInt(icpAmount),
        tokenType === "Yes" ? { Yes: null } : { No: null },
      );

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(
          `Failed to get buy quote: ${Object.keys(result.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("Failed to get buy quote:", error);
      throw error;
    }
  }

  /**
   * Calculate sell quote for tokens
   */
  static async getSellQuote(
    marketId: number,
    tokenAmount: number,
    tokenType: "Yes" | "No",
  ): Promise<any> {
    try {
      const result = await backend.get_sell_quote(
        BigInt(marketId),
        BigInt(tokenAmount),
        tokenType === "Yes" ? { Yes: null } : { No: null },
      );

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(
          `Failed to get sell quote: ${Object.keys(result.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("Failed to get sell quote:", error);
      throw error;
    }
  }

  /**
   * Claim reward for winning tokens (NOT AVAILABLE)
   */
  static async claimReward(_marketId: number): Promise<any> {
    throw new Error(
      "claimReward function is not available in the current backend",
    );
  }

  /**
   * Get user's claims history (NOT AVAILABLE)
   */
  static async getUserClaims(): Promise<any[]> {
    throw new Error(
      "getUserClaims function is not available in the current backend",
    );
  }

  /**
   * Helper function to format prices as percentages
   */
  static formatPrice(price: number): string {
    return `${(price * 100).toFixed(1)}%`;
  }

  /**
   * Helper function to determine side display
   */
  static getSideDisplay(result: any): string {
    if (!result) return "Unknown";

    // Handle optional array format from Candid: [] | [TokenType]
    if (Array.isArray(result)) {
      if (result.length === 0) return "Unknown";
      const side = result[0];
      if ("Yes" in side) return "YES";
      if ("No" in side) return "NO";
    }

    // Handle direct object format: { Yes: null } or { No: null }
    if (typeof result === "object" && result !== null) {
      if ("Yes" in result) return "YES";
      if ("No" in result) return "NO";
    }

    return "Unknown";
  }

  /**
   * Get admin principal (NOT AVAILABLE - use adminAuthService.getAdminPrincipal instead)
   */
  static async getAdmin(): Promise<Principal | null> {
    throw new Error(
      "getAdmin function is not available in the current backend - use adminAuthService.getAdminPrincipal instead",
    );
  }

  /**
   * Analyze market with AI (NOW AVAILABLE)
   */
  static async analyzeMarket(marketId: number): Promise<string> {
    try {
      console.log("🤖 Analyzing market:", marketId);
      const result = await backend.analyze_market(BigInt(marketId));

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(
          `Failed to analyze market: ${Object.keys(result.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("Failed to analyze market:", error);
      throw error;
    }
  }

  /**
   * Inspect market (DEBUG FUNCTION - NOT AVAILABLE)
   */
  static inspectMarket(market: any): void {
    console.log("=== Market Inspection (DISABLED) ===");
    console.log("Market:", market);
    console.log("Market inspection is disabled in the current backend");
  }
}

// Default export for compatibility
export default PredictionMarketService;
