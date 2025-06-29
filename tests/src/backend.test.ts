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
    expect(response).toEqual(
      "Hello, World! Welcome to the AMM Prediction Market!",
    );
  });

  it("should increment and get counter", async () => {
    const initialCount = await actor.get_count();
    const newCount = await actor.increment();
    expect(newCount).toEqual(initialCount + BigInt(1));
  });

  it("should set and get counter", async () => {
    const testValue = BigInt(42);
    const result = await actor.set_count(testValue);
    expect(result).toEqual(testValue);
    const currentCount = await actor.get_count();
    expect(currentCount).toEqual(testValue);
  });

  it("should get user balance", async () => {
    const balance = await actor.get_user_balance();
    expect(typeof balance).toBe("bigint");
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

  it("should get empty markets list initially", async () => {
    const markets = await actor.get_markets();
    expect(Array.isArray(markets)).toBe(true);
    expect(markets.length).toBe(0);
  });

  it("should get user balance", async () => {
    const testPrincipal = Principal.fromText("rdmx6-jaaaa-aaaaa-aaadq-cai");
    const balance = await actor.get_balance_of(testPrincipal);
    expect(typeof balance).toBe("bigint");
    expect(balance).toEqual(BigInt(0));
  });

  it("should allow depositing funds", async () => {
    const depositAmount = BigInt(1000);
    const result = await actor.deposit_icp(depositAmount);
    expect("Ok" in result).toBe(true);
    if ("Ok" in result) {
      expect(result.Ok).toBe("Successfully deposited 1000 ICP");
    }
  });

  it("should get empty user positions initially", async () => {
    const positions = await actor.get_all_user_positions();
    expect(Array.isArray(positions)).toBe(true);
    expect(positions.length).toBe(0);
  });

  it("should get empty market for non-existent market", async () => {
    const market = await actor.get_market(BigInt(999));
    expect(market.length).toBe(0); // Option<MarketSummary> returns empty array when None
  });

  it("should get empty user position for current user", async () => {
    const position = await actor.get_user_position(BigInt(999));
    expect(position.length).toBe(0); // Option<UserPosition> returns empty array when None
  });

  it("should create a market", async () => {
    const title = "Will it rain tomorrow?";
    const description =
      "This market resolves to YES if it rains in New York City tomorrow.";
    const liquidityAmount = BigInt(1000);

    // First deposit some ICP
    await actor.deposit_icp(BigInt(2000));

    const result = await actor.create_market(
      title,
      description,
      liquidityAmount,
    );
    expect("Ok" in result).toBe(true);
    if ("Ok" in result) {
      expect(result.Ok).toEqual(BigInt(1));
    }
  });

  it("should get token price for existing market", async () => {
    // Create a market first
    await actor.deposit_icp(BigInt(2000));
    await actor.create_market("Test Market", "Test Description", BigInt(1000));

    const yesPrice = await actor.get_token_price(BigInt(1), { Yes: null });
    expect("Ok" in yesPrice).toBe(true);
    if ("Ok" in yesPrice) {
      expect(yesPrice.Ok).toBe(0.5); // Initial price should be 0.5
    }

    const noPrice = await actor.get_token_price(BigInt(1), { No: null });
    expect("Ok" in noPrice).toBe(true);
    if ("Ok" in noPrice) {
      expect(noPrice.Ok).toBe(0.5); // Initial price should be 0.5
    }
  });
});
