import { backend } from "../../../declarations/backend";

/**
 * Service for handling all backend canister API calls
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
   * Fetches the current counter value
   * @returns Promise with the current count
   */
  async getCount(): Promise<bigint> {
    return await backend.get_count();
  },

  /**
   * Increments the counter on the backend
   * @returns Promise with the new count
   */
  async incrementCounter(): Promise<bigint> {
    return await backend.increment();
  },

  /**
   * Sends a prompt to the LLM backend
   * @param prompt The user's prompt text
   * @returns Promise with the LLM response
   */
  async sendLlmPrompt(prompt: string): Promise<string> {
    return await backend.prompt(prompt);
  },
};
