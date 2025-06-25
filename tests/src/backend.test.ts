import { describe, beforeEach, afterEach, it, expect, inject } from "vitest";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { PocketIc, type Actor } from "@dfinity/pic";
import { Principal } from "@dfinity/principal";

// Import generated types for your canister
import {
  type _SERVICE,
  idlFactory,
} from "../../src/declarations/backend/backend.did.js";

// Define the path to your canister's WASM file
export const WASM_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "target",
  "wasm32-unknown-unknown",
  "release",
  "backend.wasm",
);

// The `describe` function is used to group tests together
describe("Vibe Coding Template Backend", () => {
  // Define variables to hold our PocketIC instance, canister ID,
  // and an actor to interact with our canister.
  let pic: PocketIc;
  // @ts-ignore - This variable is used in the setup / framework
  let canisterId: Principal;
  let actor: Actor<_SERVICE>;

  // The `beforeEach` hook runs before each test.
  beforeEach(async () => {
    // create a new PocketIC instance
    pic = await PocketIc.create(inject("PIC_URL"));

    // Setup the canister and actor
    const fixture = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: WASM_PATH,
    });

    // Save the actor and canister ID for use in tests
    actor = fixture.actor;
    canisterId = fixture.canisterId;
  });

  // The `afterEach` hook runs after each test.
  afterEach(async () => {
    // tear down the PocketIC instance
    await pic.tearDown();
  });

  // The `it` function is used to define individual tests
  it("should greet with the provided name", async () => {
    const response = await actor.greet("World");
    expect(response).toEqual("Hello, World!");
  });

  it("should increment counter and return new value", async () => {
    const initialCount = await actor.get_count();
    const newCount = await actor.increment();
    expect(newCount).toEqual(initialCount + BigInt(1));
  });

  it("should get current counter value", async () => {
    const count = await actor.get_count();
    expect(typeof count).toBe("bigint");
  });

  it("should set counter to specified value", async () => {
    const newValue = BigInt(42);
    const result = await actor.set_count(newValue);
    expect(result).toEqual(newValue);
    const currentCount = await actor.get_count();
    expect(currentCount).toEqual(newValue);
  });
});

// Tests for Prediction Market functionality
describe("Prediction Market Backend", () => {
  let pic: PocketIc;
  let actor: Actor<_SERVICE>;
  let adminPrincipal: Principal;

  beforeEach(async () => {
    pic = await PocketIc.create(inject("PIC_URL"));

    const fixture = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: WASM_PATH,
    });

    actor = fixture.actor;
    adminPrincipal = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai"); // Test principal

    // Set admin for testing
    const setAdminResult = await actor.set_admin(adminPrincipal);
    expect("Ok" in setAdminResult).toBe(true);
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  it("should set and get admin", async () => {
    const admin = await actor.get_admin();
    expect(admin.length).toBe(1);
    expect(admin[0]).toEqual(adminPrincipal);
  });

  it("should create a new market", async () => {
    const title = "Will it rain tomorrow?";
    const description =
      "This market resolves to YES if it rains in New York City tomorrow.";

    const result = await actor.initialize_market(title, description);
    expect("Ok" in result).toBe(true);

    if ("Ok" in result) {
      expect(result.Ok).toEqual(BigInt(1));
    }
  });

  it("should get markets list", async () => {
    // Create a market first
    await actor.initialize_market("Test Market", "Test Description");

    const markets = await actor.get_markets();
    expect(markets.length).toBe(1);
    expect(markets[0].market.title).toBe("Test Market");
    expect(markets[0].market.description).toBe("Test Description");
    expect(markets[0].yes_price).toBe(0.5);
    expect(markets[0].no_price).toBe(0.5);
  });

  it("should allow buying tokens", async () => {
    await actor.initialize_market("Test Market", "Test Description");

    const result = await actor.buy_tokens(
      BigInt(1), // market_id
      { Yes: null }, // side
      BigInt(100), // quantity
      BigInt(1000), // deposit_amount
    );

    expect("Ok" in result).toBe(true);

    // Check that the market pools updated
    const markets = await actor.get_markets();
    expect(markets[0].market.yes_pool).toEqual(BigInt(100));
    expect(markets[0].market.no_pool).toEqual(BigInt(0));
  });

  it("should reject insufficient deposit", async () => {
    await actor.initialize_market("Test Market", "Test Description");

    const result = await actor.buy_tokens(
      BigInt(1), // market_id
      { Yes: null }, // side
      BigInt(100), // quantity
      BigInt(500), // deposit_amount (less than MIN_DEPOSIT)
    );

    expect("Err" in result).toBe(true);
    if ("Err" in result) {
      expect("InsufficientDeposit" in result.Err).toBe(true);
    }
  });

  it("should close market with result", async () => {
    // Create market
    await actor.initialize_market("Test Market", "Test Description");

    // Close the market
    const result = await actor.close_market(BigInt(1), { Yes: null });
    expect("Ok" in result).toBe(true);

    // Verify market is closed
    const markets = await actor.get_markets();
    expect("Closed" in markets[0].market.status).toBe(true);
    expect(markets[0].market.result.length).toBe(1);
    if (markets[0].market.result.length > 0 && markets[0].market.result[0]) {
      expect("Yes" in markets[0].market.result[0]).toBe(true);
    }
  });

  it("should get user positions", async () => {
    await actor.initialize_market("Test Market", "Test Description");

    // Buy tokens
    await actor.buy_tokens(BigInt(1), { Yes: null }, BigInt(100), BigInt(1000));

    // Get user positions
    const positions = await actor.get_user_positions(BigInt(1));
    expect(positions.length).toBe(1);
    expect(positions[0].market_id).toEqual(BigInt(1));
    expect(positions[0].quantity).toEqual(BigInt(100));
    expect("Yes" in positions[0].side).toBe(true);
  });
});
