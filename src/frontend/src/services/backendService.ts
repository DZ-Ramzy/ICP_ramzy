import { backend } from "../../../declarations/backend";
import { Principal } from "@dfinity/principal";

/**
 * Service for handling all backend canister API calls
 * Only includes functions that are actually available in the backend
 */
export const backendService = {
  /**
   * Sends a greeting to the backend and returns the response
   * @param name Name to greet
   * @returns Promise with the greeting response
   */
  async greet(name: string): Promise<string> {
    return await backend.greet(name || "World");
  },

  /**
   * Deposits ICP to user balance (simulation)
   * @param amount Amount to deposit
   * @returns Promise with deposit confirmation
   */
  async deposit(amount: number): Promise<{ Ok: string } | { Err: any }> {
    return await backend.deposit_icp(BigInt(amount));
  },

  /**
   * Gets user balance by principal
   * @param user User principal
   * @returns Promise with the balance
   */
  async getBalance(user: Principal): Promise<bigint> {
    return await backend.get_balance_of(user);
  },

  /**
   * Gets current user's balance
   * @returns Promise with the balance
   */
  async getUserBalance(): Promise<bigint> {
    return await backend.get_user_balance();
  },

  /**
   * Sets a message on the backend - NOT AVAILABLE IN CURRENT BACKEND
   * @param _message Message to set
   * @returns Promise with error message
   */
  async setMessage(_message: string): Promise<string> {
    throw new Error("setMessage is not available in the current backend API");
  },

  /**
   * Check if current caller is admin
   * @returns Promise with admin status
   */
  async isAdmin(): Promise<boolean> {
    return await backend.is_admin();
  },

  /**
   * Set admin principal
   * @param admin New admin principal
   * @returns Promise with result
   */
  async setAdmin(admin: Principal): Promise<{ Ok: string } | { Err: any }> {
    return await backend.set_admin(admin);
  },

  /**
   * Get admin principal
   * @returns Promise with admin principal or null
   */
  async getAdmin(): Promise<Principal | null> {
    const result = await backend.get_admin();
    return result.length > 0 ? result[0]! : null;
  },

  // ============================================================
  // DISABLED FUNCTIONS - NOT AVAILABLE IN CURRENT BACKEND
  // ============================================================

  /**
   * Fetches the current counter value (NOT AVAILABLE)
   */
  async getCount(): Promise<bigint> {
    throw new Error(
      "getCount function is not available in the current backend",
    );
  },

  /**
   * Increments the counter on the backend (NOT AVAILABLE)
   */
  async incrementCounter(): Promise<bigint> {
    throw new Error(
      "incrementCounter function is not available in the current backend",
    );
  },

  /**
   * Sends a prompt to the LLM backend (NOT AVAILABLE)
   */
  async sendLlmPrompt(prompt: string): Promise<string> {
    console.log("LLM prompt (not implemented):", prompt);
    throw new Error(
      "sendLlmPrompt function is not available in the current backend",
    );
  },
};
