import { backend } from "../../../declarations/backend";
import { Principal } from "@dfinity/principal";

// Type definitions for our AMM prediction market
export interface AmmMarket {
  id: number;
  title: string;
  description: string;
  yes_reserve: number;
  no_reserve: number;
  icp_liquidity_pool: number;
  status: any;
  winning_outcome?: any;
  creator: Principal;
  admin: Principal;
  total_fees_collected: number;
  creation_time: number;
}

export interface MarketSummary {
  market: AmmMarket;
  yes_price: number;
  no_price: number;
  total_volume: number;
  price_impact: number;
}

export interface UserPosition {
  user: Principal;
  market_id: number;
  yes_tokens: number;
  no_tokens: number;
  claimed_reward: boolean;
}

export interface TradeResult {
  tokens_received: number;
  tokens_paid: number;
  fee_paid: number;
  new_price: number;
}

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
   * Get the current admin principal
   */
  static async getAdmin(): Promise<Principal | null> {
    try {
      const result = await backend.get_admin();
      return result.length > 0 ? result[0]! : null;
    } catch (error) {
      console.error("Failed to get admin:", error);
      throw error;
    }
  }

  /**
   * Create a new prediction market (Admin only)
   */
  static async createMarket(
    title: string,
    description: string,
  ): Promise<number> {
    try {
      const result = await backend.initialize_market(title, description);
      if ("Ok" in result) {
        return Number(result.Ok);
      } else {
        throw new Error(
          `Failed to create market: ${Object.keys(result.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("Failed to create market:", error);
      throw error;
    }
  }

  /**
   * Buy tokens for a specific market
   */
  static async buyTokens(
    marketId: number,
    side: "Yes" | "No",
    quantity: number,
    depositAmount: number,
  ): Promise<string> {
    try {
      const sideEnum = side === "Yes" ? { Yes: null } : { No: null };
      const result = await backend.buy_tokens(
        BigInt(marketId),
        sideEnum,
        BigInt(quantity),
        BigInt(depositAmount),
      );

      if ("Ok" in result) {
        return result.Ok;
      } else {
        throw new Error(`Failed to buy tokens: ${Object.keys(result.Err)[0]}`);
      }
    } catch (error) {
      console.error("Failed to buy tokens:", error);
      throw error;
    }
  }

  /**
   * Resolve a market with a result (Admin only)
   */
  static async closeMarket(
    marketId: number,
    result: "Yes" | "No",
  ): Promise<string> {
    try {
      const resultEnum = result === "Yes" ? { Yes: null } : { No: null };
      const response = await backend.resolve_market(
        BigInt(marketId),
        resultEnum,
      );

      if ("Ok" in response) {
        return response.Ok;
      } else {
        throw new Error(
          `Failed to resolve market: ${Object.keys(response.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("Failed to resolve market:", error);
      throw error;
    }
  }

  /**
   * Get all markets with pricing information
   */
  static async getMarkets() {
    try {
      const markets = await backend.get_markets();
      return markets.map((market: any) => ({
        ...market,
        id: Number(market.market.id),
        market: {
          ...market.market,
          id: Number(market.market.id),
          yes_pool: Number(market.market.yes_pool),
          no_pool: Number(market.market.no_pool),
        },
        total_volume: Number(market.total_volume),
      }));
    } catch (error) {
      console.error("Failed to get markets:", error);
      throw error;
    }
  }

  /**
   * Get a specific market by ID
   */
  static async getMarket(marketId: number) {
    try {
      const result = await backend.get_market(BigInt(marketId));
      if (result.length > 0) {
        const marketSummary = result[0]!; // TypeScript assertion since we checked length
        return {
          market: {
            id: Number(marketSummary.market.id),
            title: marketSummary.market.title,
            description: marketSummary.market.description,
            status: marketSummary.market.status,
            result: marketSummary.market.result,
            yes_pool: Number(marketSummary.market.yes_pool),
            no_pool: Number(marketSummary.market.no_pool),
          },
          yes_price: marketSummary.yes_price,
          no_price: marketSummary.no_price,
          total_volume: Number(marketSummary.total_volume),
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get market:", error);
      throw error;
    }
  }

  /**
   * Get user position for a specific market
   */
  static async getUserPosition(marketId: number) {
    try {
      const position = await backend.get_user_position(BigInt(marketId));
      if (position.length > 0) {
        const pos = position[0]!;
        return {
          ...pos,
          market_id: Number(pos.market_id),
          yes_tokens: Number(pos.yes_tokens),
          no_tokens: Number(pos.no_tokens),
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to get user position:", error);
      throw error;
    }
  }

  /**
   * Get all user positions
   */
  static async getAllUserPositions() {
    try {
      const positions = await backend.get_all_user_positions();
      return positions.map((position: any) => ({
        ...position,
        market_id: Number(position.market_id),
        yes_tokens: Number(position.yes_tokens),
        no_tokens: Number(position.no_tokens),
      }));
    } catch (error) {
      console.error("Failed to get all user positions:", error);
      throw error;
    }
  }

  /**
   * Get LLM analysis for a market
   */
  static async analyzeMarket(marketId: number): Promise<string> {
    try {
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
   * Deposit funds to user balance (for testing purposes)
   */
  static async depositFunds(amount: number): Promise<string> {
    try {
      const response = await backend.deposit_funds(BigInt(amount));

      if ("Ok" in response) {
        return response.Ok;
      } else {
        throw new Error(
          `Failed to deposit funds: ${Object.keys(response.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("Failed to deposit funds:", error);
      throw error;
    }
  }

  /**
   * Get user balance
   */
  static async getUserBalance(userPrincipal: string): Promise<number> {
    try {
      const principal = Principal.fromText(userPrincipal);
      const balance = await backend.get_user_balance(principal);
      return Number(balance);
    } catch (error) {
      console.error("Failed to get user balance:", error);
      throw error;
    }
  }

  /**
   * Helper function to format prices as percentages
   */
  static formatPrice(price: number): string {
    return `${(price * 100).toFixed(1)}%`;
  }

  /**
   * Helper function to determine market status display
   */
  static getStatusDisplay(status: any): string {
    if ("Open" in status) return "Open";
    if ("Closed" in status) return "Closed";
    return "Unknown";
  }

  /**
   * Helper function to determine side display
   */
  static getSideDisplay(result: any): string {
    console.log("getSideDisplay called with:", result); // Debug log

    if (!result) {
      console.log("Result is null/undefined");
      return "Unknown";
    }

    // Handle array format from Candid: [] | [Side]
    if (Array.isArray(result)) {
      console.log("Result is array:", result);
      if (result.length === 0) {
        console.log("Result array is empty");
        return "Unknown";
      }
      // Get the first element which should be the Side
      const side = result[0];
      console.log("Side from array:", side);

      if ("Yes" in side) {
        console.log("Found Yes in side");
        return "YES";
      }
      if ("No" in side) {
        console.log("Found No in side");
        return "NO";
      }
    }

    // Handle direct object format: { Yes: null } or { No: null }
    if (typeof result === "object" && result !== null) {
      if ("Yes" in result) {
        console.log("Found Yes in result object");
        return "YES";
      }
      if ("No" in result) {
        console.log("Found No in result object");
        return "NO";
      }
    }

    // Additional fallback for direct string values
    if (typeof result === "string") {
      console.log("Result is string:", result);
      if (result.toLowerCase() === "yes") return "YES";
      if (result.toLowerCase() === "no") return "NO";
    }

    console.log("Returning Unknown for result:", result);
    return "Unknown";
  }

  /**
   * Debug helper to inspect market data
   */
  static inspectMarket(market: any): void {
    console.log("=== Market Inspection ===");
    console.log("Market ID:", market.id);
    console.log("Market Status:", market.status);
    console.log("Market Result:", market.result);
    console.log("Market Result Type:", typeof market.result);
    console.log("Market Result Is Array:", Array.isArray(market.result));
    if (Array.isArray(market.result)) {
      console.log("Market Result Array Length:", market.result.length);
      if (market.result.length > 0) {
        console.log("Market Result First Element:", market.result[0]);
      }
    }
    console.log(
      "Market Result Structure:",
      JSON.stringify(market.result, null, 2),
    );
    console.log("getSideDisplay result:", this.getSideDisplay(market.result));
    console.log("========================");
  }
}
