# AMM Prediction Market Smart Contract

## Overview

This project implements a comprehensive **Automated Market Maker (AMM)** smart contract for prediction markets on the Internet Computer Protocol (ICP) using Rust. The AMM enables decentralized trading of YES/NO tokens for binary prediction markets with dynamic pricing.

## Core Features

### 🔄 AMM Trading Engine

- **Constant Product Formula**: Uses `x * y = k` for automatic price discovery
- **Dynamic Pricing**: Token prices automatically adjust based on supply and demand
- **Trading Fees**: 0.3% fee on all trades, collected in the liquidity pool
- **Slippage Protection**: Minimum token output requirements to prevent MEV attacks

### 💰 Market Management

- **Market Creation**: Create prediction markets with initial liquidity
- **Token Trading**: Buy/sell YES/NO tokens using ICP
- **Position Tracking**: Track user token holdings and balances
- **Quote System**: Get trade quotes without executing transactions

### 🏆 Reward Distribution

- **Market Resolution**: Admin-only function to resolve markets with winning outcome
- **Proportional Rewards**: Winners receive ICP proportional to their token share
- **Double-Claim Protection**: Prevents users from claiming rewards multiple times
- **Automatic Payout**: Rewards distributed from the liquidity pool

### 🧠 AI Integration

- **LLM Analysis**: AI-powered market sentiment and risk analysis
- **Price Predictions**: Market trend analysis using language models
- **Automated Insights**: Generate comprehensive market reports

## Technical Architecture

### Data Structures

```rust
// Core market structure
pub struct AmmMarket {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub yes_reserve: u64,        // YES token reserve
    pub no_reserve: u64,         // NO token reserve
    pub icp_liquidity_pool: u64, // Total ICP backing the market
    pub status: MarketStatus,
    pub winning_outcome: Option<TokenType>,
    // ... additional fields
}

// User position tracking
pub struct UserPosition {
    pub user: Principal,
    pub market_id: u64,
    pub yes_tokens: u64,
    pub no_tokens: u64,
    pub claimed_reward: bool,
}
```

### AMM Mathematics

#### Price Calculation

```
Price(YES) = NO_reserve / (YES_reserve + NO_reserve)
Price(NO) = YES_reserve / (YES_reserve + NO_reserve)
```

#### Token Output Calculation (Buying)

```
k = YES_reserve × NO_reserve (constant product)
ICP_after_fee = ICP_in × (1000 - fee) / 1000
new_NO_reserve = NO_reserve - ICP_after_fee
new_YES_reserve = k / new_NO_reserve
tokens_out = new_YES_reserve - YES_reserve
```

#### ICP Output Calculation (Selling)

```
k = YES_reserve × NO_reserve
new_YES_reserve = YES_reserve - tokens_in
new_NO_reserve = k / new_YES_reserve
ICP_out = (new_NO_reserve - NO_reserve) × (1000 - fee) / 1000
```

#### Reward Distribution

```
user_reward = (user_winning_tokens / total_winning_tokens) × total_ICP_pool
```

## API Reference

### Core Trading Functions

#### `create_market(title: String, description: String, initial_icp_liquidity: u64) -> Result<u64, PredictionMarketError>`

Creates a new prediction market with initial liquidity.

#### `buy_yes_tokens(market_id: u64, icp_amount: u64, min_tokens_out: u64) -> Result<TradeResult, PredictionMarketError>`

Purchase YES tokens using ICP with slippage protection.

#### `buy_no_tokens(market_id: u64, icp_amount: u64, min_tokens_out: u64) -> Result<TradeResult, PredictionMarketError>`

Purchase NO tokens using ICP with slippage protection.

#### `sell_yes_tokens(market_id: u64, token_amount: u64, min_icp_out: u64) -> Result<TradeResult, PredictionMarketError>`

Sell YES tokens back to the AMM for ICP.

#### `sell_no_tokens(market_id: u64, token_amount: u64, min_icp_out: u64) -> Result<TradeResult, PredictionMarketError>`

