import { backend } from "../../../declarations/backend";
import type { Principal } from "@dfinity/principal";

// Re-export types for convenience
export type {
  Market,
  MarketSummary,
  Position,
  Side,
  MarketStatus,
  PredictionMarketError,
} from "../../../declarations/backend/backend.did";

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
   * Close a market with a result (Admin only)
   */
  static async closeMarket(
    marketId: number,
    result: "Yes" | "No",
  ): Promise<string> {
    try {
      const resultEnum = result === "Yes" ? { Yes: null } : { No: null };
      const response = await backend.close_market(BigInt(marketId), resultEnum);

      if ("Ok" in response) {
        return response.Ok;
      } else {
        throw new Error(
          `Failed to close market: ${Object.keys(response.Err)[0]}`,
        );
      }
    } catch (error) {
      console.error("Failed to close market:", error);
      throw error;
    }
  }

  /**
   * Get all markets with pricing information
   */
  static async getMarkets() {
    try {
      const markets = await backend.get_markets();
      return markets.map((market) => ({
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
   * Get user positions for a specific market
   */
  static async getUserPositions(marketId: number) {
    try {
      const positions = await backend.get_user_positions(BigInt(marketId));
      return positions.map((position) => ({
        ...position,
        market_id: Number(position.market_id),
        quantity: Number(position.quantity),
      }));
    } catch (error) {
      console.error("Failed to get user positions:", error);
      throw error;
    }
  }

  /**
   * Get all user positions
   */
  static async getAllUserPositions() {
    try {
      const positions = await backend.get_all_user_positions();
      return positions.map((position) => ({
        ...position,
        market_id: Number(position.market_id),
        quantity: Number(position.quantity),
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
  static getSideDisplay(side: any): string {
    if ("Yes" in side) return "YES";
    if ("No" in side) return "NO";
    return "Unknown";
  }
}