Sell NO tokens back to the AMM for ICP.

### Market Resolution Functions

#### `resolve_market(market_id: u64, outcome: TokenType) -> Result<String, PredictionMarketError>`

Resolve a market with the winning outcome (admin only).

#### `claim_reward(market_id: u64) -> Result<RewardClaim, PredictionMarketError>`

Claim proportional reward based on winning token holdings.

### Query Functions

#### `get_token_price(market_id: u64, token_type: TokenType) -> Result<f64, PredictionMarketError>`

Get current price of YES or NO tokens.

#### `get_markets() -> Vec<MarketSummary>`

Get all markets with current prices and statistics.

#### `get_user_position(market_id: u64) -> Option<UserPosition>`

Get user's token position for a specific market.

#### `get_buy_quote(market_id: u64, icp_amount: u64, token_type: TokenType) -> Result<TradeResult, PredictionMarketError>`

Get quote for buying tokens without executing trade.

#### `get_sell_quote(market_id: u64, token_amount: u64, token_type: TokenType) -> Result<TradeResult, PredictionMarketError>`

Get quote for selling tokens without executing trade.

## Usage Examples

### Creating a Market

```typescript
// Create a new prediction market
const result = await backend.create_market(
  "Will Bitcoin reach $100k by 2025?",
  "Binary prediction on Bitcoin price target",
  5000, // Initial ICP liquidity
);
```

### Trading Tokens

```typescript
// Buy YES tokens
const buyResult = await backend.buy_yes_tokens(
  1, // market_id
  1000, // ICP amount
  900, // minimum tokens out (slippage protection)
);

// Sell YES tokens
const sellResult = await backend.sell_yes_tokens(
  1, // market_id
  500, // token amount
  450, // minimum ICP out (slippage protection)
);
```

### Claiming Rewards

```typescript
// After market resolution
const claimResult = await backend.claim_reward(1); // market_id
```

## Testing

The project includes comprehensive unit tests covering:

- ✅ **AMM Price Calculations**: Verify constant product formula implementation
- ✅ **Token Trading Logic**: Test buy/sell operations and fee calculations
- ✅ **Reward Distribution**: Test proportional payout calculations
- ✅ **Double-Claim Protection**: Verify security measures
- ✅ **Edge Cases**: Handle insufficient liquidity, small trades, and error conditions
- ✅ **Slippage Protection**: Test trade execution limits
- ✅ **Invariant Preservation**: Verify AMM mathematical properties

Run tests with:

```bash
cargo test --bin amm_tests
```

## Security Features

1. **Double-Claim Protection**: Users cannot claim rewards multiple times
2. **Slippage Protection**: Minimum output requirements prevent sandwich attacks
3. **Admin Controls**: Only admins can resolve markets
4. **Input Validation**: All parameters validated for correctness
5. **Overflow Protection**: Safe arithmetic operations throughout
6. **Access Controls**: Principal-based permissions

## Frontend Integration

The smart contract is designed for seamless React + TypeScript integration:

```typescript
import { backend } from "../declarations/backend";

// Get market data
const markets = await backend.get_markets();

// Execute trades
const tradeResult = await backend.buy_yes_tokens(marketId, amount, minOut);

// Check positions
const position = await backend.get_user_position(marketId);
```

## Constants

- **Initial Liquidity**: 500 YES and 500 NO tokens per market
- **Trading Fee**: 0.3% (3 basis points)
- **Minimum Deposit**: 1000 ICP units

## Error Handling

The contract provides comprehensive error types:

- `MarketNotFound`: Invalid market ID
- `MarketClosed`: Market not accepting trades
- `InsufficientLiquidity`: Not enough tokens in AMM
- `SlippageExceeded`: Trade would exceed slippage limits
- `AlreadyClaimed`: User already claimed rewards
- `Unauthorized`: Admin-only function called by non-admin

This AMM implementation provides a robust foundation for decentralized prediction markets with fair pricing, secure reward distribution, and comprehensive testing coverage.
